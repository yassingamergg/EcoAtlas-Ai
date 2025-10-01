# 🔌 Simple ESP32 + LCD Setup Guide

## 📋 What You Need
- ✅ **ESP32 Dev Board**
- ✅ **16x2 LCD Display (I2C)**
- ✅ **Jumper Wires**
- ✅ **USB Cable** (for power and programming)

## 🔌 Super Simple Wiring

### **LCD Connections (I2C)**
```
ESP32          LCD Display
------         -----------
3.3V    →      VCC
GND     →      GND  
GPIO 21 →      SDA
GPIO 22 →      SCL
```

That's it! Only 4 connections needed.

## 💻 Software Setup

### **Step 1: Install Arduino IDE**
1. Download from [arduino.cc](https://www.arduino.cc/en/software)
2. Install ESP32 board package:
   - File → Preferences → Additional Board Manager URLs
   - Add: ` `
   - Tools → Board → Boards Manager → Search "ESP32" → Install

### **Step 2: Install Libraries**
In Arduino IDE Library Manager, install:
- **LiquidCrystal I2C** by Frank de Brabander
- **ArduinoJson** by Benoit Blanchon

### **Step 3: Configure WiFi**
Edit the ESP32 code and update:
```cpp
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverURL = "http://YOUR_IP_ADDRESS:5000/api/sensor-data";
```

### **Step 4: Find Your Computer's IP**
```bash
# Windows
ipconfig

# Mac/Linux  
ifconfig
```
Look for your local IP (e.g., 192.168.1.100)

## 🚀 Upload and Test

### **Step 1: Upload Code**
1. Select Board: Tools → Board → ESP32 Dev Module
2. Select Port: Tools → Port → Your ESP32's COM port
3. Upload the code
4. Open Serial Monitor (115200 baud)

### **Step 2: Start Backend**
```bash
cd backend
npm start
```

### **Step 3: Check Results**

**Serial Monitor Output:**
```
🌱 EcoAtlas AI - Simple ESP32 Sensor Starting...
WiFi Connected!
IP Address: 192.168.1.100
📊 Reading sensors...
📈 Sensor Data:
  Temperature: 45.2°C
  WiFi Signal: -45 dBm
  IP Address: 192.168.1.100
📤 Sending data to EcoAtlas AI...
✅ Data sent successfully!
```

**LCD Display:**
```
Line 1: T:45.2°C S:-45
Line 2: IP:192.168.1.100
```

## 📊 What You'll Get

### **Sensors Available**
- **Temperature**: ESP32 built-in sensor
- **WiFi Signal**: Signal strength in dBm
- **IP Address**: Device network address
- **Connection Status**: Online/offline status

### **Data Sent to EcoAtlas**
- Device ID and timestamp
- Temperature readings
- WiFi signal strength
- Location and node type
- Connection status

## 🔧 Troubleshooting

### **LCD Not Working**
- Check I2C address (try 0x27 or 0x3F)
- Verify SDA/SCL connections
- Ensure 3.3V power supply

### **WiFi Connection Failed**
- Double-check SSID and password
- Ensure 2.4GHz network
- Check signal strength

### **Data Not Uploading**
- Verify backend server is running
- Check server URL in code
- Ensure correct IP address

## 🎯 Expected Results

✅ **LCD Shows**: Temperature and WiFi signal  
✅ **Serial Monitor**: Shows connection status  
✅ **Backend API**: Receives sensor data  
✅ **EcoAtlas Dashboard**: Displays live data  
✅ **Real-time Updates**: Every 30 seconds  

## 🌟 Next Steps

Once this works, you can add more sensors later:
- **DHT22**: For accurate temperature/humidity
- **MQ-135**: For air quality monitoring
- **LDR**: For light level detection

But for now, you have a fully functional environmental monitoring system with just ESP32 + LCD! 🎉

---

**Need Help?** Check the troubleshooting section or ask for assistance!
