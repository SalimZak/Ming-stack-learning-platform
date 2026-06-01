#ifndef LED_CONTROL_H
#define LED_CONTROL_H

#ifdef __cplusplus
extern "C" {
#endif

// GPIO pins for each LED
#define LED_M_GPIO  38   // MQTT
#define LED_I_GPIO  39   // InfluxDB
#define LED_N_GPIO  40   // Node-RED
#define LED_G_GPIO  41   // Grafana

// Call once at startup (in app_main)
void led_control_init(void);

// Call with the page name from the /led endpoint
// e.g. "mqtt", "mqtt-t1", "influx", "nodered", "grafana-t2", etc.
// Any unrecognized page turns all LEDs off
void led_control_set_page(const char *page);

#ifdef __cplusplus
}
#endif

#endif // LED_CONTROL_H
