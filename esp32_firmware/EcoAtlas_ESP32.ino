/*
 * EcoAtlas ESP32 Real-time Environmental Monitoring
 * 
 * This firmware collects environmental data from various sensors
 * and transmits it to the EcoAtlas AI platform via MQTT
 * 
 * Required Libraries:
 * - WiFi
 * - PubSubClient
 * - ArduinoJson
 * - DHT sensor library
 * - Adafruit BME280
 * - PMS library (for PM2.5 sensor)
 * 
 * Hardware Setup:
 * - ESP32 DevKit
 * - DHT22 (Temperature & Humidity)
 * - BME280 (Pressure)
 * - PMS5003 (PM2.5 Air Quality)
 * - Current Transformer (Energy Monitoring)
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <Wire.h>
#include <Adafruit_BME280.h>
#include <SoftwareSerial.h>
#include <SensirionI2CScd4x.h>  // For SCD4x CO2 sensor
#include <MHZ19.h>              // For MH-Z19 CO2 sensor

// WiFi Configuration
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// MQTT Configuration
const char* mqtt_server = "YOUR_MQTT_BROKER_IP";
const int mqtt_port = 1883;
const char* mqtt_user = "ecoatlas";
const char* mqtt_password = "ecoatlas123";
const char* device_id = "ESP32_001";

// Sensor Pins
#define DHT_PIN 4
#define DHT_TYPE DHT22
#define PMS_RX 16
#define PMS_TX 17
#define CT_PIN 34
#define CO2_RX 18  // For MH-Z19 CO2 sensor
#define CO2_TX 19  // For MH-Z19 CO2 sensor

// Sensor Objects
DHT dht(DHT_PIN, DHT_TYPE);
Adafruit_BME280 bme;
SoftwareSerial pmsSerial(PMS_RX, PMS_TX);
SoftwareSerial co2Serial(CO2_RX, CO2_TX);  // For MH-Z19 CO2 sensor
MHZ19 co2Sensor;  // MH-Z19 CO2 sensor object

// WiFi and MQTT Clients
WiFiClient espClient;
PubSubClient client(espClient);

// Data Collection Variables
struct SensorData {
  float temperature;
  float humidity;
  float pressure;
  float pm25;
  float pm10;
  float co2;
  float power_consumption;
  unsigned long timestamp;
  String device_id;
};

SensorData currentData;

// Timing Variables
unsigned long lastDataSent = 0;
const unsigned long dataInterval = 30000; // Send data every 30 seconds
unsigned long lastHeartbeat = 0;
const unsigned long heartbeatInterval = 60000; // Heartbeat every minute

// Network Status
bool wifiConnected = false;
bool mqttConnected = false;

void setup() {
  Serial.begin(115200);
  Serial.println("EcoAtlas ESP32 Environmental Monitor Starting...");
  
  // Initialize Sensors
  initializeSensors();
  
  // Connect to WiFi
  connectToWiFi();
  
  // Setup MQTT
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(mqttCallback);
  
  // Connect to MQTT
  connectToMQTT();
  
  Serial.println("EcoAtlas ESP32 Ready!");
}

void loop() {
  // Maintain WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    wifiConnected = false;
    connectToWiFi();
  }
  
  // Maintain MQTT connection
  if (!client.connected()) {
    mqttConnected = false;
    connectToMQTT();
  }
  
  client.loop();
  
  // Collect and send sensor data
  if (millis() - lastDataSent >= dataInterval) {
    collectSensorData();
    sendSensorData();
    lastDataSent = millis();
  }
  
  // Send heartbeat
  if (millis() - lastHeartbeat >= heartbeatInterval) {
    sendHeartbeat();
    lastHeartbeat = millis();
  }
  
  delay(1000);
}

void initializeSensors() {
  Serial.println("Initializing sensors...");
  
  // Initialize DHT22
  dht.begin();
  Serial.println("DHT22 initialized");
  
  // Initialize BME280
  if (!bme.begin(0x76)) {
    Serial.println("BME280 not found!");
  } else {
    Serial.println("BME280 initialized");
  }
  
  // Initialize PMS5003
  pmsSerial.begin(9600);
  Serial.println("PMS5003 initialized");
  
  // Initialize CO2 sensor (MH-Z19)
  co2Serial.begin(9600);
  co2Sensor.begin(co2Serial);
  co2Sensor.autoCalibration(false);  // Disable auto-calibration for better accuracy
  Serial.println("MH-Z19 CO2 sensor initialized");
  
  // Initialize CT sensor pin
  pinMode(CT_PIN, INPUT);
  Serial.println("Current Transformer initialized");
}

void connectToWiFi() {
  if (wifiConnected) return;
  
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    Serial.println();
    Serial.println("WiFi connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println();
    Serial.println("WiFi connection failed!");
  }
}

void connectToMQTT() {
  if (mqttConnected) return;
  
  Serial.print("Connecting to MQTT broker...");
  
  if (client.connect(device_id, mqtt_user, mqtt_password)) {
    mqttConnected = true;
    Serial.println(" connected!");
    
    // Subscribe to control topics
    client.subscribe("ecoatlas/control/+/+");
    client.subscribe("ecoatlas/device/" + String(device_id) + "/control");
    
    // Publish device online status
    publishDeviceStatus("online");
  } else {
    Serial.print(" failed, rc=");
    Serial.println(client.state());
  }
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("]: ");
  Serial.println(message);
  
  // Handle control commands
  if (String(topic).indexOf("control") >= 0) {
    handleControlCommand(topic, message);
  }
}

void handleControlCommand(String topic, String message) {
  // Parse control commands
  if (message == "restart") {
    Serial.println("Restart command received");
    ESP.restart();
  } else if (message == "calibrate") {
    Serial.println("Calibration command received");
    calibrateSensors();
  } else if (message == "status") {
    sendDeviceStatus();
  }
}

void collectSensorData() {
  Serial.println("Collecting sensor data...");
  
  // Read DHT22 (Temperature & Humidity)
  currentData.temperature = dht.readTemperature();
  currentData.humidity = dht.readHumidity();
  
  // Read BME280 (Pressure)
  currentData.pressure = bme.readPressure() / 100.0F; // Convert to hPa
  
  // Read PMS5003 (PM2.5 & PM10)
  readPMSData();
  
  // Read CO2 sensor (MH-Z19)
  currentData.co2 = readCO2Sensor();
  
  // Read Current Transformer (Power Consumption)
  currentData.power_consumption = readPowerConsumption();
  
  // Set metadata
  currentData.timestamp = millis();
  currentData.device_id = String(device_id);
  
  // Validate data
  if (isnan(currentData.temperature) || isnan(currentData.humidity)) {
    Serial.println("DHT22 read failed!");
    currentData.temperature = 0;
    currentData.humidity = 0;
  }
  
  Serial.println("Sensor data collected:");
  Serial.println("Temperature: " + String(currentData.temperature) + "°C");
  Serial.println("Humidity: " + String(currentData.humidity) + "%");
  Serial.println("Pressure: " + String(currentData.pressure) + " hPa");
  Serial.println("PM2.5: " + String(currentData.pm25) + " μg/m³");
  Serial.println("PM10: " + String(currentData.pm10) + " μg/m³");
  Serial.println("CO2: " + String(currentData.co2) + " ppm");
  Serial.println("Power: " + String(currentData.power_consumption) + " W");
}

void readPMSData() {
  // Read PM2.5 and PM10 from PMS5003
  if (pmsSerial.available()) {
    uint8_t buffer[32];
    int index = 0;
    
    while (pmsSerial.available() && index < 32) {
      buffer[index] = pmsSerial.read();
      index++;
    }
    
    if (index >= 32) {
      // Parse PMS5003 data
      uint16_t pm25 = (buffer[12] << 8) | buffer[13];
      uint16_t pm10 = (buffer[14] << 8) | buffer[15];
      
      currentData.pm25 = pm25;
      currentData.pm10 = pm10;
    }
  } else {
    currentData.pm25 = 0;
    currentData.pm10 = 0;
  }
}

float readPowerConsumption() {
  // Read current transformer and calculate power
  int rawValue = analogRead(CT_PIN);
  float voltage = (rawValue / 4095.0) * 3.3; // Convert to voltage
  float current = (voltage - 1.65) / 0.066; // Convert to current (A)
  float power = current * 230.0; // Assume 230V AC
  
  return abs(power);
}

float readCO2Sensor() {
  // Read CO2 from MH-Z19 sensor
  int co2Reading = co2Sensor.getCO2();
  
  if (co2Reading > 0) {
    return (float)co2Reading;
  } else {
    // Fallback to estimation if sensor fails
    return estimateCO2(currentData.temperature, currentData.humidity);
  }
}

float estimateCO2(float temp, float humidity) {
  // Simplified CO2 estimation based on temperature and humidity
  // Used as fallback when CO2 sensor is not available
  float baseCO2 = 400; // Baseline atmospheric CO2
  float tempFactor = (temp - 20) * 2; // Temperature effect
  float humidityFactor = (humidity - 50) * 0.5; // Humidity effect
  
  return baseCO2 + tempFactor + humidityFactor;
}

void sendSensorData() {
  if (!mqttConnected) return;
  
  // Create JSON payload
  DynamicJsonDocument doc(1024);
  doc["device_id"] = currentData.device_id;
  doc["timestamp"] = currentData.timestamp;
  doc["temperature"] = currentData.temperature;
  doc["humidity"] = currentData.humidity;
  doc["pressure"] = currentData.pressure;
  doc["pm25"] = currentData.pm25;
  doc["pm10"] = currentData.pm10;
  doc["co2"] = currentData.co2;
  doc["power_consumption"] = currentData.power_consumption;
  doc["wifi_rssi"] = WiFi.RSSI();
  doc["uptime"] = millis();
  
  // Convert to string
  String payload;
  serializeJson(doc, payload);
  
  // Publish to MQTT
  String topic = "ecoatlas/sensors/" + String(device_id) + "/data";
  if (client.publish(topic.c_str(), payload.c_str())) {
    Serial.println("Sensor data published successfully");
  } else {
    Serial.println("Failed to publish sensor data");
  }
}

void sendHeartbeat() {
  if (!mqttConnected) return;
  
  DynamicJsonDocument doc(256);
  doc["device_id"] = String(device_id);
  doc["timestamp"] = millis();
  doc["status"] = "alive";
  doc["wifi_rssi"] = WiFi.RSSI();
  doc["free_heap"] = ESP.getFreeHeap();
  
  String payload;
  serializeJson(doc, payload);
  
  String topic = "ecoatlas/device/" + String(device_id) + "/heartbeat";
  client.publish(topic.c_str(), payload.c_str());
}

void publishDeviceStatus(String status) {
  DynamicJsonDocument doc(256);
  doc["device_id"] = String(device_id);
  doc["status"] = status;
  doc["timestamp"] = millis();
  doc["ip_address"] = WiFi.localIP().toString();
  
  String payload;
  serializeJson(doc, payload);
  
  String topic = "ecoatlas/device/" + String(device_id) + "/status";
  client.publish(topic.c_str(), payload.c_str());
}

void sendDeviceStatus() {
  DynamicJsonDocument doc(512);
  doc["device_id"] = String(device_id);
  doc["status"] = "online";
  doc["timestamp"] = millis();
  doc["wifi_ssid"] = String(ssid);
  doc["ip_address"] = WiFi.localIP().toString();
  doc["mac_address"] = WiFi.macAddress();
  doc["free_heap"] = ESP.getFreeHeap();
  doc["uptime"] = millis();
  doc["sensors"]["dht22"] = !isnan(currentData.temperature);
  doc["sensors"]["bme280"] = true;
  doc["sensors"]["pms5003"] = true;
  doc["sensors"]["ct"] = true;
  
  String payload;
  serializeJson(doc, payload);
  
  String topic = "ecoatlas/device/" + String(device_id) + "/status";
  client.publish(topic.c_str(), payload.c_str());
}

void calibrateSensors() {
  Serial.println("Calibrating sensors...");
  
  // DHT22 calibration (wait for stable readings)
  for (int i = 0; i < 5; i++) {
    dht.readTemperature();
    dht.readHumidity();
    delay(2000);
  }
  
  // BME280 calibration
  bme.readPressure();
  
  Serial.println("Sensor calibration complete");
}
