# 🚀 EcoAtlas AI - Launch Guide

This guide will help you launch your EcoAtlas AI mobile app with all the enhanced features.

## 📱 **Quick Launch (Recommended)**

### **Step 1: Start the Development Server**
```bash
# Navigate to your project directory
cd C:\Users\yassi\Desktop\MyProjects\ecoatlas-ai

# Start the Expo development server
npx expo start
```

### **Step 2: Connect Your Mobile Device**
1. **Install Expo Go** on your phone:
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Scan the QR Code**:
   - Open Expo Go app
   - Scan the QR code from your terminal
   - The app will load on your device

## 🎯 **Launch Options**

### **Option A: Mobile Device (Best Experience)**
```bash
# Start with QR code for mobile
npx expo start
```
- Scan QR code with Expo Go app
- Test all mobile features
- Test push notifications
- Test offline functionality

### **Option B: iOS Simulator (Mac Only)**
```bash
# Start iOS simulator
npx expo start --ios
```
- Requires Xcode installed
- Good for testing iOS-specific features
- No push notifications

### **Option C: Android Emulator**
```bash
# Start Android emulator
npx expo start --android
```
- Requires Android Studio installed
- Good for testing Android-specific features
- No push notifications

### **Option D: Web Browser**
```bash
# Start web version
npx expo start --web
```
- Limited mobile features
- Good for quick testing
- No native mobile features

## 🔧 **Backend Integration**

### **Start Backend Server (Optional)**
```bash
# In a new terminal window
cd backend
npm start
```
- Enables real sensor data
- Enables authentication
- Enables data persistence

### **Without Backend**
- App works with mock data
- All mobile features functional
- Offline sync works locally

## 📱 **Testing Your Enhanced Features**

### **1. Dashboard**
- ✅ Real-time stats display
- ✅ Theme toggle (dark/light mode)
- ✅ Quick action buttons
- ✅ Recent activity feed

### **2. IoT Sensors**
- ✅ Swipe left/right to switch devices
- ✅ Pull down to refresh data
- ✅ Touch sensor cards for details
- ✅ Connection status indicator

### **3. Carbon Calculator**
- ✅ Tap + button to add entries
- ✅ Select categories with touch
- ✅ Modal forms for data entry
- ✅ Visual charts and feedback

### **4. Notifications**
- ✅ Grant notification permissions
- ✅ Send test notifications
- ✅ Configure alert settings
- ✅ View notification history

### **5. Offline Sync**
- ✅ Turn off WiFi/cellular
- ✅ Add data while offline
- ✅ Turn network back on
- ✅ Watch automatic sync

### **6. Settings**
- ✅ Toggle dark/light theme
- ✅ Configure preferences
- ✅ Manage data and privacy

## 🎮 **Interactive Features to Test**

### **Gesture Controls**
```
1. Sensors Tab:
   - Swipe left/right to switch devices
   - Pull down to refresh data
   - Tap sensor cards for details

2. Calculator Tab:
   - Tap + button to add entries
   - Swipe on category buttons
   - Tap charts to interact

3. Any Tab:
   - Pull down to refresh
   - Tap and hold for context menus
   - Swipe gestures for navigation
```

### **Offline Testing**
```
1. Turn off device WiFi/cellular
2. Add sensor data or carbon entries
3. Navigate between tabs
4. Turn network back on
5. Watch data sync automatically
```

### **Push Notifications**
```
1. Go to Notifications tab
2. Grant permission when prompted
3. Tap "Test Notification"
4. Check notification appears
5. Configure different alert types
```

## 🚨 **Troubleshooting**

### **Common Issues**

#### **App Won't Load**
```bash
# Clear cache and restart
npx expo start --clear

# Or reset Metro bundler
npx expo start --reset-cache
```

#### **QR Code Not Working**
```bash
# Use tunnel mode
npx expo start --tunnel

# Or use LAN mode
npx expo start --lan
```

#### **Charts Not Displaying**
- Ensure you're on a physical device
- Charts may not render in simulators
- Check console for errors

#### **Notifications Not Working**
- Must test on physical device
- Check notification permissions
- Verify Expo Go app is up to date

### **Performance Issues**
```bash
# Clear all caches
npm cache clean --force
npx expo start --clear

# Reinstall dependencies
rm -rf node_modules
npm install
```

## 📊 **What You'll See**

### **Dashboard Screen**
- Real-time environmental stats
- Quick action buttons
- Recent activity feed
- Theme toggle button

### **Sensors Screen**
- Device connection status
- Swipeable device selector
- Sensor data cards with colors
- Interactive charts
- Pull-to-refresh

### **Calculator Screen**
- Total carbon footprint
- Category selection grid
- Add entry modal
- Visual charts
- Entry history

### **Notifications Screen**
- Push token display
- Notification settings
- Test notification buttons
- Alert type configuration
- Notification history

### **Sync Screen**
- Connection status
- Offline data storage
- Pending sync items
- Manual sync options
- Sync statistics

### **Settings Screen**
- Theme toggle
- App preferences
- Data management
- Privacy settings
- About information

## 🎯 **Success Indicators**

### **✅ App Launched Successfully**
- QR code appears in terminal
- Expo Go app loads the project
- All 6 tabs are visible
- No error messages in console

### **✅ Mobile Features Working**
- Swipe gestures respond
- Pull-to-refresh works
- Touch interactions are smooth
- Charts render correctly
- Notifications appear

### **✅ Offline Functionality**
- Data saves when offline
- Sync occurs when online
- No data loss
- Smooth transitions

## 🚀 **Next Steps After Launch**

1. **Test All Features**: Go through each tab and test functionality
2. **Test Gestures**: Try all swipe and touch interactions
3. **Test Offline**: Disconnect network and test offline features
4. **Test Notifications**: Send test notifications
5. **Customize**: Adjust settings and preferences
6. **Share**: Show others your enhanced mobile app!

## 📞 **Need Help?**

If you encounter issues:
1. Check the console for error messages
2. Try clearing cache with `npx expo start --clear`
3. Restart the development server
4. Check that Expo Go app is updated
5. Ensure your device and computer are on the same network

**Your EcoAtlas AI mobile app is ready to launch! 🎉**

Just run `npx expo start` and scan the QR code with Expo Go to see all your enhanced mobile features in action!


