// App.js
import React, { useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import SplashScreen from './src/screens/SplashScreen';
import WelcomeScreen from './src/screens/auth/WelcomeScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import ForgotPasswordFlow from './src/screens/auth/ForgotPasswordFlow';

// Role Dashboard Screens
import ElderlyHomeScreen from './src/screens/elderly/ElderlyHomeScreen';
import VolunteerHomeScreen from './src/screens/volunteer/VolunteerHomeScreen';
import CaregiverDashboard from './src/screens/caregiver/CaregiverDashboard';
import AdminDashboardScreen from './src/screens/admin/AdminDashboardScreen';

function MainNavigator() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [authScreen, setAuthScreen] = useState('Welcome'); // 'Welcome' | 'Login' | 'Register'

  // 1. Show Splash on initial startup
  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // 2. Show spinner while verifying stored token
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0D9488" />
      </View>
    );
  }

  // 3. Unauthenticated Stack
  if (!isAuthenticated || !user) {
    if (authScreen === 'Login') {
      return <LoginScreen onNavigate={setAuthScreen} />;
    }
    if (authScreen === 'Register') {
      return <RegisterScreen onNavigate={setAuthScreen} />;
    }
    if (authScreen === 'ForgotPassword') {
      return <ForgotPasswordFlow onBackToLogin={() => setAuthScreen('Login')} />;
    }
    return <WelcomeScreen onNavigate={setAuthScreen} />;
  }

  // 4. Role-Based Navigation Routing
  switch (user.role) {
    case 'volunteer':
      return <VolunteerHomeScreen />;
    case 'caregiver':
      return <CaregiverDashboard />;
    case 'admin':
      return <AdminDashboardScreen />;
    case 'elderly':
    default:
      return <ElderlyHomeScreen />;
  }
}

export default function App() {
  return (
    <AuthProvider>
      <MainNavigator />
    </AuthProvider>
  );
}