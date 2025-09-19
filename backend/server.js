const express = require('express');
const mqtt = require('mqtt');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const helmet = require('helmet');
const WebSocket = require('ws');
const cron = require('node-cron');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Database setup
const db = new sqlite3.Database('./ecoatlas.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

// WebSocket server for real-time data
const wss = new WebSocket.Server({ port: 8080 });
console.log('WebSocket server running on port 8080');

// MQTT client
const mqttClient = mqtt.connect('mqtt://localhost:1883', {
  username: 'ecoatlas',
  password: 'ecoatlas123',
  clientId: 'ecoatlas-backend'
});

// Store connected WebSocket clients
const clients = new Set();

// Initialize database tables
function initializeDatabase() {
  // Sensor data table
  db.run(`
    CREATE TABLE IF NOT EXISTS sensor_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      temperature REAL,
      humidity REAL,
      pressure REAL,
      pm25 REAL,
      pm10 REAL,
      co2 REAL,
      power_consumption REAL,
      wifi_rssi INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Device status table
  db.run(`
    CREATE TABLE IF NOT EXISTS device_status (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT NOT NULL,
      status TEXT NOT NULL,
      ip_address TEXT,
      last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Carbon calculations table
  db.run(`
    CREATE TABLE IF NOT EXISTS carbon_calculations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      energy_consumption REAL,
      co2_emissions REAL,
      calculation_method TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('Database tables initialized');
}

// MQTT connection handling
mqttClient.on('connect', () => {
  console.log('Connected to MQTT broker');
  
  // Subscribe to sensor data topics
  mqttClient.subscribe('ecoatlas/sensors/+/data', (err) => {
    if (err) {
      console.error('Error subscribing to sensor data:', err);
    } else {
      console.log('Subscribed to sensor data topics');
    }
  });

  // Subscribe to device status topics
  mqttClient.subscribe('ecoatlas/device/+/status', (err) => {
    if (err) {
      console.error('Error subscribing to device status:', err);
    } else {
      console.log('Subscribed to device status topics');
    }
  });

  // Subscribe to heartbeat topics
  mqttClient.subscribe('ecoatlas/device/+/heartbeat', (err) => {
    if (err) {
      console.error('Error subscribing to heartbeat:', err);
    } else {
      console.log('Subscribed to heartbeat topics');
    }
  });
});

mqttClient.on('error', (err) => {
  console.error('MQTT connection error:', err);
});

// Handle incoming MQTT messages
mqttClient.on('message', (topic, message) => {
  try {
    const data = JSON.parse(message.toString());
    
    if (topic.includes('/sensors/') && topic.includes('/data')) {
      handleSensorData(data);
    } else if (topic.includes('/device/') && topic.includes('/status')) {
      handleDeviceStatus(data);
    } else if (topic.includes('/device/') && topic.includes('/heartbeat')) {
      handleHeartbeat(data);
    }
  } catch (error) {
    console.error('Error parsing MQTT message:', error);
  }
});

// Handle sensor data
function handleSensorData(data) {
  console.log('Received sensor data from:', data.device_id);
  
  // Store in database
  const stmt = db.prepare(`
    INSERT INTO sensor_data 
    (device_id, timestamp, temperature, humidity, pressure, pm25, pm10, co2, power_consumption, wifi_rssi)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run([
    data.device_id,
    data.timestamp,
    data.temperature,
    data.humidity,
    data.pressure,
    data.pm25,
    data.pm10,
    data.co2,
    data.power_consumption,
    data.wifi_rssi
  ]);
  
  stmt.finalize();
  
  // Calculate carbon emissions
  calculateCarbonEmissions(data);
  
  // Broadcast to WebSocket clients
  broadcastToClients({
    type: 'sensor_data',
    data: data
  });
}

// Handle device status
function handleDeviceStatus(data) {
  console.log('Device status update:', data.device_id, data.status);
  
  const stmt = db.prepare(`
    INSERT INTO device_status (device_id, status, ip_address)
    VALUES (?, ?, ?)
  `);
  
  stmt.run([data.device_id, data.status, data.ip_address]);
  stmt.finalize();
  
  // Broadcast to WebSocket clients
  broadcastToClients({
    type: 'device_status',
    data: data
  });
}

// Handle heartbeat
function handleHeartbeat(data) {
  console.log('Heartbeat from:', data.device_id);
  
  // Update device status
  const stmt = db.prepare(`
    UPDATE device_status 
    SET last_seen = CURRENT_TIMESTAMP 
    WHERE device_id = ?
  `);
  
  stmt.run([data.device_id]);
  stmt.finalize();
}

// Calculate carbon emissions from sensor data
function calculateCarbonEmissions(sensorData) {
  // Simplified carbon calculation
  // In a real system, you'd use more sophisticated algorithms
  
  const energyConsumption = sensorData.power_consumption || 0; // Watts
  const energyKWh = energyConsumption / 1000; // Convert to kWh
  const co2Emissions = energyKWh * 0.4; // Assume 0.4 kg CO2 per kWh
  
  const stmt = db.prepare(`
    INSERT INTO carbon_calculations 
    (device_id, timestamp, energy_consumption, co2_emissions, calculation_method)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  stmt.run([
    sensorData.device_id,
    sensorData.timestamp,
    energyConsumption,
    co2Emissions,
    'simplified_energy_based'
  ]);
  
  stmt.finalize();
  
  // Broadcast carbon data
  broadcastToClients({
    type: 'carbon_data',
    data: {
      device_id: sensorData.device_id,
      timestamp: sensorData.timestamp,
      energy_consumption: energyConsumption,
      co2_emissions: co2Emissions
    }
  });
}

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('New WebSocket client connected');
  clients.add(ws);
  
  // Send recent data to new client
  sendRecentData(ws);
  
  ws.on('close', () => {
    console.log('WebSocket client disconnected');
    clients.delete(ws);
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(ws);
  });
});

// Broadcast data to all connected WebSocket clients
function broadcastToClients(data) {
  const message = JSON.stringify(data);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Send recent data to a specific client
function sendRecentData(ws) {
  db.all(`
    SELECT * FROM sensor_data 
    ORDER BY created_at DESC 
    LIMIT 100
  `, (err, rows) => {
    if (err) {
      console.error('Error fetching recent data:', err);
    } else {
      ws.send(JSON.stringify({
        type: 'recent_data',
        data: rows
      }));
    }
  });
}

// API Routes

// Get all sensor data
app.get('/api/sensor-data', (req, res) => {
  const { device_id, limit = 100, offset = 0 } = req.query;
  
  let query = 'SELECT * FROM sensor_data';
  let params = [];
  
  if (device_id) {
    query += ' WHERE device_id = ?';
    params.push(device_id);
  }
  
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  
  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// Get device status
app.get('/api/devices', (req, res) => {
  db.all(`
    SELECT device_id, status, ip_address, last_seen, created_at
    FROM device_status 
    ORDER BY last_seen DESC
  `, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// Get carbon calculations
app.get('/api/carbon-data', (req, res) => {
  const { device_id, limit = 100 } = req.query;
  
  let query = 'SELECT * FROM carbon_calculations';
  let params = [];
  
  if (device_id) {
    query += ' WHERE device_id = ?';
    params.push(device_id);
  }
  
  query += ' ORDER BY created_at DESC LIMIT ?';
  params.push(parseInt(limit));
  
  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// Get real-time statistics
app.get('/api/stats', (req, res) => {
  db.get(`
    SELECT 
      COUNT(DISTINCT device_id) as total_devices,
      COUNT(*) as total_readings,
      AVG(temperature) as avg_temperature,
      AVG(humidity) as avg_humidity,
      AVG(pm25) as avg_pm25,
      SUM(power_consumption) as total_power
    FROM sensor_data 
    WHERE created_at > datetime('now', '-1 hour')
  `, (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(row);
    }
  });
});

// Send control command to device
app.post('/api/devices/:deviceId/control', (req, res) => {
  const { deviceId } = req.params;
  const { command } = req.body;
  
  const topic = `ecoatlas/device/${deviceId}/control`;
  mqttClient.publish(topic, command, (err) => {
    if (err) {
      res.status(500).json({ error: 'Failed to send command' });
    } else {
      res.json({ message: 'Command sent successfully' });
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    mqtt_connected: mqttClient.connected,
    websocket_clients: clients.size
  });
});

// Cleanup old data (run daily)
cron.schedule('0 2 * * *', () => {
  console.log('Running daily cleanup...');
  
  // Delete data older than 30 days
  db.run(`
    DELETE FROM sensor_data 
    WHERE created_at < datetime('now', '-30 days')
  `);
  
  db.run(`
    DELETE FROM carbon_calculations 
    WHERE created_at < datetime('now', '-30 days')
  `);
  
  console.log('Daily cleanup completed');
});

// Start server
app.listen(PORT, () => {
  console.log(`EcoAtlas Backend API running on port ${PORT}`);
  console.log(`WebSocket server running on port 8080`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  
  mqttClient.end();
  db.close();
  wss.close();
  
  process.exit(0);
});
