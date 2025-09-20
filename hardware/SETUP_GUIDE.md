# 🔌 ESP32 + LCD EcoAtlas AI Sensor Setup Guide

## 📋 Required Components

### **Essential Hardware**
- ✅ **ESP32 Dev Board** (ESP32-WROOM-32 or similar)
- ✅ **16x2 LCD Display** (I2C interface, address 0x27)
- ✅ **DHT22 Temperature & Humidity Sensor**
- ✅ **MQ-135 Air Quality Sensor**
- ✅ **Light Dependent Resistor (LDR)**
- ✅ **Jumper Wires** (Male-to-Male, Male-to-Female)
- ✅ **Breadboard** (optional, for prototyping)
- ✅ **Resistors**: 10kΩ (for DHT22), 4.7kΩ (for LDR)

### **Optional Components**
- **Power Supply**: 5V 2A adapter for continuous operation
- **Enclosure**: 3D printed or plastic case
- **Battery**: 18650 Li-ion for portable operation
- **SD Card Module**: For data logging (optional)

## 🔌 Wiring Diagram

```
ESP32 Pinout:
┌─────────────────┐
│ 3.3V  │ 5V     │
│ GPIO1 │ GPIO2  │
│ GPIO3 │ GPIO4  │ ← DHT22 Data
│ GPIO5 │ GPIO18 │
│ GPIO19│ GPIO21 │ ← LCD SDA
│ GPIO22│ GPIO23 │ ← LCD SCL
│ GPIO34│ GPIO35 │ ← LDR (A0)
│ GPIO36│ GPIO39 │
│ GND   │ 3.3V   │
└─────────────────┘

Connections:
┌─────────────────────────────────────────┐
│ ESP32          │ Component              │
├─────────────────────────────────────────┤
│ 3.3V           │ DHT22 VCC              │
│ 3.3V           │ MQ-135 VCC             │
│ 3.3V           │ LDR (one side)         │
│ GND            │ DHT22 GND              │
│ GND            │ MQ-135 GND             │
│ GND            │ LDR (other side)       │
│ GPIO4          │ DHT22 Data             │
│ GPIO34 (A0)    │ MQ-135 A0              │
│ GPIO35 (A0)    │ LDR (with 4.7kΩ to GND)│
│ GPIO21         │ LCD SDA                │
│ GPIO22         │ LCD SCL                │
│ 5V             │ LCD VCC                │
│ GND            │ LCD GND                │
└─────────────────────────────────────────┘
```

## 🛠️ Step-by-Step Setup

