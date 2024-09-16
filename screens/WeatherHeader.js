import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as Notifications from 'expo-notifications';

const WeatherHeader = ({ apiKey, latitude, longitude }) => {
  const [temperature, setTemperature] = useState('');
  const [condition, setCondition] = useState('');
  const [iconCode, setIconCode] = useState('');
  const [location, setLocation] = useState('');

  const { width } = Dimensions.get('window'); // Get screen width for responsive design

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

      // Send weather notification (optional)
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
        data: { data: 'goes here' },
      },
      trigger: null, // shows the notification immediately
    });
  };

  const getWeatherIcon = (code) => {
    const iconName = iconCodeMapping(code);
    return <Icon name={iconName} size={width < 350 ? 40 : 60} color="#4A90E2" style={styles.iconShadow} />;
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
      default: return 'weather-sunny'; // Default icon if no match
    }
  };

  return (
    <View style={[styles.weatherCard, { width: width - 50 }]}>
      <View style={styles.weatherContent}>
        {getWeatherIcon(iconCode)}
        <View style={styles.textContainer}>
          <Text style={[styles.temperatureText, { fontSize: width < 320 ? 32 : 29 }]}>{temperature}</Text>
          <Text style={[styles.conditionText, { fontSize: width < 350 ? 14 : 15 }]}>{condition}</Text>
          <Text style={[styles.locationText, { fontSize: width < 350 ? 12 : 14 }]}>{location}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  weatherCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    marginHorizontal: 10,
    marginVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height:2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  weatherContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    marginLeft: 15,
  },
  temperatureText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  conditionText: {
    fontSize: 14,
    color: '#4A90E2',
    marginTop: 3,
  },
  locationText: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  iconShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: Platform.OS === 'android' ? 4 : 0, // Slight elevation on Android
  },
});

export default WeatherHeader;
