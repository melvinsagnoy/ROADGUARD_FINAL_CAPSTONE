import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as Notifications from 'expo-notifications';

const WeatherHeader = ({ apiKey, latitude, longitude }) => {
  const [temperature, setTemperature] = useState('');
  const [condition, setCondition] = useState('');
  const [icon, setIcon] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    fetchWeather();
    fetchLocation();
  }, []);

  const fetchWeather = async () => {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`;
  try {
    const response = await axios.get(url);
    const { temp } = response.data.main;
    const { main, icon } = response.data.weather[0];
    const { name } = response.data;

    // Update the states individually
    setTemperature(`${Math.round(temp)}°C`);
    setCondition(main);
    setIcon(`http://openweathermap.org/img/wn/${icon}.png`);
    setLocation(name);

    // Schedule a local notification
    Notifications.scheduleNotificationAsync({
      content: {
        title: "Weather Update 🌤",
        body: `The current temperature in ${name} is ${Math.round(temp)}°C with ${main}.`,
        data: { data: 'goes here' },
      },
      trigger: null, // this shows the notification immediately
    });

  } catch (error) {
    console.error('Error fetching weather data:', error);
  }
};

  const fetchLocation = async () => {
    const googleMapsApiKey = 'AIzaSyACvMNE1lw18V00MT1wzRDW1vDlofnOZbw';
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${googleMapsApiKey}`;
    try {
      const response = await axios.get(url);
      const addressComponents = response.data.results[0].address_components;
      const city = addressComponents.find(component => component.types.includes("locality"))?.long_name;
      setLocation(city || 'Location not available');
    } catch (error) {
      console.error('Error fetching location:', error);
      setLocation('Location not available');
    }
  };

  const getWeatherIcon = (iconCode) => {
    const iconName = iconCodeMapping(iconCode) || 'weather-sunny'; // Default to sunny if no match found
    return <Icon name={iconName} size={50} color="#000" />;
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
      case '10d': return 'weather-rainy';
      case '10n': return 'weather-rainy';
      case '11d':
      case '11n': return 'weather-lightning';
      case '13d':
      case '13n': return 'weather-snowy-heavy';
      case '50d':
      case '50n': return 'weather-fog';
      default: return null;
    }
  };

  return (
    <View style={styles.weatherContainer}>
      {getWeatherIcon(icon)}
      <View style={styles.textContainer}>
        <Text style={styles.temperatureText}>{temperature}</Text>
        <Text style={styles.conditionText}>{condition}</Text>
        <Text style={styles.locationText}>{location}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  weatherHeaderContainer: {
    paddingTop: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#dedede',
    top: 100,
    backgroundColor: '#f0f0f0' // Light background for visibility
  },
  weatherContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
  },
  textContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  weatherIcon: {
    width: 50,
    height: 50,
  },
  temperatureText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  conditionText: {
    fontSize: 16,
    color: '#333',
  },
  locationText: {
    fontSize: 14,
    color: '#555', // Slightly lighter text for the location
  },
});

export default WeatherHeader;
