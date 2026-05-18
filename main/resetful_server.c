#include <stdint.h>
#include <stdio.h>
#include <string.h>
#include <fcntl.h>
#include <sys/types.h>
#include <sys/param.h>
#include "esp_vfs.h"
#include "esp_log.h"
#include "esp_http_server.h"
#include "esp_chip_info.h"
#include "esp_random.h"
#include "esp_vfs.h"
#include "cJSON.h"
#include "led_control.h"
#include "sensorer.h"


static const char *REST_TAG = "esp-rest";
#define REST_CHECK(a, str, goto_tag, ...)                                              \
    do                                                                                 \
    {                                                                                  \
        if (!(a))                                                                      \
        {                                                                              \
            ESP_LOGE(REST_TAG, "%s(%d): " str, __FUNCTION__, __LINE__, ##__VA_ARGS__); \
            goto goto_tag;                                                             \
        }                                                                              \
    } while (0)

#define FILE_PATH_MAX (ESP_VFS_PATH_MAX + 128)
#define SCRATCH_BUFSIZE (10240)

typedef struct rest_server_context {
    char base_path[ESP_VFS_PATH_MAX + 1];
    char scratch[SCRATCH_BUFSIZE];
} rest_server_context_t;

#define CHECK_FILE_EXTENSION(filename, ext) (strcasecmp(&filename[strlen(filename) - strlen(ext)], ext) == 0)

/* Set HTTP response content type according to file extension */
static esp_err_t set_content_type_from_file(httpd_req_t *req, const char *filepath)
{
    const char *type = "text/plain";
    if (CHECK_FILE_EXTENSION(filepath, ".html")) {
        type = "text/html";
    } else if (CHECK_FILE_EXTENSION(filepath, ".js")) {
        type = "application/javascript";
    } else if (CHECK_FILE_EXTENSION(filepath, ".css")) {
        type = "text/css";
    } else if (CHECK_FILE_EXTENSION(filepath, ".png")) {
        type = "image/png";
    } else if (CHECK_FILE_EXTENSION(filepath, ".ico")) {
        type = "image/x-icon";
    } else if (CHECK_FILE_EXTENSION(filepath, ".svg")) {
        type = "image/svg+xml";
    }
    return httpd_resp_set_type(req, type);
}

/* Send HTTP response with the contents of the requested file */
static esp_err_t rest_common_get_handler(httpd_req_t *req)
{
    char filepath[FILE_PATH_MAX];

    rest_server_context_t *rest_context = (rest_server_context_t *)req->user_ctx;
    strlcpy(filepath, rest_context->base_path, sizeof(filepath));
    if (req->uri[strlen(req->uri) - 1] == '/') {
        strlcat(filepath, "/index.html", sizeof(filepath));
    } else {
        strlcat(filepath, req->uri, sizeof(filepath));
    }
    int fd = open(filepath, O_RDONLY, 0);
    if (fd == -1) {
        ESP_LOGE(REST_TAG, "Failed to open file : %s", filepath);
        /* Respond with 500 Internal Server Error */
        httpd_resp_send_err(req, HTTPD_500_INTERNAL_SERVER_ERROR, "Failed to read existing file");
        return ESP_FAIL;
    }

    set_content_type_from_file(req, filepath);

    char *chunk = rest_context->scratch;
    ssize_t read_bytes;
    do {
        /* Read file in chunks into the scratch buffer */
        read_bytes = read(fd, chunk, SCRATCH_BUFSIZE);
        if (read_bytes == -1) {
            ESP_LOGE(REST_TAG, "Failed to read file : %s", filepath);
            close(fd);
            httpd_resp_sendstr_chunk(req, NULL);
            httpd_resp_send_err(req, HTTPD_500_INTERNAL_SERVER_ERROR, "Failed to read file");
            return ESP_FAIL;
        } else if (read_bytes > 0) {
            /* Send the buffer contents as HTTP response chunk */
            if (httpd_resp_send_chunk(req, chunk, read_bytes) != ESP_OK) {
                close(fd);
                ESP_LOGE(REST_TAG, "File sending failed!");
                /* Abort sending file */
                httpd_resp_sendstr_chunk(req, NULL);
                /* Respond with 500 Internal Server Error */
                httpd_resp_send_err(req, HTTPD_500_INTERNAL_SERVER_ERROR, "Failed to send file");
                return ESP_FAIL;
            }
        }
    } while (read_bytes > 0);
    /* Close file after sending complete */
    close(fd);
    ESP_LOGI(REST_TAG, "File sending complete");
    /* Respond with an empty chunk to signal HTTP response completion */
    httpd_resp_send_chunk(req, NULL, 0);
    return ESP_OK;
}



//sensor side
static esp_err_t sensor_get_handler(httpd_req_t *req){
    httpd_resp_set_type(req, "application/json");
    cJSON *root = cJSON_CreateObject();

    float pot = get_pot(); 
    float dist = get_distance();
    float loadc = get_press();
    float tempe = get_temp();

    cJSON_AddBoolToObject(root,   "ok",   true);
    cJSON_AddNumberToObject(root, "pot",  pot);
    cJSON_AddNumberToObject(root, "dist",  dist);
    cJSON_AddNumberToObject(root, "temp",  tempe);
    cJSON_AddNumberToObject(root, "weight",  loadc);
    


    const char *json = cJSON_Print(root); //konverterer til char
    httpd_resp_sendstr(req, json); //response body som blir sendt
    free((void *)json); //json objektet allokerer minnet på heap, dette må frigjøres og slette data inni for å unngå minne lekasje
    cJSON_Delete(root);
    return ESP_OK;
}

//handler for load cell
static esp_err_t loadcell_get_handler(httpd_req_t *req){
    httpd_resp_set_type(req, "application/json");
    cJSON *root = cJSON_CreateObject();

    float load_cell = get_press();

    cJSON_AddBoolToObject(root,   "ok",   true);
    cJSON_AddNumberToObject(root, "loadcell",  load_cell);
    
    const char *json = cJSON_Print(root); //konverterer til char
    httpd_resp_sendstr(req, json); //response body som blir sendt
    free((void *)json); //json objektet allokerer minnet på heap, dette må frigjøres og slette data inni for å unngå minne lekasje
    cJSON_Delete(root);
    return ESP_OK;
}

//handler for influx oppgave
static esp_err_t influx_get_handler(httpd_req_t *req){
    httpd_resp_set_type(req, "application/json");
    cJSON *root = cJSON_CreateObject();

    char sensorName[] = "DS18B20";
    float temprature = get_temp(); 
    
    cJSON_AddStringToObject(root, "sensorName", sensorName);
    cJSON_AddNumberToObject(root, "temp",  temprature);

    const char *json = cJSON_Print(root); //konverterer til char
    httpd_resp_sendstr(req, json); //response body som blir sendt
    free((void *)json); //json objektet allokerer minnet på heap, dette må frigjøres og slette data inni for å unngå minne lekasje
    cJSON_Delete(root);
    return ESP_OK;
}


/* Handler for LED page sync */
static esp_err_t led_set_handler(httpd_req_t *req)
{
    char page[64] = "";
    // Extract 'page' query param, e.g. /led?page=mqtt
    if (httpd_req_get_url_query_len(req) > 0) {
        char query[128];
        if (httpd_req_get_url_query_str(req, query, sizeof(query)) == ESP_OK) {
            httpd_query_key_value(query, "page", page, sizeof(page));
        }
    }
    led_control_set_page(page);
    httpd_resp_set_type(req, "application/json");
    httpd_resp_sendstr(req, "{\"ok\":true}");
    return ESP_OK;
}

esp_err_t resetful_server_start(const char *base_path)
{
    REST_CHECK(base_path, "wrong base path", err);
    rest_server_context_t *rest_context = calloc(1, sizeof(rest_server_context_t));
    REST_CHECK(rest_context, "No memory for rest context", err);
    strlcpy(rest_context->base_path, base_path, sizeof(rest_context->base_path));

    httpd_handle_t server = NULL;
    httpd_config_t config = HTTPD_DEFAULT_CONFIG();
    config.uri_match_fn = httpd_uri_match_wildcard;

    ESP_LOGI(REST_TAG, "Starting HTTP Server");
    REST_CHECK(httpd_start(&server, &config) == ESP_OK, "Start server failed", err_start);

            //influx oppgave
    httpd_uri_t influx_task_get_uri = {
        .uri = "/influx",
        .method = HTTP_GET,
        .handler = influx_get_handler,
        .user_ctx = rest_context
    };
    httpd_register_uri_handler(server, &influx_task_get_uri);

    
        //lastcelle 
    httpd_uri_t lastcelle_data_get_uri = {
        .uri = "/lastcelle",
        .method = HTTP_GET,
        .handler = loadcell_get_handler,
        .user_ctx = rest_context
    };
    httpd_register_uri_handler(server, &lastcelle_data_get_uri);


        
    httpd_uri_t pot_data_get_uri = {
        .uri = "/sensor",
        .method = HTTP_GET,
        .handler = sensor_get_handler,
        .user_ctx = rest_context
    };
    httpd_register_uri_handler(server, &pot_data_get_uri);

    /* URI handler for LED page sync */
    httpd_uri_t led_set_uri = {
        .uri = "/led",
        .method = HTTP_GET,
        .handler = led_set_handler,
        .user_ctx = rest_context
    };
    httpd_register_uri_handler(server, &led_set_uri);

    /* URI handler for getting web server files */
    httpd_uri_t common_get_uri = {
        .uri = "/*",
        .method = HTTP_GET,
        .handler = rest_common_get_handler,
        .user_ctx = rest_context
    };
    httpd_register_uri_handler(server, &common_get_uri);

    return ESP_OK;
err_start:
    free(rest_context);
err:
    return ESP_FAIL;
}
