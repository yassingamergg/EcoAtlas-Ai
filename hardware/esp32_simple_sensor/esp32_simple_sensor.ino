/*
 * EcoAtlas AI - ESP32 Simple Environmental Sensor
 * 
 * This simplified version works with just:
 * - ESP32 Dev Board
 * - 16x2 LCD Display (I2C)
 * - Jumper wires
 * 
 * Uses ESP32's built-in temperature sensor and WiFi
 * 
 * Connections:
 * LCD (I2C): SDA -> GPIO 21, SCL -> GPIO 22, VCC -> 5V, GND -> GND
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <LiquidCrystal_I2C.h>

// WiFi Configuration
const char* ssid = "Xiaomi_1929";
const char* password = "Jojo.321";

// EcoAtlas AI Backend URL (replace with your computer's IP)
const char* serverURL = "http://192.168.31.247:5000/api/sensor-data";
// Find your IP with: ipconfig (Windows) or ifconfig (Mac/Linux)

// LCD Configuration (I2C Address: 0x27)
LiquidCrystal_I2C lcd(0x27, 16, 2);

// Global Variables
float temperature = 0;
int wifiSignal = 0;
unsigned long lastUpdate = 0;
const unsigned long updateInterval = 30000; // 30 seconds

// Device ID (unique for each sensor node)    
const String deviceId = "ESP32_SIMPLE_001";

void setup() {
  Serial.begin(115200);
  Serial.println("🌱 EcoAtlas AI - Simple ESP32 Sensor Starting...");
  
  // Initialize LCD
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("EcoAtlas AI");
  lcd.setCursor(0, 1);
  lcd.print("Initializing...");
  
  // Connect to WiFi
  connectToWiFi();
  
  // Display startup message
  displayStartupMessage();
  
  Serial.println("✅ Simple sensor node initialized successfully!");
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
  
  // Read ESP32 built-in temperature sensor
  temperature = temperatureRead();
  
  // Get WiFi signal strength
  wifiSignal = WiFi.RSSI();
  
  Serial.println("📈 Sensor Data:");
  Serial.println("  Temperature: " + String(temperature) + "°C");
  Serial.println("  WiFi Signal: " + String(wifiSignal) + " dBm");
  Serial.println("  IP Address: " + WiFi.localIP().toString());
}

void displayData() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("T:" + String(temperature, 1) + "°C S:" + String(wifiSignal));
  lcd.setCursor(0, 1);
  lcd.print("IP:" + WiFi.localIP().toString().substring(0, 15));
}

void displayStartupMessage() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("🌱 EcoAtlas AI");
  lcd.setCursor(0, 1);
  lcd.print("Simple Sensor");
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
  doc["humidity"] = 0; // Not available without DHT22
  doc["air_quality"] = 0; // Not available without MQ-135
  doc["co2_level"] = 0; // Not available without MQ-135
  doc["light_level"] = 0; // Not available without LDR
  doc["wifi_signal"] = wifiSignal;
  doc["location"] = "Home Office";
  doc["node_type"] = "simple_environmental";
  
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

// Test function to verify all components
void runSelfTest() {
  Serial.println("🧪 Running self-test...");
  
  // Test LCD
  lcd.clear();
  lcd.print("LCD Test OK");
  delay(1000);
  
  // Test WiFi
  if (WiFi.status() == WL_CONNECTED) {
    lcd.clear();
    lcd.print("WiFi Test OK");
    delay(1000);
  } else {
    lcd.clear();
    lcd.print("WiFi Test FAIL");
    delay(1000);
  }
  
  // Test temperature sensor
  float testTemp = temperatureRead();
  lcd.clear();
  lcd.print("Temp: " + String(testTemp, 1) + "°C");
  delay(1000);
  
  Serial.println("✅ Self-test completed!");
}
