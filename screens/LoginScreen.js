import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Animated, Image } from 'react-native';
import { Formik } from 'formik';
import * as yup from 'yup';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import Icon from 'react-native-vector-icons/Ionicons';

const loginValidationSchema = yup.object().shape({
  emailOrPhone: yup.string().required('Email or phone number is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters long').required('Password is required'),
});

const LoginScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [initialValues, setInitialValues] = useState({ emailOrPhone: '', password: '' });
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const [fontsLoaded] = useFonts({
    Poppins: require('../assets/fonts/Poppins-Regular.ttf'),
  });

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const userLoggedIn = await AsyncStorage.getItem('userLoggedIn');
        if (userLoggedIn) {
          navigation.navigate('VerificationOptions');
        }
      } catch (error) {
        console.error('Error checking user status', error);
      }
    };

    checkUserStatus();
  }, [navigation]);

  useEffect(() => {
    const loadCredentials = async () => {
      try {
        const savedUserInfo = await AsyncStorage.getItem('userInfo');
        const savedRememberMe = await AsyncStorage.getItem('rememberMe');
        
        if (savedUserInfo && savedRememberMe === 'true') {
          const { emailOrPhone, password } = JSON.parse(savedUserInfo);
          setInitialValues({ emailOrPhone, password });
          setRememberMe(true); // Set the checkbox to checked
        }
      } catch (error) {
        console.error('Error loading credentials', error);
      }
    };

    loadCredentials();
  }, []);

  const handleLogin = async (emailOrPhone, password) => {
    setLoading(true);
    const auth = getAuth();

    try {
      const userCredential = await signInWithEmailAndPassword(auth, emailOrPhone, password);

      // Store credentials and rememberMe status in AsyncStorage if "Remember Me" is checked
      if (rememberMe) {
        await AsyncStorage.setItem('userInfo', JSON.stringify({ emailOrPhone, password }));
        await AsyncStorage.setItem('rememberMe', 'true');
      } else {
        // Clear stored credentials if "Remember Me" is not checked
        await AsyncStorage.removeItem('userInfo');
        await AsyncStorage.setItem('rememberMe', 'false');
      }

      await AsyncStorage.setItem('userLoggedIn', JSON.stringify({
        email: userCredential.user.email,
        uid: userCredential.user.uid,
      }));
      setLoading(false);
      navigation.navigate('VerificationOptions');
    } catch (error) {
      setLoading(false);
      Alert.alert('Login Error', error.message);
    }
  };

  const handleLogout = async () => {
    const auth = getAuth();
    try {
      await auth.signOut();
      // Clear credentials only if "Remember Me" was not checked
      const savedRememberMe = await AsyncStorage.getItem('rememberMe');
      if (savedRememberMe !== 'true') {
        await AsyncStorage.removeItem('userInfo');
      }
      await AsyncStorage.removeItem('userLoggedIn'); // Clear logged-in status
      navigation.navigate('Login'); // Navigate to login screen
    } catch (error) {
      console.error('Error during logout', error);
    }
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Top Background */}
      <View style={styles.topBackground}>
        <Image
          source={require('../assets/icon.png')}
          style={styles.logo}
        />
      </View>

      {/* Rounded Container for Login */}
      <View style={styles.loginContainer}>
        <Text style={styles.welcomeText}>Welcome back!</Text>
        <Formik
          validationSchema={loginValidationSchema}
          initialValues={initialValues}
          enableReinitialize={true}  // Important: Ensures Formik re-initializes with new values
          onSubmit={(values) => handleLogin(values.emailOrPhone, values.password)}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
            <>
              <TextInput
                style={styles.input}
                placeholder="Email or Phone"
                onChangeText={handleChange('emailOrPhone')}
                onBlur={handleBlur('emailOrPhone')}
                value={values.emailOrPhone}
                placeholderTextColor="#7C7A7A"
                keyboardType="email-address"
              />
              {touched.emailOrPhone && errors.emailOrPhone && (
                <Text style={styles.errorText}>{errors.emailOrPhone}</Text>
              )}

              <TextInput
                style={styles.input}
                placeholder="Password"
                onChangeText={handleChange('password')}
                onBlur={handleBlur('password')}
                value={values.password}
                secureTextEntry
                placeholderTextColor="#7C7A7A"
              />
              {touched.password && errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}

              <View style={styles.rememberRow}>
                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => setRememberMe(!rememberMe)}
                >
                  <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                    {rememberMe && <Icon name="checkmark" size={16} color="#FFF" />}
                  </View>
                  <Text style={styles.rememberMe}>Remember me</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                  <Text style={styles.forgotPassword}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.button}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <Animated.View style={[styles.loadingContainer, { transform: [{ rotate: rotateInterpolate }] }]}>
                    <Image source={require('../assets/tire.png')} style={styles.loadingImage} />
                  </Animated.View>
                ) : (
                  <Text style={styles.buttonText}>Sign In</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.googleSignIn}>
                <Image source={require('../assets/google_logo.png')} style={styles.googleLogo} />
                <Text style={styles.googleText}>Sign in with Google</Text>
              </TouchableOpacity>
            </>
          )}
        </Formik>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.registerText}>
            Don’t have an account? <Text style={styles.signUp}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
    width: 200,
    height: 200,
    borderRadius: 25,
    top: 50,
  },
  loginContainer: {
    width: '100%',
    backgroundColor: '#81818199',
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 50,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3A3A3A',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 50,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    borderRadius: 25,
    paddingHorizontal: 15,
    marginVertical: 10,
    backgroundColor: '#F1F1F1',
    color: '#333',
  },
  rememberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
    alignItems: 'center',
  },
  rememberMe: {
    color: '#7C7A7A',
    fontSize: 14,
  },
  forgotPassword: {
    color: '#F6EF00',
    fontSize: 14,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#F6EF00',
    borderRadius: 4,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#F6EF00',
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
    fontWeight: 'bold',
  },
  googleSignIn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#E0E0E0',
    borderWidth: 1,
    borderRadius: 25,
    height: 50,
    width: 190,
    marginVertical: 10,
    backgroundColor: '#FFF',
  },
  googleLogo: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  googleText: {
    fontSize: 16,
    color: '#333',
  },
  registerText: {
    marginTop: 20,
    color: '#7C7A7A',
    fontSize: 14,
  },
  signUp: {
    color: '#F6EF00',
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 12,
    color: 'red',
    marginBottom: 10,
  },
  loadingContainer: {
    position: 'absolute',
  },
  loadingImage: {
    width: 30,
    height: 30,
  },
});

export default LoginScreen;
