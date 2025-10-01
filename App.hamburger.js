import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  Modal,
  Animated,
  StatusBar,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

// Import mobile-optimized components
import MobileOptimizedSensors from './src/components/mobile/MobileOptimizedSensors';
import MobileCarbonCalculator from './src/components/mobile/MobileCarbonCalculator';
import MobileNotifications from './src/components/mobile/MobileNotifications';
import MobileOfflineSync from './src/components/mobile/MobileOfflineSync';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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

// All tabs from your main website - organized by category
const tabs = [
  // Core Features
  { id: 'dashboard', name: 'Dashboard', icon: 'home', component: 'Dashboard', category: 'Core', color: '#22c55e' },
  { id: 'iot', name: 'IoT Sensors', icon: 'thermometer', component: 'IoTSensors', category: 'Core', color: '#3b82f6' },
  { id: 'tracker', name: 'Carbon Tracker', icon: 'leaf', component: 'CarbonCalculator', category: 'Core', color: '#16a34a' },
  
  // Analytics & Insights
  { id: 'reports', name: 'Reports', icon: 'bar-chart', component: 'ReportsInsights', category: 'Analytics', color: '#8b5cf6' },
  { id: 'advisor', name: 'AI Advisor', icon: 'brain', component: 'AIAdvisor', category: 'Analytics', color: '#f59e0b' },
  { id: 'goals', name: 'Goals & Rewards', icon: 'trophy', component: 'GoalsRewards', category: 'Analytics', color: '#ef4444' },
  
  // Community & Solutions
  { id: 'solutions', name: 'Solutions', icon: 'bulb', component: 'CarbonSolutions', category: 'Community', color: '#06b6d4' },
  { id: 'marketplace', name: 'Marketplace', icon: 'storefront', component: 'Marketplace', category: 'Community', color: '#f97316' },
  { id: 'community', name: 'Community', icon: 'people', component: 'Community', category: 'Community', color: '#84cc16' },
  
  // System & Support
  { id: 'notifications', name: 'Notifications', icon: 'notifications', component: 'Notifications', category: 'System', color: '#ec4899' },
  { id: 'sync', name: 'Offline Sync', icon: 'sync', component: 'OfflineSync', category: 'System', color: '#6366f1' },
  { id: 'integrations', name: 'Integrations', icon: 'link', component: 'Integrations', category: 'System', color: '#14b8a6' },
  { id: 'settings', name: 'Settings', icon: 'settings', component: 'Settings', category: 'System', color: '#6b7280' },
  
  // Help & Info
  { id: 'support', name: 'Support', icon: 'help-circle', component: 'Support', category: 'Help', color: '#0ea5e9' },
  { id: 'about', name: 'About', icon: 'information-circle', component: 'About', category: 'Help', color: '#64748b' },
];

// Dashboard Component
const Dashboard = () => {
  const theme = useTheme();
  const [stats, setStats] = useState({
    totalEmissions: 0,
    devicesOnline: 0,
    alertsActive: 0,
    lastUpdate: new Date(),
  });

  useEffect(() => {
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
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} showsVerticalScrollIndicator={false}>
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
  );
};

// Placeholder components for all tabs
const CarbonSolutions = () => {
  const theme = useTheme();
  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.placeholderContainer}>
        <Ionicons name="bulb" size={64} color={theme.colors.primary} />
        <Text style={[styles.placeholderTitle, { color: theme.colors.text }]}>
          Carbon Solutions
        </Text>
        <Text style={[styles.placeholderText, { color: theme.colors.textSecondary }]}>
          Discover sustainable solutions and reduction strategies for your carbon footprint.
        </Text>
      </View>
    </ScrollView>
  );
};

const ReportsInsights = () => {
  const theme = useTheme();
  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.placeholderContainer}>
        <Ionicons name="bar-chart" size={64} color={theme.colors.primary} />
        <Text style={[styles.placeholderTitle, { color: theme.colors.text }]}>
          Reports & Insights
        </Text>
        <Text style={[styles.placeholderText, { color: theme.colors.textSecondary }]}>
          Generate detailed reports and gain insights into your environmental impact.
        </Text>
      </View>
    </ScrollView>
  );
};

const GoalsRewards = () => {
  const theme = useTheme();
  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.placeholderContainer}>
        <Ionicons name="trophy" size={64} color={theme.colors.primary} />
        <Text style={[styles.placeholderTitle, { color: theme.colors.text }]}>
          Goals & Rewards
        </Text>
        <Text style={[styles.placeholderText, { color: theme.colors.textSecondary }]}>
          Set sustainability goals and earn rewards for your environmental achievements.
        </Text>
      </View>
    </ScrollView>
  );
};

