import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, StyleSheet, Alert, Image, useColorScheme, Switch } from 'react-native';
import * as Location from 'expo-location';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ref, set, serverTimestamp, get } from 'firebase/database';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { database } from '../firebaseConfig';

const GOOGLE_MAPS_API_KEY = 'AIzaSyDZShgCYNWnTIkKJFRGsqY8GZDax9Ykqo0'; // Replace with your actual API key

const ClaimingFormModal = ({ visible, onClose, reward }) => {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [usingCurrentLocation, setUsingCurrentLocation] = useState(true);
  const [loading, setLoading] = useState(false);
  const [rewardPoints, setRewardPoints] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0); // For Realtime Database sync

  const auth = getAuth();
  const firestore = getFirestore();
  const currentUser = auth.currentUser;
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  // Theme colors
  const theme = {
    light: {
      background: '#FFFFFF',
      text: '#000000',
      inputBorder: '#CCCCCC',
      buttonBackground: '#E0C55B',
      buttonText: '#FFFFFF',
      overlayBackground: 'rgba(0,0,0,0.5)',
      activeToggleBackground: '#E0C55B',
      activeToggleText: '#FFFFFF',
    },
    dark: {
      background: '#1E1E1E',
      text: '#E0E0E0',
      inputBorder: '#444444',
      buttonBackground: '#BB86FC',
      buttonText: '#E0E0E0',
      overlayBackground: 'rgba(255,255,255,0.1)',
      activeToggleBackground: '#BB86FC',
      activeToggleText: '#E0E0E0',
    },
  };

  const currentTheme = isDarkMode ? theme.dark : theme.light;

  useEffect(() => {
    if (visible) {
      if (usingCurrentLocation) {
        getCurrentLocation();
      }
      fetchRewardPoints();
      fetchTotalScore(); // Fetch total score when the modal becomes visible
    }
  }, [visible, usingCurrentLocation, reward]);

  const sanitizeEmail = (email) => email.replace(/[@.]/g, '_');

  // Fetch user's total score from Firestore and sync with Realtime Database
  const fetchTotalScore = async () => {
    if (!currentUser) return;

    const userDocRef = doc(firestore, 'users', currentUser.email);
    const sanitizedEmail = sanitizeEmail(currentUser.email);
    const realtimeRef = ref(database, `users/${sanitizedEmail}/points`);

    // Listen to Firestore changes
    const unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        const scores = data.scores || [];
        const total = scores.reduce((sum, score) => sum + score.score, 0);

        // Update Realtime Database
        set(realtimeRef, total)
          .then(() => {
            console.log('Total points synced to Realtime Database:', total);
            setTotalPoints(total);
          })
          .catch((error) => console.error('Error syncing points:', error));
      } else {
        console.error('User document does not exist in Firestore');
      }
    });

    return () => unsubscribe();
  };

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location access was denied.');
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      if (data.results.length > 0) {
        setAddress(data.results[0].formatted_address);
      } else {
        setAddress('Unable to retrieve address');
      }
      setLoading(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to retrieve location.');
      setLoading(false);
    }
  };

  const fetchRewardPoints = async () => {
    if (reward?.rewardId) {
      try {
        const rewardRef = ref(database, `rewards/${reward.rewardId}`);
        const snapshot = await get(rewardRef);
        if (snapshot.exists()) {
          setRewardPoints(snapshot.val().pointsRequired || 0);
        }
      } catch {
        setRewardPoints(0);
      }
    }
  };

  const handleClaim = async () => {
    if (!fullName.trim() || !phoneNumber.trim() || !address.trim()) {
      Alert.alert('Error', 'All fields are required.');
      return;
    }

    const sanitizedEmail = currentUser?.email.replace(/[@.]/g, '_');
    const claimRef = ref(database, `claim_reward/${sanitizedEmail}`);
    const userRef = ref(database, `users/${sanitizedEmail}`);

    try {
      setLoading(true);

      if (totalPoints < rewardPoints) {
        Alert.alert('Error', 'Insufficient points.');
        return;
      }

      const newPoints = totalPoints - rewardPoints;
      await set(claimRef, {
        fullName,
        phoneNumber,
        address,
        email: currentUser?.email,
        timestamp: serverTimestamp(),
        status: 'pending',
        rewardName: reward?.rewardName || 'No Name',
        rewardImageUrl: reward?.imageUrl || '',
        pointsRequired: rewardPoints,
      });
      await set(userRef, { points: newPoints });

      Alert.alert('Success', 'Claim submitted.');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleBackButtonPress = () => {
    Alert.alert(
      'Cancel Claiming',
      'Are you sure you want to cancel claiming this reward?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes', onPress: () => onClose() },
      ],
      { cancelable: false }
    );
  };

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={handleBackButtonPress}>
      <View style={[styles.modalContainer, { backgroundColor: currentTheme.overlayBackground }]}>
        <View style={[styles.modalContent, { backgroundColor: currentTheme.background }]}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackButtonPress}>
            <Icon name="arrow-back" size={24} color={currentTheme.text} />
          </TouchableOpacity>

          <Text style={[styles.title, { color: currentTheme.text }]}>Claim Reward</Text>

          {reward?.imageUrl && <Image source={{ uri: reward.imageUrl }} style={styles.rewardImage} />}

          <Text style={[styles.rewardName, { color: currentTheme.text }]}>{reward?.rewardName}</Text>
          <Text style={[styles.rewardPoints, { color: currentTheme.text }]}>
            Points Required: {rewardPoints > 0 ? rewardPoints : 'N/A'}
          </Text>
          <Text style={[styles.totalPoints, { color: currentTheme.text }]}>
            Total Points: {totalPoints}
          </Text>

          {/* Claim Form */}
          <TextInput
            style={[styles.input, { borderColor: currentTheme.inputBorder, color: currentTheme.text }]}
            placeholder="Enter your full name"
            placeholderTextColor={isDarkMode ? '#888888' : '#AAAAAA'}
            value={fullName}
            onChangeText={setFullName}
          />

          <TextInput
            style={[styles.input, { borderColor: currentTheme.inputBorder, color: currentTheme.text }]}
            placeholder="Enter your phone number"
            placeholderTextColor={isDarkMode ? '#888888' : '#AAAAAA'}
            value={phoneNumber}
            onChangeText={(text) => setPhoneNumber(text.replace(/[^0-9]/g, ''))}
            maxLength={11}
            keyboardType="phone-pad"
          />

<Switch
            value={usingCurrentLocation}
            onValueChange={() => setUsingCurrentLocation(!usingCurrentLocation)}
          />
          <Text>{usingCurrentLocation ? 'Using Current Location' : 'Manual Address'}</Text>

          <TextInput
            style={styles.input}
            placeholder="Address"
            value={address}
            onChangeText={(text) => !usingCurrentLocation && setAddress(text)}
            editable={!usingCurrentLocation}
          />

          <TouchableOpacity
            style={[styles.claimButton, { backgroundColor: currentTheme.buttonBackground }]}
            onPress={handleClaim}
          >
            <Text style={[styles.buttonText, { color: currentTheme.buttonText }]}>Claim</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    padding: 10,
    zIndex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  rewardImage: {
    width: 100,
    height: 100,
    marginBottom: 10,
    borderRadius: 10,
  },
  rewardName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  rewardPoints: {
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
  },
  totalPoints: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 20,
  },
  claimButton: {
    padding: 15,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: 'bold',
  },
});

export default ClaimingFormModal;
