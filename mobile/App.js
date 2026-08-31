import React, { useEffect, useRef } from 'react';
import { StatusBar, ActivityIndicator, View, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { usersAPI } from './src/services/api';
import { COLORS } from './src/theme';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import StudentDashboardScreen from './src/screens/StudentDashboardScreen';
import RequestDetailScreen from './src/screens/RequestDetailScreen';
import SupervisorDashboardScreen from './src/screens/SupervisorDashboardScreen';
import StaffDashboardScreen from './src/screens/StaffDashboardScreen';

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const AuthStack = createNativeStackNavigator();
const StudentStack = createNativeStackNavigator();
const SupervisorStack = createNativeStackNavigator();
const StaffStack = createNativeStackNavigator();

function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.bgPrimary },
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
    </AuthStack.Navigator>
  );
}

function StudentNavigator() {
  return (
    <StudentStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.bgSecondary },
        headerTintColor: COLORS.textPrimary,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: COLORS.bgPrimary },
      }}
    >
      <StudentStack.Screen
        name="StudentDashboard"
        component={StudentDashboardScreen}
        options={{ headerShown: false }}
      />
      <StudentStack.Screen
        name="RequestDetail"
        component={RequestDetailScreen}
        options={{ title: 'Request Details' }}
      />
    </StudentStack.Navigator>
  );
}

function SupervisorNavigator() {
  return (
    <SupervisorStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.bgPrimary },
      }}
    >
      <SupervisorStack.Screen name="SupervisorDashboard" component={SupervisorDashboardScreen} />
    </SupervisorStack.Navigator>
  );
}

function StaffNavigator() {
  return (
    <StaffStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.bgPrimary },
      }}
    >
      <StaffStack.Screen name="StaffDashboard" component={StaffDashboardScreen} />
    </StaffStack.Navigator>
  );
}

function AppContent() {
  const { user, loading } = useAuth();
  const notificationListener = useRef();
  const responseListener = useRef();

  // Register for push notifications when user logs in
  useEffect(() => {
    if (!user) return;

    const registerPushNotifications = async () => {
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          console.log('Push notification permission not granted');
          return;
        }

        // Set notification channel for Android
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'CleanTrack',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#7c5cfc',
          });
        }

        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: 'cleantrack-mobile',
        });

        // Send token to backend
        await usersAPI.updatePushToken(tokenData.data);
        console.log('Push token registered:', tokenData.data);
      } catch (err) {
        console.error('Push notification registration error:', err);
      }
    };

    registerPushNotifications();

    // Listen for incoming notifications
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
    });

    // Listen for notification taps
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification tapped:', response);
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [user]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bgPrimary }}>
        <ActivityIndicator size="large" color={COLORS.accentPrimary} />
      </View>
    );
  }

  if (!user) {
    return <AuthNavigator />;
  }

  switch (user.role) {
    case 'STUDENT':
      return <StudentNavigator />;
    case 'SUPERVISOR':
      return <SupervisorNavigator />;
    case 'STAFF':
      return <StaffNavigator />;
    default:
      return <AuthNavigator />;
  }
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer
        theme={{
          dark: true,
          colors: {
            primary: COLORS.accentPrimary,
            background: COLORS.bgPrimary,
            card: COLORS.bgSecondary,
            text: COLORS.textPrimary,
            border: COLORS.borderLight,
            notification: COLORS.accentPrimary,
          },
        }}
      >
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bgPrimary} />
        <AppContent />
      </NavigationContainer>
    </AuthProvider>
  );
}
