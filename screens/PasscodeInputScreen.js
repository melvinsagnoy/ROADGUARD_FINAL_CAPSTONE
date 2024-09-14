import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Animated, Image, Dimensions } from 'react-native';
import { firestore, auth } from '../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore'; 

const { width } = Dimensions.get('window');

const PasscodeInputScreen = ({ navigation, route }) => {
  const [passcode, setPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [storedPasscode, setStoredPasscode] = useState('');
  const maxDigits = 4;
  const rotateAnim = useRef(new Animated.Value(0)).current;

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
    if (isConfirming) {
      if (confirmPasscode.length === maxDigits) {
        if (confirmPasscode === storedPasscode) {
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
              passcode: storedPasscode,
            });

            setLoading(false);
            navigation.navigate('ProfileUpdate');
          } catch (error) {
            setLoading(false);
            console.error('Error registering passcode:', error);
            Alert.alert('Registration Error', 'Failed to register passcode.');
          }
        } else {
          Alert.alert('Passcode Mismatch', 'The passcodes do not match.');
          setPasscode('');
          setConfirmPasscode('');
          setStoredPasscode('');
          setIsConfirming(false);
        }
      } else {
        Alert.alert('Incomplete Passcode', 'Please enter 4 digits.');
      }
    } else {
      if (passcode.length === maxDigits) {
        setStoredPasscode(passcode);
        setIsConfirming(true);
        setPasscode('');
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
      <Text style={styles.title}>Enter Passcode</Text>
      <View style={styles.passcodeContainer}>
        {Array.from({ length: maxDigits }).map((_, index) => (
          <View key={index} style={[styles.passcodeCircle, passcode.length > index && styles.passcodeFilled]} />
        ))}
      </View>
      <View style={styles.numberGrid}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
          <TouchableOpacity key={number} style={styles.numberButton} onPress={() => handleNumberPress(String(number))}>
            <Text style={styles.numberText}>{number}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.numberButton} onPress={() => handleDeletePress()}>
          <Text style={styles.numberText}>⟵</Text>
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
          <Text style={styles.verifyButtonText}>Verify</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f4e4',
  },
  logo: {
    width: width * 0.4,
    height: width * 0.4,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    color: '#333',
    marginBottom: 10,
  },
  passcodeContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  passcodeCircle: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    borderWidth: 2,
    borderColor: '#000',
    marginHorizontal: 10,
  },
  passcodeFilled: {
    backgroundColor: '#333',
  },
  numberGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
    width: '80%',
  },
  numberButton: {
    width: width * 0.2,
    height: width * 0.2,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 10,
    borderRadius: width * 0.1,
    backgroundColor: '#ddd',
  },
  numberText: {
    fontSize: 24,
    color: '#000',
  },
  verifyButton: {
    width: '80%',
    height: 50,
    backgroundColor: '#f7c02b',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginTop: 20,
  },
  verifyButtonText: {
    fontSize: 18,
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