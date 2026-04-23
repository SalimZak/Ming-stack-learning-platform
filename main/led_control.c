#include "led_control.h"
#include "driver/gpio.h"
#include "esp_log.h"
#include <string.h>

static const char *TAG = "led_control";

// Pages that belong to each technology
static const char *M_PAGES[] = { "mqtt", "mqtt-t1", "mqtt-t2", "task3", "task4", NULL };
static const char *I_PAGES[] = { "influx", "influx-t1", "influx-t2", NULL };
static const char *N_PAGES[] = { "nodered", "nodered-t1", "nodered-t2", NULL };
static const char *G_PAGES[] = { "grafana", "grafana-t1", "grafana-t2", "grafana-t3", "grafana-t4", NULL };

static bool page_matches(const char *page, const char **list)
{
    for (int i = 0; list[i] != NULL; i++) {
        if (strcmp(page, list[i]) == 0) return true;
    }
    return false;
}

void led_control_init(void)
{
    gpio_config_t cfg = {
        .pin_bit_mask = (1ULL << LED_M_GPIO) |
                        (1ULL << LED_I_GPIO) |
                        (1ULL << LED_N_GPIO) |
                        (1ULL << LED_G_GPIO),
        .mode         = GPIO_MODE_OUTPUT,
        .pull_up_en   = GPIO_PULLUP_DISABLE,
        .pull_down_en = GPIO_PULLDOWN_DISABLE,
        .intr_type    = GPIO_INTR_DISABLE,
    };
    gpio_config(&cfg);

    // All LEDs off at startup
    gpio_set_level(LED_M_GPIO, 0);
    gpio_set_level(LED_I_GPIO, 0);
    gpio_set_level(LED_N_GPIO, 0);
    gpio_set_level(LED_G_GPIO, 0);

    ESP_LOGI(TAG, "LED control initialized");
}

void led_control_set_page(const char *page)
{
    if (page == NULL) page = "";

    int m = page_matches(page, M_PAGES) ? 1 : 0;
    int i = page_matches(page, I_PAGES) ? 1 : 0;
    int n = page_matches(page, N_PAGES) ? 1 : 0;
    int g = page_matches(page, G_PAGES) ? 1 : 0;

    gpio_set_level(LED_M_GPIO, m);
    gpio_set_level(LED_I_GPIO, i);
    gpio_set_level(LED_N_GPIO, n);
    gpio_set_level(LED_G_GPIO, g);

    ESP_LOGI(TAG, "Page='%s' → M:%d I:%d N:%d G:%d", page, m, i, n, g);
}
