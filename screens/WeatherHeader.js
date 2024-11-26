import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform, useColorScheme } from 'react-native';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as Notifications from 'expo-notifications';
import { useFonts } from 'expo-font';

const WeatherHeader = ({ apiKey, latitude, longitude }) => {
  const [temperature, setTemperature] = useState('');
  const [condition, setCondition] = useState('');
  const [iconCode, setIconCode] = useState('');
  const [location, setLocation] = useState('');

  const { width } = Dimensions.get('window');
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const [fontsLoaded] = useFonts({
    'Poppins-Regular': require('../assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Bold': require('../assets/fonts/Poppins-Bold.ttf'),
  });
  // Define the themes
  const theme = {
    light: {
      backgroundColor: '#fff',
      textColor: '#333',
      conditionColor: '#4A90E2',
      locationColor: '#888',
    },
    dark: {
      backgroundColor: '#1c1c1c',
      textColor: '#e0e0e0',
      conditionColor: '#80c7ff',
      locationColor: '#bbbbbb',
    },
  };

  const currentTheme = isDarkMode ? theme.dark : theme.light;

  useEffect(() => {
    fetchWeather();
  }, [latitude, longitude]);

  const fetchWeather = async () => {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`;
    try {
      const response = await axios.get(url);
      const { temp } = response.data.main;
      const { main, icon } = response.data.weather[0];
      const name = response.data.name;

      setTemperature(`${Math.round(temp)}°C`);
      setCondition(main);
      setIconCode(icon);
      setLocation(name);

      sendWeatherNotification(name, temp, main);
    } catch (error) {
      console.error('Error fetching weather data:', error);
    }
  };

  const sendWeatherNotification = (name, temp, main) => {
    Notifications.scheduleNotificationAsync({
      content: {
        title: "Weather Update 🌤",
        body: `The current temperature in ${name} is ${Math.round(temp)}°C with ${main}.`,
      },
      trigger: null,
    });
  };

  const getWeatherIcon = (code) => {
    const iconName = iconCodeMapping(code);
    return <Icon name={iconName} size={width < 350 ? 40 : 60} color={currentTheme.conditionColor} style={styles.iconShadow} />;
  };

  const iconCodeMapping = (code) => {
    switch (code) {
      case '01d': return 'weather-sunny';
      case '01n': return 'weather-night';
      case '02d': return 'weather-partly-cloudy';
      case '02n': return 'weather-night-partly-cloudy';
      case '03d':
      case '03n': return 'weather-cloudy';
      case '04d':
      case '04n': return 'weather-cloudy-arrow-right';
      case '09d':
      case '09n': return 'weather-pouring';
      case '10d':
      case '10n': return 'weather-rainy';
      case '11d':
      case '11n': return 'weather-lightning';
      case '13d':
      case '13n': return 'weather-snowy-heavy';
      case '50d':
      case '50n': return 'weather-fog';
      default: return 'weather-sunny';
    }
  };

  return (
    <View style={[styles.weatherCard, { backgroundColor: currentTheme.backgroundColor}]}>
      <View style={styles.weatherContent}>
        {getWeatherIcon(iconCode)}
        <View style={styles.textContainer}>
          <Text style={[styles.temperatureText, { fontSize: width < 320 ? 20 : 20, color: currentTheme.textColor }]}>{temperature}</Text>
          <Text style={[styles.conditionText, { fontSize: width < 350 ? 13 : 13, color: currentTheme.conditionColor }]}>{condition}</Text>
          <Text style={[styles.locationText, { fontSize: width < 350 ? 13 : 13, color: currentTheme.locationColor }]}>{location}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  weatherCard: {
    borderRadius: 12,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    width: '75%',
    fontFamily: 'Poppins-Regular',
  },
  weatherContent: {
    flexDirection: 'row', // Align icon and text horizontally
    alignItems: 'center', // Vertically center the icon and text
  },
  textContainer: {
    marginLeft: 15, // Space between the icon and text
  },
  temperatureText: {
    fontSize: 5, // Adjusted font size for clarity
    fontFamily: 'Poppins-Bold',
  },
  conditionText: {
    fontSize: 14,
    marginTop: 3,
    fontFamily: 'Poppins-Regular',
  },
  locationText: {
    fontSize: 12,
    marginTop: 2,
    fontFamily: 'Poppins-Regular',
  },
  iconShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: Platform.OS === 'android' ? 4 : 0,
  },
});


export default WeatherHeader;
