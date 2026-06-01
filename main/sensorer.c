//======================================bibloteker
#include <stdio.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "driver/i2c_master.h"
#include "driver/adc.h"
#include "esp_log.h"
#include "vl53l1x.h"
#include "freertos/semphr.h"
#include "sensorer.h"
#include <math.h>

//======================================globale variabler osv
#define HX711_DT 5
#define HX711_SCK 6
#define DS18B20_GPIO GPIO_NUM_4
#define POT_ADC_CHANNEL ADC1_CHANNEL_6   // GPIO4
#define POT_ADC_ATTEN ADC_ATTEN_DB_11  // 0–3.3V
#define POT_ADC_WIDTH ADC_WIDTH_BIT_12 // 0–4095
#define I2C_SCL_GPIO 9
#define I2C_SDA_GPIO 8
#define VL53L1X_ADDR_7BIT 0x29
#define TEMP_ALPHA 0.1f


static const char *TAG = "sensor_test";

static i2c_master_bus_handle_t g_i2c_bus = NULL;
static SemaphoreHandle_t g_i2c_mutex = NULL;   
static sensor_health_t g_health = {false, false, false, false, false}; 
static volatile float g_distance = NAN;
static volatile float g_press = NAN;
static volatile float g_temperature = NAN;
static volatile float g_pot_value = NAN;
static int32_t baseline = 254700;       // kalibrering, må overleve mellom kall
static float scale = 430.0f;            // kalibrering
static float weight_filtered = 0.0f;    // filter-state, må overleve mellom iterasjoner
static int weight_init = 0;             // filter-state
static float temp_filtered = 0.0f;
static int temp_init = 0;


//getter som skal returnere tilstanded til sensorene(om de lever eller ikke)
sensor_health_t get_sensor_health(void) {
    return g_health;  
}
//===================================hjelpe funksjoner 
//hjelpe funksjon for lastcelle 
static int32_t hx711_read_raw(){
    int32_t data = 0;
    int timeout = 100000;

    //ny sjekk om sensoren er død
    while (gpio_get_level(HX711_DT) == 1) {
        if (--timeout == 0) return INT32_MIN;
    }

    
    portDISABLE_INTERRUPTS();
    
    for (int i = 0; i < 24; i++) {
        gpio_set_level(HX711_SCK, 1);
        esp_rom_delay_us(2);
        data <<= 1;
        if (gpio_get_level(HX711_DT)) data++;  // les mens SCK er høy
        gpio_set_level(HX711_SCK, 0);
        esp_rom_delay_us(2);
    }


    // Gain = 128 — 1 ekstra puls
    gpio_set_level(HX711_SCK, 1);
    esp_rom_delay_us(2);
    gpio_set_level(HX711_SCK, 0);
    esp_rom_delay_us(2);

    portENABLE_INTERRUPTS();
    
    if (data & 0x800000) data |= 0xFF000000;
    return data;
}

//hjelpe funksjoner for tempratur sensoren
//one wire
static void ow_low(){ 
    gpio_set_direction(DS18B20_GPIO, GPIO_MODE_OUTPUT); 
    gpio_set_level(DS18B20_GPIO, 0); 
}

static void ow_release(){
    gpio_set_direction(DS18B20_GPIO, GPIO_MODE_INPUT); 
}

static int ow_read(){ 
    return gpio_get_level(DS18B20_GPIO); 
}

static int ow_reset(){
    ow_low();
    esp_rom_delay_us(480);
    ow_release();
    esp_rom_delay_us(70);
    int presence = !ow_read();
    esp_rom_delay_us(410);
    return presence;
}

static void ow_write_bit(int bit){
    ow_low();
    if (bit){
        esp_rom_delay_us(6);
        ow_release();
        esp_rom_delay_us(64);
    }
    else{
        esp_rom_delay_us(60);
        ow_release();
        esp_rom_delay_us(10);
    }
}

static int ow_read_bit (){
    int bit;
    ow_low(); esp_rom_delay_us(6);
    ow_release(); esp_rom_delay_us(9);
    bit = ow_read();
    esp_rom_delay_us(55);
    return bit;
}

static void ow_write_byte(uint8_t byte){
    for(int i = 0; i < 8; i++){
        ow_write_bit(byte & 0x01);
        byte >>= 1;
    }
}

static uint8_t ow_read_byte(){
    uint8_t byte = 0;
    for (int i = 0; i < 8; i++){
        byte >>= 1; 
        if(ow_read_bit()){
            byte |= 0x80;
        }
    }
    return byte;
} 

