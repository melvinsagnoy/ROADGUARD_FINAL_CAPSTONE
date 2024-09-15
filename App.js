import React, { useEffect } from 'react';
import { Provider as PaperProvider, DefaultTheme, DarkTheme } from 'react-native-paper';
import AuthNavigator from './navigation/AuthNavigator';
import { useNavigationContainerRef } from '@react-navigation/native';
import { useColorScheme } from 'react-native';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import axios from 'axios';

const App = () => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;
  const navigationRef = useNavigationContainerRef();

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

    return () => subscription.remove();
  }, []);

  async function requestNotificationPermissions() {
    const { status } = await Notifications.requestPermissionsAsync();
    console.log('Notification permissions status:', status);
  }

  const handleNotificationClick = (data) => {
    if (data?.screen) {
      navigationRef.current?.navigate(data.screen, data.params);
    }
  };

  const WEATHER_TASK = 'background-weather-task';

  TaskManager.defineTask(WEATHER_TASK, async () => {
    try {
      const weather = await fetchWeather();
      await scheduleWeatherNotification(weather);
      return BackgroundFetch.BackgroundFetchResult.NewData;
    } catch (error) {
      console.error("Background Fetch Failed", error);
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
  });

  async function registerBackgroundFetchAsync() {
    BackgroundFetch.registerTaskAsync(WEATHER_TASK, {
      minimumInterval: 1800,
      stopOnTerminate: false,
      startOnBoot: true,
    });
  }

  async function fetchWeather() {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=10.3157&lon=123.8854&units=metric&appid=b2529bcc950c7e261538c1ddb942c44e`;
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
          sound: true,
          data: { screen: 'WeatherScreen', params: weather }
        },
        trigger: null,
      });
    }
  }

  return (
    <PaperProvider theme={theme}>
      <AuthNavigator ref={navigationRef} />
    </PaperProvider>
  );
};

export default App;