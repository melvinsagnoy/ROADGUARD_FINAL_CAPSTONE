import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native'; // Import useColorScheme

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

const AuthNavigator = () => {
  const [initialRoute, setInitialRoute] = useState('Landing'); // Default route
  const [isLoading, setIsLoading] = useState(true); // Loading state

  useEffect(() => {
    const checkUserLoggedIn = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          setInitialRoute('VerificationOptions'); // Redirect to verification if user is logged in
        } else {
          setInitialRoute('Landing'); // Otherwise, start with the Landing screen
        }
      } catch (error) {
        console.error('Error checking user login status:', error);
        setInitialRoute('Landing'); // Default to Landing screen in case of error
      } finally {
        setIsLoading(false); // Set loading to false after checking
      }
    };

    checkUserLoggedIn();
  }, []);

  if (isLoading) {
    return null; // Optionally return a loading indicator while checking user status
  }

  return (
    <NavigationContainer>
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
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AuthNavigator;
