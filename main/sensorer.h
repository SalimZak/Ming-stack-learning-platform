#ifndef SENSORER_H
#define SENSORER_H

#include <esp_err.h>
#include <stdbool.h>

//status til sensorer
typedef struct{
    bool i2c;
    bool tof;
    bool loadcell;
    bool pot;
    bool temperature;
} sensor_health_t;

//I2C initialisering
esp_err_t sensors_init(void);

//sensors tasks
void tof_sensor(void *pvParameters);
void press_sensor(void *pvParameters);
void ds18b20_sensor(void *pvParameters);
void pot_sensor(void *pvParameters);

//gettere
float get_distance(void);
float get_press(void);
float get_temp(void);
float get_pot(void);
sensor_health_t get_sensor_health(void);

#endif