static float ds18b20_read_temp_c(){
    static int measuring = 0;
    static TickType_t start_time = 0;

    // Start ny måling
    if (!measuring) {
        if (!ow_reset()) return -1000.0f;
        ow_write_byte(0xCC);  // Skip ROM
        ow_write_byte(0x44);  // Convert T
        start_time = xTaskGetTickCount();
        measuring  = 1;
        return -1000.0f;
    }

    // Vent 750ms konverteringstid
    if (xTaskGetTickCount() - start_time < pdMS_TO_TICKS(750))
        return -1000.0f;

    // Les resultat
    measuring = 0;
    if (!ow_reset()) return -1000.0f;
    ow_write_byte(0xCC);
    ow_write_byte(0xBE);

    uint8_t temp_l = ow_read_byte();
    uint8_t temp_h = ow_read_byte();
    int16_t raw    = (temp_h << 8) | temp_l;
    float   temp   = (float)raw / 16.0f;

    // Sanity check — forkast åpenbart ugyldige verdier
    if (temp < -55.0f || temp > 125.0f) return -1000.0f;

    // IIR-filter — initialiser med første gyldige måling
    if (!temp_init) {
        temp_filtered = temp;
        temp_init = 1;
    } else {
        temp_filtered = TEMP_ALPHA * temp + (1.0f - TEMP_ALPHA) * temp_filtered;
    }

    return temp_filtered;
}

//hjelpe funksjon for potmeter
static float pot_read(){
    int raw = adc1_get_raw(POT_ADC_CHANNEL);
    return (raw / 4095.0f);
}

//========================================Initialisering av sensorene 
//i2c bus og mutex initialisering
esp_err_t sensors_init(void){
    esp_err_t err;

    g_i2c_mutex = xSemaphoreCreateMutex();
    if(g_i2c_mutex == NULL){
        return ESP_ERR_NO_MEM;
    }

    
    i2c_master_bus_config_t bus_cfg = {
        .i2c_port = I2C_NUM_0,
        .sda_io_num = I2C_SDA_GPIO,
        .scl_io_num = I2C_SCL_GPIO,
        .clk_source = I2C_CLK_SRC_DEFAULT,
        .glitch_ignore_cnt = 7,
        .flags.enable_internal_pullup = true,
    };

    err = i2c_new_master_bus(&bus_cfg, &g_i2c_bus);
    if(err != ESP_OK){
        ESP_LOGE(TAG, "I2C bus initialisation failed");
        g_health.i2c = false;
        g_health.tof = false;
        return err;
    }
    
    return ESP_OK;
    
}

//tof sensor init
static esp_err_t tof_sensor_init(vl53l1x_t *sensor){
    
    esp_err_t err;

    err = vl53l1x_init(sensor, g_i2c_bus, VL53L1X_ADDR_7BIT);
    if(err != ESP_OK){
        return err;
    }

    err = vl53l1x_sensor_init(sensor);
    if(err != ESP_OK){
        return err;
    }

    err = vl53l1x_config_long_100ms(sensor);
    if(err != ESP_OK){
        return err;
    }

    err = vl53l1x_start(sensor);
    if(err != ESP_OK){
        return err;
    }

    ESP_LOGI(TAG, "tof sensor ready");
    return ESP_OK; //fjerna ESP_ERROR_CHECK fordi det førte til at det crasher, fordi abort()
}

//lastcelle sensor init
static esp_err_t loadcell_sensor_init(){
    esp_err_t err;

    err = gpio_set_direction(HX711_DT, GPIO_MODE_INPUT);
    if(err != ESP_OK){
        return err;
    } 

    err = gpio_set_direction(HX711_SCK, GPIO_MODE_OUTPUT);
    if(err != ESP_OK){
        return err;
    }

    return ESP_OK;
}

//tempratur sensor init
static esp_err_t ds18b20_init(){
    esp_err_t err;

    err = gpio_set_direction(DS18B20_GPIO, GPIO_MODE_INPUT);
    if(err != ESP_OK){
        return err;
    } 

    err = gpio_set_pull_mode(DS18B20_GPIO, GPIO_PULLUP_ONLY);
    if(err != ESP_OK){
        return err;
    } 

    return ESP_OK;
}


// potentiometer init
static esp_err_t pot_init(){
    esp_err_t err;

    err = adc1_config_width(POT_ADC_WIDTH);
    if(err != ESP_OK){
        return err;
    }

    err = adc1_config_channel_atten(POT_ADC_CHANNEL, POT_ADC_ATTEN);
    if(err != ESP_OK){
        return err;
    }
    return ESP_OK;
}

