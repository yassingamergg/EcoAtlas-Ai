const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const router = express.Router();

// Enable CORS for ESP32 requests
router.use(cors({
  origin: '*', // Allow all origins for ESP32
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'X-Device-ID']
}));

// Database setup
const dbPath = path.join(__dirname, 'sensor_data.db');
const db = new sqlite3.Database(dbPath);

// Create sensor data table if it doesn't exist
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS sensor_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    temperature REAL,
    humidity REAL,
    air_quality INTEGER,
    co2_level INTEGER,
    light_level INTEGER,
    wifi_signal INTEGER,
    location TEXT,
    node_type TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Create index for faster queries
  db.run(`CREATE INDEX IF NOT EXISTS idx_device_timestamp ON sensor_data(device_id, timestamp)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_created_at ON sensor_data(created_at)`);
});

// POST /api/sensor-data - Receive data from ESP32
router.post('/sensor-data', (req, res) => {
  try {
    const {
      device_id,
      timestamp,
      temperature,
      humidity,
      air_quality,
      co2_level,
      light_level,
      location,
      node_type
    } = req.body;

  // Validate required fields
  if (!device_id || !timestamp) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: device_id and timestamp'
    });
  }

  // Handle simplified sensor data (ESP32 without external sensors)
  const sensorData = {
    device_id,
    timestamp,
    temperature: temperature || null,
    humidity: humidity || null,
    air_quality: air_quality || null,
    co2_level: co2_level || null,
    light_level: light_level || null,
    wifi_signal: req.body.wifi_signal || null,
    location: location || 'Unknown',
    node_type: node_type || 'environmental'
  };

    // Insert sensor data into database
    const stmt = db.prepare(`
      INSERT INTO sensor_data 
      (device_id, timestamp, temperature, humidity, air_quality, co2_level, light_level, wifi_signal, location, node_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run([
      device_id,
      timestamp,
      temperature || null,
      humidity || null,
      air_quality || null,
      co2_level || null,
      light_level || null,
      wifi_signal || null,
      location || 'Unknown',
      node_type || 'environmental'
    ], function(err) {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({
          success: false,
          error: 'Failed to store sensor data'
        });
      }

      console.log(`📊 Sensor data stored: Device ${device_id}, ID ${this.lastID}`);
      
      res.json({
        success: true,
        message: 'Sensor data received and stored',
        data_id: this.lastID,
        device_id: device_id,
        timestamp: timestamp
      });
    });

    stmt.finalize();

  } catch (error) {
    console.error('Sensor data API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/sensor-data - Get sensor data for dashboard
router.get('/sensor-data', (req, res) => {
  try {
    const { device_id, limit = 100, hours = 24 } = req.query;
    
    let query = `
      SELECT * FROM sensor_data 
      WHERE created_at >= datetime('now', '-${hours} hours')
    `;
    let params = [];

    if (device_id) {
      query += ' AND device_id = ?';
      params.push(device_id);
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('Database query error:', err);
        return res.status(500).json({
          success: false,
          error: 'Failed to retrieve sensor data'
        });
      }

      res.json({
        success: true,
        data: rows,
        count: rows.length,
        device_id: device_id || 'all',
        time_range: `${hours} hours`
      });
    });

  } catch (error) {
    console.error('Sensor data GET error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/sensor-data/latest - Get latest data from all devices
router.get('/sensor-data/latest', (req, res) => {
  try {
    const query = `
      SELECT device_id, 
             temperature, 
             humidity, 
             air_quality, 
             co2_level, 
             light_level, 
             location,
             created_at,
             MAX(created_at) as latest_time
      FROM sensor_data 
      WHERE created_at >= datetime('now', '-1 hour')
      GROUP BY device_id
      ORDER BY latest_time DESC
    `;

    db.all(query, [], (err, rows) => {
      if (err) {
        console.error('Database query error:', err);
        return res.status(500).json({
          success: false,
          error: 'Failed to retrieve latest sensor data'
        });
      }

      res.json({
        success: true,
        data: rows,
        count: rows.length,
        timestamp: new Date().toISOString()
      });
    });

  } catch (error) {
    console.error('Latest sensor data error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/sensor-data/stats - Get aggregated statistics
router.get('/sensor-data/stats', (req, res) => {
  try {
    const { device_id, hours = 24 } = req.query;
    
    let query = `
      SELECT 
        device_id,
        COUNT(*) as total_readings,
        AVG(temperature) as avg_temperature,
        AVG(humidity) as avg_humidity,
        AVG(air_quality) as avg_air_quality,
        AVG(co2_level) as avg_co2_level,
        AVG(light_level) as avg_light_level,
        MIN(created_at) as first_reading,
        MAX(created_at) as last_reading
      FROM sensor_data 
      WHERE created_at >= datetime('now', '-${hours} hours')
    `;
    let params = [];

    if (device_id) {
      query += ' AND device_id = ?';
      params.push(device_id);
    }

    query += ' GROUP BY device_id';

    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('Database query error:', err);
        return res.status(500).json({
          success: false,
          error: 'Failed to retrieve sensor statistics'
        });
      }

      res.json({
        success: true,
        data: rows,
        time_range: `${hours} hours`,
        timestamp: new Date().toISOString()
      });
    });

  } catch (error) {
    console.error('Sensor stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/devices - Get list of connected devices
router.get('/devices', (req, res) => {
  try {
    const query = `
      SELECT 
        device_id,
        location,
        node_type,
        MAX(created_at) as last_seen,
        COUNT(*) as total_readings
      FROM sensor_data 
      GROUP BY device_id, location, node_type
      ORDER BY last_seen DESC
    `;

    db.all(query, [], (err, rows) => {
      if (err) {
        console.error('Database query error:', err);
        return res.status(500).json({
          success: false,
          error: 'Failed to retrieve devices'
        });
      }

      res.json({
        success: true,
        devices: rows,
        count: rows.length,
        timestamp: new Date().toISOString()
      });
    });

  } catch (error) {
    console.error('Devices API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'EcoAtlas AI Sensor API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

module.exports = router;
