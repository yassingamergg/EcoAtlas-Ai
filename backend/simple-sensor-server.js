const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

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
app.post('/api/sensor-data', (req, res) => {
  try {
    const {
      device_id,
      timestamp,
      temperature,
      humidity,
      air_quality,
      co2_level,
      light_level,
      wifi_signal,
      location,
      node_type
    } = req.body;

    console.log('📊 Received sensor data from:', device_id);
    console.log('  Temperature:', temperature, '°C');
    console.log('  WiFi Signal:', wifi_signal, 'dBm');
    console.log('  Location:', location);

    // Store in database
    const stmt = db.prepare(`
      INSERT INTO sensor_data 
      (device_id, timestamp, temperature, humidity, air_quality, co2_level, light_level, wifi_signal, location, node_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run([
      device_id,
      timestamp,
      temperature,
      humidity,
      air_quality,
      co2_level,
      light_level,
      wifi_signal,
      location,
      node_type
    ]);

    stmt.finalize();

    res.json({
      success: true,
      message: 'Sensor data received successfully',
      device_id: device_id,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error processing sensor data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process sensor data'
    });
  }
});

// GET /api/sensor-data - Get sensor data
app.get('/api/sensor-data', (req, res) => {
  try {
    const { device_id, limit = 100 } = req.query;
    
    let query = 'SELECT * FROM sensor_data';
    let params = [];
    
    if (device_id) {
      query += ' WHERE device_id = ?';
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
        timestamp: new Date().toISOString()
      });
    });

  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/devices - Get list of connected devices
app.get('/api/devices', (req, res) => {
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
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'EcoAtlas AI Simple Sensor API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    port: PORT
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🌱 EcoAtlas AI Simple Sensor API Server');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📊 Sensor data endpoint: http://localhost:${PORT}/api/sensor-data`);
  console.log('✅ Ready to receive data from ESP32 devices!');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server gracefully...');
  db.close();
  process.exit(0);
});