const Marketplace = () => {
  const theme = useTheme();
  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.placeholderContainer}>
        <Ionicons name="storefront" size={64} color={theme.colors.primary} />
        <Text style={[styles.placeholderTitle, { color: theme.colors.text }]}>
          Marketplace
        </Text>
        <Text style={[styles.placeholderText, { color: theme.colors.textSecondary }]}>
          Browse and purchase sustainable products and services.
        </Text>
      </View>
    </ScrollView>
  );
};

const Community = () => {
  const theme = useTheme();
  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.placeholderContainer}>
        <Ionicons name="people" size={64} color={theme.colors.primary} />
        <Text style={[styles.placeholderTitle, { color: theme.colors.text }]}>
          Community
        </Text>
        <Text style={[styles.placeholderText, { color: theme.colors.textSecondary }]}>
          Connect with like-minded individuals and share your sustainability journey.
        </Text>
      </View>
    </ScrollView>
  );
};

const AIAdvisor = () => {
  const theme = useTheme();
  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.placeholderContainer}>
        <Ionicons name="brain" size={64} color={theme.colors.primary} />
        <Text style={[styles.placeholderTitle, { color: theme.colors.text }]}>
          AI Advisor
        </Text>
        <Text style={[styles.placeholderText, { color: theme.colors.textSecondary }]}>
          Get personalized AI-powered recommendations for reducing your carbon footprint.
        </Text>
      </View>
    </ScrollView>
  );
};

const Support = () => {
  const theme = useTheme();
  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.placeholderContainer}>
        <Ionicons name="help-circle" size={64} color={theme.colors.primary} />
        <Text style={[styles.placeholderTitle, { color: theme.colors.text }]}>
          Support
        </Text>
        <Text style={[styles.placeholderText, { color: theme.colors.textSecondary }]}>
          Get help and support for using EcoAtlas AI effectively.
        </Text>
      </View>
    </ScrollView>
  );
};

const Integrations = () => {
  const theme = useTheme();
  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.placeholderContainer}>
        <Ionicons name="link" size={64} color={theme.colors.primary} />
        <Text style={[styles.placeholderTitle, { color: theme.colors.text }]}>
          Integrations
        </Text>
        <Text style={[styles.placeholderText, { color: theme.colors.textSecondary }]}>
          Connect with third-party services and devices for enhanced functionality.
        </Text>
      </View>
    </ScrollView>
  );
};

const Settings = () => {
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
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} showsVerticalScrollIndicator={false}>
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
        
        <View style={[styles.settingItem, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.settingLeft}>
            <Ionicons name="swap-horizontal" size={24} color={theme.colors.primary} />
            <View style={styles.settingText}>
              <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                Swipe Navigation
              </Text>
              <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
                Enable swipe gestures between tabs
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.toggleButton, { backgroundColor: swipeEnabled ? theme.colors.primary : theme.colors.border }]}
            onPress={() => setSwipeEnabled(!swipeEnabled)}
          >
            <View style={[styles.toggleThumb, { 
              backgroundColor: '#ffffff',
              transform: [{ translateX: swipeEnabled ? 20 : 2 }]
            }]} />
          </TouchableOpacity>
        </View>
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
  );
};

const About = () => {
  const theme = useTheme();
  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.placeholderContainer}>
        <Ionicons name="information-circle" size={64} color={theme.colors.primary} />
        <Text style={[styles.placeholderTitle, { color: theme.colors.text }]}>
          About EcoAtlas AI
        </Text>
        <Text style={[styles.placeholderText, { color: theme.colors.textSecondary }]}>
          Learn more about our mission to help individuals and organizations reduce their environmental impact.
        </Text>
      </View>
    </ScrollView>
  );
};

