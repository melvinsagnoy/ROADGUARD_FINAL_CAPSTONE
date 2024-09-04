import React from 'react';
import { Provider as PaperProvider, DefaultTheme, DarkTheme } from 'react-native-paper';
import AuthNavigator from './navigation/AuthNavigator';
import { useColorScheme } from 'react-native'; // Import useColorScheme

const App = () => {
  const colorScheme = useColorScheme(); // Get the device color scheme

  // Set the theme based on the detected color scheme
  const theme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <PaperProvider theme={theme}>
      <AuthNavigator />
    </PaperProvider>
  );
};

export default App;