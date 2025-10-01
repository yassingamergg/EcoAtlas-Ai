# 🔥 ESP32 + MQ2 Gas Sensor + LCD Breadboard Setup Guide

## 📋 Required Components

### **Essential Hardware**
- ✅ **ESP32 Dev Board** (ESP32-WROOM-32 or similar)
- ✅ **MQ-2 Gas Sensor** (LPG, CO, Smoke detection)
- ✅ **16x2 LCD Display** (I2C interface)
- ✅ **Breadboard** (830 tie points recommended)
- ✅ **Jumper Wires** (Male-to-Male, Male-to-Female)
- ✅ **Resistors**: 10kΩ (for LCD contrast), 220Ω (for MQ-2 heater)
- ✅ **Power Supply**: 5V 2A adapter (for continuous operation)

### **Optional Components**
- **Enclosure**: 3D printed or plastic case
- **Battery**: 18650 Li-ion for portable operation
- **SD Card Module**: For data logging
- **Buzzer**: For gas alarm alerts

## 🔌 Detailed Wiring Diagram

```
ESP32 Pinout:
┌─────────────────┐
│ 3.3V  │ 5V     │
│ GPIO1 │ GPIO2  │
│ GPIO3 │ GPIO4  │
│ GPIO5 │ GPIO18 │
│ GPIO19│ GPIO21 │ ← LCD SDA (I2C)
│ GPIO22│ GPIO23 │ ← LCD SCL (I2C)
│ GPIO34│ GPIO35 │ ← MQ-2 A0 & D0
│ GPIO36│ GPIO39 │
│ GND   │ 3.3V   │
└─────────────────┘

Breadboard Layout:
┌─────────────────────────────────────────────────────────┐
│ ESP32          │ Component              │ Pin           │
├─────────────────────────────────────────────────────────┤
│ 3.3V           │ MQ-2 VCC               │ VCC           │
│ 3.3V           │ LCD VCC (via 5V)       │ VCC           │
│ 5V             │ LCD VCC                │ VCC           │
│ GND            │ MQ-2 GND               │ GND           │
│ GND            │ LCD GND                │ GND           │
│ GND            │ Breadboard Ground Rail │ -             │
│ GPIO21         │ LCD SDA                │ SDA           │
│ GPIO22         │ LCD SCL                │ SCL           │
│ GPIO34 (A0)    │ MQ-2 A0                │ A0            │
│ GPIO35 (A0)    │ MQ-2 D0                │ D0            │
└─────────────────────────────────────────────────────────┘
```

## 🛠️ Step-by-Step Assembly

### **Step 1: Power Setup**
1. **Connect Power Rails**: 
   - Connect ESP32 3.3V to breadboard positive rail
   - Connect ESP32 GND to breadboard negative rail
   - Connect ESP32 5V to breadboard positive rail (for LCD)

### **Step 2: ESP32 Placement**
1. **Place ESP32** on breadboard (straddling the center gap)
2. **Connect Power**: 
   - ESP32 3.3V → Breadboard positive rail
   - ESP32 GND → Breadboard negative rail

### **Step 3: MQ-2 Gas Sensor**
1. **Place MQ-2** on breadboard
2. **Power Connections**:
   - MQ-2 VCC → Breadboard positive rail (3.3V)
   - MQ-2 GND → Breadboard negative rail
3. **Signal Connections**:
   - MQ-2 A0 → ESP32 GPIO 34 (Analog input)
   - MQ-2 D0 → ESP32 GPIO 35 (Digital input)

### **Step 4: LCD Display (I2C)**
1. **Place LCD** on breadboard
2. **Power Connections**:
   - LCD VCC → Breadboard positive rail (5V)
   - LCD GND → Breadboard negative rail
3. **I2C Connections**:
   - LCD SDA → ESP32 GPIO 21
   - LCD SCL → ESP32 GPIO 22

### **Step 5: Final Connections**
1. **Double-check** all connections
2. **Verify** power polarity
3. **Test** connections with multimeter if available

## 💻 Arduino IDE Setup

### **Step 1: Install ESP32 Board Package**
```bash
# In Arduino IDE:
1. File → Preferences
2. Add URL: https://dl.espressif.com/dl/package_esp32_index.json
3. Tools → Board → Boards Manager
4. Search "ESP32" → Install "ESP32 by Espressif Systems"
```

### **Step 2: Install Required Libraries**
```cpp
// Install via Library Manager:
- LiquidCrystal I2C by Frank de Brabander
- ArduinoJson by Benoit Blanchon
- WiFi (included with ESP32 package)
- HTTPClient (included with ESP32 package)
```

### **Step 3: Configure Code**
1. **Update WiFi credentials**:
```cpp
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
```

2. **Update server URL**:
```cpp
const char* serverURL = "http://YOUR_COMPUTER_IP:5000/api/sensor-data";
```

3. **Find your computer's IP**:
   - Windows: `ipconfig`
   - Mac/Linux: `ifconfig`

## 🔧 Code Configuration

### **LCD I2C Address Detection**
```cpp
// If LCD doesn't work, try these addresses:
LiquidCrystal_I2C lcd(0x27, 16, 2); // Most common
LiquidCrystal_I2C lcd(0x3F, 16, 2); // Alternative
```

### **MQ-2 Calibration**
```cpp
// The MQ-2 sensor requires 24-48 hours of continuous operation
// for full calibration. Initial readings may be inaccurate.

// Calibration process:
1. Run sensor in clean air for 24-48 hours
2. Note baseline readings
3. Adjust calculation formulas based on your environment
```

## 📊 Expected Output