//==========================================sensor task
void tof_sensor(void *pvParameters){

    vl53l1x_t sensor = {0};
    
    if (tof_sensor_init(&sensor) != ESP_OK) {
        ESP_LOGE(TAG, "ToF init failed");
        g_health.tof = false; //flagg for å sjekke om sensoren lever
        vTaskDelete(NULL); //sletter denne tasken 
        return;
    }
    g_health.tof = true;


    for( ;; ){
        vl53l1x_result_t r = {0};
        esp_err_t err = ESP_FAIL;

        if (xSemaphoreTake(g_i2c_mutex, pdMS_TO_TICKS(100)) == pdTRUE) {
            err = vl53l1x_read(&sensor, &r, 200);
            xSemaphoreGive(g_i2c_mutex);
        }
        if (err == ESP_OK && r.status == 0) {
            ESP_LOGI(TAG, "distance: %u mm", r.distance_mm);
            g_distance = r.distance_mm;
        } else {
            ESP_LOGW(TAG, "invalid reading =%u err=%s", r.status, esp_err_to_name(err));
        }
        vTaskDelay(pdMS_TO_TICKS(100));
    }
}

void press_sensor(void *pvParameters){
    if(loadcell_sensor_init() != ESP_OK){
        ESP_LOGE(TAG, "loadcell init failed");
        g_health.loadcell = false;
        g_press = 0.0f;          // ikke NAN — GUI får 0 istedenfor søppel
        vTaskDelete(NULL);
        return;
    }

    // Vent på at HX711 er klar (maks ~1 sek)
    int timeout = 10000;
    while (gpio_get_level(HX711_DT) == 1) {
        if (--timeout == 0){
            ESP_LOGE(TAG, "loadcell sensor timedout");
            g_health.loadcell = false;
            g_press = 0.0f;
            vTaskDelete(NULL);
            return;
        }
        esp_rom_delay_us(100);   // ikke busy-wait — gir fra seg litt CPU
    }
    g_health.loadcell = true;

    // Tare: 10 målinger som nullpunkt
    int32_t tare_sum = 0;
    for (int i = 0; i < 10; i++){
        int32_t r = hx711_read_raw();
        if(r == INT32_MIN){
            ESP_LOGE(TAG, "loadcell died during tare");
            g_health.loadcell = false;
            g_press = 0.0f;
            vTaskDelete(NULL);
            return;
        }
        tare_sum += r;
        vTaskDelay(pdMS_TO_TICKS(10));   // litt pause mellom tare-lesinger
    }
    baseline = tare_sum / 10;
    weight_init = 0;

    for( ;; ){
        // Middel over 5 prøver — samme som fungerende hx711.c
        int32_t sum = 0;
        bool read_ok = true;

        for (int i = 0; i < 5; i++) {
            int32_t r = hx711_read_raw();
            if (r == INT32_MIN) {
                ESP_LOGW(TAG, "loadcell read failed");
                read_ok = false;
                break;
            }
            sum += r;
            vTaskDelay(pdMS_TO_TICKS(10));
        }

        if (!read_ok) {
            vTaskDelay(pdMS_TO_TICKS(100));
            continue;   // hopp over, behold forrige g_press-verdi
        }

        int32_t raw = sum / 5;
        float weight_g = (float)(raw - baseline) / scale;

        // IIR-filter (alpha = 0.6)
        if (!weight_init) {
            weight_filtered = weight_g;
            weight_init = 1;
        } else {
            weight_filtered = 0.6f * weight_g + 0.4f * weight_filtered;
        }

        g_press = weight_filtered;
        vTaskDelay(pdMS_TO_TICKS(100));
    }
}

void ds18b20_sensor(void *pvParameters){
    if(ds18b20_init() != ESP_OK){
        ESP_LOGE(TAG, "temp init failed");
        g_health.temperature = false;
        vTaskDelete(NULL);
        return;
    }
    
    if (!ow_reset()) {
        ESP_LOGE(TAG, "one wire reset failed");
        g_health.temperature = false;
        vTaskDelete(NULL);
        return;
    }
    g_health.temperature = true;

    for( ;; ){
        float t = ds18b20_read_temp_c();
        if (t > -999.0f) {
            g_temperature = t;
        }
        vTaskDelay(pdMS_TO_TICKS(100));
    }
}

void pot_sensor(void *pvParameters){
    if(pot_init() != ESP_OK){
        ESP_LOGE(TAG, "pot init failed");
        g_health.pot = false; //flagg for å sjekke om sensoren lever
        vTaskDelete(NULL); //sletter denne tasken 
        return;
    }
    g_health.pot = true;

    for( ;;){
        float val_pot = pot_read();
        g_pot_value = val_pot;
        //legg til noe kode for omgjøring
        vTaskDelay(pdMS_TO_TICKS(100));
    }

}


//===========================getter funksjoner
float get_distance(void){
    return g_distance;
}

float get_press(void){
    return g_press;
}

float get_temp(void){
    return g_temperature;
}

float get_pot(void){
    return g_pot_value;
}

