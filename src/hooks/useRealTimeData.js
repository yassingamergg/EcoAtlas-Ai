import { useState, useEffect, useRef } from 'react';

// Custom hook for real-time ESP32 data
export const useRealTimeData = () => {
  const [sensorData, setSensorData] = useState([]);
  const [deviceStatus, setDeviceStatus] = useState({});
  const [carbonData, setCarbonData] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const connectWebSocket = () => {
    try {
      const ws = new WebSocket('ws://localhost:8080');
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setError(null);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          switch (message.type) {
            case 'sensor_data':
              setSensorData(prev => {
                const newData = [message.data, ...prev.slice(0, 99)]; // Keep last 100 readings
                return newData;
              });
              break;
              
            case 'device_status':
              setDeviceStatus(prev => ({
                ...prev,
                [message.data.device_id]: message.data
              }));
              break;
              
            case 'carbon_data':
              setCarbonData(prev => {
                const newData = [message.data, ...prev.slice(0, 99)]; // Keep last 100 readings
                return newData;
              });
              break;
              
            case 'recent_data':
              setSensorData(message.data);
              break;
              
            default:
              console.log('Unknown message type:', message.type);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        
        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 3000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('WebSocket connection error');
        setIsConnected(false);
      };

    } catch (err) {
      console.error('Error creating WebSocket:', err);
      setError('Failed to create WebSocket connection');
    }
  };

  const disconnectWebSocket = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  useEffect(() => {
    // Disable WebSocket for now since our simple backend doesn't support it
    // connectWebSocket();
    
    return () => {
      disconnectWebSocket();
    };
  }, []);

  // Fetch initial data from API
  const fetchInitialData = async () => {
    try {
      const [sensorResponse, deviceResponse] = await Promise.all([
        fetch('http://localhost:5000/api/sensor-data?limit=50'),
        fetch('http://localhost:5000/api/devices')
      ]);

      if (sensorResponse.ok) {
        const response = await sensorResponse.json();
        // Handle our simple backend response format
        if (response.success && response.data) {
          setSensorData(response.data);
        } else {
          setSensorData(response);
        }
      }

      if (deviceResponse.ok) {
        const response = await deviceResponse.json();
        // Handle our simple backend response format
        if (response.success && response.devices) {
          const deviceMap = {};
          response.devices.forEach(device => {
            deviceMap[device.device_id] = device;
          });
          setDeviceStatus(deviceMap);
        }
      }
    } catch (err) {
      console.error('Error fetching initial data:', err);
      setError('Failed to fetch initial data');
    }
  };

  useEffect(() => {
    fetchInitialData();
    
    // Refresh data every 30 seconds since we don't have WebSocket
    const interval = setInterval(fetchInitialData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    sensorData,
    deviceStatus,
    carbonData,
    isConnected,
    error,
    reconnect: connectWebSocket,
    disconnect: disconnectWebSocket
  };
};

// Hook for device control
export const useDeviceControl = () => {
  const sendCommand = async (deviceId, command) => {
    try {
      const response = await fetch(`http://localhost:5000/api/devices/${deviceId}/control`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command })
      });

      if (response.ok) {
        return { success: true };
      } else {
        throw new Error('Failed to send command');
      }
    } catch (error) {
      console.error('Error sending command:', error);
      return { success: false, error: error.message };
    }
  };

  return { sendCommand };
};

// Hook for statistics
export const useStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      // Since our simple backend doesn't have stats endpoint, create basic stats from sensor data
      const response = await fetch('http://localhost:5000/api/sensor-data?limit=100');
      if (response.ok) {
        const data = await response.json();
        const sensorData = data.success ? data.data : data;
        
        if (sensorData && sensorData.length > 0) {
          const totalReadings = sensorData.length;
          const uniqueDevices = new Set(sensorData.map(d => d.device_id)).size;
          const avgTemp = sensorData.reduce((sum, d) => sum + (d.temperature || 0), 0) / totalReadings;
          const avgSignal = sensorData.reduce((sum, d) => sum + (d.wifi_signal || 0), 0) / totalReadings;
          
          setStats({
            total_devices: uniqueDevices,
            total_readings: totalReadings,
            avg_temperature: avgTemp,
            avg_wifi_signal: avgSignal
          });
        }
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return { stats, loading, refresh: fetchStats };
};
