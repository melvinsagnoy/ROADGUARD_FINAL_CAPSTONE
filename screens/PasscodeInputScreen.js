import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Animated, Image, Dimensions } from 'react-native';
import { firestore, auth } from '../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore'; 
import { useFonts } from 'expo-font';

const { width } = Dimensions.get('window');

const PasscodeInputScreen = ({ navigation }) => {
  const [passcode, setPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [isConfirming, setIsConfirming] = useState(false); // To track if user is confirming passcode
  const [loading, setLoading] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const maxDigits = 4; // The length of the passcode
  const [fontsLoaded] = useFonts({
    'Poppins-Regular': require('../assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Bold': require('../assets/fonts/Poppins-Bold.ttf'),
  });
  const handleNumberPress = (number) => {
    if (isConfirming) {
      if (confirmPasscode.length < maxDigits) {
        setConfirmPasscode(prev => prev + number);
      }
    } else {
      if (passcode.length < maxDigits) {
        setPasscode(prev => prev + number);
      }
    }
  };

  const handleDeletePress = () => {
    if (isConfirming) {
      if (confirmPasscode.length > 0) {
        setConfirmPasscode(prev => prev.slice(0, -1));
      }
    } else {
      if (passcode.length > 0) {
        setPasscode(prev => prev.slice(0, -1));
      }
    }
  };

  const handleConfirmPress = async () => {
    if (!isConfirming) {
      // When first passcode is entered
      if (passcode.length === maxDigits) {
        setIsConfirming(true); // Switch to confirmation step
      } else {
        Alert.alert('Incomplete Passcode', 'Please enter 4 digits.');
      }
    } else {
      // When confirming the passcode
      if (confirmPasscode.length === maxDigits) {
        if (passcode === confirmPasscode) {
          // Passcodes match, proceed to save
          setLoading(true);
          Animated.loop(
            Animated.timing(rotateAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            })
          ).start();

          try {
            const user = auth.currentUser;
            if (!user) {
              throw new Error('User not authenticated');
            }

            const email = user.email;
            const userDocRef = doc(firestore, 'users', email);

            await updateDoc(userDocRef, {
              passcode: passcode,
            });

            setLoading(false);
            navigation.navigate('ProfileUpdate'); // Navigate to the next screen
          } catch (error) {
            setLoading(false);
            console.error('Error saving passcode:', error);
            Alert.alert('Save Error', 'Failed to save passcode.');
          }
        } else {
          // Passcodes do not match
          Alert.alert('Passcode Mismatch', 'The passcodes do not match. Please try again.');
          setPasscode('');
          setConfirmPasscode('');
          setIsConfirming(false);
        }
      } else {
        Alert.alert('Incomplete Passcode', 'Please enter 4 digits.');
      }
    }
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <Image source={require('../assets/icon.png')} style={styles.logo} />
      <View style={styles.passcodeBox}>
        <Text style={styles.title}>{isConfirming ? 'Confirm Passcode' : 'Set Passcode'}</Text>
        <View style={styles.passcodeContainer}>
          {Array.from({ length: maxDigits }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.passcodeCircle,
                (!isConfirming ? passcode.length : confirmPasscode.length) > index && styles.passcodeFilled,
              ]}
            />
          ))}
        </View>
        <View style={styles.numberGrid}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
            <TouchableOpacity key={number} style={styles.numberButton} onPress={() => handleNumberPress(String(number))}>
              <Text style={styles.numberText}>{number}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.numberButton} onPress={handleDeletePress}>
            <Text style={styles.numberText}>⌫</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.numberButton} onPress={() => handleNumberPress('0')}>
            <Text style={styles.numberText}>0</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.verifyButton} onPress={handleConfirmPress} disabled={loading}>
          {loading ? (
            <Animated.View style={[styles.loadingContainer, { transform: [{ rotate: rotateInterpolate }] }]}>
              <Image source={require('../assets/tire.png')} style={styles.loadingImage} />
            </Animated.View>
          ) : (
            <Text style={styles.verifyButtonText}>
              {isConfirming ? 'Confirm Passcode' : 'Set Passcode'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFAE6',
  },
  logo: {
    width: 150,
    height: 150,
    borderRadius: 25,
    top: 150,
  },
  passcodeBox: {
    width: '100%',
    backgroundColor: '#81818199',
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 180,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Poppins-Bold',
    color: '#333',
    marginBottom: 10,
  },
  passcodeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  passcodeCircle: {
    width: 20,
    height: 20,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#000',
    marginHorizontal: 10,
  },
  passcodeFilled: {
    backgroundColor: '#000',
  },
  numberGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '80%',
  },
  numberButton: {
    width: '30%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 5,
    borderRadius: 100,
    backgroundColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 2, height: 2 },
  },
  numberText: {
    fontSize: 24,
    fontFamily: 'Poppins-Regular',
    color: '#333',
  },
  verifyButton: {
    width: '80%',
    height: 50,
    backgroundColor: '#F6EF00',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    bottom: 80,
  },
  verifyButtonText: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#000',
  },
  loadingContainer: {
    position: 'absolute',
  },
  loadingImage: {
    width: 30,
    height: 30,
  },
});

export default PasscodeInputScreen;
