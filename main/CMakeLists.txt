idf_component_register(SRCS "tusb_ncm_main.c" "tusb_cdc_handler.c" "resetful_server.c" "potmeter.cpp" "led_control.c" "sensorer.c" 
                       INCLUDE_DIRS "."
                       PRIV_REQUIRES grrtzm__vl53l1x_library esp_driver_gpio vfs spiffs esp_netif esp_http_server json driver
                       )
set(WEB_SRC_DIR "${CMAKE_CURRENT_SOURCE_DIR}/../front/web-demo")
if(EXISTS ${WEB_SRC_DIR}/dist)
    spiffs_create_partition_image(www ${WEB_SRC_DIR}/dist FLASH_IN_PROJECT)
else()
    message(FATAL_ERROR "${WEB_SRC_DIR}/dist doesn't exit.")
endif()