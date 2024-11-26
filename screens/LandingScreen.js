import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ImageBackground, Animated } from 'react-native';
import { useFonts } from 'expo-font';
import { BlurView } from 'expo-blur';

const LandingScreen = ({ navigation }) => {
  const [fontsLoaded] = useFonts({
    Poppins: require('../assets/fonts/Poppins-Regular.ttf'), // Regular font
    'Poppins-Bold': require('../assets/fonts/Poppins-Bold.ttf'), // Bold font
  });

  const [loading, setLoading] = useState(true);
  const spinValue = new Animated.Value(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 3000);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!fontsLoaded || loading) {
    return (
      <ImageBackground source={require('../assets/background.jpg')} style={styles.background}>
        <BlurView intensity={50} style={styles.blurContainer}>
          <View style={styles.container}>
            <Animated.Image
              source={require('../assets/tire.png')}
              style={[styles.loadingIcon, { transform: [{ rotate: spin }] }]}
            />
          </View>
        </BlurView>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground source={require('../assets/background.jpg')} style={styles.background}>
      <BlurView intensity={50} style={styles.blurContainer}>
        <View style={styles.container}>
          <View style={styles.logoContainer}>
            <Image source={require('../assets/icon.png')} style={styles.logo} />
          </View>
          <TouchableOpacity
            style={styles.signInButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.buttonText}>LOGIN</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.signUpButton}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.buttonText}>REGISTER</Text>
          </TouchableOpacity>
        </View>
      </BlurView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  blurContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 50,
  },
  logo: {
    width: 150,
    height: 150,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  signInButton: {
    width: 200,
    height: 55,
    backgroundColor: '#E0C55B',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  signUpButton: {
    width: 200,
    height: 55,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    color: 'black',
    fontSize: 20,
    fontFamily: 'Poppins-Bold', // Use Poppins-Bold for bold text
  },
  loadingIcon: {
    width: 80,
    height: 80,
    marginBottom: 20,
  },
});

export default LandingScreen;
