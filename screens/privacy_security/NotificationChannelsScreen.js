import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { database, auth } from '../../firebaseConfig';
import { ref, update } from 'firebase/database';

const NotificationChannelsScreen = ({ onClose, notificationsEnabled, setNotificationsEnabled }) => {
  const toggleSwitch = () => {
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);

    const currentUser = auth.currentUser;
    if (currentUser && currentUser.email) {
      const sanitizedEmail = currentUser.email.replace(/[.#$\/\[\]]/g, '_');
      const userRef = ref(database, `users/${sanitizedEmail}/notificationPreferences`);

      update(userRef, { notificationsEnabled: newValue })
        .then(() => {
          console.log("Notification preferences updated successfully.");
        })
        .catch((error) => {
          console.error("Error updating notification preferences: ", error);
        });
    } else {
      console.warn("User is not authenticated or email is unavailable.");
    }
  };

  return (
    <View style={styles.modalContent}>
      <Text style={styles.title}>Notification Settings</Text>
      <View style={styles.channelRow}>
        <Text style={styles.channelText}>Enable Notifications</Text>
        <Switch
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={notificationsEnabled ? '#f5dd4b' : '#f4f3f4'}
          ios_backgroundColor="#3e3e3e"
          onValueChange={toggleSwitch}
          value={notificationsEnabled}
        />
      </View>
      <TouchableOpacity onPress={onClose}>
        <LinearGradient
          colors={['#5a98d2', '#69c0f7']}
          style={styles.closeButton}
        >
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
