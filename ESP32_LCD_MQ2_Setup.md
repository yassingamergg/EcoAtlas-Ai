# ESP32 + LCD + MQ-2 Gas Sensor Setup Guide

## Components Needed
- ESP32 Development Board
- 16x2 LCD Display (I2C)
- MQ-2 Gas Sensor
- Breadboard
- Jumper wires
- 10kΩ potentiometer (for LCD contrast)
- 220Ω resistor (for MQ-2 heater)
- Power supply (5V for MQ-2, 3.3V for ESP32)

## Wiring Connections

### ESP32 Pinout
```
ESP32 Pin    →    Component
3.3V         →    LCD VCC, MQ-2 VCC
GND          →    LCD GND, MQ-2 GND
GPIO 21      →    LCD SDA
GPIO 22      →    LCD SCL
GPIO 34      →    MQ-2 A0 (Analog Output)
GPIO 35      →    MQ-2 D0 (Digital Output)
```

### Detailed Connections

#### LCD Display (I2C)
- **VCC** → ESP32 3.3V
- **GND** → ESP32 GND
- **SDA** → ESP32 GPIO 21
- **SCL** → ESP32 GPIO 22

#### MQ-2 Gas Sensor
- **VCC** → ESP32 3.3V (or 5V for better sensitivity)
- **GND** → ESP32 GND
- **A0** → ESP32 GPIO 34 (Analog Input)
- **D0** → ESP32 GPIO 35 (Digital Input)

## Breadboard Layout

```
ESP32                    Breadboard
┌─────────┐              ┌─────────────────┐
│ 3.3V    │──────────────│ Power Rail +    │
│ GND     │──────────────│ Power Rail -    │
│ GPIO 21 │──────────────│ LCD SDA         │
│ GPIO 22 │──────────────│ LCD SCL         │
│ GPIO 34 │──────────────│ MQ-2 A0         │
│ GPIO 35 │──────────────│ MQ-2 D0         │
└─────────┘              └─────────────────┘

LCD (I2C)                MQ-2 Sensor
┌─────────┐              ┌─────────┐
│ VCC     │──────────────│ VCC     │
│ GND     │──────────────│ GND     │
│ SDA     │──────────────│ A0      │
│ SCL     │──────────────│ D0      │
└─────────┘              └─────────┘
```

## Arduino Code

```cpp
#include <LiquidCrystal_I2C.h>
#include <WiFi.h>
#include <HTTPClient.h>

// LCD Setup
LiquidCrystal_I2C lcd(0x27, 16, 2); // I2C address 0x27, 16 columns, 2 rows

// Pin definitions
const int MQ2_AO_PIN = 34;  // Analog output from MQ-2
const int MQ2_DO_PIN = 35;  // Digital output from MQ-2

// Variables
int analogValue = 0;
int digitalValue = 0;
float voltage = 0;
float gasConcentration = 0;

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Server endpoint (your EcoAtlas backend)
const char* serverURL = "http://localhost:5000/api/sensor-data";

void setup() {
  Serial.begin(115200);
  
  // Initialize LCD
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("EcoAtlas AI");
  lcd.setCursor(0, 1);
  lcd.print("Initializing...");
  
  // Initialize pins
  pinMode(MQ2_DO_PIN, INPUT);
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  
  Serial.println("WiFi connected!");
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("WiFi Connected");
  lcd.setCursor(0, 1);
  lcd.print("IP: " + WiFi.localIP().toString());
  
  delay(2000);
}

void loop() {
  // Read sensor values
  analogValue = analogRead(MQ2_AO_PIN);
  digitalValue = digitalRead(MQ2_DO_PIN);
  
  // Convert analog reading to voltage (0-3.3V)
  voltage = (analogValue * 3.3) / 4095.0;
  
  // Convert voltage to gas concentration (approximate)
  // This is a simplified calculation - calibrate based on your specific sensor
  gasConcentration = (voltage - 0.1) * 1000; // ppm approximation
  
  // Display on LCD
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Gas Level: " + String(gasConcentration, 0) + " ppm");
  lcd.setCursor(0, 1);
  if (digitalValue == HIGH) {
    lcd.print("ALERT: Gas Detected!");
  } else {
    lcd.print("Normal Air Quality");
  }
  
  // Send data to server
  sendDataToServer();
  
  // Print to serial
  Serial.print("Analog: ");
  Serial.print(analogValue);
  Serial.print(" | Voltage: ");
  Serial.print(voltage, 2);
  Serial.print("V | Gas: ");
  Serial.print(gasConcentration, 0);
  Serial.print(" ppm | Digital: ");
  Serial.println(digitalValue);
  
  delay(2000); // Wait 2 seconds before next reading
}

void sendDataToServer() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverURL);
    http.addHeader("Content-Type", "application/json");
    
    // Create JSON payload
    String jsonPayload = "{";
    jsonPayload += "\"device_id\":\"ESP32-MQ2-001\",";
    jsonPayload += "\"timestamp\":\"" + String(millis()) + "\",";
    jsonPayload += "\"gas_concentration\":" + String(gasConcentration) + ",";
    jsonPayload += "\"voltage\":" + String(voltage, 2) + ",";
    jsonPayload += "\"digital_alert\":" + String(digitalValue) + ",";
    jsonPayload += "\"analog_raw\":" + String(analogValue);
    jsonPayload += "}";
    
    int httpResponseCode = http.POST(jsonPayload);
    
    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("HTTP Response: " + String(httpResponseCode));
      Serial.println("Response: " + response);
    } else {
      Serial.println("Error on HTTP request: " + String(httpResponseCode));
    }
    
    http.end();
  }
}
```

