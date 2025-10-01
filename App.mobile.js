import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

// Import mobile-optimized components
import MobileOptimizedSensors from './src/components/mobile/MobileOptimizedSensors';
import MobileCarbonCalculator from './src/components/mobile/MobileCarbonCalculator';
import MobileNotifications from './src/components/mobile/MobileNotifications';
import MobileOfflineSync from './src/components/mobile/MobileOfflineSync';

const { width: screenWidth } = Dimensions.get('window');
const Tab = createBottomTabNavigator();

// Push Notifications Configuration
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Theme Context
const ThemeContext = React.createContext();

const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const theme = {
    isDarkMode,
    toggleTheme,
    colors: {
      primary: '#22c55e',
      secondary: '#16a34a',
      background: isDarkMode ? '#111827' : '#f8fafc',
      surface: isDarkMode ? '#1f2937' : '#ffffff',
      text: isDarkMode ? '#f9fafb' : '#111827',
      textSecondary: isDarkMode ? '#d1d5db' : '#6b7280',
      border: isDarkMode ? '#374151' : '#e5e7eb',
    },
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

const useTheme = () => {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Dashboard Component
const DashboardScreen = () => {
  const theme = useTheme();
  const [stats, setStats] = useState({
    totalEmissions: 0,
    devicesOnline: 0,
    alertsActive: 0,
    lastUpdate: new Date(),
  });

  useEffect(() => {
    // Simulate real-time stats updates
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        totalEmissions: prev.totalEmissions + Math.random() * 0.1,
        devicesOnline: Math.floor(Math.random() * 5) + 1,
        alertsActive: Math.floor(Math.random() * 3),
        lastUpdate: new Date(),
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const StatCard = ({ title, value, icon, color = theme.colors.primary, subtitle }) => (
    <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.statHeader}>
        <Ionicons name={icon} size={24} color={color} />
        <Text style={[styles.statTitle, { color: theme.colors.text }]}>{title}</Text>
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      {subtitle && (
        <Text style={[styles.statSubtitle, { color: theme.colors.textSecondary }]}>
          {subtitle}
        </Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              EcoAtlas AI
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
              Environmental Monitoring Dashboard
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.themeButton, { backgroundColor: theme.colors.surface }]}
            onPress={theme.toggleTheme}
          >
            <Ionicons
              name={theme.isDarkMode ? 'sunny' : 'moon'}
              size={24}
              color={theme.colors.text}
            />
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Emissions"
            value={`${stats.totalEmissions.toFixed(2)} kg CO₂`}
            icon="leaf"
            color="#22c55e"
            subtitle="This month"
          />
          <StatCard
            title="Devices Online"
            value={stats.devicesOnline}
            icon="wifi"
            color="#3b82f6"
            subtitle="Active sensors"
          />
          <StatCard
            title="Active Alerts"
            value={stats.alertsActive}
            icon="warning"
            color="#f59e0b"
            subtitle="Requires attention"
          />
          <StatCard
            title="Last Update"
            value={stats.lastUpdate.toLocaleTimeString()}
            icon="time"
            color="#8b5cf6"
            subtitle="Real-time data"
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Quick Actions
          </Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.colors.surface }]}>
              <Ionicons name="refresh" size={24} color="#22c55e" />
              <Text style={[styles.actionText, { color: theme.colors.text }]}>Refresh Data</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.colors.surface }]}>
              <Ionicons name="notifications" size={24} color="#3b82f6" />
              <Text style={[styles.actionText, { color: theme.colors.text }]}>View Alerts</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.colors.surface }]}>
              <Ionicons name="share" size={24} color="#8b5cf6" />
              <Text style={[styles.actionText, { color: theme.colors.text }]}>Share Report</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.colors.surface }]}>
              <Ionicons name="settings" size={24} color="#6b7280" />
              <Text style={[styles.actionText, { color: theme.colors.text }]}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.recentActivity}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Recent Activity
          </Text>
          <View style={[styles.activityCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.activityItem}>
              <Ionicons name="thermometer" size={20} color="#ef4444" />
              <Text style={[styles.activityText, { color: theme.colors.text }]}>
                Temperature sensor updated: 24.5°C
              </Text>
              <Text style={[styles.activityTime, { color: theme.colors.textSecondary }]}>
                2m ago
              </Text>
            </View>
            
            <View style={styles.activityItem}>
              <Ionicons name="leaf" size={20} color="#22c55e" />
              <Text style={[styles.activityText, { color: theme.colors.text }]}>
                Carbon entry added: 2.3 kg CO₂
              </Text>
              <Text style={[styles.activityTime, { color: theme.colors.textSecondary }]}>
                5m ago
              </Text>
            </View>
            
            <View style={styles.activityItem}>
              <Ionicons name="wifi" size={20} color="#3b82f6" />
              <Text style={[styles.activityText, { color: theme.colors.text }]}>
                Device ESP32_001 connected
              </Text>
              <Text style={[styles.activityTime, { color: theme.colors.textSecondary }]}>
                10m ago
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Settings Screen
const SettingsScreen = () => {
  const theme = useTheme();

  const SettingItem = ({ title, subtitle, icon, onPress, rightElement }) => (
    <TouchableOpacity
      style={[styles.settingItem, { backgroundColor: theme.colors.surface }]}
      onPress={onPress}
    >
      <View style={styles.settingLeft}>
        <Ionicons name={icon} size={24} color={theme.colors.primary} />
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {rightElement || (
        <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.settingsHeader}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Settings
          </Text>
        </View>

        <View style={styles.settingsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            App Settings
          </Text>
          
          <SettingItem
            title="Theme"
            subtitle={theme.isDarkMode ? 'Dark mode' : 'Light mode'}
            icon="color-palette"
            onPress={theme.toggleTheme}
          />
          
          <SettingItem
            title="Notifications"
            subtitle="Manage push notifications"
            icon="notifications"
            onPress={() => {}}
          />
          
          <SettingItem
            title="Offline Sync"
            subtitle="Manage offline data"
            icon="cloud-sync"
            onPress={() => {}}
          />
        </View>

        <View style={styles.settingsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Data & Privacy
          </Text>
          
          <SettingItem
            title="Export Data"
            subtitle="Download your data"
            icon="download"
            onPress={() => {}}
          />
          
          <SettingItem
            title="Clear Cache"
            subtitle="Free up storage space"
            icon="trash"
            onPress={() => {}}
          />
          
          <SettingItem
            title="Privacy Policy"
            subtitle="Read our privacy policy"
            icon="shield-checkmark"
            onPress={() => {}}
          />
        </View>

        <View style={styles.settingsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            About
          </Text>
          
          <SettingItem
            title="Version"
            subtitle="1.0.0"
            icon="information-circle"
            onPress={() => {}}
          />
          
          <SettingItem
            title="Support"
            subtitle="Get help and support"
            icon="help-circle"
            onPress={() => {}}
          />
          
          <SettingItem
            title="Rate App"
            subtitle="Rate us on the app store"
            icon="star"
            onPress={() => {}}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Main App Component
const App = () => {
  const [expoPushToken, setExpoPushToken] = useState('');

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => setExpoPushToken(token));
  }, []);

  const registerForPushNotificationsAsync = async () => {
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
        console.log('Failed to get push token for push notification!');
        return;
      }
      token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('Expo push token:', token);
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    return token;
  };

  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              tabBarIcon: ({ focused, color, size }) => {
                let iconName;

                if (route.name === 'Dashboard') {
                  iconName = focused ? 'home' : 'home-outline';
                } else if (route.name === 'Sensors') {
                  iconName = focused ? 'thermometer' : 'thermometer-outline';
                } else if (route.name === 'Calculator') {
                  iconName = focused ? 'calculator' : 'calculator-outline';
                } else if (route.name === 'Notifications') {
                  iconName = focused ? 'notifications' : 'notifications-outline';
                } else if (route.name === 'Sync') {
                  iconName = focused ? 'sync' : 'sync-outline';
                } else if (route.name === 'Settings') {
                  iconName = focused ? 'settings' : 'settings-outline';
                }

                return <Ionicons name={iconName} size={size} color={color} />;
              },
              tabBarActiveTintColor: '#22c55e',
              tabBarInactiveTintColor: 'gray',
              tabBarStyle: {
                backgroundColor: '#ffffff',
                borderTopColor: '#e5e7eb',
                paddingBottom: Platform.OS === 'ios' ? 20 : 5,
                paddingTop: 5,
                height: Platform.OS === 'ios' ? 85 : 60,
              },
              headerShown: false,
            })}
          >
            <Tab.Screen name="Dashboard" component={DashboardScreen} />
            <Tab.Screen name="Sensors" component={MobileOptimizedSensors} />
            <Tab.Screen name="Calculator" component={MobileCarbonCalculator} />
            <Tab.Screen name="Notifications" component={MobileNotifications} />
            <Tab.Screen name="Sync" component={MobileOfflineSync} />
            <Tab.Screen name="Settings" component={SettingsScreen} />
          </Tab.Navigator>
        </NavigationContainer>
        <ExpoStatusBar style="auto" />
      </SafeAreaProvider>
    </ThemeProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  themeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  statCard: {
    width: (screenWidth - 48) / 2,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 12,
  },
  quickActions: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: (screenWidth - 48) / 2,
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  recentActivity: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  activityCard: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  activityText: {
    fontSize: 14,
    flex: 1,
    marginLeft: 12,
  },
  activityTime: {
    fontSize: 12,
  },
  settingsHeader: {
    padding: 20,
    paddingTop: 10,
  },
  settingsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  settingSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
});

export default App;
