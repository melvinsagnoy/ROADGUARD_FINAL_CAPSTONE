import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, useColorScheme, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ref, onValue, update } from 'firebase/database';
import * as Notifications from 'expo-notifications';
import { database, auth } from '../firebaseConfig';
import NavBar from './NavBar';

function sanitizeEmail(email) {
  return email ? email.replace(/[.#$\/\[\]]/g, '_') : '';
}

// Set Notification Handler dynamically based on notificationsEnabled state
const setDynamicNotificationHandler = (notificationsEnabled) => {
  Notifications.setNotificationHandler({
    handleNotification: async () => (notificationsEnabled ? {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    } : {
      shouldShowAlert: false,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
};

const NotificationsScreen = ({ navigation }) => {
  const lightTheme = {
    background: '#f5f5f5',
    headerBackground: '#ffffff',
    text: '#333',
    buttonGradientStart: '#5a98d2',
    buttonGradientEnd: '#69c0f7',
    notificationGradientStart: '#6a11cb',
    notificationGradientEnd: '#2575fc',
    disabledText: '#888',
  };

  const darkTheme = {
    background: '#121212',
    headerBackground: '#1E1E1E',
    text: '#E0E0E0',
    buttonGradientStart: '#3a3b3c',
    buttonGradientEnd: '#555657',
    notificationGradientStart: '#373737',
    notificationGradientEnd: '#4a4a4a',
    disabledText: '#555',
  };

  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const theme = isDarkMode ? darkTheme : lightTheme;

  const [notifications, setNotifications] = useState([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [expoPushToken, setExpoPushToken] = useState(null);

  useEffect(() => {
    const currentUser = auth.currentUser;

    if (currentUser) {
      const userEmail = sanitizeEmail(currentUser.email);
      const userRef = ref(database, `users/${userEmail}/notificationPreferences`);

      // Load notification preference from the database
      onValue(userRef, (snapshot) => {
        const preferences = snapshot.val();
        if (preferences?.notificationsEnabled !== undefined) {
          setNotificationsEnabled(preferences.notificationsEnabled);
          setDynamicNotificationHandler(preferences.notificationsEnabled);
        }
      });
    }

    if (notificationsEnabled) {
      requestNotificationPermissions();
      loadNotifications();
    } else {
      removePushToken();
    }

    return () => {
      setNotifications([]);
    };
  }, [notificationsEnabled]);

  const requestNotificationPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status === 'granted') {
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      setExpoPushToken(token);

      const currentUser = auth.currentUser;
      if (currentUser) {
        const userEmail = sanitizeEmail(currentUser.email);
        const userRef = ref(database, `users/${userEmail}`);

        // Save the token in the database
        update(userRef, { expoPushToken: token }).catch((error) =>
          console.error('Error saving push token:', error)
        );
      }
    }
  };

  const removePushToken = () => {
    setExpoPushToken(null);

    const currentUser = auth.currentUser;
    if (currentUser) {
      const userEmail = sanitizeEmail(currentUser.email);
      const userRef = ref(database, `users/${userEmail}`);

      // Remove the token from the database
      update(userRef, { expoPushToken: null }).catch((error) =>
        console.error('Error removing push token:', error)
      );
    }
  };

  const loadNotifications = () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const userEmail = sanitizeEmail(currentUser.email);
    const postsRef = ref(database, `posts`);
    const userNotifications = [];

    onValue(postsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      Object.keys(data).forEach((postId) => {
        const post = data[postId];
        if (post.userId !== userEmail) {
          userNotifications.push({
            id: `${postId}-newPost`,
            title: 'New Post',
            message: `New post from ${post.displayName || 'Anonymous'}: "${post.body}"`,
            createdAt: post.createdAt,
          });

          // Schedule a local notification for the post
          schedulePushNotification(`New Post: ${post.displayName || 'Anonymous'}`, post.body);
        }
      });

      setNotifications(userNotifications);
    });
  };

  const schedulePushNotification = async (title, body) => {
    if (notificationsEnabled) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
        },
        trigger: null, // Trigger immediately
      });
    }
  };

  const toggleNotifications = () => {
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);
    setDynamicNotificationHandler(newValue);

    const currentUser = auth.currentUser;
    if (currentUser) {
      const userEmail = sanitizeEmail(currentUser.email);
      const userRef = ref(database, `users/${userEmail}/notificationPreferences`);

      update(userRef, { notificationsEnabled: newValue })
        .then(() => {
          Alert.alert(
            'Notification Preferences Updated',
            newValue
              ? 'Notifications have been turned on.'
              : 'Notifications have been turned off.'
          );
        })
        .catch((error) => {
          console.error('Error updating notification preferences:', error);
        });
    }
  };

  const renderNotification = ({ item }) => (
    <View
      colors={[theme.notificationGradientStart, theme.notificationGradientEnd]}
      style={styles.notification}
    >
      <Text style={[styles.notificationTitle, { color: theme.text }]}>{item.title}</Text>
      <Text style={[styles.notificationMessage, { color: theme.text }]}>{item.message}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.headerContainer, { backgroundColor: theme.headerBackground }]}>
        <Text style={[styles.header, { color: theme.text }]}>Notifications</Text>
        <TouchableOpacity style={styles.button} onPress={toggleNotifications}>
          <LinearGradient
            colors={[theme.buttonGradientStart, theme.buttonGradientEnd]}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>
              {notificationsEnabled ? 'Turn Off Notifications' : 'Turn On Notifications'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {notificationsEnabled ? (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.notificationList}
        />
      ) : (
        <Text style={[styles.disabledText, { color: theme.disabledText }]}>
          Notifications are turned off.
        </Text>
      )}

      <NavBar navigation={navigation} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 5,
    marginTop: 20,
    backgroundColor: '#ffffff',
  },
  header: {
    marginTop: 30,
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
  },
  button: {
    borderRadius: 20,
    marginTop: 30,
  },
  buttonGradient: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  notificationList: {
    padding: 5,
  },
  notification: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginVertical: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },  
    shadowRadius: 6,  
    elevation: 5,      
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#d3e0ff',
    marginTop: 4,
  },
  disabledText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#888',
    marginTop: 20,
  },
});

export default NotificationsScreen;
