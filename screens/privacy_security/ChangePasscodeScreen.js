import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const ChangePasscodeScreen = ({ navigation }) => {
  const [currentPasscode, setCurrentPasscode] = useState('');
  const [newPasscode, setNewPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Get current user's email
  const { email } = getAuth().currentUser;

  // Firebase Firestore reference
  const db = getFirestore();

  // Helper function to check if the entered passcode matches the current one
  const validatePasscodes = () => {
    if (!currentPasscode || !newPasscode || !confirmPasscode) {
      Alert.alert('Error', 'All fields are required');
      return false;
    }

    if (newPasscode !== confirmPasscode) {
      Alert.alert('Error', 'New passcodes do not match');
      return false;
    }

    return true;
  };

  // Function to handle the passcode change
  const handleChangePasscode = async () => {
    if (!validatePasscodes()) {
      return;
    }

    setIsLoading(true);

    try {
      // Reference to the user's Firestore document
      const userDocRef = doc(db, 'users', email);

      // Get the document
      const docSnapshot = await getDoc(userDocRef);

      if (!docSnapshot.exists()) {
        Alert.alert('Error', 'User does not exist');
        return;
      }

      const userData = docSnapshot.data();
      const storedPasscode = userData?.passcode;

      // Verify if the current passcode entered matches the one stored in Firestore
      if (storedPasscode !== currentPasscode) {
        Alert.alert('Error', 'Current passcode is incorrect');
        return;
      }

      // Update the passcode in Firestore
      await setDoc(userDocRef, { passcode: newPasscode }, { merge: true });

      // Show success message and navigate back or to another screen
      Alert.alert('Success', 'Your passcode has been changed');
      navigation.goBack();  // Navigate back after success

    } catch (error) {
      console.error('Error changing passcode: ', error);
      Alert.alert('Error', 'Failed to change passcode');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <MaterialIcons name="arrow-back" size={24} color="#333" />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Change Passcode</Text>

      <View style={styles.inputContainer}>
        <MaterialIcons name="lock" size={24} color="#aaa" />
        <TextInput
          style={styles.input}
          placeholder="Enter Current Passcode"
          secureTextEntry
          value={currentPasscode}
          onChangeText={setCurrentPasscode}
        />
      </View>

      <View style={styles.inputContainer}>
        <MaterialIcons name="lock" size={24} color="#aaa" />
        <TextInput
          style={styles.input}
          placeholder="Enter New Passcode"
          secureTextEntry
          value={newPasscode}
          onChangeText={setNewPasscode}
        />
      </View>

      <View style={styles.inputContainer}>
        <MaterialIcons name="lock" size={24} color="#aaa" />
        <TextInput
          style={styles.input}
          placeholder="Confirm New Passcode"
          secureTextEntry
          value={confirmPasscode}
          onChangeText={setConfirmPasscode}
        />
      </View>

      <TouchableOpacity
        style={styles.buttonContainer}
        onPress={handleChangePasscode}
        disabled={isLoading}
      >
        <LinearGradient
          colors={isLoading ? ['#E0E0E0', '#E0E0E0'] : ['#F6EF00', '#D4C600']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientButton}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Change Passcode</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#f5f5f5',
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    marginLeft: 5,
    fontSize: 16,
    color: '#333',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 3,
  },
  input: {
    flex: 1,
    paddingHorizontal: 10,
    fontSize: 16,
    color: '#333',
  },
  buttonContainer: {
    marginTop: 20,
    borderRadius: 8,
    overflow: 'hidden',
  },
  gradientButton: {
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default ChangePasscodeScreen;
