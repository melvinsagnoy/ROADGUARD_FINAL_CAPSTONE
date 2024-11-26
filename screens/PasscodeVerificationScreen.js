import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Animated, Image, Dimensions } from 'react-native';
import { firestore } from '../firebaseConfig'; 
import { doc, getDoc } from 'firebase/firestore';
import { auth } from '../firebaseConfig'; 
import { useFonts } from 'expo-font';

const { width } = Dimensions.get('window');

const PasscodeVerificationScreen = ({ navigation }) => {
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const maxDigits = 4;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const [fontsLoaded] = useFonts({
    'Poppins-Regular': require('../assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Bold': require('../assets/fonts/Poppins-Bold.ttf'),
  });

  const handleNumberPress = (number) => {
    if (passcode.length < maxDigits) {
      setPasscode(passcode + number);
    }
  };

  const handleDeletePress = () => {
    if (passcode.length > 0) {
      setPasscode(passcode.slice(0, -1));
    }
  };

  const handleVerifyPasscode = async () => {
    if (passcode.length === maxDigits) {
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
        const docSnap = await getDoc(userDocRef);

        if (docSnap.exists()) {
          const userData = docSnap.data();
          const storedPasscode = userData.passcode;

          if (passcode === storedPasscode) {
            setLoading(false);
            navigation.navigate('Home');
          } else {
            setLoading(false);
            Alert.alert('Incorrect Passcode', 'Please enter the correct passcode.');
          }
        } else {
          setLoading(false);
          Alert.alert('User Data Not Found', 'User data does not exist in Firestore.');
        }
      } catch (error) {
        setLoading(false);
        console.error('Error verifying passcode:', error);
        Alert.alert('Verification Error', 'Failed to verify passcode.');
      }
    } else {
      Alert.alert('Incomplete Passcode', 'Please enter 4 digits.');
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
        <Text style={styles.title}>Enter Passcode</Text>
        <View style={styles.passcodeContainer}>
          {Array.from({ length: maxDigits }).map((_, index) => (
            <View key={index} style={[styles.passcodeCircle, passcode.length > index && styles.passcodeFilled]} />
          ))}
        </View>
        <View style={styles.numberGrid}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
            <TouchableOpacity
              key={number}
              style={styles.numberButton}
              onPress={() => handleNumberPress(String(number))}
            >
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
        <TouchableOpacity style={styles.verifyButton} onPress={handleVerifyPasscode} disabled={loading}>
          {loading ? (
            <Animated.View style={[styles.loadingContainer, { transform: [{ rotate: rotateInterpolate }] }]}>
              <Image source={require('../assets/tire.png')} style={styles.loadingImage} />
            </Animated.View>
          ) : (
            <Text style={styles.verifyButtonText}>Verify</Text>
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
    fontFamily: 'Poppins-Regular',
    backgroundColor: '#FFFAE6',
  },
  logo: {
    width: 200,
    height: 200,
    borderRadius: 25,
    top:200
  },
  passcodeBox: {
    width: '100%',
    backgroundColor: '#81818199', // Semi-transparent gray background
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 250,
  },
  title: {
    fontSize: 22,
    color: '#333',
    fontFamily: 'Poppins-Bold',
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
    width: '80%', // 80% of the width of the screen
  },
  numberButton: {
    width: '30%', // Ensure 3 numbers per row
    aspectRatio: 1, // Ensure square shape
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
    borderRadius: 100, // Make buttons circular
    backgroundColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 2, height: 2 },
  },
  numberText: {
    fontSize: 24,
    color: '#333',
  },
  verifyButton: {
    width: '80%',
    height: 50,
    backgroundColor: '#F6EF00',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    bottom: 100
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

export default PasscodeVerificationScreen;
