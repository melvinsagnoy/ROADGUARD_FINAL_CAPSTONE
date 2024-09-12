import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, StyleSheet, Alert, Image } from 'react-native';
import * as Location from 'expo-location';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ref, set, serverTimestamp, get } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { database } from '../firebaseConfig';

const GOOGLE_MAPS_API_KEY = 'AIzaSyACvMNE1lw18V00MT1wzRDW1vDlofnOZbw';

const ClaimingFormModal = ({ visible, onClose, reward }) => {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [usingCurrentLocation, setUsingCurrentLocation] = useState(true);
  const [loading, setLoading] = useState(false);
  const [rewardPoints, setRewardPoints] = useState(0);

  const auth = getAuth();
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (visible) {
      if (usingCurrentLocation) {
        getCurrentLocation();
      }
      fetchRewardPoints();
    }
    console.log('Reward data:', reward); // Debugging
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
        console.log('Fetched reward data:', rewardData); // Debugging
        console.log('Points required:', rewardData.pointsRequired); // Debugging
        setRewardPoints(rewardData.pointsRequired || 0);
      } else {
        console.log('Reward not found'); // Debugging
        setRewardPoints(0);
      }
    } catch (error) {
      console.error('Error fetching reward points:', error); // Debugging
      Alert.alert('Error', `Unable to fetch reward points: ${error.message}`);
      setRewardPoints(0);
    }
  } else {
    console.log('No reward ID provided'); // Debugging
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

      // Log the current points and reward points
      console.log('Current Points:', currentPoints);
      console.log('Reward Points Required:', rewardPoints);

      if (currentPoints < rewardPoints) {
        Alert.alert('Error', 'Not enough points to claim this reward.');
        setLoading(false);
        return;
      }

      const newPoints = currentPoints - rewardPoints;

      await set(claimRef, {
        fullName: fullName,
        phoneNumber: phoneNumber,
        address: address,
        email: currentUser?.email || 'Unknown',
        timestamp: serverTimestamp(),
        status: 'pending',
        rewardName: reward?.rewardName || 'No Name',
        rewardImageUrl: reward?.imageUrl || '',
        pointsRequired: rewardPoints, // Correctly storing points required
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
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Yes',
          onPress: () => onClose(),
        },
      ],
      { cancelable: false }
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={handleBackButtonPress}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackButtonPress}>
            <Icon name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>

          <Text style={styles.title}>Claim Reward</Text>
          
          {reward?.imageUrl && (
            <Image source={{ uri: reward.imageUrl }} style={styles.rewardImage} />
          )}
          
          <Text style={styles.rewardName}>{reward?.rewardName}</Text>
          <Text style={styles.rewardPoints}>Points Required: {rewardPoints > 0 ? rewardPoints : 'N/A'}</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            value={fullName}
            onChangeText={setFullName}
          />

          <TextInput
            style={styles.input}
            placeholder="Enter your phone number"
            value={phoneNumber}
            onChangeText={(text) => setPhoneNumber(text.replace(/[^0-9]/g, ''))}
            maxLength={11}
            keyboardType="phone-pad"
          />

          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleButton, usingCurrentLocation && styles.activeToggle]}
              onPress={() => setUsingCurrentLocation(true)}
            >
              <Text style={[styles.toggleText, usingCurrentLocation && styles.activeToggleText]}>
                Use Current Location
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, !usingCurrentLocation && styles.activeToggle]}
              onPress={() => setUsingCurrentLocation(false)}
            >
              <Text style={[styles.toggleText, !usingCurrentLocation && styles.activeToggleText]}>
                Enter Address Manually
              </Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder={usingCurrentLocation ? "Address (Auto-filled)" : "Enter your address"}
            value={address}
            onChangeText={(text) => {
              if (!usingCurrentLocation) {
                setAddress(text);
              }
            }}
            editable={!usingCurrentLocation}
          />

          <TouchableOpacity style={styles.claimButton} onPress={handleClaim}>
            <Text style={styles.buttonText}>Claim</Text>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '90%',
    padding: 20,
    backgroundColor: 'white',
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
    color: '#E0C55B',
  },
  input: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
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
    borderColor: '#ccc',
    marginHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeToggle: {
    backgroundColor: '#E0C55B',
    borderColor: '#E0C55B',
  },
  toggleText: {
    fontSize: 14,
  },
  activeToggleText: {
    color: '#fff',
  },
  claimButton: {
    padding: 15,
    backgroundColor: '#E0C55B',
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default ClaimingFormModal;
