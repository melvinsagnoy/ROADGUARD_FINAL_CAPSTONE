import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ref, get, onValue } from 'firebase/database';
import { database, auth } from '../firebaseConfig';
import NavBar from './NavBar';
import NotificationChannelsScreen from './privacy_security/NotificationChannelsScreen'; // Import the channel settings modal

function sanitizeEmail(email) {
  return email ? email.replace(/[.#$\/\[\]]/g, '_') : '';
}

const NotificationsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showChannelModal, setShowChannelModal] = useState(false);

  // Function to load notifications from the database
  const loadNotifications = async () => {
    const notificationsRef = ref(database, 'notifications');
    const snapshot = await get(notificationsRef);

    const loadedNotifications = [];
    snapshot.forEach((childSnapshot) => {
      const notification = childSnapshot.val();
      loadedNotifications.push(notification);
    });

    setNotifications(loadedNotifications);
  };

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const userRef = ref(database, `users/${sanitizeEmail(currentUser.email)}/notificationPreferences`);
      onValue(userRef, (snapshot) => {
        const preferences = snapshot.val();
        setNotificationsEnabled(preferences?.notificationsEnabled ?? true);
      });
    }
  }, []);

  useEffect(() => {
    // Only load notifications if they are enabled
    if (notificationsEnabled) {
      loadNotifications();
    }
  }, [notificationsEnabled]); // Reload notifications whenever notificationsEnabled changes

  const renderNotification = ({ item }) => (
    <LinearGradient colors={['#6a11cb', '#2575fc']} style={styles.notification}>
      <Text style={styles.notificationTitle}>{item.title}</Text>
      <Text style={styles.notificationMessage}>{item.message}</Text>
    </LinearGradient>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Notifications</Text>
        <TouchableOpacity style={styles.toggleButton} onPress={() => setShowChannelModal(true)}>
          <LinearGradient colors={['#5a98d2', '#69c0f7']} style={styles.toggleGradient}>
            <Text style={styles.toggleText}>{notificationsEnabled ? 'Turn Off' : 'Turn On'}</Text>
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
        <Text style={styles.disabledText}>Notifications are turned off</Text>
      )}

      <NavBar navigation={navigation} />

      <Modal visible={showChannelModal} transparent animationType="slide">
        <View style={styles.modalBackground}>
          <NotificationChannelsScreen onClose={() => setShowChannelModal(false)} />
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
