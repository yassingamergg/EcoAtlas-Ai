# 🌱 EcoAtlas ESP32 Real-time Environmental Monitoring Setup Guide

This guide will help you set up a complete real-time environmental monitoring system using ESP32 devices that integrate with your EcoAtlas AI application.

## 📋 Table of Contents
1. [Hardware Requirements](#hardware-requirements)
2. [Software Setup](#software-setup)
3. [ESP32 Firmware Installation](#esp32-firmware-installation)
4. [MQTT Broker Setup](#mqtt-broker-setup)
5. [Backend API Setup](#backend-api-setup)
6. [Frontend Integration](#frontend-integration)
7. [Testing & Deployment](#testing--deployment)

## 🔧 Hardware Requirements

### ESP32 Development Board
- **ESP32 DevKit V1** or **ESP32-S3** (recommended)
- Built-in WiFi and Bluetooth
- Multiple GPIO pins for sensors
- 3.3V and 5V power outputs

### Environmental Sensors
- **DHT22** - Temperature & Humidity sensor
- **BME280** - Pressure, Temperature & Humidity sensor
- **PMS5003** - PM2.5 & PM10 Air Quality sensor
- **Current Transformer (CT)** - Energy monitoring
- **SCD30** (optional) - CO2 sensor

### Additional Components
- **Breadboard** and jumper wires
- **Resistors** (10kΩ for DHT22)
- **Power supply** (5V, 2A recommended)
- **Enclosure** (waterproof IP65 recommended)

## 🔌 Hardware Connections

### ESP32 Pin Mapping
```
DHT22:
- VCC → 3.3V
- GND → GND
- Data → GPIO 4

BME280:
- VCC → 3.3V
- GND → GND
- SDA → GPIO 21
- SCL → GPIO 22

PMS5003:
- VCC → 5V
- GND → GND
- TX → GPIO 16
- RX → GPIO 17

Current Transformer:
- Output → GPIO 34 (ADC)
- GND → GND
```

## 💻 Software Setup

### 1. Install Arduino IDE
1. Download Arduino IDE from [arduino.cc](https://www.arduino.cc/en/software)
2. Install ESP32 board support:
   - Go to File → Preferences
   - Add this URL to "Additional Board Manager URLs":
     ```
     https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
     ```
   - Go to Tools → Board → Boards Manager
   - Search for "ESP32" and install "ESP32 by Espressif Systems"

### 2. Install Required Libraries
Open Arduino IDE and install these libraries via Library Manager:

- **PubSubClient** by Nick O'Leary
- **ArduinoJson** by Benoit Blanchon
- **DHT sensor library** by Adafruit
- **Adafruit BME280 Library** by Adafruit
- **PMS Library** by Mariusz Kacki

### 3. Configure ESP32 Firmware
1. Open `esp32_firmware/EcoAtlas_ESP32.ino` in Arduino IDE
2. Update WiFi credentials:
   ```cpp
   const char* ssid = "YOUR_WIFI_SSID";
   const char* password = "YOUR_WIFI_PASSWORD";
   ```
3. Update MQTT broker IP:
   ```cpp
   const char* mqtt_server = "YOUR_MQTT_BROKER_IP";
   ```
4. Set device ID:
   ```cpp
   const char* device_id = "ESP32_001";
   ```

## 📡 MQTT Broker Setup

### Option 1: Local MQTT Broker (Recommended)
1. Install Docker and Docker Compose
2. Navigate to `mqtt_broker/` directory
3. Run setup script:
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```
4. Access MQTT Dashboard at `http://localhost:3001`

### Option 2: Cloud MQTT Broker
- **HiveMQ Cloud** (free tier available)
- **AWS IoT Core**
- **Google Cloud IoT Core**
- **Azure IoT Hub**

## 🖥️ Backend API Setup

### 1. Install Node.js Dependencies
```bash
cd backend/
npm install
```

### 2. Configure Environment Variables
Create `.env` file:
```env
PORT=5000
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_USERNAME=ecoatlas
MQTT_PASSWORD=ecoatlas123
DATABASE_PATH=./ecoatlas.db
```

### 3. Start Backend Server
```bash
npm start
```

The API will be available at `http://localhost:5000`

## 🌐 Frontend Integration

### 1. Update React App
1. Copy the new hooks and components to your React app:
   ```bash
   cp src/hooks/useRealTimeData.js /path/to/your/react/app/src/hooks/
   cp src/components/RealTimeIoTSensors.js /path/to/your/react/app/src/components/
   ```

2. Update your main App.js to include the real-time component:
   ```javascript
   import RealTimeIoTSensors from './components/RealTimeIoTSensors';
   
   // In your component:
   {activeTab === 'iot' && <RealTimeIoTSensors />}
   ```

### 2. Install Additional Dependencies
```bash
npm install mqtt
```

## 🧪 Testing & Deployment

### 1. Test ESP32 Connection
1. Upload firmware to ESP32
2. Open Serial Monitor (115200 baud)
3. Check for "EcoAtlas ESP32 Ready!" message
4. Verify WiFi and MQTT connections

### 2. Test MQTT Communication
```bash
# Subscribe to sensor data
mosquitto_sub -h localhost -t "ecoatlas/sensors/+/data" -u ecoatlas -P ecoatlas123

# Send test command
mosquitto_pub -h localhost -t "ecoatlas/device/ESP32_001/control" -m "status" -u ecoatlas -P ecoatlas123
```

### 3. Test Backend API
```bash
# Check health
curl http://localhost:5000/api/health

# Get sensor data
curl http://localhost:5000/api/sensor-data

# Get device status
curl http://localhost:5000/api/devices
```

### 4. Test Frontend Integration
1. Start React app: `npm start`
2. Navigate to IoT Sensors tab
3. Verify real-time data updates
4. Test device control commands

## 🔧 Troubleshooting

### Common Issues

#### ESP32 Won't Connect to WiFi
- Check WiFi credentials
- Ensure 2.4GHz network (ESP32 doesn't support 5GHz)
- Check signal strength

#### MQTT Connection Failed
- Verify MQTT broker is running
- Check IP address and port
- Verify username/password

#### No Sensor Data
- Check sensor connections
- Verify sensor libraries are installed
- Check Serial Monitor for error messages

#### Frontend Not Receiving Data
- Check WebSocket connection
- Verify backend API is running
- Check browser console for errors

### Debug Commands
```bash
# Check MQTT broker status
docker ps | grep mosquitto

# View MQTT logs
docker logs ecoatlas-mqtt-broker

# Check backend logs
tail -f backend/logs/app.log

# Test WebSocket connection
wscat -c ws://localhost:8080
```

## 📊 Data Flow

```
ESP32 Sensors → MQTT Broker → Backend API → WebSocket → React Frontend
     ↓              ↓              ↓           ↓            ↓
  Raw Data    Real-time    Database    Live Updates   User Interface
```

## 🚀 Production Deployment

### 1. Secure MQTT Broker
- Enable TLS/SSL
- Use strong passwords
- Configure firewall rules

### 2. Database Optimization
- Set up database backups
- Configure data retention policies
- Monitor database performance

### 3. Monitoring & Alerts
- Set up device offline alerts
- Monitor sensor data anomalies
- Configure carbon emission thresholds

## 📈 Scaling

### Multiple ESP32 Devices
- Use unique device IDs
- Implement device discovery
- Add load balancing for MQTT broker

### Cloud Deployment
- Deploy to AWS/GCP/Azure
- Use managed MQTT services
- Implement auto-scaling

## 🎯 Next Steps

1. **Add More Sensors**: CO2, noise, light, soil moisture
2. **Implement Alerts**: Email/SMS notifications for anomalies
3. **Data Analytics**: Machine learning for pattern recognition
4. **Mobile App**: React Native app for mobile monitoring
5. **Integration**: Connect with other smart home systems

## 📞 Support

For issues and questions:
- Check the troubleshooting section
- Review ESP32 documentation
- Check MQTT broker logs
- Verify network connectivity

---

**Happy Monitoring! 🌱📊**
