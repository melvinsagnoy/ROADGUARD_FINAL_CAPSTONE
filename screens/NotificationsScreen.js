import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, useColorScheme, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ref, onValue } from 'firebase/database';
import * as Notifications from 'expo-notifications';
import { database, auth } from '../firebaseConfig';
import NavBar from './NavBar';
import NotificationChannelsScreen from './privacy_security/NotificationChannelsScreen';

function sanitizeEmail(email) {
  return email ? email.replace(/[.#$\/\[\]]/g, '_') : '';
}

// Set Notification Handler to show banners when app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, // Show banner
    shouldPlaySound: true, // Play sound
    shouldSetBadge: true, // Update app badge
  }),
});

const NotificationsScreen = ({ navigation }) => {
  const lightTheme = {
    background: '#f5f5f5',
    headerBackground: '#ffffff',
    text: '#333',
    toggleGradientStart: '#5a98d2',
    toggleGradientEnd: '#69c0f7',
    notificationGradientStart: '#6a11cb',
    notificationGradientEnd: '#2575fc',
    disabledText: '#888',
  };

  const darkTheme = {
    background: '#121212',
    headerBackground: '#1E1E1E',
    text: '#E0E0E0',
    toggleGradientStart: '#3a3b3c',
    toggleGradientEnd: '#555657',
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
  const [showChannelModal, setShowChannelModal] = useState(false);

  useEffect(() => {
    if (notificationsEnabled) {
      requestNotificationPermissions();
      loadNotifications();
  
      // Listener for notification responses (foreground)
      const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
        // Handle the response object correctly, no need to access 'e'
        console.log('Notification Response:', response);
        // You can process the response data here
      });
  
      // Background notification listener
      const backgroundSubscription = Notifications.addNotificationReceivedListener((notification) => {
        // Handle background notifications correctly
        console.log('Background Notification Received:', notification);
        // You can process the notification data here
      });
  
      return () => {
        responseSubscription.remove();
        backgroundSubscription.remove();
      };
    }
  }, [notificationsEnabled]);

  const requestNotificationPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status === 'granted') {
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      setExpoPushToken(token);
    } else {
      Alert.alert('Permission Denied', 'You need to enable notifications in settings.');
    }
  };

  const loadNotifications = () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log('No user is logged in.');
      return;
    }

    const userEmail = sanitizeEmail(currentUser.email);
    const postsRef = ref(database, `posts`);
    const userNotifications = [];

    onValue(postsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        console.log('No posts found in the database.');
        return;
      }
    
      Object.keys(data).forEach((postId) => {
        const post = data[postId];
    
        // New post notifications
        if (post.userId !== userEmail) {
          userNotifications.push({
            id: `${postId}-newPost`,
            type: 'newPost',
            title: 'New Post',
            message: `New post from ${post.displayName || 'Anonymous'}: "${post.body}"`,
            createdAt: post.createdAt,
          });
          triggerPushNotification('New Post', `New post from ${post.displayName || 'Anonymous'}: "${post.body}"`);
        }
    
        // Comment notifications
        if (post.userId === userEmail && post.comments) {
          Object.keys(post.comments).forEach((commentId) => {
            const comment = post.comments[commentId];
            if (sanitizeEmail(comment.email) !== userEmail) {
              userNotifications.push({
                id: `${postId}-${commentId}`,
                type: 'comment',
                title: 'New Comment',
                message: `${comment.displayName || 'Anonymous'} commented: "${comment.text}"`,
                createdAt: comment.createdAt,
              });
              triggerPushNotification('New Comment', `${comment.displayName || 'Anonymous'} commented: "${comment.text}"`);
            }
          });
        }
      });
    
      userNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setNotifications(userNotifications);
    });
  };

  const triggerPushNotification = async (title, body) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
      },
      trigger: null, // Send immediately
    });
  };

  const toggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
  };

  const renderNotification = ({ item }) => (
    <LinearGradient
      colors={[theme.notificationGradientStart, theme.notificationGradientEnd]}
      style={styles.notification}
    >
      <Text style={[styles.notificationTitle, { color: theme.text }]}>{item.title}</Text>
      <Text style={[styles.notificationMessage, { color: theme.text }]}>{item.message}</Text>
    </LinearGradient>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.headerContainer, { backgroundColor: theme.headerBackground }]}>
        <Text style={[styles.header, { color: theme.text }]}>Notifications</Text>
        <TouchableOpacity style={styles.toggleButton} onPress={() => setShowChannelModal(true)}>
          <LinearGradient
            colors={[theme.toggleGradientStart, theme.toggleGradientEnd]}
            style={styles.toggleGradient}
          >
            <Text style={styles.toggleText}>
              {notificationsEnabled ? 'Manage Settings' : 'Notifications Off'}
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
          Notifications are turned off
        </Text>
      )}

      <NavBar navigation={navigation} />

      <Modal visible={showChannelModal} transparent animationType="slide">
        <View style={styles.modalBackground}>
        
          <NotificationChannelsScreen
            onClose={() => setShowChannelModal(false)}
            notificationsEnabled={notificationsEnabled}
            setNotificationsEnabled={setNotificationsEnabled}
          />
        </View>
      </Modal>
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
    paddingVertical: 10,
    backgroundColor: '#ffffff',
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
  },
  toggleButton: {
    borderRadius: 20,
  },
  toggleGradient: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  toggleText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  notificationList: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  notification: {
    padding: 15,
    borderRadius: 10,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
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
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default NotificationsScreen;
