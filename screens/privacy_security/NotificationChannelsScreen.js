import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { database, auth } from '../../firebaseConfig';
import { ref, update, onValue } from 'firebase/database';

function sanitizeEmail(email) {
  return email ? email.replace(/[.#$\/\[\]]/g, '_') : '';
}

const NotificationChannelsScreen = ({ onClose }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const userRef = ref(database, `users/${sanitizeEmail(currentUser.email)}/notificationPreferences`);
      onValue(userRef, (snapshot) => {
        const preferences = snapshot.val();
        setNotificationsEnabled(preferences?.notificationsEnabled ?? true); // Default to true if not set
      });
    }
  }, []);

  const savePreferences = (value) => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const userRef = ref(database, `users/${sanitizeEmail(currentUser.email)}/notificationPreferences`);
      update(userRef, { notificationsEnabled: value });
    }
  };

  return (
    <View style={styles.modalContent}>
      <Text style={styles.title}>Notification Settings</Text>
      <View style={styles.channelRow}>
        <Text style={styles.channelText}>Notifications</Text>
        <Switch
          value={notificationsEnabled}
          onValueChange={(value) => {
            setNotificationsEnabled(value);
            savePreferences(value);
          }}
          trackColor={{ true: '#f0c943', false: '#ddd' }}
          thumbColor={notificationsEnabled ? '#f6ef00' : '#888'}
        />
      </View>
      <TouchableOpacity onPress={onClose}>
        <LinearGradient colors={['#5a98d2', '#69c0f7']} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>Close</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  modalContent: {
    width: '90%',
    padding: 25,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2a2a2a',
    marginBottom: 25,
  },
  channelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: 15,
    marginBottom: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  channelText: {
    fontSize: 16,
    color: '#424242',
  },
  closeButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default NotificationChannelsScreen;