## Installation Steps

### 1. Install Required Libraries
```bash
# In Arduino IDE, go to Tools > Manage Libraries
# Search and install:
- LiquidCrystal I2C by Frank de Brabander
- WiFi (usually included with ESP32 board package)
- HTTPClient (usually included with ESP32 board package)
```

### 2. ESP32 Board Setup
```bash
# In Arduino IDE:
1. Go to File > Preferences
2. Add this URL to Additional Board Manager URLs:
   https://dl.espressif.com/dl/package_esp32_index.json
3. Go to Tools > Board > Boards Manager
4. Search for "ESP32" and install "ESP32 by Espressif Systems"
5. Select your ESP32 board from Tools > Board
```

### 3. Wiring Steps
1. **Power Rails**: Connect 3.3V and GND to breadboard power rails
2. **ESP32**: Place ESP32 on breadboard, connect power
3. **LCD**: Connect I2C pins (SDA/SCL) and power
4. **MQ-2**: Connect analog and digital outputs, power
5. **Double-check**: Verify all connections before powering on

### 4. Calibration
```cpp
// Add this function to calibrate your MQ-2 sensor
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
  
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Baseline: " + String(baseline));
  lcd.setCursor(0, 1);
  lcd.print("Calibration Done!");
  
  delay(2000);
}
```

## Troubleshooting

### Common Issues:
1. **LCD not displaying**: Check I2C address (try 0x3F or 0x27)
2. **MQ-2 not responding**: Ensure 5V power supply
3. **WiFi connection fails**: Check credentials and signal strength
4. **Analog readings erratic**: Add capacitor between VCC and GND

### I2C Scanner Code:
```cpp
#include <Wire.h>

void setup() {
  Wire.begin();
  Serial.begin(115200);
  Serial.println("I2C Scanner");
}

void loop() {
  byte error, address;
  int nDevices = 0;
  
  for(address = 1; address < 127; address++ ) {
    Wire.beginTransmission(address);
    error = Wire.endTransmission();
    
    if (error == 0) {
      Serial.print("I2C device found at address 0x");
      if (address < 16) Serial.print("0");
      Serial.print(address, HEX);
      Serial.println(" !");
      nDevices++;
    }
  }
  
  if (nDevices == 0) Serial.println("No I2C devices found");
  delay(5000);
}
```

## Integration with EcoAtlas AI

This setup will send data to your EcoAtlas backend at `http://localhost:5000/api/sensor-data`. Make sure your backend is running and can receive the JSON payload with gas concentration data.

The sensor will display real-time air quality information on the LCD and send data to your web dashboard for monitoring and analysis.

