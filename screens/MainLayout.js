import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigationState } from '@react-navigation/native';
import AuthNavigator from '../navigation/AuthNavigator';
import NavBar from './NavBar';
import LoadingScreen from './LoadingScreen';

const MainLayout = () => {
  const [activeNav, setActiveNav] = useState('Home');
  const [loading, setLoading] = useState(true);

  // Get the current route name from the navigation state
  const currentRouteName = useNavigationState(state => state?.routes[state.index]?.name);

  // Determine if the NavBar should be displayed based on the current screen
  const shouldShowNavBar = ['Home', 'Search', 'Notifications', 'Profile'].includes(currentRouteName);

  // Sync activeNav with the current route name whenever the route changes
  useEffect(() => {
    if (currentRouteName) {
      console.log(`MainLayout - Current Route: ${currentRouteName}`);
      setActiveNav(currentRouteName); // Set active navigation state to the current route name
    }
  }, [currentRouteName]);

  // Simulate a loading period
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  // If loading, show the loading screen
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <AuthNavigator activeNav={activeNav} setActiveNav={setActiveNav} />
      </View>
      {shouldShowNavBar && (
        <View style={styles.navBarContainer}>
          <NavBar activeNav={activeNav} setActiveNav={setActiveNav} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  navBarContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
});

export default MainLayout;
