import React, { useState, useEffect } from 'react';
import { useNavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FloatingButton from '../screens/FloatingButton';
import ChatbotModal from '../screens/ChatbotModal';

// Import screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import LandingScreen from '../screens/LandingScreen';
import SearchScreen from '../screens/SearchScreen';
import AddScreen from '../screens/AddScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import FingerprintVerification from '../screens/FingerprintVerification';
import PasscodeInputScreen from '../screens/PasscodeInputScreen';
import VerificationOptionsScreen from '../screens/VerificationOptionsScreen';
import PasscodeVerificationScreen from '../screens/PasscodeVerificationScreen';
import GameScreen from '../screens/GameScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import EditPostModal from '../screens/EditPostModal';
import ProfileUpdateScreen from '../screens/ProfileUpdateScreen';
import ChatListScreen from '../screens/ChatListScreen';
import ChatScreen from '../screens/ChatScreen';
import PostDetail from '../screens/PostDetail';
import DrivingModeScreen from '../screens/DrivingModeScreen';
import PrivacySecurityScreen from '../screens/PrivacySecurityScreen';

const Stack = createStackNavigator();

const AuthNavigator = ({ activeNav, setActiveNav }) => {
  const [initialRoute, setInitialRoute] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showFloatingButton, setShowFloatingButton] = useState(false);
  const [isChatbotVisible, setIsChatbotVisible] = useState(false);

  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    const checkUserLoggedIn = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        setInitialRoute(userData ? 'VerificationOptions' : 'Landing');
      } catch (error) {
        console.error('Error checking user login status:', error);
        setInitialRoute('Landing');
      } finally {
        setIsLoading(false);
      }
    };

    checkUserLoggedIn();
  }, []);

  useEffect(() => {
    const unsubscribe = navigationRef?.addListener('state', () => {
      const currentRoute = navigationRef?.getCurrentRoute()?.name;
      console.log(`Current Route in AuthNavigator: ${currentRoute}`);

      // List of screens where the floating button should not be shown
      const screensWithoutFloatingButton = [
        'Landing',
        'Login',
        'Register',
        'ProfileUpdate',
        'Fingerprint',
        'Passcode',
        'VerificationOptions',
        'PasscodeVerificationScreen',
      ];

      if (screensWithoutFloatingButton.includes(currentRoute)) {
        setShowFloatingButton(false);
      } else {
        setShowFloatingButton(true);
      }

      // Only update the activeNav state when it changes
      if (currentRoute && currentRoute !== activeNav) {
        console.log(`Setting ActiveNav to: ${currentRoute}`);
        setActiveNav(currentRoute);
      }
    });

    return () => unsubscribe();
  }, [navigationRef, activeNav, setActiveNav]);

  if (isLoading || !initialRoute) {
    return null; // Optionally, return a loading indicator here
  }

  return (
    <Stack.Navigator initialRouteName={initialRoute}>
      <Stack.Screen name="Landing" component={LandingScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Home" options={{ headerShown: false }}>
        {(props) => <HomeScreen {...props} activeNav={activeNav} setActiveNav={setActiveNav} />}
      </Stack.Screen>
      <Stack.Screen name="Search" options={{ headerShown: false }}>
        {(props) => <SearchScreen {...props} activeNav={activeNav} setActiveNav={setActiveNav} />}
      </Stack.Screen>
      <Stack.Screen name="Add" options={{ headerShown: false }}>
        {(props) => <AddScreen {...props} activeNav={activeNav} setActiveNav={setActiveNav} />}
      </Stack.Screen>
      <Stack.Screen name="Notifications" options={{ headerShown: false }}>
        {(props) => <NotificationsScreen {...props} activeNav={activeNav} setActiveNav={setActiveNav} />}
      </Stack.Screen>
      <Stack.Screen name="Profile" options={{ headerShown: false }}>
        {(props) => <ProfileScreen {...props} activeNav={activeNav} setActiveNav={setActiveNav} />}
      </Stack.Screen>
      <Stack.Screen name="Fingerprint" component={FingerprintVerification} options={{ headerShown: false }} />
      <Stack.Screen name="Passcode" component={PasscodeInputScreen} options={{ headerShown: false }} />
      <Stack.Screen name="VerificationOptions" component={VerificationOptionsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="PasscodeVerificationScreen" component={PasscodeVerificationScreen} options={{ headerShown: false }} />
      <Stack.Screen name="GameScreen" component={GameScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SubscriptionScreen" component={SubscriptionScreen} options={{ headerShown: false }} />
      <Stack.Screen name="EditPostModal" component={EditPostModal} options={{ presentation: 'modal' }} />
      <Stack.Screen name="ChatList" component={ChatListScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ChatScreen" component={ChatScreen} options={{ headerShown: false }} />
      <Stack.Screen name="PostDetail" component={PostDetail} options={{ headerShown: false }} />
      <Stack.Screen name="DrivingModeScreen" component={DrivingModeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="PrivacySecurityScreen" component={PrivacySecurityScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
