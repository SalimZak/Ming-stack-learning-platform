#ifndef SENSORER_H
#define SENSORER_H

#include <esp_err.h>

esp_err_t sensors_init(void);

void tof_sensor(void *pvParameters);

void press_sensor(void *pvParameters);

void pot_init();

float pot_sensor();

float get_distance(void);

float get_press(void);

#endif
