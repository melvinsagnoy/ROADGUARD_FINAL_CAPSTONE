import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, StyleSheet, Alert, Image, useColorScheme } from 'react-native';
import * as Location from 'expo-location';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ref, set, serverTimestamp, get } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { database } from '../firebaseConfig';

const GOOGLE_MAPS_API_KEY = 'AIzaSyACvMNE1lw18V00MT1wzRDW1vDlofnOZbw'; // Replace with your actual API key

const ClaimingFormModal = ({ visible, onClose, reward }) => {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [usingCurrentLocation, setUsingCurrentLocation] = useState(true);
  const [loading, setLoading] = useState(false);
  const [rewardPoints, setRewardPoints] = useState(0);

  const auth = getAuth();
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
    }
  }, [visible, usingCurrentLocation, reward]);

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Permission to access location was denied');
        setLoading(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      let { latitude, longitude } = location.coords;
      let response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`
      );
      let data = await response.json();
      if (data.results.length > 0) {
        setAddress(data.results[0].formatted_address);
      } else {
        setAddress('Unable to retrieve address');
      }
      setLoading(false);
    } catch (error) {
      Alert.alert('Error', 'Unable to retrieve location');
      setLoading(false);
    }
  };

  const fetchRewardPoints = async () => {
    if (reward?.rewardId) {
      try {
        const rewardRef = ref(database, `rewards/${reward.rewardId}`);
        const snapshot = await get(rewardRef);
        if (snapshot.exists()) {
          const rewardData = snapshot.val();
          setRewardPoints(rewardData.pointsRequired || 0);
        } else {
          setRewardPoints(0);
        }
      } catch (error) {
        Alert.alert('Error', `Unable to fetch reward points: ${error.message}`);
        setRewardPoints(0);
      }
    } else {
      setRewardPoints(0);
    }
  };

  const sanitizeEmail = (email) => {
    return email.replace(/[@.]/g, '_');
  };

  const handleClaim = async () => {
    if (fullName.trim() === '' || phoneNumber.trim() === '' || address.trim() === '') {
      Alert.alert('Error', 'Please provide full name, phone number, and address.');
      return;
    }
    if (phoneNumber.length !== 11) {
      Alert.alert('Error', 'Phone number must be exactly 11 digits.');
      return;
    }

    const sanitizedEmail = sanitizeEmail(currentUser?.email || 'unknown@domain.com');
    const claimRef = ref(database, `claim_reward/${sanitizedEmail}`);
    const userRef = ref(database, `users/${sanitizedEmail}`);

    try {
      setLoading(true);
      const userSnapshot = await get(userRef);
      if (userSnapshot.exists()) {
        const userData = userSnapshot.val();
        const currentPoints = userData.points || 0;

        if (currentPoints < rewardPoints) {
          Alert.alert('Error', 'Not enough points to claim this reward.');
          setLoading(false);
          return;
        }

        const newPoints = currentPoints - rewardPoints;

        await set(claimRef, {
          fullName,
          phoneNumber,
          address,
          email: currentUser?.email || 'Unknown',
          timestamp: serverTimestamp(),
          status: 'pending',
          rewardName: reward?.rewardName || 'No Name',
          rewardImageUrl: reward?.imageUrl || '',
          pointsRequired: rewardPoints,
        });

        await set(userRef, {
          ...userData,
          points: newPoints,
        });

        Alert.alert('Success', 'Claim submitted successfully.');
        onClose();
      } else {
        Alert.alert('Error', 'User data not found.');
      }
    } catch (error) {
      Alert.alert('Error', `Unable to submit claim: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAddressMethod = () => {
    setUsingCurrentLocation(!usingCurrentLocation);
    if (!usingCurrentLocation) {
      setAddress('');
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

          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                usingCurrentLocation && { backgroundColor: currentTheme.activeToggleBackground },
              ]}
              onPress={() => setUsingCurrentLocation(true)}
            >
              <Text
                style={[
                  styles.toggleText,
                  usingCurrentLocation && { color: currentTheme.activeToggleText },
                ]}
              >
                Use Current Location
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                !usingCurrentLocation && { backgroundColor: currentTheme.activeToggleBackground },
              ]}
              onPress={() => setUsingCurrentLocation(false)}
            >
              <Text
                style={[
                  styles.toggleText,
                  !usingCurrentLocation && { color: currentTheme.activeToggleText },
                ]}
              >
                Enter Address Manually
              </Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={[styles.input, { borderColor: currentTheme.inputBorder, color: currentTheme.text }]}
            placeholder={usingCurrentLocation ? 'Address (Auto-filled)' : 'Enter your address'}
            placeholderTextColor={isDarkMode ? '#888888' : '#AAAAAA'}
            value={address}
            onChangeText={(text) => {
              if (!usingCurrentLocation) {
                setAddress(text);
              }
            }}
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
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  toggleButton: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    marginHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleText: {
    fontSize: 14,
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
