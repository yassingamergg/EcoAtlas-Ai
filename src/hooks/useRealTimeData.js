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
    connectWebSocket();
    
    return () => {
      disconnectWebSocket();
    };
  }, []);

  // Fetch initial data from API
  const fetchInitialData = async () => {
    try {
      const [sensorResponse, deviceResponse, carbonResponse] = await Promise.all([
        fetch('http://localhost:5000/api/sensor-data?limit=50'),
        fetch('http://localhost:5000/api/devices'),
        fetch('http://localhost:5000/api/carbon-data?limit=50')
      ]);

      if (sensorResponse.ok) {
        const sensorData = await sensorResponse.json();
        setSensorData(sensorData);
      }

      if (deviceResponse.ok) {
        const devices = await deviceResponse.json();
        const deviceMap = {};
        devices.forEach(device => {
          deviceMap[device.device_id] = device;
        });
        setDeviceStatus(deviceMap);
      }

      if (carbonResponse.ok) {
        const carbonData = await carbonResponse.json();
        setCarbonData(carbonData);
      }
    } catch (err) {
      console.error('Error fetching initial data:', err);
      setError('Failed to fetch initial data');
    }
  };

  useEffect(() => {
    fetchInitialData();
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
      const response = await fetch('http://localhost:5000/api/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
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