### **Serial Monitor**
```
🌱 EcoAtlas AI - ESP32 MQ2 Gas Sensor Starting...
WiFi Connected!
IP Address: 192.168.1.100
📊 Reading MQ2 gas sensor...
📈 MQ2 Sensor Data:
  Analog Value: 1250
  Digital Value: 0
  Voltage: 1.008V
  Gas Concentration: 908 ppm
  LPG: 45 ppm
  CO: 12 ppm
  Smoke: 23 ppm
📤 Sending MQ2 data to EcoAtlas AI...
✅ MQ2 data sent successfully!
```

### **LCD Display**
```
Line 1: Gas: 908 ppm
Line 2: Normal Air Quality

Every 10 seconds:
Line 1: LPG:45 CO:12
Line 2: Smoke:23 ppm
```

## 🚨 Safety Features

### **Gas Alert System**
- **Digital Alert**: MQ-2 D0 pin triggers when gas exceeds threshold
- **LCD Warning**: "ALERT: Gas Detected!" message
- **Emergency Function**: Flashing LCD backlight
- **Data Logging**: All readings stored in database

### **Thresholds**
```cpp
// Adjust these based on your safety requirements:
- LPG: > 1000 ppm (Dangerous)
- CO: > 50 ppm (Dangerous)
- Smoke: > 200 ppm (Dangerous)
```

## 🔧 Troubleshooting

### **Common Issues**

1. **LCD Not Displaying**
   - Check I2C address (try 0x27 or 0x3F)
   - Verify SDA/SCL connections
   - Ensure 5V power supply
   - Check contrast potentiometer

2. **MQ-2 Not Reading**
   - Verify 3.3V power supply
   - Check A0 and D0 connections
   - Allow 2-minute warm-up time
   - Calibrate in clean air

3. **WiFi Connection Failed**
   - Double-check SSID and password
   - Ensure 2.4GHz network (ESP32 doesn't support 5GHz)
   - Check signal strength
   - Verify IP address format

4. **Data Not Uploading**
   - Verify backend server is running
   - Check server URL in code
   - Monitor Serial output for HTTP errors
   - Test with curl: `curl http://YOUR_IP:5000/api/health`

### **Testing Individual Components**

```cpp
// Test LCD
lcd.clear();
lcd.print("Hello World!");

// Test MQ-2
int analogValue = analogRead(MQ2_AO_PIN);
int digitalValue = digitalRead(MQ2_DO_PIN);
Serial.println("MQ-2 A0: " + String(analogValue));
Serial.println("MQ-2 D0: " + String(digitalValue));

// Test WiFi
if (WiFi.status() == WL_CONNECTED) {
  Serial.println("WiFi: Connected");
} else {
  Serial.println("WiFi: Failed");
}
```

## 🌐 Backend Integration

### **Database Schema**
The backend automatically creates these fields for MQ2 data:
- `gas_concentration` - General gas level (ppm)
- `lpg_concentration` - LPG gas level (ppm)
- `co_concentration` - Carbon monoxide level (ppm)
- `smoke_concentration` - Smoke level (ppm)
- `voltage` - Sensor voltage reading
- `analog_raw` - Raw analog value
- `digital_alert` - Digital alert status

### **API Endpoints**
```bash
# Health check
curl http://localhost:5000/api/health

# Get latest MQ2 data
curl http://localhost:5000/api/sensor-data/latest

# Get MQ2 device data
curl http://localhost:5000/api/sensor-data?device_id=ESP32_MQ2_001
```

## 🎯 Advanced Features

### **Multiple Gas Detection**
The MQ-2 can detect:
- **LPG** (Liquefied Petroleum Gas)
- **CO** (Carbon Monoxide)
- **Smoke** (Combustion particles)
- **Alcohol** (Ethanol)
- **Propane** (C3H8)

### **Data Logging**
```cpp
// Add SD card module for offline logging
// Implement data buffering for network outages
// Add timestamp synchronization
```

### **Battery Operation**
```cpp
// Enable deep sleep for battery saving
void enterDeepSleep(int seconds) {
  esp_sleep_enable_timer_wakeup(seconds * 1000000);
  esp_deep_sleep_start();
}
```

## 📱 Dashboard Integration

Once your ESP32 is running:

1. **Check Backend**: Visit `http://localhost:5000/api/devices`
2. **View MQ2 Data**: Check `http://localhost:5000/api/sensor-data/latest`
3. **Dashboard**: Your gas sensor data will appear in the IoT Sensors tab
4. **Real-time Updates**: Data refreshes every 30 seconds

## 🚀 Next Steps

1. **Deploy Backend**: Upload to Vercel/Railway
2. **Update ESP32 URL**: Point to your live backend
3. **Add More Sensors**: Expand your environmental monitoring
4. **Create Alerts**: Configure notifications for gas thresholds
5. **Build Dashboard**: Create custom visualizations

## ⚠️ Safety Notes

- **MQ-2 is not a certified safety device** - use for monitoring only
- **Install proper gas detectors** for safety-critical applications
- **Regular calibration** required for accurate readings
- **Ventilation** needed when testing with actual gases
- **Keep away from open flames** during testing

---

**Need Help?** Check the troubleshooting section or create an issue in the repository! 🆘

## 📁 File Structure

```
hardware/
├── esp32_mq2_sensor/
│   └── esp32_mq2_sensor.ino    # Main Arduino code
├── SETUP_GUIDE.md              # General setup guide
└── ESP32_MQ2_LCD_SETUP.md      # This file

backend/
├── sensor-api.js               # Updated with MQ2 support
└── server.js                   # Main backend server
```