### **Step 1: Install Arduino IDE**
1. Download Arduino IDE from [arduino.cc](https://www.arduino.cc/en/software)
2. Install ESP32 board package:
   - File → Preferences → Additional Board Manager URLs
   - Add: `https://dl.espressif.com/dl/package_esp32_index.json`
   - Tools → Board → Boards Manager → Search "ESP32" → Install

### **Step 2: Install Required Libraries**
```cpp
// Install these libraries via Library Manager:
- LiquidCrystal I2C by Frank de Brabander
- DHT sensor library by Adafruit
- ArduinoJson by Benoit Blanchon
```

### **Step 3: Hardware Assembly**
1. **Power Off** your ESP32 before wiring
2. **Connect LCD** (I2C):
   - VCC → 5V
   - GND → GND
   - SDA → GPIO 21
   - SCL → GPIO 22

3. **Connect DHT22**:
   - VCC → 3.3V
   - GND → GND
   - Data → GPIO 4
   - Add 10kΩ pull-up resistor between Data and 3.3V

4. **Connect MQ-135**:
   - VCC → 3.3V
   - GND → GND
   - A0 → GPIO 34

5. **Connect LDR**:
   - One side → 3.3V
   - Other side → GPIO 35
   - Add 4.7kΩ resistor between GPIO 35 and GND

### **Step 4: Configure WiFi**
Edit the ESP32 code and update these lines:
```cpp
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
```

### **Step 5: Upload Code**
1. Select Board: "ESP32 Dev Module"
2. Select Port: Your ESP32's COM port
3. Upload the code
4. Open Serial Monitor (115200 baud)

## 🌐 Backend Setup

### **Step 1: Install Dependencies**
```bash
cd backend
npm install sqlite3 cors
```

### **Step 2: Add Sensor API to Main Server**
Add this to your main `server.js`:
```javascript
const sensorApi = require('./sensor-api');
app.use('/api', sensorApi);
```

### **Step 3: Test API Endpoints**
```bash
# Health check
curl http://localhost:3001/api/health

# Get latest sensor data
curl http://localhost:3001/api/sensor-data/latest

# Get device list
curl http://localhost:3001/api/devices
```

## 📊 Expected Output

### **Serial Monitor**
```
🌱 EcoAtlas AI - ESP32 Sensor Node Starting...
WiFi Connected!
IP Address: 192.168.1.100
📊 Reading sensors...
📈 Sensor Data:
  Temperature: 23.5°C
  Humidity: 45%
  Air Quality: 120 PPM
  CO2 Level: 450 PPM
  Light Level: 75%
📤 Sending data to EcoAtlas AI...
✅ Data sent successfully!
```

### **LCD Display**
```
Line 1: T:23.5°C H:45%
Line 2: AQ:120 L:75%
```

## 🔧 Troubleshooting

### **Common Issues**

1. **LCD Not Working**
   - Check I2C address (try 0x27 or 0x3F)
   - Verify SDA/SCL connections
   - Ensure 5V power supply

2. **DHT22 Not Reading**
   - Check 10kΩ pull-up resistor
   - Verify GPIO 4 connection
   - Wait 2 seconds between readings

3. **WiFi Connection Failed**
   - Double-check SSID and password
   - Ensure 2.4GHz network (ESP32 doesn't support 5GHz)
   - Check signal strength

4. **Data Not Uploading**
   - Verify backend server is running
   - Check server URL in code
   - Monitor Serial output for HTTP errors

### **Testing Individual Components**

```cpp
// Test LCD
lcd.clear();
lcd.print("Hello World!");

// Test DHT22
float t = dht.readTemperature();
float h = dht.readHumidity();
Serial.println("Temp: " + String(t) + "°C");

// Test MQ-135
int airQuality = analogRead(MQ135_PIN);
Serial.println("Air Quality: " + String(airQuality));

// Test LDR
int light = analogRead(LDR_PIN);
Serial.println("Light: " + String(light));
```

## 🚀 Advanced Features

### **Battery Operation**
```cpp
// Enable deep sleep for battery saving
void enterDeepSleep(int seconds) {
  esp_sleep_enable_timer_wakeup(seconds * 1000000);
  esp_deep_sleep_start();
}
```

### **Multiple Sensors**
- Change `deviceId` for each ESP32
- Use different GPIO pins for additional sensors
- Add more sensor types (pressure, motion, etc.)

### **Data Logging**
- Add SD card module for offline logging
- Implement data buffering for network outages
- Add timestamp synchronization

## 📱 Integration with EcoAtlas AI

Once your ESP32 is running:

1. **Check Backend**: Visit `http://localhost:3001/api/devices`
2. **View Data**: Check `http://localhost:3001/api/sensor-data/latest`
3. **Dashboard**: Your data will appear in the IoT Sensors tab
4. **Real-time Updates**: Data refreshes every 30 seconds

## 🎯 Next Steps

1. **Deploy Backend**: Upload to Vercel/Railway
2. **Update ESP32 URL**: Point to your live backend
3. **Add More Sensors**: Expand your environmental monitoring
4. **Create Dashboard**: Build custom visualizations
5. **Set Up Alerts**: Configure notifications for thresholds

---

**Need Help?** Check the troubleshooting section or create an issue in the repository! 🆘
