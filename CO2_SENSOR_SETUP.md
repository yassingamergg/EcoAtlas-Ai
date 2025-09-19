# 🌬️ CO2 Sensor Setup Guide for EcoAtlas ESP32

This guide covers how to integrate real CO2 sensors with your ESP32 environmental monitoring system.

## 📋 Available CO2 Sensors

### 1. **MH-Z19** (Recommended for Beginners)
- **Type**: NDIR (Non-Dispersive Infrared)
- **Range**: 0-5000 ppm
- **Accuracy**: ±50 ppm ±5% of reading
- **Interface**: UART/Serial
- **Price**: $20-30
- **Pros**: Good accuracy, easy to use, affordable
- **Cons**: Requires calibration, larger size

### 2. **SCD30** (Professional Grade)
- **Type**: NDIR
- **Range**: 400-10,000 ppm
- **Accuracy**: ±30 ppm ±3% of reading
- **Interface**: I2C
- **Price**: $50-70
- **Pros**: Very accurate, stable, low power
- **Cons**: More expensive

### 3. **SGP30** (Budget Option)
- **Type**: Metal Oxide Semiconductor
- **Range**: 400-60,000 ppm (eCO2)
- **Accuracy**: ±15% of reading
- **Interface**: I2C
- **Price**: $15-25
- **Pros**: Very affordable, small size
- **Cons**: Less accurate, needs calibration

### 4. **CCS811** (Ultra Budget)
- **Type**: Metal Oxide Semiconductor
- **Range**: 400-8192 ppm (eCO2)
- **Accuracy**: ±15% of reading
- **Interface**: I2C
- **Price**: $10-20
- **Pros**: Very cheap, small
- **Cons**: Least accurate, needs calibration

## 🔌 Hardware Connections

### **MH-Z19 (UART) - Recommended**
```
MH-Z19 → ESP32
VCC    → 5V (or 3.3V with level shifter)
GND    → GND
TX     → GPIO 18 (RX on ESP32)
RX     → GPIO 19 (TX on ESP32)
```

### **SCD30 (I2C)**
```
SCD30 → ESP32
VCC   → 3.3V
GND   → GND
SDA   → GPIO 21
SCL   → GPIO 22
```

### **SGP30/CCS811 (I2C)**
```
SGP30/CCS811 → ESP32
VCC          → 3.3V
GND          → GND
SDA          → GPIO 21
SCL          → GPIO 22
```

## 📚 Required Libraries

### For MH-Z19:
```cpp
#include <MHZ19.h>
```

### For SCD30:
```cpp
#include <SensirionI2CScd4x.h>
```

### For SGP30:
```cpp
#include <Adafruit_SGP30.h>
```

### For CCS811:
```cpp
#include <Adafruit_CCS811.h>
```

## 💻 Code Examples

### **MH-Z19 Implementation (Already in your firmware)**
```cpp
#include <MHZ19.h>
#include <SoftwareSerial.h>

SoftwareSerial co2Serial(18, 19);  // RX, TX
MHZ19 co2Sensor;

void setup() {
  co2Serial.begin(9600);
  co2Sensor.begin(co2Serial);
  co2Sensor.autoCalibration(false);  // Disable auto-calibration
}

float readCO2Sensor() {
  int co2Reading = co2Sensor.getCO2();
  return (float)co2Reading;
}
```

### **SCD30 Implementation**
```cpp
#include <SensirionI2CScd4x.h>
#include <Wire.h>

SensirionI2CScd4x scd4x;

void setup() {
  Wire.begin();
  scd4x.begin(Wire);
  scd4x.startPeriodicMeasurement();
}

float readCO2Sensor() {
  uint16_t co2;
  float temperature, humidity;
  
  if (scd4x.readMeasurement(co2, temperature, humidity) == 0) {
    return (float)co2;
  }
  return 0;
}
```

### **SGP30 Implementation**
```cpp
#include <Adafruit_SGP30.h>
#include <Wire.h>

Adafruit_SGP30 sgp;

void setup() {
  Wire.begin();
  if (!sgp.begin()) {
    Serial.println("SGP30 not found");
  }
}

float readCO2Sensor() {
  if (sgp.IAQmeasure()) {
    return (float)sgp.eCO2;
  }
  return 0;
}
```

