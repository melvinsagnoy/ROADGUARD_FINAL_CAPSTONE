import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebaseConfig'; // Import auth from your firebaseConfig

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePasswordReset = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }

    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, email);
      Alert.alert(
        'Password Reset',
        'A password reset email has been sent to your email address. Please check your inbox.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Forgot Password</Text>
      <Text style={styles.description}>
        Enter your email address below and we will send you instructions to reset your password.
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        placeholderTextColor="#7C7A7A"
      />
      <TouchableOpacity
        style={[styles.button, loading && styles.disabledButton]}
        onPress={handlePasswordReset}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Sending...' : 'Send Reset Email'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#FFFAE6',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3A3A3A',
    marginBottom: 20,
  },
  description: {
    fontSize: 14,
    color: '#7C7A7A',
    textAlign: 'center',
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
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#F6EF00',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
    marginVertical: 10,
  },
  disabledButton: {
    backgroundColor: '#E0C55B',
  },
  buttonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backText: {
    marginTop: 20,
    color: '#F6EF00',
    fontWeight: 'bold',
  },
});

export default ForgotPasswordScreen;
