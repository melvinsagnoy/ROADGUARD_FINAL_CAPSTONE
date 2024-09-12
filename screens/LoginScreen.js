import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Animated, Image } from 'react-native';
import { Formik } from 'formik';
import * as yup from 'yup';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';

const loginValidationSchema = yup.object().shape({
  emailOrPhone: yup.string().required('Email or phone number is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters long').required('Password is required'),
});

const LoginScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [fontsLoaded] = useFonts({
    Poppins: require('../assets/fonts/Poppins-Regular.ttf'),
  });
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const checkUserLoggedIn = async () => {
      const userLoggedIn = await AsyncStorage.getItem('userLoggedIn');
      if (userLoggedIn) {
        navigation.navigate('VerificationOptions');
      }
    };
    checkUserLoggedIn();
  }, []);

  const handleLogin = async (emailOrPhone, password) => {
    setLoading(true);
    const auth = getAuth();
    const db = getFirestore(); 

    try {
      let userCredential;
      let userEmail = emailOrPhone;

      if (emailOrPhone.includes('@')) {
        userCredential = await signInWithEmailAndPassword(auth, emailOrPhone, password);
      } else {
        const usersCollectionRef = collection(db, 'users');
        const q = query(usersCollectionRef, where('phoneNumber', '==', emailOrPhone));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          throw new Error('No user found with this phone number.');
        }

        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        userEmail = userData.email;
        userCredential = await signInWithEmailAndPassword(auth, userEmail, password);
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
          initialValues={{ emailOrPhone: '', password: '' }}
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
                <TouchableOpacity>
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
    borderRadius:25,
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
  },
  rememberMe: {
    color: '#7C7A7A',
    fontSize: 14,
  },
  forgotPassword: {
    color: '#F6EF00',
    fontSize: 14,
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

export default LoginScreen
