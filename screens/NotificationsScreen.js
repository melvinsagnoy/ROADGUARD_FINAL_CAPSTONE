import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, RefreshControl, Platform } from 'react-native';
import { ref, onValue, off, update, get } from 'firebase/database';
import { database, auth } from '../firebaseConfig';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { formatDistanceToNow } from 'date-fns';
import * as Notifications from 'expo-notifications';
import NavBar from './NavBar'; // Ensure the import path is correct

const NotificationsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [clickedNotifications, setClickedNotifications] = useState({}); // Track clicked notifications

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error('No user logged in');
      return;
    }

    const userEmail = currentUser.email?.toLowerCase().trim();
    if (!userEmail) {
      console.error('No email found for the current user');
      return;
    }

    const sanitizedEmail = sanitizeEmail(userEmail);
    if (!sanitizedEmail) {
      console.error('Sanitized email is invalid');
      return;
    }

    registerForPushNotificationsAsync(sanitizedEmail);

    const postsRef = ref(database, 'posts');
    
    const unsubscribe = onValue(postsRef, async (snapshot) => {
      const loadedNotifications = [];
      snapshot.forEach((postSnapshot) => {
        const postData = postSnapshot.val();
        const postId = postSnapshot.key;

        if (postData.email === userEmail) {
          // Handle comments and replies
          if (postData.comments) {
            Object.keys(postData.comments).forEach(commentId => {
              const comment = postData.comments[commentId];
              if (comment.email !== userEmail) {
                loadedNotifications.push({
                  id: commentId,
                  postId,
                  text: `${comment.displayName || 'Someone'} commented on your post: ${comment.text}`,
                  timestamp: comment.createdAt,
                  profileImage: comment.profileImage || 'https://via.placeholder.com/50',
                  type: 'comments',
                  read: comment.read || false // Adding 'read' property
                });
                sendNotification(comment.email, `${comment.displayName || 'Someone'} commented on your post.`);
              }

              if (comment.replies) {
                Object.keys(comment.replies).forEach(replyId => {
                  const reply = comment.replies[replyId];
                  if (reply.email !== userEmail) {
                    loadedNotifications.push({
                      id: replyId,
                      postId,
                      commentId,
                      text: `${reply.displayName || 'Someone'} replied to your comment: ${reply.text}`,
                      timestamp: reply.createdAt,
                      profileImage: reply.profileImage || 'https://via.placeholder.com/50',
                      type: 'replies',
                      read: reply.read || false // Adding 'read' property
                    });
                    sendNotification(reply.email, `${reply.displayName || 'Someone'} replied to your comment.`);
                  }
                });
              }
            });
          }

          // Handle votes (upvotes and downvotes)
          if (postData.voters) {
            Object.entries(postData.voters).forEach(([voterEmail, voteData]) => {
              if (voterEmail !== sanitizedEmail) {
                const voteType = voteData.voteType === 'upvote' ? 'liked' : 'disliked';
                loadedNotifications.push({
                  id: voterEmail,  // Use the voter's email as the ID
                  postId,
                  text: `${voteData.displayName || 'Someone'} ${voteType} your post`,
                  timestamp: voteData.timestamp,
                  profileImage: voteData.photoURL || 'https://via.placeholder.com/50',
                  type: 'voters',
                  read: voteData.read || false // Adding 'read' property
                });
                sendNotification(postData.email, `${voteData.displayName || 'Someone'} ${voteType} your post.`);
              }
            });
          }
        }
      });

      setNotifications(loadedNotifications.sort((a, b) => b.timestamp - a.timestamp)); // Sort by newest first
      setRefreshing(false);
    });

    return () => off(postsRef, 'value', unsubscribe);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setRefreshing(false);
  };

  const markAsRead = async (notificationId, postId, type) => {
    if (type === 'voters') {
      // For voters, update the read status under the voter's email
      const notificationRef = ref(database, `posts/${postId}/voters/${notificationId}`);
      await update(notificationRef, { read: true });
    } else {
      // For other types (comments, replies), keep the original logic
      const notificationRef = ref(database, `posts/${postId}/${type}/${notificationId}`);
      await update(notificationRef, { read: true });
    }
  };

  const handleNotificationClick = (item) => {
    // Check if the notification is already clicked
    if (clickedNotifications[item.id]) {
      console.log('Notification already processed.');
      return; // Prevent duplicate actions
    }

    // Mark the notification as clicked
    setClickedNotifications((prevClickedNotifications) => ({
      ...prevClickedNotifications,
      [item.id]: true,
    }));

    // Mark the notification as read in Firebase
    markAsRead(item.id, item.postId, item.type);

    // Navigate to the post detail screen
    navigation.navigate('PostDetail', { postId: item.postId });
  };

  const renderNotification = ({ item }) => {
    console.log('Notification item:', item);  // Debugging log

    let formattedTime = 'Unknown time';

    if (item.timestamp) {
      const date = new Date(item.timestamp);
      if (!isNaN(date.getTime())) {
        formattedTime = formatDistanceToNow(date) + ' ago';
      }
    }

    const notificationBackground = item.read ? '#fff' : '#e0e0e0'; // Gray for unread notifications

    return (
      <TouchableOpacity
        style={[styles.notification, { backgroundColor: notificationBackground }]}
        onPress={() => handleNotificationClick(item)} // Handle notification click
      >
        <Image source={{ uri: item.profileImage }} style={styles.profileImage} />
        <View style={styles.textContainer}>
          <Text style={styles.body}>
            {typeof item.text === 'string' ? item.text : JSON.stringify(item.text)}
          </Text>
          <Text style={styles.time}>{formattedTime}</Text>
        </View>
        <Icon name="notifications" size={30} color="#4CAF50" />
      </TouchableOpacity>
    );
  };

  // Register for push notifications
  async function registerForPushNotificationsAsync(sanitizedEmail) {
    let token;
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;

    // Save the token to the database
    await saveDeviceToken(sanitizedEmail, token);
  }

  // Save the device token in the database
  async function saveDeviceToken(userEmail, token) {
    const sanitizedEmail = sanitizeEmail(userEmail);
    const userTokenRef = ref(database, `users/${sanitizedEmail}/deviceToken`);
    
    console.log('Saving device token to path:', `users/${sanitizedEmail}/deviceToken`);
    console.log('Device token:', token);

    try {
      await update(userTokenRef, { token });
      console.log('Device token saved successfully');
    } catch (error) {
      console.error('Error saving device token:', error);
    }
  }

  // Send a notification to a specific user
  async function sendNotification(userEmail, message) {
    const sanitizedEmail = sanitizeEmail(userEmail);
    const userTokenRef = ref(database, `users/${sanitizedEmail}/deviceToken`);
    
    console.log('Fetching device token from path:', `users/${sanitizedEmail}/deviceToken`);

    try {
      const snapshot = await get(userTokenRef);

      if (!snapshot.exists()) {
        console.error('No data found at path:', userTokenRef.toString());
        return;
      }

      const token = snapshot.val()?.token;

      if (token) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "New Notification",
            body: message,
            sound: true, // Play sound for notifications
            data: { userEmail }, // Pass userEmail or other relevant data
          },
          trigger: null, // Immediate trigger
        });
      } else {
        console.error('Device token not found for user:', userEmail);
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  // Sanitize email by replacing invalid characters
  function sanitizeEmail(email) {
    return email ? email.replace(/[.#$\/\[\]]/g, '_') : '';
  }

  return (
  <View style={styles.container}>
    {/* Header Title */}
    <View style={styles.header}>
      <Text style={styles.headerTitle}>NOTIFICATION</Text>
    </View>

    {/* Notifications List */}
    <FlatList
      data={notifications}
      renderItem={renderNotification}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    />
    <NavBar navigation={navigation} />
  </View>
);
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  notification: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginBottom: 5,
  },
    header: {
    padding: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  body: {
    fontSize: 16,
  },
  time: {
    fontSize: 12,
    color: '#888',
  },
});

export default NotificationsScreen;