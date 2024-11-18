import React, { useEffect } from 'react';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import AuthNavigator from './navigation/AuthNavigator';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import axios from 'axios';

const App = () => {
  useEffect(() => {
    requestNotificationPermissions();
    registerBackgroundFetchAsync();
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      handleNotificationClick(response.notification.request.content.data);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  async function requestNotificationPermissions() {
    const { status } = await Notifications.requestPermissionsAsync();
    console.log('Notification permissions status:', status);
  }

  async function registerBackgroundFetchAsync() {
    const TASK_NAME = 'background-weather-task';
    console.log('Registering task:', TASK_NAME);
    try {
      await BackgroundFetch.registerTaskAsync(TASK_NAME, {
        minimumInterval: 1800,  // in seconds (30 minutes)
        stopOnTerminate: false,
        startOnBoot: true,
      });
      console.log('Task registered successfully');
    } catch (error) {
      console.error('Error registering task:', error);
    }
  }

  TaskManager.defineTask('background-weather-task', async () => {
    try {
      const weather = await fetchWeather();
      await scheduleWeatherNotification(weather);
      return BackgroundFetch.BackgroundFetchResult.NewData;
    } catch (error) {
      console.error("Background Fetch Failed", error);
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
  });

  async function fetchWeather() {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=10.3157&lon=123.8854&units=metric&appid=YOUR_API_KEY`;
    try {
      const response = await axios.get(url);
      return {
        temperature: `${Math.round(response.data.main.temp)}°C`,
        condition: response.data.weather[0].main
      };
    } catch (error) {
      console.error("Failed to fetch weather data", error);
    }
  }

  async function scheduleWeatherNotification(weather) {
    if (weather) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Weather Update",
          body: `The temperature is ${weather.temperature} with ${weather.condition}.`,
        },
        trigger: null,
      });
    }
  }

  return (
    <PaperProvider theme={DefaultTheme}>
      <AuthNavigator />
    </PaperProvider>
  );
};

export default App;
