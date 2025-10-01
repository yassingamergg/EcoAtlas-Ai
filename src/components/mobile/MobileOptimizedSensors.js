import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  Platform,
  RefreshControl,
  Animated,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { useRealTimeData } from '../../hooks/useRealTimeData';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const MobileOptimizedSensors = () => {
  const { sensorData, deviceStatus, isConnected, error } = useRealTimeData();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [swipeAnimation] = useState(new Animated.Value(0));

  // Swipe gesture for device switching
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 20;
    },
    onPanResponderMove: (evt, gestureState) => {
      swipeAnimation.setValue(gestureState.dx);
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (Math.abs(gestureState.dx) > 100) {
        // Switch device
        const devices = [...new Set(sensorData.map(data => data.device_id))];
        const currentIndex = devices.indexOf(selectedDevice);
        let nextIndex;
        
        if (gestureState.dx > 0) {
          // Swipe right - previous device
          nextIndex = currentIndex > 0 ? currentIndex - 1 : devices.length - 1;
        } else {
          // Swipe left - next device
          nextIndex = currentIndex < devices.length - 1 ? currentIndex + 1 : 0;
        }
        
        setSelectedDevice(devices[nextIndex]);
      }
      
      Animated.spring(swipeAnimation, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getLatestData = (deviceId) => {
    return sensorData.find(data => data.device_id === deviceId);
  };

  const getDeviceStatus = (deviceId) => {
    const hasData = sensorData.some(data => data.device_id === deviceId);
    return deviceStatus[deviceId] || { status: hasData ? 'online' : 'offline' };
  };

  const devices = [...new Set(sensorData.map(data => data.device_id))];

  // Set default selected device
  useEffect(() => {
    if (devices.length > 0 && !selectedDevice) {
      setSelectedDevice(devices[0]);
    }
  }, [devices, selectedDevice]);

  const renderSensorCard = (title, value, unit, icon, color = '#22c55e') => (
    <View style={[styles.sensorCard, { borderLeftColor: color }]}>
      <View style={styles.sensorHeader}>
        <Ionicons name={icon} size={24} color={color} />
        <Text style={styles.sensorTitle}>{title}</Text>
      </View>
      <Text style={[styles.sensorValue, { color }]}>
        {value} {unit}
      </Text>
    </View>
  );

  const renderChart = (data, type = 'line') => {
    if (!data || data.length === 0) return null;

    const chartConfig = {
      backgroundColor: '#ffffff',
      backgroundGradientFrom: '#ffffff',
      backgroundGradientTo: '#ffffff',
      decimalPlaces: 1,
      color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
      labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
      style: {
        borderRadius: 16,
      },
      propsForDots: {
        r: '6',
        strokeWidth: '2',
        stroke: '#22c55e',
      },
    };

    const chartData = {
      labels: data.slice(-7).map((_, index) => `${index + 1}`),
      datasets: [{
        data: data.slice(-7).map(item => item.value || 0),
        color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
        strokeWidth: 2,
      }],
    };

    return (
      <View style={styles.chartContainer}>
        {type === 'line' ? (
          <LineChart
            data={chartData}
            width={screenWidth - 40}
            height={200}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        ) : (
          <BarChart
            data={chartData}
            width={screenWidth - 40}
            height={200}
            chartConfig={chartConfig}
            style={styles.chart}
          />
        )}
      </View>
    );
  };

  const latestData = selectedDevice ? getLatestData(selectedDevice) : null;
  const status = selectedDevice ? getDeviceStatus(selectedDevice) : null;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Connection Status */}
      <View style={styles.statusBar}>
        <View style={[styles.statusIndicator, { backgroundColor: isConnected ? '#22c55e' : '#ef4444' }]} />
        <Text style={styles.statusText}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </Text>
        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}
      </View>

      {/* Device Selector */}
      {devices.length > 1 && (
        <View style={styles.deviceSelector}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {devices.map((deviceId) => (
              <TouchableOpacity
                key={deviceId}
                style={[
                  styles.deviceButton,
                  selectedDevice === deviceId && styles.deviceButtonActive,
                ]}
                onPress={() => setSelectedDevice(deviceId)}
              >
                <Text style={[
                  styles.deviceButtonText,
                  selectedDevice === deviceId && styles.deviceButtonTextActive,
                ]}>
                  {deviceId}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Main Sensor Data */}
      {latestData && (
        <Animated.View
          style={[
            styles.sensorContainer,
            {
              transform: [{ translateX: swipeAnimation }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          {/* Temperature */}
          {renderSensorCard(
            'Temperature',
            latestData.temperature?.toFixed(1) || 'N/A',
            '°C',
            'thermometer-outline',
            '#ef4444'
          )}

          {/* Humidity */}
          {renderSensorCard(
            'Humidity',
            latestData.humidity?.toFixed(1) || 'N/A',
            '%',
            'water-outline',
            '#3b82f6'
          )}

          {/* Air Quality */}
          {renderSensorCard(
            'Air Quality',
            latestData.air_quality || 'N/A',
            'ppm',
            'leaf-outline',
            '#22c55e'
          )}

          {/* CO2 Level */}
          {renderSensorCard(
            'CO2 Level',
            latestData.co2_level || 'N/A',
            'ppm',
            'cloud-outline',
            '#8b5cf6'
          )}

          {/* Power Consumption */}
          {renderSensorCard(
            'Power',
            latestData.power_consumption?.toFixed(1) || 'N/A',
            'W',
            'flash-outline',
            '#f59e0b'
          )}
        </Animated.View>
      )}

      {/* Charts Section */}
      {latestData && (
        <View style={styles.chartsSection}>
          <Text style={styles.sectionTitle}>Historical Data</Text>
          
          {/* Temperature Chart */}
          {renderChart(
            sensorData
              .filter(data => data.device_id === selectedDevice)
              .map(data => ({ value: data.temperature })),
            'line'
          )}

          {/* Air Quality Chart */}
          {renderChart(
            sensorData
              .filter(data => data.device_id === selectedDevice)
              .map(data => ({ value: data.air_quality })),
            'bar'
          )}
        </View>
      )}

      {/* Device Status */}
      {status && (
        <View style={styles.statusSection}>
          <Text style={styles.sectionTitle}>Device Status</Text>
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Ionicons
                name={status.status === 'online' ? 'checkmark-circle' : 'close-circle'}
                size={24}
                color={status.status === 'online' ? '#22c55e' : '#ef4444'}
              />
              <Text style={styles.statusLabel}>Status: {status.status}</Text>
            </View>
            {status.lastSeen && (
              <Text style={styles.lastSeenText}>
                Last seen: {new Date(status.lastSeen).toLocaleTimeString()}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="refresh" size={24} color="#22c55e" />
            <Text style={styles.actionText}>Refresh</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="settings" size={24} color="#22c55e" />
            <Text style={styles.actionText}>Settings</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="share" size={24} color="#22c55e" />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="download" size={24} color="#22c55e" />
            <Text style={styles.actionText}>Export</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    marginBottom: 8,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginLeft: 8,
  },
  deviceSelector: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  deviceButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  deviceButtonActive: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  deviceButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  deviceButtonTextActive: {
    color: '#ffffff',
  },
  sensorContainer: {
    padding: 16,
  },
  sensorCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sensorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sensorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  sensorValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  chartsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  chartContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chart: {
    borderRadius: 12,
  },
  statusSection: {
    padding: 16,
  },
  statusCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  lastSeenText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  actionsSection: {
    padding: 16,
    paddingBottom: 32,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: (screenWidth - 48) / 2,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 8,
  },
});

export default MobileOptimizedSensors;
