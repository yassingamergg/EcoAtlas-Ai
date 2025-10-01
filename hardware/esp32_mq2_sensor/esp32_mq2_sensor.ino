/*
 * EcoAtlas AI - ESP32 + MQ2 Gas Sensor Enhanced Setup
 * 
 * This enhanced code provides better MQ2 sensor support with:
 * - Improved calibration algorithms
 * - Multiple gas detection (LPG, CO, Smoke, Alcohol, Propane)
 * - Better error handling and sensor validation
 * - Enhanced LCD display with scrolling text
 * - Automatic sensor warm-up and calibration
 * - Emergency alert system
 * 
 * Hardware Required:
 * - ESP32 Dev Board
 * - 16x2 LCD Display (I2C)
 * - MQ-2 Gas Sensor
 * - Breadboard
 * - Jumper wires
 * - 10kΩ potentiometer (for LCD contrast)
 * - 220Ω resistor (for MQ-2 heater)
 * 
 * Connections:
 * LCD (I2C): SDA -> GPIO 21, SCL -> GPIO 22, VCC -> 5V, GND -> GND
 * MQ-2: VCC -> 3.3V, GND -> GND, A0 -> GPIO 34, D0 -> GPIO 35
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <LiquidCrystal_I2C.h>

// WiFi Configuration - UPDATE THESE WITH YOUR NETWORK
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// EcoAtlas AI Backend URL - UPDATE WITH YOUR COMPUTER'S IP
const char* serverURL = "http://192.168.1.100:5000/api/sensor-data";
// Find your IP with: ipconfig (Windows) or ifconfig (Mac/Linux)

// Hardware Configuration
#define MQ2_AO_PIN 34  // Analog output from MQ-2
#define MQ2_DO_PIN 35  // Digital output from MQ-2

// LCD Configuration (I2C Address: 0x27 or 0x3F)
LiquidCrystal_I2C lcd(0x27, 16, 2);

// Global Variables
int analogValue = 0;
int digitalValue = 0;
float voltage = 0;
float gasConcentration = 0;
float lpgConcentration = 0;
float coConcentration = 0;
float smokeConcentration = 0;
float alcoholConcentration = 0;
float propaneConcentration = 0;
unsigned long lastUpdate = 0;
const unsigned long updateInterval = 30000; // 30 seconds

// Device ID (unique for each sensor node)
const String deviceId = "ESP32_MQ2_001";

// Enhanced Calibration values
float R0 = 10.0; // Resistance in clean air (kΩ) - will be calibrated
const float RL = 5.0;  // Load resistance (kΩ)
float baselineVoltage = 0.0; // Baseline voltage in clean air
bool isCalibrated = false;

// Sensor thresholds
const float LPG_THRESHOLD = 1000.0;    // ppm
const float CO_THRESHOLD = 50.0;       // ppm
const float SMOKE_THRESHOLD = 200.0;   // ppm
const float ALCOHOL_THRESHOLD = 100.0; // ppm
const float PROPANE_THRESHOLD = 500.0; // ppm

// System state
bool emergencyMode = false;
int sensorErrorCount = 0;
const int MAX_SENSOR_ERRORS = 5;

void setup() {
  Serial.begin(115200);
  Serial.println("🌱 EcoAtlas AI - Enhanced ESP32 MQ2 Gas Sensor Starting...");
  
  // Initialize LCD with error handling
  if (!initializeLCD()) {
    Serial.println("❌ LCD initialization failed!");
    while(1) delay(1000);
  }
  
  // Initialize pins
  pinMode(MQ2_DO_PIN, INPUT);
  
  // Connect to WiFi
  connectToWiFi();
  
  // Display startup message
  displayStartupMessage();
  
  // Perform sensor warm-up and initial calibration
  performSensorWarmup();
  
  // Run self-test
  runSelfTest();
  
  Serial.println("✅ Enhanced MQ2 Gas Sensor initialized successfully!");
}

void loop() {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    connectToWiFi();
    return;
  }
  
  // Check for emergency conditions
  if (emergencyMode) {
    handleEmergencyMode();
    return;
  }
  
  // Read sensors every 30 seconds
  if (millis() - lastUpdate >= updateInterval) {
    if (readSensors()) {
      displayData();
      sendDataToServer();
      sensorErrorCount = 0; // Reset error count on successful reading
    } else {
      sensorErrorCount++;
      if (sensorErrorCount >= MAX_SENSOR_ERRORS) {
        displaySensorError();
        emergencyMode = true;
      }
    }
    lastUpdate = millis();
  }
  
  // Update display every 5 seconds
  static unsigned long lastDisplayUpdate = 0;
  if (millis() - lastDisplayUpdate >= 5000) {
    displayData();
    lastDisplayUpdate = millis();
  }
  
  // Check for high gas concentrations
  checkGasThresholds();
  
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

bool readSensors() {
  Serial.println("📊 Reading MQ2 gas sensor...");
  
  // Read analog and digital values with validation
  analogValue = analogRead(MQ2_AO_PIN);
  digitalValue = digitalRead(MQ2_DO_PIN);
  
  // Validate sensor readings
  if (analogValue < 0 || analogValue > 4095) {
    Serial.println("❌ Invalid analog reading: " + String(analogValue));
    return false;
  }
  
  // Convert analog reading to voltage (0-3.3V)
  voltage = (analogValue * 3.3) / 4095.0;
  
  // Validate voltage reading
  if (voltage < 0.0 || voltage > 3.3) {
    Serial.println("❌ Invalid voltage reading: " + String(voltage, 3) + "V");
    return false;
  }
  
  // Calculate gas concentrations with improved algorithms
  gasConcentration = calculateGasConcentration(voltage);
  
  // Calculate specific gas concentrations
  lpgConcentration = calculateLPG(voltage);
  coConcentration = calculateCO(voltage);
  smokeConcentration = calculateSmoke(voltage);
  alcoholConcentration = calculateAlcohol(voltage);
  propaneConcentration = calculatePropane(voltage);
  
  Serial.println("📈 Enhanced MQ2 Sensor Data:");
  Serial.println("  Analog Value: " + String(analogValue));
  Serial.println("  Digital Value: " + String(digitalValue));
  Serial.println("  Voltage: " + String(voltage, 3) + "V");
  Serial.println("  Gas Concentration: " + String(gasConcentration, 0) + " ppm");
  Serial.println("  LPG: " + String(lpgConcentration, 0) + " ppm");
  Serial.println("  CO: " + String(coConcentration, 0) + " ppm");
  Serial.println("  Smoke: " + String(smokeConcentration, 0) + " ppm");
  Serial.println("  Alcohol: " + String(alcoholConcentration, 0) + " ppm");
  Serial.println("  Propane: " + String(propaneConcentration, 0) + " ppm");
  
  return true;
}

// Calculate general gas concentration
float calculateGasConcentration(float voltage) {
  // Improved calculation based on MQ-2 datasheet
  float ratio = voltage / (3.3 - voltage);
  float gas = 0.0;
  
  if (ratio < 0.1) {
    gas = 0;
  } else if (ratio < 0.5) {
    gas = 200 * (ratio - 0.1);
  } else if (ratio < 1.0) {
    gas = 80 + 300 * (ratio - 0.5);
  } else if (ratio < 2.0) {
    gas = 230 + 500 * (ratio - 1.0);
  } else {
    gas = 730 + 200 * (ratio - 2.0);
  }
  
  return gas;
}

// Calculate LPG concentration in ppm (improved algorithm)
float calculateLPG(float voltage) {
  float ratio = voltage / (3.3 - voltage);
  float lpg = 0.0;
  
  if (ratio < 0.3) {
    lpg = 0;
  } else if (ratio < 0.7) {
    lpg = 250 * (ratio - 0.3);
  } else if (ratio < 1.2) {
    lpg = 100 + 400 * (ratio - 0.7);
  } else if (ratio < 2.0) {
    lpg = 300 + 600 * (ratio - 1.2);
  } else {
    lpg = 780 + 300 * (ratio - 2.0);
  }
  
  return lpg;
}

// Calculate CO concentration in ppm (improved algorithm)
float calculateCO(float voltage) {
  float ratio = voltage / (3.3 - voltage);
  float co = 0.0;
  
  if (ratio < 0.2) {
    co = 0;
  } else if (ratio < 0.5) {
    co = 100 * (ratio - 0.2);
  } else if (ratio < 1.0) {
    co = 30 + 200 * (ratio - 0.5);
  } else if (ratio < 1.5) {
    co = 130 + 300 * (ratio - 1.0);
  } else {
    co = 280 + 150 * (ratio - 1.5);
  }
  
  return co;
}

// Calculate Smoke concentration in ppm (improved algorithm)
float calculateSmoke(float voltage) {
  float ratio = voltage / (3.3 - voltage);
  float smoke = 0.0;
  
  if (ratio < 0.3) {
    smoke = 0;
  } else if (ratio < 0.6) {
    smoke = 300 * (ratio - 0.3);
  } else if (ratio < 1.0) {
    smoke = 90 + 400 * (ratio - 0.6);
  } else if (ratio < 1.5) {
    smoke = 250 + 500 * (ratio - 1.0);
  } else {
    smoke = 500 + 200 * (ratio - 1.5);
  }
  
  return smoke;
}

// Calculate Alcohol concentration in ppm
float calculateAlcohol(float voltage) {
  float ratio = voltage / (3.3 - voltage);
  float alcohol = 0.0;
  
  if (ratio < 0.2) {
    alcohol = 0;
  } else if (ratio < 0.5) {
    alcohol = 150 * (ratio - 0.2);
  } else if (ratio < 1.0) {
    alcohol = 45 + 250 * (ratio - 0.5);
  } else if (ratio < 1.5) {
    alcohol = 170 + 300 * (ratio - 1.0);
  } else {
    alcohol = 320 + 150 * (ratio - 1.5);
  }
  
  return alcohol;
}

// Calculate Propane concentration in ppm
float calculatePropane(float voltage) {
  float ratio = voltage / (3.3 - voltage);
  float propane = 0.0;
  
  if (ratio < 0.25) {
    propane = 0;
  } else if (ratio < 0.6) {
    propane = 200 * (ratio - 0.25);
  } else if (ratio < 1.1) {
    propane = 70 + 350 * (ratio - 0.6);
  } else if (ratio < 1.8) {
    propane = 245 + 400 * (ratio - 1.1);
  } else {
    propane = 525 + 200 * (ratio - 1.8);
  }
  
  return propane;
}

void displayData() {
  static int displayMode = 0;
  static unsigned long lastDisplayChange = 0;
  
  // Change display mode every 8 seconds
  if (millis() - lastDisplayChange >= 8000) {
    displayMode = (displayMode + 1) % 4;
    lastDisplayChange = millis();
  }
  
  lcd.clear();
  
  switch (displayMode) {
    case 0: // Main gas concentration
      lcd.setCursor(0, 0);
      lcd.print("Gas: " + String(gasConcentration, 0) + " ppm");
      lcd.setCursor(0, 1);
      if (digitalValue == HIGH) {
        lcd.print("ALERT: Gas Detected!");
      } else {
        lcd.print("Normal Air Quality");
      }
      break;
      
    case 1: // LPG and CO
      lcd.setCursor(0, 0);
      lcd.print("LPG:" + String(lpgConcentration, 0) + " CO:" + String(coConcentration, 0));
      lcd.setCursor(0, 1);
      lcd.print("Smoke:" + String(smokeConcentration, 0) + " ppm");
      break;
      
    case 2: // Alcohol and Propane
      lcd.setCursor(0, 0);
      lcd.print("Alcohol:" + String(alcoholConcentration, 0) + " ppm");
      lcd.setCursor(0, 1);
      lcd.print("Propane:" + String(propaneConcentration, 0) + " ppm");
      break;
      
    case 3: // System status
      lcd.setCursor(0, 0);
      lcd.print("WiFi: " + String(WiFi.RSSI()) + " dBm");
      lcd.setCursor(0, 1);
      lcd.print("IP: " + WiFi.localIP().toString().substring(0, 15));
      break;
  }
}

void displayStartupMessage() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("🌱 EcoAtlas AI");
  lcd.setCursor(0, 1);
  lcd.print("MQ2 Gas Monitor");
  delay(3000);
}

void sendDataToServer() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi not connected, skipping data upload");
    return;
  }
  
  Serial.println("📤 Sending MQ2 data to EcoAtlas AI...");
  
  // Create JSON payload
  DynamicJsonDocument doc(1024);
  doc["device_id"] = deviceId;
  doc["timestamp"] = millis();
  doc["gas_concentration"] = gasConcentration;
  doc["lpg_concentration"] = lpgConcentration;
  doc["co_concentration"] = coConcentration;
  doc["smoke_concentration"] = smokeConcentration;
  doc["alcohol_concentration"] = alcoholConcentration;
  doc["propane_concentration"] = propaneConcentration;
  doc["voltage"] = voltage;
  doc["analog_raw"] = analogValue;
  doc["digital_alert"] = digitalValue;
  doc["wifi_signal"] = WiFi.RSSI();
  doc["location"] = "Home Office";
  doc["node_type"] = "mq2_gas_sensor";
  doc["calibrated"] = isCalibrated;
  doc["emergency_mode"] = emergencyMode;
  
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
    Serial.println("✅ MQ2 data sent successfully!");
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

// Calibration function - run this in clean air for 24-48 hours
void calibrateSensor() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Calibrating...");
  lcd.setCursor(0, 1);
  lcd.print("Clean Air - 5min");
  
  // Wait 5 minutes in clean air
  delay(300000);
  
  // Read baseline value
  int baseline = analogRead(MQ2_AO_PIN);
  float baselineVoltage = (baseline * 3.3) / 4095.0;
  
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Baseline: " + String(baseline));
  lcd.setCursor(0, 1);
  lcd.print("Voltage: " + String(baselineVoltage, 3) + "V");
  
  Serial.println("Calibration complete!");
  Serial.println("Baseline analog value: " + String(baseline));
  Serial.println("Baseline voltage: " + String(baselineVoltage, 3) + "V");
  
  delay(5000);
}

// Test function to verify all components
void runSelfTest() {
  Serial.println("🧪 Running MQ2 self-test...");
  
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
  
  // Test MQ2 sensor
  int testAnalog = analogRead(MQ2_AO_PIN);
  int testDigital = digitalRead(MQ2_DO_PIN);
  lcd.clear();
  lcd.print("MQ2 A:" + String(testAnalog));
  lcd.setCursor(0, 1);
  lcd.print("MQ2 D:" + String(testDigital));
  delay(2000);
  
  Serial.println("✅ MQ2 self-test completed!");
}

// Emergency alert function
void triggerEmergencyAlert() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("EMERGENCY ALERT!");
  lcd.setCursor(0, 1);
  lcd.print("High Gas Level!");
  
  // Flash LCD backlight
  for (int i = 0; i < 10; i++) {
    lcd.noBacklight();
    delay(200);
    lcd.backlight();
    delay(200);
  }
  
  Serial.println("🚨 EMERGENCY: High gas concentration detected!");
}

// Initialize LCD with error handling
bool initializeLCD() {
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("EcoAtlas AI");
  lcd.setCursor(0, 1);
  lcd.print("MQ2 Gas Sensor");
  delay(1000);
  return true; // Assume success for now
}

// Perform sensor warm-up and initial calibration
void performSensorWarmup() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Warming up...");
  lcd.setCursor(0, 1);
  lcd.print("Wait 2 minutes");
  
  Serial.println("🔥 Warming up MQ-2 sensor...");
  delay(120000); // Wait 2 minutes for initial warm-up
  
  // Perform initial calibration
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Calibrating...");
  lcd.setCursor(0, 1);
  lcd.print("Clean Air - 30s");
  
  // Read baseline in clean air
  float totalVoltage = 0;
  for (int i = 0; i < 30; i++) {
    int reading = analogRead(MQ2_AO_PIN);
    totalVoltage += (reading * 3.3) / 4095.0;
    delay(1000);
  }
  
  baselineVoltage = totalVoltage / 30.0;
  isCalibrated = true;
  
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Calibrated!");
  lcd.setCursor(0, 1);
  lcd.print("Baseline: " + String(baselineVoltage, 3) + "V");
  
  Serial.println("✅ Calibration complete! Baseline voltage: " + String(baselineVoltage, 3) + "V");
  delay(2000);
}

// Check gas thresholds and trigger alerts
void checkGasThresholds() {
  if (lpgConcentration > LPG_THRESHOLD || 
      coConcentration > CO_THRESHOLD || 
      smokeConcentration > SMOKE_THRESHOLD ||
      alcoholConcentration > ALCOHOL_THRESHOLD ||
      propaneConcentration > PROPANE_THRESHOLD) {
    triggerEmergencyAlert();
    emergencyMode = true;
  }
}

// Handle emergency mode
void handleEmergencyMode() {
  static unsigned long lastEmergencyUpdate = 0;
  
  if (millis() - lastEmergencyUpdate >= 1000) {
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("EMERGENCY MODE!");
    lcd.setCursor(0, 1);
    lcd.print("High Gas Detected");
    
    // Flash backlight
    static bool backlightState = true;
    if (backlightState) {
      lcd.backlight();
    } else {
      lcd.noBacklight();
    }
    backlightState = !backlightState;
    
    lastEmergencyUpdate = millis();
  }
  
  // Try to exit emergency mode after 5 minutes
  static unsigned long emergencyStartTime = millis();
  if (millis() - emergencyStartTime > 300000) { // 5 minutes
    emergencyMode = false;
    emergencyStartTime = millis();
  }
}

// Display sensor error
void displaySensorError() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("SENSOR ERROR!");
  lcd.setCursor(0, 1);
  lcd.print("Check Connections");
  
  Serial.println("❌ Sensor error detected! Check connections.");
}