## 🛒 Where to Buy

### **Online Retailers:**
- **Amazon**: Search for "MH-Z19 CO2 sensor"
- **AliExpress**: Cheaper but longer shipping
- **Adafruit**: High-quality sensors with good documentation
- **SparkFun**: Professional-grade sensors
- **DFRobot**: Good selection of environmental sensors

### **Recommended Sellers:**
- **Winsen** (MH-Z19 manufacturer)
- **Sensirion** (SCD30 manufacturer)
- **Adafruit** (SGP30, CCS811)

## 🔧 Calibration

### **MH-Z19 Calibration:**
```cpp
// Zero point calibration (use in fresh air)
co2Sensor.calibrate();

// Span calibration (use with known CO2 concentration)
co2Sensor.calibrateSpan(1000);  // 1000 ppm reference
```

### **SGP30/CCS811 Calibration:**
```cpp
// These sensors need 24-48 hours to stabilize
// Run in clean air environment for best results
```

## 📊 CO2 Levels Reference

| CO2 Level (ppm) | Air Quality | Health Impact |
|----------------|-------------|---------------|
| 400-600 | Excellent | Normal outdoor air |
| 600-800 | Good | Acceptable indoor air |
| 800-1000 | Fair | Some discomfort possible |
| 1000-1500 | Poor | Drowsiness, poor air |
| 1500-2000 | Bad | Headaches, sleepiness |
| 2000+ | Dangerous | Serious health risks |

## 🚨 Alerts and Thresholds

### **Recommended Alert Levels:**
```cpp
// In your ESP32 firmware
void checkCO2Alerts(float co2) {
  if (co2 > 1000) {
    // Send alert to MQTT
    sendAlert("CO2_WARNING", "CO2 level high: " + String(co2) + " ppm");
  }
  if (co2 > 1500) {
    // Send critical alert
    sendAlert("CO2_CRITICAL", "CO2 level critical: " + String(co2) + " ppm");
  }
}
```

## 🔍 Troubleshooting

### **Common Issues:**

#### **MH-Z19 Not Reading:**
- Check wiring (TX/RX swapped)
- Verify power supply (5V recommended)
- Wait 3 minutes for sensor to warm up
- Check baud rate (9600)

#### **SCD30 Not Found:**
- Check I2C connections
- Verify 3.3V power
- Check I2C address (0x61)
- Ensure proper pull-up resistors

#### **SGP30/CCS811 Unstable:**
- Allow 24-48 hours for stabilization
- Ensure clean air environment
- Check for interference from other sensors

### **Debug Commands:**
```cpp
// Check sensor communication
Serial.println("CO2: " + String(co2Sensor.getCO2()));

// Check sensor status
Serial.println("Temperature: " + String(co2Sensor.getTemperature()));
```

## 📈 Integration with EcoAtlas

### **Frontend Display:**
Your React app will automatically display CO2 readings in the IoT Sensors tab with:
- Real-time CO2 levels
- Air quality status indicators
- Historical CO2 trends
- Alert notifications

### **Carbon Calculations:**
CO2 sensor data is used for:
- Indoor air quality monitoring
- Ventilation recommendations
- Health and comfort alerts
- Energy efficiency optimization

## 🎯 Next Steps

1. **Choose a sensor** based on your budget and accuracy needs
2. **Order the hardware** from a reputable supplier
3. **Update the firmware** with the appropriate sensor code
4. **Test the sensor** in a known environment
5. **Calibrate if needed** for accurate readings
6. **Monitor the data** in your EcoAtlas dashboard

## 💡 Pro Tips

- **MH-Z19** is the best balance of price and accuracy
- **SCD30** is the most accurate but expensive
- **SGP30/CCS811** are good for budget projects
- Always allow sensors to warm up before taking readings
- Calibrate sensors in fresh outdoor air when possible
- Monitor CO2 levels for health and energy efficiency

---

**Ready to monitor CO2 levels in real-time! 🌬️📊**
