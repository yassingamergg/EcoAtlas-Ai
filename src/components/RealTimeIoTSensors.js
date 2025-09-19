import React, { useState, useEffect } from 'react';
import { useRealTimeData, useDeviceControl, useStats } from '../hooks/useRealTimeData';
import { 
  Wifi, 
  Thermometer, 
  Droplet, 
  Wind, 
  Zap, 
  Globe, 
  Activity,
  RefreshCw,
  Power,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';

const RealTimeIoTSensors = () => {
  const { sensorData, deviceStatus, carbonData, isConnected, error } = useRealTimeData();
  const { sendCommand } = useDeviceControl();
  const { stats, loading } = useStats();
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Get latest data for each device
  const getLatestData = (deviceId) => {
    return sensorData.find(data => data.device_id === deviceId);
  };

  // Get device status
  const getDeviceStatus = (deviceId) => {
    return deviceStatus[deviceId] || { status: 'unknown' };
  };

  // Get unique devices
  const devices = [...new Set(sensorData.map(data => data.device_id))];

  // Calculate carbon emissions from latest data
  const calculateCarbonEmissions = (deviceId) => {
    const latestData = getLatestData(deviceId);
    if (!latestData) return 0;
    
    const powerWatts = latestData.power_consumption || 0;
    const powerKWh = powerWatts / 1000;
    const co2Emissions = powerKWh * 0.4; // 0.4 kg CO2 per kWh
    
    return co2Emissions;
  };

  // Send control command
  const handleControlCommand = async (deviceId, command) => {
    const result = await sendCommand(deviceId, command);
    if (result.success) {
      console.log(`Command ${command} sent to ${deviceId}`);
    } else {
      console.error(`Failed to send command: ${result.error}`);
    }
  };

  // Get status icon and color
  const getStatusIcon = (status) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'offline':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  // Get air quality status
  const getAirQualityStatus = (pm25) => {
    if (pm25 <= 12) return { status: 'Good', color: 'text-green-600', bg: 'bg-green-100' };
    if (pm25 <= 35) return { status: 'Moderate', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    if (pm25 <= 55) return { status: 'Unhealthy for Sensitive', color: 'text-orange-600', bg: 'bg-orange-100' };
    return { status: 'Unhealthy', color: 'text-red-600', bg: 'bg-red-100' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-8 rounded-xl text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Wifi className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold">Real-time ESP32 Sensor Network</h2>
                <p className="text-lg opacity-90">Live environmental monitoring with wireless ESP32 IoT sensors</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                isConnected ? 'bg-green-500/20 text-green-100' : 'bg-red-500/20 text-red-100'
              }`}>
                <div className={`w-3 h-3 rounded-full ${
                  isConnected ? 'bg-green-400' : 'bg-red-400'
                }`}></div>
                <span className="font-medium">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`p-2 rounded-lg transition-colors ${
                  autoRefresh ? 'bg-white/20 text-white' : 'bg-white/10 text-white/70'
                }`}
              >
                <RefreshCw className={`w-5 h-5 ${autoRefresh ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800 font-medium">Connection Error</span>
          </div>
          <p className="text-red-700 mt-1">{error}</p>
        </div>
      )}

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Wifi className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-2xl font-bold text-blue-600">{stats.total_devices || 0}</span>
            </div>
            <h3 className="font-semibold text-gray-900">Active Devices</h3>
            <p className="text-sm text-gray-600">ESP32 sensors online</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-2xl font-bold text-green-600">{stats.total_readings || 0}</span>
            </div>
            <h3 className="font-semibold text-gray-900">Data Points</h3>
            <p className="text-sm text-gray-600">Last hour</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Thermometer className="w-5 h-5 text-orange-600" />
              </div>
              <span className="text-2xl font-bold text-orange-600">
                {stats.avg_temperature ? stats.avg_temperature.toFixed(1) : '--'}°C
              </span>
            </div>
            <h3 className="font-semibold text-gray-900">Avg Temperature</h3>
            <p className="text-sm text-gray-600">Across all sensors</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-2xl font-bold text-purple-600">
                {stats.total_power ? stats.total_power.toFixed(1) : '--'}W
              </span>
            </div>
            <h3 className="font-semibold text-gray-900">Total Power</h3>
            <p className="text-sm text-gray-600">Current consumption</p>
          </div>
        </div>
      )}

      {/* Device Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {devices.map(deviceId => {
          const latestData = getLatestData(deviceId);
          const deviceStatus = getDeviceStatus(deviceId);
          const carbonEmissions = calculateCarbonEmissions(deviceId);
          const airQuality = latestData ? getAirQualityStatus(latestData.pm25) : null;

          return (
            <div key={deviceId} className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
              {/* Device Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(deviceStatus.status)}
                  <div>
                    <h3 className="font-semibold text-gray-900">ESP32-{deviceId}</h3>
                    <p className="text-sm text-gray-600 capitalize">{deviceStatus.status}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleControlCommand(deviceId, 'status')}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Get Status"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleControlCommand(deviceId, 'calibrate')}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Calibrate Sensors"
                  >
                    <Activity className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Sensor Data */}
              {latestData ? (
                <div className="space-y-3">
                  {/* Temperature & Humidity */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2">
                      <Thermometer className="w-4 h-4 text-red-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {latestData.temperature.toFixed(1)}°C
                        </p>
                        <p className="text-xs text-gray-600">Temperature</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Droplet className="w-4 h-4 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {latestData.humidity.toFixed(1)}%
                        </p>
                        <p className="text-xs text-gray-600">Humidity</p>
                      </div>
                    </div>
                  </div>

                  {/* Air Quality */}
                  {airQuality && (
                    <div className="flex items-center space-x-2">
                      <Wind className="w-4 h-4 text-green-500" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            {latestData.pm25.toFixed(1)} μg/m³
                          </p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${airQuality.bg} ${airQuality.color}`}>
                            {airQuality.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">PM2.5 Air Quality</p>
                      </div>
                    </div>
                  )}

                  {/* Power & CO2 */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {latestData.power_consumption.toFixed(1)}W
                        </p>
                        <p className="text-xs text-gray-600">Power</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Globe className="w-4 h-4 text-purple-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {latestData.co2.toFixed(0)} ppm
                        </p>
                        <p className="text-xs text-gray-600">CO₂</p>
                      </div>
                    </div>
                  </div>

                  {/* Carbon Emissions */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Power className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-gray-900">Carbon Emissions</span>
                      </div>
                      <span className="text-sm font-bold text-green-600">
                        {carbonEmissions.toFixed(3)} kg CO₂
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Estimated from power consumption</p>
                  </div>

                  {/* Last Update */}
                  <div className="text-xs text-gray-500 text-center">
                    Last update: {new Date(latestData.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No data available</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* No Devices Message */}
      {devices.length === 0 && (
        <div className="text-center py-12">
          <Wifi className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No ESP32 Devices Connected</h3>
          <p className="text-gray-600 mb-4">
            Connect your ESP32 devices to start receiving real-time environmental data.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
            <h4 className="font-medium text-blue-900 mb-2">Setup Instructions:</h4>
            <ol className="text-sm text-blue-800 text-left space-y-1">
              <li>1. Upload the ESP32 firmware</li>
              <li>2. Configure WiFi credentials</li>
              <li>3. Connect sensors (DHT22, BME280, PMS5003)</li>
              <li>4. Power on the device</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealTimeIoTSensors;
