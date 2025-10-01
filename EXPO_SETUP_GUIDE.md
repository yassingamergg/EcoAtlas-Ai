# EcoAtlas AI - Mobile App Setup Guide

This guide will help you run the EcoAtlas AI mobile app with enhanced mobile features.

## 🚀 **NEW: Enhanced Mobile Features**

### **📱 Mobile-Optimized Components**
- **MobileOptimizedSensors**: Swipe gestures, pull-to-refresh, optimized charts
- **MobileCarbonCalculator**: Touch-friendly interface, modal forms, visual feedback
- **MobileNotifications**: Push notifications, alert management, test notifications
- **MobileOfflineSync**: Offline data storage, automatic sync, conflict resolution

### **🎯 Key Mobile Improvements**
- **Gesture Support**: Swipe between devices, pull-to-refresh
- **Offline Capability**: Data syncs when connection restored
- **Push Notifications**: Real-time alerts for sensors and carbon data
- **Touch Optimization**: Larger touch targets, better spacing
- **Performance**: Optimized for mobile devices

## Prerequisites

1. **Node.js** (version 16 or higher)
2. **Expo CLI** - Install globally: `npm install -g @expo/cli`
3. **Expo Go app** on your mobile device:
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

## Installation Steps

### 1. Install Dependencies

```bash
# Install all required dependencies
npm install

# If you encounter any issues, try clearing the cache
npm cache clean --force
```

### 2. Start the Expo Development Server

```bash
# Start the Expo development server
npm start

# Or use the Expo CLI directly
npx expo start
```

### 3. Connect Your Device

#### Option A: QR Code (Recommended)
1. Open the Expo Go app on your mobile device
2. Scan the QR code displayed in your terminal or browser
3. The app will load on your device

#### Option B: Development Build
1. Press `i` for iOS simulator (requires Xcode on macOS)
2. Press `a` for Android emulator (requires Android Studio)
3. Press `w` to open in web browser

### 4. Development Commands

```bash
# Start with specific platform
npm run ios      # iOS simulator
npm run android  # Android emulator
npm run web      # Web browser

# Clear cache and restart
npx expo start --clear
```

## 📱 **Mobile App Features**

### ✅ **Enhanced Mobile Features**
- **Dashboard**: Real-time stats, quick actions, recent activity
- **IoT Sensors**: Swipe gestures, device switching, optimized charts
- **Carbon Calculator**: Touch-friendly forms, visual feedback, category selection
- **Notifications**: Push notifications, alert management, test notifications
- **Offline Sync**: Automatic sync, conflict resolution, offline data storage
- **Settings**: Theme toggle, notification preferences, data management

### 🔄 **Mobile-Optimized Components**
- **React Native Components**: All UI components optimized for mobile
- **Navigation**: Bottom tab navigation with icons
- **Charts**: react-native-chart-kit with mobile-optimized styling
- **Storage**: AsyncStorage for offline data persistence
- **Styling**: StyleSheet with responsive design
- **Gestures**: Swipe, pull-to-refresh, touch interactions

### 🆕 **New Mobile Features**
- **Push Notifications**: Real-time alerts for sensor data and carbon footprint
- **Offline Support**: Data syncs automatically when connection restored
- **Gesture Controls**: Swipe between devices, pull-to-refresh
- **Touch Optimization**: Larger buttons, better spacing, haptic feedback
- **Performance**: Optimized for mobile devices and battery life

## Troubleshooting

### Common Issues

1. **Metro bundler issues**:
   ```bash
   npx expo start --clear
   ```

2. **Dependency conflicts**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Expo Go connection issues**:
   - Ensure your device and computer are on the same network
   - Try using the tunnel option: `npx expo start --tunnel`

4. **Chart rendering issues**:
   - Charts require react-native-svg which is included
   - If charts don't render, try restarting the development server

### Platform-Specific Notes

#### iOS
- Requires iOS 11.0 or higher
- Some features may require physical device testing

#### Android
- Requires Android 5.0 (API level 21) or higher
- Ensure USB debugging is enabled for physical device testing

## Backend Integration

The app is configured to connect to your existing backend:

- **API Base URL**: `http://localhost:3001/api` (development)
- **Authentication**: JWT token-based authentication
- **Storage**: AsyncStorage for token persistence

To connect to your backend:
1. Ensure your backend server is running on port 3001
2. Update the API_BASE_URL in `src/contexts/AuthContext.js` if needed
3. The app will automatically connect to your authentication endpoints

## Next Steps

1. **Test the app** in Expo Go on your device
2. **Customize the UI** by modifying the styles in `src/App.js`
3. **Add more features** using React Native components
4. **Integrate with your backend** for real data
5. **Build for production** when ready

## Building for Production

When you're ready to build for app stores:

```bash
# Build for iOS
npx expo build:ios

# Build for Android
npx expo build:android

# Or use EAS Build (recommended)
npx eas build --platform all
```

## Support

If you encounter any issues:
1. Check the [Expo documentation](https://docs.expo.dev/)
2. Review the [React Native documentation](https://reactnative.dev/)
3. Check the console logs in your terminal for error messages

The app is now ready to run in Expo Go! 🚀


