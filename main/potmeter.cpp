#include "potmeter.h"
#include "driver/adc.h"

#define POT_ADC_CHANNEL   ADC1_CHANNEL_3   // GPIO4
#define POT_ADC_ATTEN     ADC_ATTEN_DB_11  // 0–3.3V
#define POT_ADC_WIDTH     ADC_WIDTH_BIT_12 // 0–4095

extern "C" float read_potentiometer_voltage(void) {
    adc1_config_width(POT_ADC_WIDTH);
    adc1_config_channel_atten(POT_ADC_CHANNEL, POT_ADC_ATTEN);
    
    int raw = adc1_get_raw(POT_ADC_CHANNEL);
    return (raw / 4095.0f) * 3.3f;
}
