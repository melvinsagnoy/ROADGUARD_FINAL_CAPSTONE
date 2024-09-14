import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { ref, onValue, off } from 'firebase/database'; // Import ref, onValue, and off from Firebase
import { database, auth } from '../firebaseConfig'; // Import database and auth from firebaseConfig
import Icon from 'react-native-vector-icons/MaterialIcons'; // Import icons for notifications
import { formatDistanceToNow } from 'date-fns'; // For time ago format
import NavBar from './NavBar';

const NotificationsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(false);

  useEffect(() => {
    // Set up the listener for new notifications on component mount
    const postsRef = ref(database, 'posts'); // Reference to the 'posts' node in Firebase
    const unsubscribe = setupNotifications(postsRef);

    // Cleanup listener on component unmount
    return () => {
      off(postsRef); // Correctly remove the listener using Firebase's 'off' method
    };
  }, []);

  // Function to set up real-time notifications listener from the 'posts' node
  const setupNotifications = (postsRef) => {
  const user = auth.currentUser;

  if (!user) {
    console.error('User not authenticated');
    return;
  }

  // Listen for new comments and votes
  const handleNewActivity = (snapshot) => {
    const activities = [];
    snapshot.forEach((childSnapshot) => {
      const post = childSnapshot.val();
      const { title, comments, userPhotoURL } = post;
      const postId = childSnapshot.key; // Get the postId from the childSnapshot key

      // Loop through each comment in the 'comments' node
      if (comments) {
        Object.keys(comments).forEach((commentId) => {
          const comment = comments[commentId];
          activities.push({
            id: commentId, // Unique comment ID
            postId,        // Store the postId along with the comment
            text: `New comment on "${title}": "${comment.text}"`,
            type: 'comment',
            timestamp: comment.createdAt,
            profileImage: comment.profileImage || 'https://via.placeholder.com/50', // Use the commenter's profile image
            displayName: comment.displayName || 'Anonymous', // Commenter's display name
          });
        });
      }

      // If votes are stored, you can handle votes as well (not shown in the structure)
      // Example: if (lastVote) { ... }
    });

    setNotifications(activities); // Update notifications state
    setRefreshing(false);
  };

  onValue(postsRef, handleNewActivity); // Attach the listener
};

  // Function to handle manual refresh
  const onRefresh = () => {
    setRefreshing(true);
    const postsRef = ref(database, 'posts'); // Reference the same posts node
    setupNotifications(postsRef); // Refresh notifications by resetting the listener
  };

  // Function to render each notification item
 // Function to render each notification item
const renderNotification = ({ item }) => (
  <TouchableOpacity
    style={styles.notification}
    onPress={() => {
      if (item.postId) { // Use postId, not commentId, for navigation
        console.log('Navigating to Post ID:', item.postId); // Debugging log
        navigation.navigate('PostDetail', { postId: item.postId }); // Ensure postId exists
      } else {
        console.error("Post ID not found in notification");
      }
    }}
  >
    <Image source={{ uri: item.profileImage }} style={styles.profileImage} />
    <View style={styles.textContainer}>
      <Text style={styles.body}>{item.text}</Text>
      <Text style={styles.time}>{formatDistanceToNow(new Date(item.timestamp))} ago</Text>
    </View>
    <Icon
      name={item.type === 'comment' ? 'comment' : 'thumb-up'}
      size={30}
      color={item.type === 'comment' ? '#4CAF50' : '#2196F3'}
      style={styles.icon}
    />
  </TouchableOpacity>
);

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={30} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Notifications</Text>
      </View>

      {/* Notifications List */}
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
      <NavBar navigation={navigation} isProfileComplete={isProfileComplete} />
    </View>
    
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  backButton: {
    marginRight: 10,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  notification: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  body: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  time: {
    fontSize: 12,
    color: '#888',
    marginTop: 5,
  },
  icon: {
    marginLeft: 10,
  },
});

export default NotificationsScreen;
