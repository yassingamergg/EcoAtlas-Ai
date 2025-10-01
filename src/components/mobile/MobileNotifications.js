import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

const MobileNotifications = () => {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [sensorAlerts, setSensorAlerts] = useState(true);
  const [carbonAlerts, setCarbonAlerts] = useState(true);
  const [dailyReports, setDailyReports] = useState(false);
  const [weeklyReports, setWeeklyReports] = useState(true);

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => setExpoPushToken(token));

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log(response);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  const notificationListener = React.useRef();
  const responseListener = React.useRef();

  async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#22c55e',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        Alert.alert('Failed to get push token for push notification!');
        return;
      }
      token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log(token);
    } else {
      Alert.alert('Must use physical device for Push Notifications');
    }

    return token;
  }

  const sendTestNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "EcoAtlas AI Test",
        body: 'This is a test notification from EcoAtlas AI! 🌱',
        data: { data: 'goes here' },
      },
      trigger: { seconds: 2 },
    });
  };

  const scheduleDailyReport = async () => {
    if (dailyReports) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Daily Carbon Report",
          body: 'Check your daily carbon footprint summary 📊',
          data: { type: 'daily_report' },
        },
        trigger: {
          hour: 18,
          minute: 0,
          repeats: true,
        },
      });
    }
  };

  const scheduleWeeklyReport = async () => {
    if (weeklyReports) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Weekly Carbon Report",
          body: 'Your weekly sustainability report is ready! 📈',
          data: { type: 'weekly_report' },
        },
        trigger: {
          weekday: 1,
          hour: 9,
          minute: 0,
          repeats: true,
        },
      });
    }
  };

  const sendSensorAlert = async (sensorType, value, threshold) => {
    if (sensorAlerts) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Sensor Alert: ${sensorType}`,
          body: `${sensorType} level is ${value} (threshold: ${threshold})`,
          data: { type: 'sensor_alert', sensor: sensorType },
        },
        trigger: null, // Send immediately
      });
    }
  };

  const sendCarbonAlert = async (message) => {
    if (carbonAlerts) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Carbon Footprint Alert",
          body: message,
          data: { type: 'carbon_alert' },
        },
        trigger: null, // Send immediately
      });
    }
  };

  const clearAllNotifications = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    Alert.alert('Success', 'All scheduled notifications have been cleared');
  };

  const renderNotificationCard = (title, description, enabled, onToggle, icon) => (
    <View style={styles.notificationCard}>
      <View style={styles.notificationHeader}>
        <View style={styles.notificationIcon}>
          <Ionicons name={icon} size={24} color="#22c55e" />
        </View>
        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle}>{title}</Text>
          <Text style={styles.notificationDescription}>{description}</Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={onToggle}
          trackColor={{ false: '#d1d5db', true: '#bbf7d0' }}
          thumbColor={enabled ? '#22c55e' : '#f3f4f6'}
        />
      </View>
    </View>
  );

  const renderActionButton = (title, onPress, icon, color = '#22c55e') => (
    <TouchableOpacity style={[styles.actionButton, { borderColor: color }]} onPress={onPress}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[styles.actionButtonText, { color }]}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Push Token Display */}
      {expoPushToken && (
        <View style={styles.tokenCard}>
          <Text style={styles.tokenTitle}>Push Token</Text>
          <Text style={styles.tokenText} numberOfLines={2}>
            {expoPushToken}
          </Text>
        </View>
      )}

      {/* Notification Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Settings</Text>
        
        {renderNotificationCard(
          'Push Notifications',
          'Receive push notifications from EcoAtlas AI',
          notificationsEnabled,
          setNotificationsEnabled,
          'notifications'
        )}

        {renderNotificationCard(
          'Sensor Alerts',
          'Get notified when sensor readings exceed thresholds',
          sensorAlerts,
          setSensorAlerts,
          'warning'
        )}

        {renderNotificationCard(
          'Carbon Alerts',
          'Receive alerts about your carbon footprint',
          carbonAlerts,
          setCarbonAlerts,
          'leaf'
        )}

        {renderNotificationCard(
          'Daily Reports',
          'Get daily carbon footprint summaries',
          dailyReports,
          (value) => {
            setDailyReports(value);
            if (value) {
              scheduleDailyReport();
            }
          },
          'calendar'
        )}

        {renderNotificationCard(
          'Weekly Reports',
          'Receive weekly sustainability reports',
          weeklyReports,
          (value) => {
            setWeeklyReports(value);
            if (value) {
              scheduleWeeklyReport();
            }
          },
          'bar-chart'
        )}
      </View>

      {/* Test Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test Notifications</Text>
        
        <View style={styles.actionGrid}>
          {renderActionButton(
            'Test Notification',
            sendTestNotification,
            'send',
            '#3b82f6'
          )}
          
          {renderActionButton(
            'Sensor Alert',
            () => sendSensorAlert('Temperature', '35°C', '30°C'),
            'thermometer',
            '#ef4444'
          )}
          
          {renderActionButton(
            'Carbon Alert',
            () => sendCarbonAlert('Your daily carbon footprint is above average'),
            'alert-circle',
            '#f59e0b'
          )}
          
          {renderActionButton(
            'Clear All',
            clearAllNotifications,
            'trash',
            '#ef4444'
          )}
        </View>
      </View>

      {/* Notification History */}
      {notification && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Last Notification</Text>
          <View style={styles.historyCard}>
            <Text style={styles.historyTitle}>
              {notification.request.content.title}
            </Text>
            <Text style={styles.historyBody}>
              {notification.request.content.body}
            </Text>
            <Text style={styles.historyDate}>
              {new Date(notification.date).toLocaleString()}
            </Text>
          </View>
        </View>
      )}

      {/* Notification Types */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Types</Text>
        
        <View style={styles.typeCard}>
          <View style={styles.typeItem}>
            <Ionicons name="thermometer" size={20} color="#ef4444" />
            <Text style={styles.typeText}>Temperature alerts</Text>
          </View>
          
          <View style={styles.typeItem}>
            <Ionicons name="water" size={20} color="#3b82f6" />
            <Text style={styles.typeText}>Humidity warnings</Text>
          </View>
          
          <View style={styles.typeItem}>
            <Ionicons name="leaf" size={20} color="#22c55e" />
            <Text style={styles.typeText}>Air quality alerts</Text>
          </View>
          
          <View style={styles.typeItem}>
            <Ionicons name="cloud" size={20} color="#8b5cf6" />
            <Text style={styles.typeText}>CO2 level warnings</Text>
          </View>
          
          <View style={styles.typeItem}>
            <Ionicons name="flash" size={20} color="#f59e0b" />
            <Text style={styles.typeText}>Power consumption alerts</Text>
          </View>
          
          <View style={styles.typeItem}>
            <Ionicons name="bar-chart" size={20} color="#06b6d4" />
            <Text style={styles.typeText}>Carbon footprint reports</Text>
          </View>
        </View>
      </View>

      {/* Tips */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tips</Text>
        <View style={styles.tipsCard}>
          <Text style={styles.tipText}>
            • Enable sensor alerts to stay informed about environmental conditions
          </Text>
          <Text style={styles.tipText}>
            • Daily reports help you track your carbon footprint progress
          </Text>
          <Text style={styles.tipText}>
            • Weekly reports provide insights for long-term sustainability goals
          </Text>
          <Text style={styles.tipText}>
            • Test notifications to ensure everything is working correctly
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
  tokenCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tokenTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  tokenText: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'monospace',
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
  notificationCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  notificationDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: (screenWidth - 48) / 2,
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  historyCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  historyBody: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  historyDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  typeCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  typeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  typeText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
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

export default MobileNotifications;
