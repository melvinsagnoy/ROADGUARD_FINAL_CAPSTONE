import React, { useState, useRef } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert, Animated } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, firestore } from '../firebaseConfig';
import Icon from 'react-native-vector-icons/Ionicons';
import CombinedModal from './CombinedModal';
import PhoneNumberModal from './PhoneNumberModal';
import { doc, setDoc } from 'firebase/firestore';

const RegisterScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showCombinedModal, setShowCombinedModal] = useState(false);
  const [showPhoneNumberModal, setShowPhoneNumberModal] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const handleRegisterButtonPress = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Missing Fields', 'Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }

    if (!termsAccepted) {
      setShowCombinedModal(true);
      return;
    }

    try {
      setLoading(true);
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      setUserEmail(email);

      console.log('User registered with email:', email);

      // Use email directly as document ID
      const docRef = doc(firestore, 'users', email);

      // Set initial user data
      await setDoc(docRef, {
        email: email,
        needsProfileUpdate: true,
      });

      setLoading(false);
      rotateAnim.stopAnimation();
      setShowPhoneNumberModal(true);
    } catch (error) {
      setLoading(false);
      rotateAnim.stopAnimation();
      console.error('Error registering user:', error);
      Alert.alert('Registration Error', error.message);
    }
  };

  const handleTermsAgree = () => {
    setTermsAccepted(true);
    setShowCombinedModal(false);
  };

  const handleCombinedModalClose = () => {
    setShowCombinedModal(false);
  };

  const handlePhoneNumberModalClose = async (phoneNumber) => {
    setShowPhoneNumberModal(false);
    if (phoneNumber) {
      try {
        const docRef = doc(firestore, 'users', userEmail);

        // Update Firestore with phone number
        await setDoc(docRef, {
          phoneNumber: phoneNumber,
        }, { merge: true });

        console.log('Phone number saved successfully.');
      } catch (error) {
        console.error('Error updating phone number:', error);
        Alert.alert('Update Error', error.message);
      }
    }
    navigation.navigate('Passcode');
  };

  const handleCheckboxPress = () => {
    if (!termsAccepted) {
      Alert.alert('Agreement Required', 'You need to agree to the terms and privacy policy first.');
      return;
    }
    setTermsAccepted(!termsAccepted);
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Email"
        onChangeText={(text) => setEmail(text)}
        value={email}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Password"
          onChangeText={(text) => setPassword(text)}
          value={password}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setShowPassword(!showPassword)}
        >
          <Icon name={showPassword ? 'eye-off' : 'eye'} size={20} color="#E0C55B" />
        </TouchableOpacity>
      </View>
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Confirm Password"
          onChangeText={(text) => setConfirmPassword(text)}
          value={confirmPassword}
          secureTextEntry={!showConfirmPassword}
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
        >
          <Icon name={showConfirmPassword ? 'eye-off' : 'eye'} size={20} color="#E0C55B" />
        </TouchableOpacity>
      </View>
      <View style={styles.agreementContainer}>
        <TouchableOpacity
          style={[styles.customCheckbox, termsAccepted && styles.customCheckboxChecked]}
          onPress={handleCheckboxPress}
        >
          {termsAccepted && <Icon name="checkmark" size={20} color="#FFF" />}
        </TouchableOpacity>
        <Text style={styles.agreementText}>
          I agree to the <Text style={styles.link} onPress={() => setShowCombinedModal(true)}>Terms and Conditions</Text> and <Text style={styles.link} onPress={() => setShowCombinedModal(true)}>Privacy Policy</Text>.
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.button, { opacity: loading ? 0.5 : 1 }]}
        onPress={handleRegisterButtonPress}
        disabled={loading}
      >
        {loading ? (
          <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
            <Icon name="reload" size={24} color="#FFF" />
          </Animated.View>
        ) : (
          <Text style={styles.buttonText}>Register</Text>
        )}
      </TouchableOpacity>

      <CombinedModal
        visible={showCombinedModal}
        onAgree={handleTermsAgree}
        onClose={handleCombinedModalClose}
      />
      {userEmail && (
        <PhoneNumberModal
          visible={showPhoneNumberModal}
          onClose={handlePhoneNumberModalClose}
          email={userEmail}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#545151',
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  passwordContainer: {
    width: '100%',
    position: 'relative',
    marginBottom: 20,
  },
  passwordInput: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#FFFFFF',
    paddingRight: 50,
  },
  toggleButton: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: [{ translateY: -12 }],
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#E0C55B',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 10,
    position: 'relative',
  },
  buttonText: {
    fontSize: 18,
    color: '#FFF',
  },
  loginText: {
    marginTop: 20,
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
  },
  agreementContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  customCheckbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#E0C55B',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  customCheckboxChecked: {
    backgroundColor: '#E0C55B',
  },
  agreementText: {
    color: '#FFF',
    fontSize: 16,
  },
  link: {
    color: '#E0C55B',
    textDecorationLine: 'underline',
  },
});

export default RegisterScreen;