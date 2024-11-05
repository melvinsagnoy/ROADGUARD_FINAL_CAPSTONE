import React, { useState, useEffect } from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FloatingButton from '../screens/FloatingButton'; // Import FloatingButton
import ChatbotModal from '../screens/ChatbotModal'; // Import ChatbotModal

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
import ChangePasscodeScreen from '../screens/privacy_security/ChangePasscodeScreen';
import NotificationChannelsScreen from '../screens/privacy_security/NotificationChannelsScreen';

const Stack = createStackNavigator();

const AuthNavigator = () => {
  const [initialRoute, setInitialRoute] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showFloatingButton, setShowFloatingButton] = useState(false); // State to control button visibility
  const [isChatbotVisible, setIsChatbotVisible] = useState(false); // State to control chatbot modal visibility

  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    const checkUserLoggedIn = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          setInitialRoute('VerificationOptions');
        } else {
          setInitialRoute('Landing');
        }
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
    // Listen to navigation state changes to update the floating button visibility
    const unsubscribe = navigationRef?.addListener('state', () => {
      const currentRoute = navigationRef?.getCurrentRoute()?.name;

      // List of screens where the button should not be shown
      const screensWithoutFloatingButton = [
        'Landing',
        'Login',
        'Register',
        'ProfileUpdate',
        'Fingerprint',
        'Passcode',
        'VerificationOptions',
        'PasscodeVerificationScreen'
      ];

      if (screensWithoutFloatingButton.includes(currentRoute)) {
        setShowFloatingButton(false);
      } else {
        setShowFloatingButton(true);
      }
    });

    return () => unsubscribe();
  }, [navigationRef]);

  if (isLoading) {
    return null; // Optionally, return a loading indicator here
  }


  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator initialRouteName={initialRoute}>
        <Stack.Screen
          name="Landing"
          component={LandingScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ProfileUpdate"
          component={ProfileUpdateScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Search"
          component={SearchScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Add"
          component={AddScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Notifications"
          component={NotificationsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Fingerprint"
          component={FingerprintVerification}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Passcode"
          component={PasscodeInputScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="VerificationOptions"
          component={VerificationOptionsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="PasscodeVerificationScreen"
          component={PasscodeVerificationScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="GameScreen"
          component={GameScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SubscriptionScreen"
          component={SubscriptionScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="EditPostModal"
          component={EditPostModal}
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen
          name="ChatList"
          component={ChatListScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ChatScreen"
          component={ChatScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="PostDetail"
          component={PostDetail}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="DrivingModeScreen"
          component={DrivingModeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="PrivacySecurityScreen"
          component={PrivacySecurityScreen}
          options={{ headerShown: false }}
        />
         <Stack.Screen name="ChangePasscode"
          component={ChangePasscodeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="NotificationChannels"
          component={NotificationChannelsScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
      {/* Conditionally render the FloatingButton based on currentRoute */}
      {showFloatingButton && (
        <FloatingButton 
        onPress={() => {
          console.log('Floating Button Clicked'); // Debugging log
          setIsChatbotVisible(true); // Show the chatbot modal when button is clicked
        }} 
      />
    )}

      {/* Chatbot Modal for AI Interaction */}
      <ChatbotModal
        visible={isChatbotVisible}
        onClose={() => {
          console.log('Chatbot Modal closing...'); // Debugging log
          setIsChatbotVisible(false);
        }}
      />
    </NavigationContainer>
  );
};

export default AuthNavigator;