import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  NetInfo,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const MobileOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSync, setPendingSync] = useState([]);
  const [lastSync, setLastSync] = useState(null);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [offlineData, setOfflineData] = useState({
    sensorData: [],
    carbonEntries: [],
    userSettings: {},
  });

  useEffect(() => {
    // Check network connectivity
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected);
      if (state.isConnected && pendingSync.length > 0) {
        syncOfflineData();
      }
    });

    // Load offline data and pending sync items
    loadOfflineData();
    loadPendingSync();

    return () => unsubscribe();
  }, []);

  const loadOfflineData = async () => {
    try {
      const sensorData = await AsyncStorage.getItem('offline_sensor_data');
      const carbonEntries = await AsyncStorage.getItem('offline_carbon_entries');
      const userSettings = await AsyncStorage.getItem('offline_user_settings');
      const lastSyncTime = await AsyncStorage.getItem('last_sync_time');

      setOfflineData({
        sensorData: sensorData ? JSON.parse(sensorData) : [],
        carbonEntries: carbonEntries ? JSON.parse(carbonEntries) : [],
        userSettings: userSettings ? JSON.parse(userSettings) : {},
      });

      setLastSync(lastSyncTime ? new Date(lastSyncTime) : null);
    } catch (error) {
      console.error('Error loading offline data:', error);
    }
  };

  const loadPendingSync = async () => {
    try {
      const pending = await AsyncStorage.getItem('pending_sync');
      setPendingSync(pending ? JSON.parse(pending) : []);
    } catch (error) {
      console.error('Error loading pending sync:', error);
    }
  };

  const saveOfflineData = async (type, data) => {
    try {
      const key = `offline_${type}`;
      await AsyncStorage.setItem(key, JSON.stringify(data));
      
      // Update local state
      setOfflineData(prev => ({
        ...prev,
        [type]: data,
      }));
    } catch (error) {
      console.error('Error saving offline data:', error);
    }
  };

  const addToPendingSync = async (action, data) => {
    try {
      const pendingItem = {
        id: Date.now().toString(),
        action,
        data,
        timestamp: new Date().toISOString(),
        retryCount: 0,
      };

      const updatedPending = [...pendingSync, pendingItem];
      setPendingSync(updatedPending);
      await AsyncStorage.setItem('pending_sync', JSON.stringify(updatedPending));
    } catch (error) {
      console.error('Error adding to pending sync:', error);
    }
  };

  const syncOfflineData = async () => {
    if (syncInProgress || pendingSync.length === 0) return;

    setSyncInProgress(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const item of pendingSync) {
        try {
          // Simulate API call
          const success = await syncItem(item);
          if (success) {
            successCount++;
          } else {
            errorCount++;
            item.retryCount++;
          }
        } catch (error) {
          console.error('Error syncing item:', error);
          errorCount++;
          item.retryCount++;
        }
      }

      // Remove successfully synced items
      const remainingPending = pendingSync.filter(item => item.retryCount < 3);
      setPendingSync(remainingPending);
      await AsyncStorage.setItem('pending_sync', JSON.stringify(remainingPending));

      // Update last sync time
      const now = new Date().toISOString();
      setLastSync(new Date(now));
      await AsyncStorage.setItem('last_sync_time', now);

      if (successCount > 0) {
        Alert.alert(
          'Sync Complete',
          `Successfully synced ${successCount} items. ${errorCount} items failed.`
        );
      }
    } catch (error) {
      console.error('Error during sync:', error);
      Alert.alert('Sync Error', 'Failed to sync data. Please try again.');
    } finally {
      setSyncInProgress(false);
    }
  };

  const syncItem = async (item) => {
    // Simulate API call based on action type
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate 90% success rate
        resolve(Math.random() > 0.1);
      }, 1000);
    });
  };

  const clearOfflineData = async () => {
    Alert.alert(
      'Clear Offline Data',
      'This will remove all offline data and pending sync items. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove([
                'offline_sensor_data',
                'offline_carbon_entries',
                'offline_user_settings',
                'pending_sync',
                'last_sync_time',
              ]);
              
              setOfflineData({
                sensorData: [],
                carbonEntries: [],
                userSettings: {},
              });
              setPendingSync([]);
              setLastSync(null);
              
              Alert.alert('Success', 'Offline data cleared successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear offline data');
            }
          },
        },
      ]
    );
  };

  const simulateOfflineAction = () => {
    const actions = ['add_sensor_data', 'add_carbon_entry', 'update_settings'];
    const randomAction = actions[Math.floor(Math.random() * actions.length)];
    
    addToPendingSync(randomAction, {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      value: Math.random() * 100,
    });
    
    Alert.alert('Offline Action', `Added ${randomAction} to pending sync`);
  };

  const renderStatusCard = (title, value, icon, color = '#22c55e') => (
    <View style={[styles.statusCard, { borderLeftColor: color }]}>
      <View style={styles.statusHeader}>
        <Ionicons name={icon} size={24} color={color} />
        <Text style={styles.statusTitle}>{title}</Text>
      </View>
      <Text style={[styles.statusValue, { color }]}>{value}</Text>
    </View>
  );

  const renderDataCard = (title, data, icon) => (
    <View style={styles.dataCard}>
      <View style={styles.dataHeader}>
        <Ionicons name={icon} size={20} color="#374151" />
        <Text style={styles.dataTitle}>{title}</Text>
        <Text style={styles.dataCount}>{data.length} items</Text>
      </View>
      {data.length > 0 && (
        <View style={styles.dataPreview}>
          <Text style={styles.dataPreviewText}>
            Latest: {new Date(data[0].timestamp || data[0].date).toLocaleString()}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Connection Status */}
      <View style={styles.statusBar}>
        <View style={[
          styles.statusIndicator,
          { backgroundColor: isOnline ? '#22c55e' : '#ef4444' }
        ]} />
        <Text style={styles.statusText}>
          {isOnline ? 'Online' : 'Offline'}
        </Text>
        {!isOnline && (
          <Text style={styles.offlineText}>
            Data will sync when connection is restored
          </Text>
        )}
      </View>

      {/* Sync Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sync Status</Text>
        
        {renderStatusCard(
          'Last Sync',
          lastSync ? lastSync.toLocaleString() : 'Never',
          'time',
          '#3b82f6'
        )}

        {renderStatusCard(
          'Pending Sync',
          `${pendingSync.length} items`,
          'sync',
          pendingSync.length > 0 ? '#f59e0b' : '#22c55e'
        )}

        {renderStatusCard(
          'Sync Status',
          syncInProgress ? 'Syncing...' : isOnline ? 'Ready' : 'Offline',
          syncInProgress ? 'hourglass' : isOnline ? 'checkmark-circle' : 'close-circle',
          syncInProgress ? '#f59e0b' : isOnline ? '#22c55e' : '#ef4444'
        )}
      </View>

      {/* Offline Data */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Offline Data</Text>
        
        {renderDataCard(
          'Sensor Data',
          offlineData.sensorData,
          'thermometer'
        )}

        {renderDataCard(
          'Carbon Entries',
          offlineData.carbonEntries,
          'leaf'
        )}

        {renderDataCard(
          'User Settings',
          Object.keys(offlineData.userSettings),
          'settings'
        )}
      </View>

      {/* Pending Sync Items */}
      {pendingSync.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pending Sync Items</Text>
          {pendingSync.slice(0, 5).map((item, index) => (
            <View key={item.id} style={styles.pendingItem}>
              <View style={styles.pendingHeader}>
                <Ionicons name="cloud-upload" size={16} color="#f59e0b" />
                <Text style={styles.pendingAction}>{item.action}</Text>
                <Text style={styles.pendingTime}>
                  {new Date(item.timestamp).toLocaleTimeString()}
                </Text>
              </View>
              {item.retryCount > 0 && (
                <Text style={styles.retryText}>
                  Retry count: {item.retryCount}
                </Text>
              )}
            </View>
          ))}
          {pendingSync.length > 5 && (
            <Text style={styles.moreItemsText}>
              +{pendingSync.length - 5} more items
            </Text>
          )}
        </View>
      )}

      {/* Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        
        <TouchableOpacity
          style={[
            styles.actionButton,
            (!isOnline || pendingSync.length === 0 || syncInProgress) && styles.actionButtonDisabled
          ]}
          onPress={syncOfflineData}
          disabled={!isOnline || pendingSync.length === 0 || syncInProgress}
        >
          <Ionicons name="sync" size={20} color="#ffffff" />
          <Text style={styles.actionButtonText}>
            {syncInProgress ? 'Syncing...' : 'Sync Now'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonSecondary]}
          onPress={simulateOfflineAction}
        >
          <Ionicons name="add-circle" size={20} color="#22c55e" />
          <Text style={[styles.actionButtonText, { color: '#22c55e' }]}>
            Simulate Offline Action
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonDanger]}
          onPress={clearOfflineData}
        >
          <Ionicons name="trash" size={20} color="#ef4444" />
          <Text style={[styles.actionButtonText, { color: '#ef4444' }]}>
            Clear Offline Data
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tips */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Offline Sync Tips</Text>
        <View style={styles.tipsCard}>
          <Text style={styles.tipText}>
            • Data is automatically saved offline when you're disconnected
          </Text>
          <Text style={styles.tipText}>
            • Sync happens automatically when connection is restored
          </Text>
          <Text style={styles.tipText}>
            • Failed syncs are retried up to 3 times
          </Text>
          <Text style={styles.tipText}>
            • You can manually sync by tapping "Sync Now"
          </Text>
          <Text style={styles.tipText}>
            • Offline data is stored securely on your device
          </Text>
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
  offlineText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 8,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  statusCard: {
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
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  statusValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  dataCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dataHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dataTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
  dataCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  dataPreview: {
    marginTop: 8,
  },
  dataPreviewText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  pendingItem: {
    backgroundColor: '#ffffff',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  pendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pendingAction: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
  pendingTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  retryText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
  moreItemsText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#22c55e',
  },
  actionButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  actionButtonSecondary: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#22c55e',
  },
  actionButtonDanger: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
  },
  tipsCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tipText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    lineHeight: 20,
  },
});

export default MobileOfflineSync;
