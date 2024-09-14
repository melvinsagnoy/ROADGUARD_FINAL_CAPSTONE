import React, { useEffect } from 'react';
import { Provider as PaperProvider, DefaultTheme, DarkTheme } from 'react-native-paper';
import AuthNavigator from './navigation/AuthNavigator';
import { useColorScheme } from 'react-native'; // Import useColorScheme
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import axios from 'axios';

const App = () => {
  const colorScheme = useColorScheme(); // Get the device color scheme
  const theme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

  useEffect(() => {
    registerBackgroundFetchAsync();
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  }, []);

  // Define the task outside of any component
  const WEATHER_TASK = 'background-weather-task';

  TaskManager.defineTask(WEATHER_TASK, async () => {
    try {
      const weather = await fetchWeather();
      await scheduleWeatherNotification(weather);
      return BackgroundFetch.BackgroundFetchResult.NewData;
    } catch (error) {
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
  });

  async function registerBackgroundFetchAsync() {
    return BackgroundFetch.registerTaskAsync(WEATHER_TASK, {
      minimumInterval: 1800,
      stopOnTerminate: false,
      startOnBoot: true,
    });
  }

  async function fetchWeather() {
    const apiKey = 'b2529bcc950c7e261538c1ddb942c44e';
    const latitude = 10.3157;
    const longitude = 123.8854;
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`;
    const response = await axios.get(url);
    const { temp } = response.data.main;
    const { main } = response.data.weather[0];
    return {
      temperature: `${Math.round(temp)}°C`,
      condition: main
    };
  }

  async function scheduleWeatherNotification(weather) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Weather Update",
        body: `The temperature is ${weather.temperature} with ${weather.condition}.`
      },
      trigger: null,
    });
  }

  return (
    <PaperProvider theme={theme}>
      <AuthNavigator />
    </PaperProvider>
  );
};

export default App;