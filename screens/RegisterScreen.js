import React, { useState, useRef } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert, Animated, Image, ScrollView } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, firestore } from '../firebaseConfig';
import Icon from 'react-native-vector-icons/Ionicons';
import CombinedModal from './CombinedModal'; // Import the CombinedModal component
import PhoneNumberModal from './PhoneNumberModal'; // Import PhoneNumberModal
import { doc, setDoc } from 'firebase/firestore';
import { useFonts } from 'expo-font';

const RegisterScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showCombinedModal, setShowCombinedModal] = useState(false); // Modal visibility state
  const [showPhoneNumberModal, setShowPhoneNumberModal] = useState(false); // Phone number modal visibility
  const [userEmail, setUserEmail] = useState(null);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const [fontsLoaded] = useFonts({
    'Poppins-Regular': require('../assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Bold': require('../assets/fonts/Poppins-Bold.ttf'),
  });

  if (!fontsLoaded) {
    return null;
  }

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

      const docRef = doc(firestore, 'users', email);
      await setDoc(docRef, {
        email: email,
        createdAt: new Date().toISOString(),
      });

      setLoading(false);
      rotateAnim.stopAnimation();
      setShowPhoneNumberModal(true); // Show phone number modal after registration
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
    setShowPhoneNumberModal(false); // Close phone number modal after input
    if (phoneNumber) {
      try {
        const docRef = doc(firestore, 'users', userEmail);
        await setDoc(docRef, { phoneNumber: phoneNumber }, { merge: true });

        console.log('Phone number saved successfully.');
      } catch (error) {
        console.error('Error updating phone number:', error);
        Alert.alert('Update Error', error.message);
      }
    }
    navigation.navigate('Passcode'); // Navigate to Passcode screen after saving phone number
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      {/* Top Background */}
      <View style={styles.topBackground}>
        <Image
          source={require('../assets/icon.png')} // Assuming this is your app icon
          style={styles.logo}
        />
      </View>

      {/* Rounded Container for Registration */}
      <View style={styles.registerContainer}>
        <Text style={styles.title}>Create your Account</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          onChangeText={(text) => setEmail(text)}
          value={email}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#7C7A7A"
        />
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.input}
            placeholder="Password"
            onChangeText={(text) => setPassword(text)}
            value={password}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            placeholderTextColor="#7C7A7A"
          />
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Icon name={showPassword ? 'eye-off' : 'eye'} size={20} color="#000" />
          </TouchableOpacity>
        </View>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            onChangeText={(text) => setConfirmPassword(text)}
            value={confirmPassword}
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
            placeholderTextColor="#7C7A7A"
          />
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            <Icon name={showConfirmPassword ? 'eye-off' : 'eye'} size={20} color="#000" />
          </TouchableOpacity>
        </View>

        <View style={styles.agreementContainer}>
          <TouchableOpacity
            style={[styles.customCheckbox, termsAccepted && styles.customCheckboxChecked]}
            onPress={() => setTermsAccepted(!termsAccepted)}
          >
            {termsAccepted && <Icon name="checkmark" size={20} color="#FFF" />}
          </TouchableOpacity>
          <Text style={styles.agreementText}>
            I agree to the{' '}
            <Text style={styles.link} onPress={() => setShowCombinedModal(true)}>Terms and Conditions</Text>{' '}
            and <Text style={styles.link} onPress={() => setShowCombinedModal(true)}>Privacy Policy</Text>.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleRegisterButtonPress}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Register</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.registerText}>
            Already have an account? <Text style={styles.signIn}>Log In</Text>
          </Text>
        </TouchableOpacity>
      </View>

      {/* CombinedModal for Terms and Privacy Policy */}
      <CombinedModal
        visible={showCombinedModal}
        onAgree={handleTermsAgree}
        onClose={handleCombinedModalClose}
      />

      {/* PhoneNumberModal for entering phone number */}
      {showPhoneNumberModal && (
        <PhoneNumberModal 
          visible={showPhoneNumberModal}
          onClose={handlePhoneNumberModalClose}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFAE6',
    paddingVertical: 20,
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFAE6',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  topBackground: {
    width: '100%',
    height: '35%',
    backgroundColor: '#FFFAE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 150,
    height: 150,
    borderRadius: 25,
    top: 30,
  },
  registerContainer: {
    width: '100%',
    backgroundColor: '#81818199', // Semi-transparent gray background
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: '#3A3A3A',
    marginBottom: 10,
  },
  input: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F1F1F1',
    paddingHorizontal: 15,
    marginVertical: 10,
    color: '#333',
    fontFamily: 'Poppins-Regular',
  },
  passwordContainer: {
    width: '100%',
    position: 'relative',
  },
  toggleButton: {
    position: 'absolute',
    right: 15,
    top: '50%',
    transform: [{ translateY: -12 }],
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#F6EF00',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
    marginVertical: 10,
  },
  buttonText: {
    color: '#000',
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
  },
  agreementContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
  },
  customCheckbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#F6EF00',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  customCheckboxChecked: {
    backgroundColor: '#F6EF00',
  },
  agreementText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#000',
  },
  link: {
    color: '#F6EF00',
    fontFamily: 'Poppins-Bold',
  },
  registerText: {
    marginTop: 20,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#7C7A7A',
  },
  signIn: {
    color: '#F6EF00',
    fontFamily: 'Poppins-Bold',
  },
});

export default RegisterScreen;
