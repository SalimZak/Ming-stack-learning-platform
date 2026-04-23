#include <stdio.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "driver/i2c_master.h"
#include "esp_log.h"
#include "vl53l1x.h"
#include "freertos/semphr.h" 

#define I2C_SCL_GPIO      9
#define I2C_SDA_GPIO      8
#define VL53L1X_ADDR_7BIT 0x29

static const char *TAG = "sensor_test";

static i2c_master_bus_handle_t g_i2c_bus = NULL;
static SemaphoreHandle_t g_i2c_mutex = NULL;

static float g_distance = -1.0f;
static float g_press = -1.0f;

static void tof_sensor_init(vl53l1x_t *sensor){
    ESP_ERROR_CHECK(vl53l1x_init(sensor, g_i2c_bus, VL53L1X_ADDR_7BIT));
    ESP_ERROR_CHECK(vl53l1x_sensor_init(sensor));
    ESP_ERROR_CHECK(vl53l1x_config_long_100ms(sensor));
    ESP_ERROR_CHECK(vl53l1x_start(sensor));
    ESP_LOGI(TAG, "tof sensor ready");
}

static void press_sensor_init(){
    //legg til: init av press sensor
}


void tof_sensor(void *pvParameters){

    vl53l1x_t sensor = {0};
    tof_sensor_init(&sensor);

    for( ;; ){
        if (xSemaphoreTake(g_i2c_mutex, pdMS_TO_TICKS(100)) == pdTRUE) {

            vl53l1x_result_t r = {0};
            esp_err_t err = vl53l1x_read(&sensor, &r, 200);
            if (err == ESP_OK && r.status == 0) {
                ESP_LOGI(TAG, "distance: %u mm", r.distance_mm);
            } else {
                ESP_LOGW(TAG, "invalid reading =%u err=%s", r.status, esp_err_to_name(err));
            }
            xSemaphoreGive(g_i2c_mutex);
        }
        vTaskDelay(pdMS_TO_TICKS(100));
    }
}

void press_sensor(void *pvParameters){
    press_sensor_init();

    for( ;; ){
        if (xSemaphoreTake(g_i2c_mutex, pdMS_TO_TICKS(100)) == pdTRUE) {
            //legg til: avlesninger på lastcelle
            //oppdater g_press
            xSemaphoreGive(g_i2c_mutex);
        }
        vTaskDelay(pdMS_TO_TICKS(100));
    }
}

float get_distance(void){
    return g_distance;
}

float get_press(void){
    return g_press;
}
//lag header fil og legg disse til 
//getter funksjonen skal bli brukt i server som blir sendt med REST API

void app_main(void)
{
    ESP_LOGI(TAG, "sensor_test start");


    i2c_master_bus_config_t bus_cfg = {
        .i2c_port = I2C_NUM_0,
        .sda_io_num = I2C_SDA_GPIO,
        .scl_io_num = I2C_SCL_GPIO,
        .clk_source = I2C_CLK_SRC_DEFAULT,
        .glitch_ignore_cnt = 7,
        .flags.enable_internal_pullup = true,
    };

    g_i2c_mutex = xSemaphoreCreateMutex();

    ESP_ERROR_CHECK(i2c_new_master_bus(&bus_cfg, &g_i2c_bus));
    ESP_LOGI(TAG, "I2C bus initialized");

    xTaskCreate(tof_sensor, "tof_task", 4096, NULL, 4, NULL);

    xTaskCreate(press_sensor, "press_task", 4096, NULL, 4, NULL);


    //husk å fiks FreeRTOS header filen
}




