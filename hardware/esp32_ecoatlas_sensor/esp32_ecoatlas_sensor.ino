/*
 * EcoAtlas AI - ESP32 Environmental Sensor Node
 * 
 * This code runs on ESP32 and collects environmental data
 * Sends data to EcoAtlas AI backend via WiFi
 * Displays data on LCD screen
 * 
 * Hardware Required:
 * - ESP32 Dev Board
 * - 16x2 LCD Display (I2C)
 * - DHT22 Temperature/Humidity Sensor
 * - MQ-135 Air Quality Sensor
 * - Light Sensor (LDR)
 * - Jumper wires
 * 
 * Connections:
 * LCD (I2C): SDA -> GPIO 21, SCL -> GPIO 22
 * DHT22: Data -> GPIO 4, VCC -> 3.3V, GND -> GND
 * MQ-135: A0 -> GPIO 34, VCC -> 3.3V, GND -> GND
 * LDR: A0 -> GPIO 35, VCC -> 3.3V, GND -> GND
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <LiquidCrystal_I2C.h>
#include <DHT.h>

// WiFi Configuration
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// EcoAtlas AI Backend URL
const char* serverURL = "https://ecoatlas.xyz/api/sensor-data";
// Replace with your actual backend URL when deployed

// Hardware Configuration
#define DHT_PIN 4
#define DHT_TYPE DHT22
#define MQ135_PIN 34
#define LDR_PIN 35

// LCD Configuration (I2C Address: 0x27)
LiquidCrystal_I2C lcd(0x27, 16, 2);

// Sensor Objects
DHT dht(DHT_PIN, DHT_TYPE);

// Global Variables
float temperature = 0;
float humidity = 0;
int airQuality = 0;
int lightLevel = 0;
int co2Level = 0;
unsigned long lastUpdate = 0;
const unsigned long updateInterval = 30000; // 30 seconds

// Device ID (unique for each sensor node)
const String deviceId = "ESP32_NODE_001";

void setup() {
  Serial.begin(115200);
  Serial.println("🌱 EcoAtlas AI - ESP32 Sensor Node Starting...");
  
  // Initialize LCD
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("EcoAtlas AI");
  lcd.setCursor(0, 1);
  lcd.print("Initializing...");
  
  // Initialize DHT sensor
  dht.begin();
  
  // Connect to WiFi
  connectToWiFi();
  
  // Display startup message
  displayStartupMessage();
  
  Serial.println("✅ Sensor node initialized successfully!");
}

void loop() {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    connectToWiFi();
    return;
  }
  
  // Read sensors every 30 seconds
  if (millis() - lastUpdate >= updateInterval) {
    readSensors();
    displayData();
    sendDataToServer();
    lastUpdate = millis();
  }
  
  // Update display every 5 seconds
  static unsigned long lastDisplayUpdate = 0;
  if (millis() - lastDisplayUpdate >= 5000) {
    displayData();
    lastDisplayUpdate = millis();
  }
  
  delay(100);
}

void connectToWiFi() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Connecting WiFi");
  lcd.setCursor(0, 1);
  lcd.print("SSID: " + String(ssid));
  
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.println("✅ WiFi Connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("WiFi Connected!");
    lcd.setCursor(0, 1);
    lcd.print("IP: " + WiFi.localIP().toString());
    delay(2000);
  } else {
    Serial.println("❌ WiFi Connection Failed!");
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("WiFi Failed!");
    lcd.setCursor(0, 1);
    lcd.print("Check Settings");
  }
}

void readSensors() {
  Serial.println("📊 Reading sensors...");
  
  // Read DHT22 (Temperature & Humidity)
  temperature = dht.readTemperature();
  humidity = dht.readHumidity();
  
  // Check if DHT readings are valid
  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("❌ DHT sensor read failed!");
    temperature = 0;
    humidity = 0;
  }
  
  // Read MQ-135 (Air Quality / CO2)
  int mq135Raw = analogRead(MQ135_PIN);
  airQuality = map(mq135Raw, 0, 4095, 0, 1000); // Convert to PPM
  co2Level = map(mq135Raw, 0, 4095, 300, 10000); // Estimate CO2
  
  // Read Light Sensor (LDR)
  int ldrRaw = analogRead(LDR_PIN);
  lightLevel = map(ldrRaw, 0, 4095, 0, 100); // Convert to percentage
  
  Serial.println("📈 Sensor Data:");
  Serial.println("  Temperature: " + String(temperature) + "°C");
  Serial.println("  Humidity: " + String(humidity) + "%");
  Serial.println("  Air Quality: " + String(airQuality) + " PPM");
  Serial.println("  CO2 Level: " + String(co2Level) + " PPM");
  Serial.println("  Light Level: " + String(lightLevel) + "%");
}

void displayData() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("T:" + String(temperature, 1) + "°C H:" + String(humidity, 0) + "%");
  lcd.setCursor(0, 1);
  lcd.print("AQ:" + String(airQuality) + " L:" + String(lightLevel) + "%");
}

void displayStartupMessage() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("🌱 EcoAtlas AI");
  lcd.setCursor(0, 1);
  lcd.print("Environmental Node");
  delay(3000);
}

void sendDataToServer() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi not connected, skipping data upload");
    return;
  }
  
  Serial.println("📤 Sending data to EcoAtlas AI...");
  
  // Create JSON payload
  DynamicJsonDocument doc(1024);
  doc["device_id"] = deviceId;
  doc["timestamp"] = millis();
  doc["temperature"] = temperature;
  doc["humidity"] = humidity;
  doc["air_quality"] = airQuality;
  doc["co2_level"] = co2Level;
  doc["light_level"] = lightLevel;
  doc["location"] = "Home Office"; // Update with your location
  doc["node_type"] = "environmental";
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  // Send HTTP POST request
  HTTPClient http;
  http.begin(serverURL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-ID", deviceId);
  
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("✅ Data sent successfully!");
    Serial.println("Response Code: " + String(httpResponseCode));
    Serial.println("Response: " + response);
    
    // Show success on LCD
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Data Uploaded!");
    lcd.setCursor(0, 1);
    lcd.print("Code: " + String(httpResponseCode));
    delay(2000);
  } else {
    Serial.println("❌ HTTP Error: " + String(httpResponseCode));
    
    // Show error on LCD
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Upload Failed!");
    lcd.setCursor(0, 1);
    lcd.print("Code: " + String(httpResponseCode));
    delay(2000);
  }
  
  http.end();
}

// Additional utility functions
void displayError(String error) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("ERROR:");
  lcd.setCursor(0, 1);
  lcd.print(error);
  delay(3000);
}

void displayWiFiStatus() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("WiFi: " + String(WiFi.status() == WL_CONNECTED ? "OK" : "FAIL"));
  lcd.setCursor(0, 1);
  lcd.print("Signal: " + String(WiFi.RSSI()) + "dBm");
  delay(2000);
}

// Deep sleep mode for battery operation (optional)
void enterDeepSleep(int seconds) {
  Serial.println("😴 Entering deep sleep for " + String(seconds) + " seconds...");
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Sleeping...");
  lcd.setCursor(0, 1);
  lcd.print(String(seconds) + "s");
  delay(1000);
  lcd.noBacklight();
  
  esp_sleep_enable_timer_wakeup(seconds * 1000000);
  esp_deep_sleep_start();
}