// Main App Component
const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [expoPushToken, setExpoPushToken] = useState('');
  const [swipeEnabled, setSwipeEnabled] = useState(true);
  const theme = useTheme();
  
  // Swipe functionality
  const translateX = useRef(new Animated.Value(0)).current;
  const currentIndex = useRef(0);

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => setExpoPushToken(token));
  }, []);

  // Update current index when activeTab changes
  useEffect(() => {
    const index = tabs.findIndex(tab => tab.id === activeTab);
    if (index !== -1) {
      currentIndex.current = index;
    }
  }, [activeTab]);

  // Swipe gesture handlers
  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX, velocityX } = event.nativeEvent;
      
      // Determine if swipe is significant enough
      const shouldSwipe = Math.abs(translationX) > screenWidth * 0.3 || Math.abs(velocityX) > 500;
      
      if (shouldSwipe && swipeEnabled) {
        if (translationX > 0 && currentIndex.current > 0) {
          // Swipe right - go to previous tab
          goToPreviousTab();
        } else if (translationX < 0 && currentIndex.current < tabs.length - 1) {
          // Swipe left - go to next tab
          goToNextTab();
        } else {
          // Reset position
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      } else {
        // Reset position
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  const goToNextTab = () => {
    if (currentIndex.current < tabs.length - 1) {
      const nextIndex = currentIndex.current + 1;
      const nextTab = tabs[nextIndex];
      setActiveTab(nextTab.id);
      currentIndex.current = nextIndex;
      
      // Animate transition
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
  };

  const goToPreviousTab = () => {
    if (currentIndex.current > 0) {
      const prevIndex = currentIndex.current - 1;
      const prevTab = tabs[prevIndex];
      setActiveTab(prevTab.id);
      currentIndex.current = prevIndex;
      
      // Animate transition
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
  };

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

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'iot':
        return <MobileOptimizedSensors />;
      case 'tracker':
        return <MobileCarbonCalculator />;
      case 'solutions':
        return <CarbonSolutions />;
      case 'reports':
        return <ReportsInsights />;
      case 'goals':
        return <GoalsRewards />;
      case 'marketplace':
        return <Marketplace />;
      case 'community':
        return <Community />;
      case 'advisor':
        return <AIAdvisor />;
      case 'support':
        return <Support />;
      case 'integrations':
        return <Integrations />;
      case 'settings':
        return <Settings />;
      case 'about':
        return <About />;
      case 'notifications':
        return <MobileNotifications />;
      case 'sync':
        return <MobileOfflineSync />;
      default:
        return <Dashboard />;
    }
  };

  const MenuItem = ({ tab, isActive }) => (
    <TouchableOpacity
      style={[
        styles.menuItem,
        { backgroundColor: theme.colors.surface },
        isActive && { 
          backgroundColor: tab.color + '15',
          borderLeftWidth: 4,
          borderLeftColor: tab.color,
        }
      ]}
      onPress={() => {
        setActiveTab(tab.id);
        setIsMenuOpen(false);
      }}
    >
      <View style={styles.menuItemLeft}>
        <View style={[
          styles.menuItemIcon,
          { backgroundColor: isActive ? tab.color + '20' : theme.colors.background }
        ]}>
          <Ionicons 
            name={tab.icon} 
            size={20} 
            color={isActive ? tab.color : theme.colors.textSecondary} 
          />
        </View>
        <View style={styles.menuItemTextContainer}>
          <Text style={[
            styles.menuItemText,
            { color: isActive ? theme.colors.text : theme.colors.text }
          ]}>
            {tab.name}
          </Text>
          <Text style={[
            styles.menuItemCategory,
            { color: theme.colors.textSecondary }
          ]}>
            {tab.category}
          </Text>
        </View>
      </View>
      {isActive && (
        <View style={[styles.activeIndicator, { backgroundColor: tab.color }]} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={[styles.swipeButton, currentIndex.current === 0 && styles.swipeButtonDisabled]}
              onPress={goToPreviousTab}
              disabled={currentIndex.current === 0}
            >
              <Ionicons
                name="chevron-back"
                size={20}
                color={currentIndex.current === 0 ? theme.colors.textSecondary : theme.colors.text}
              />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.themeButton}
              onPress={theme.toggleTheme}
            >
              <Ionicons
                name={theme.isDarkMode ? 'sunny' : 'moon'}
                size={24}
                color={theme.colors.text}
              />
            </TouchableOpacity>
          </View>
          
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              EcoAtlas AI
            </Text>
            <View style={styles.headerSubtitleContainer}>
              <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
                {tabs.find(tab => tab.id === activeTab)?.name || 'Dashboard'}
              </Text>
              <Text style={[styles.headerPageIndicator, { color: theme.colors.textSecondary }]}>
                {currentIndex.current + 1} / {tabs.length}
              </Text>
            </View>
          </View>
          
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={[styles.swipeButton, currentIndex.current === tabs.length - 1 && styles.swipeButtonDisabled]}
              onPress={goToNextTab}
              disabled={currentIndex.current === tabs.length - 1}
            >
              <Ionicons
                name="chevron-forward"
                size={20}
                color={currentIndex.current === tabs.length - 1 ? theme.colors.textSecondary : theme.colors.text}
              />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => setIsMenuOpen(true)}
            >
              <Ionicons name="menu" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Content with Swipe Support */}
        <PanGestureHandler
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onHandlerStateChange}
          enabled={swipeEnabled}
        >
          <Animated.View 
            style={[
              styles.content,
              {
                transform: [{ translateX }],
              }
            ]}
          >
            {renderContent()}
          </Animated.View>
        </PanGestureHandler>

        {/* Swipe Indicator */}
        <View style={[styles.swipeIndicator, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.swipeIndicatorContent}>
            <Ionicons name="swap-horizontal" size={16} color={theme.colors.textSecondary} />
            <Text style={[styles.swipeIndicatorText, { color: theme.colors.textSecondary }]}>
              Swipe to navigate
            </Text>
            <View style={styles.pageDots}>
              {tabs.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.pageDot,
                    {
                      backgroundColor: index === currentIndex.current 
                        ? theme.colors.primary 
                        : theme.colors.border
                    }
                  ]}
                />
              ))}
            </View>
          </View>
        </View>

        {/* Hamburger Menu Modal */}
        <Modal
          visible={isMenuOpen}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsMenuOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.menuContainer, { backgroundColor: theme.colors.background }]}>
              {/* Menu Header */}
              <View style={[styles.menuHeader, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.menuHeaderContent}>
                  <View style={styles.menuHeaderLeft}>
                    <View style={[styles.menuLogo, { backgroundColor: theme.colors.primary }]}>
                      <Ionicons name="leaf" size={24} color="#ffffff" />
                    </View>
                    <View>
                      <Text style={[styles.menuTitle, { color: theme.colors.text }]}>
                        EcoAtlas AI
                      </Text>
                      <Text style={[styles.menuSubtitle, { color: theme.colors.textSecondary }]}>
                        Environmental Intelligence
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.closeButton, { backgroundColor: theme.colors.background }]}
                    onPress={() => setIsMenuOpen(false)}
                  >
                    <Ionicons name="close" size={20} color={theme.colors.text} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Menu Items */}
              <ScrollView style={styles.menuContent} showsVerticalScrollIndicator={false}>
                {['Core', 'Analytics', 'Community', 'System', 'Help'].map((category) => (
                  <View key={category} style={styles.menuSection}>
                    <Text style={[styles.menuSectionTitle, { color: theme.colors.textSecondary }]}>
                      {category}
                    </Text>
                    {tabs
                      .filter(tab => tab.category === category)
                      .map((tab) => (
                        <MenuItem
                          key={tab.id}
                          tab={tab}
                          isActive={activeTab === tab.id}
                        />
                      ))}
                  </View>
                ))}
              </ScrollView>

              {/* Menu Footer */}
              <View style={[styles.menuFooter, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.menuFooterText, { color: theme.colors.textSecondary }]}>
                  Version 1.0.0
                </Text>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
      <ExpoStatusBar style="auto" />
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitleContainer: {
    alignItems: 'center',
    marginTop: 2,
  },
  headerSubtitle: {
    fontSize: 12,
  },
  headerPageIndicator: {
    fontSize: 10,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  swipeButton: {
    padding: 8,
    marginHorizontal: 2,
  },
  swipeButtonDisabled: {
    opacity: 0.3,
  },
  themeButton: {
    padding: 8,
    marginHorizontal: 4,
  },
  content: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  menuContainer: {
    width: screenWidth * 0.9,
    height: screenHeight,
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  menuHeader: {
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  menuHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  menuHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  menuSection: {
    marginBottom: 24,
  },
  menuSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemTextContainer: {
    flex: 1,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  menuItemCategory: {
    fontSize: 12,
    fontWeight: '500',
  },
  activeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  menuFooter: {
    padding: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  menuFooterText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginTop: 16,
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
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  placeholderText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
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
  swipeIndicator: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  swipeIndicatorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeIndicatorText: {
    fontSize: 12,
    marginLeft: 8,
    marginRight: 16,
  },
  pageDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pageDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 2,
  },
  toggleButton: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});

// Wrap the app with ThemeProvider
const AppWithTheme = () => (
  <ThemeProvider>
    <App />
  </ThemeProvider>
);

export default AppWithTheme;
