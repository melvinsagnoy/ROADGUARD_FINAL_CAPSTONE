import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Alert, ActivityIndicator, Image, useColorScheme  } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { database } from '../firebaseConfig'; // Import the properly initialized database
import { ref, get, set } from 'firebase/database'; // Import Firebase Realtime Database functions
import { getAuth, onAuthStateChanged } from 'firebase/auth'; // Import Firebase Authentication functions

const SubscriptionScreen = ({ navigation }) => {
  const [selectedOption, setSelectedOption] = useState('1 month');
  const [modalVisible, setModalVisible] = useState(false);
  const [webViewModalVisible, setWebViewModalVisible] = useState(false); // For WebView modal visibility
  const [checkoutUrl, setCheckoutUrl] = useState(null); // Store the PayMongo checkout URL
  const [loading, setLoading] = useState(false); // For handling loading states
  const [userId, setUserId] = useState(null); // Store the authenticated user's ID
  const [subscription, setSubscription] = useState(null); // State to store subscription details


  // Detect system color scheme
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  // Define themes
  const lightTheme = {
    background: '#F5F5F5',
    text: '#000',
    headerText: '#FFD700',
    subtitle: '#555',
    modalBackground: 'rgba(0,0,0,0.5)',
    confirmText: '#FFD700',
    cancelText: 'red',
    selectedBorderColor: '#FFD700',
    optionBackground: '#FFF',
    subscriptionBackground: '#EEE',
  };

  const darkTheme = {
    background: '#121212',
    text: '#E0E0E0',
    headerText: '#FFD700',
    subtitle: '#AAA',
    modalBackground: 'rgba(255,255,255,0.1)',
    confirmText: '#FFD700',
    cancelText: 'red',
    selectedBorderColor: '#FFD700',
    optionBackground: '#1E1E1E',
    subscriptionBackground: '#333',
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  useEffect(() => {
    const auth = getAuth(); // Initialize Firebase Auth
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid); // Store the user's UID when logged in
        await checkUserSubscription(user.uid); // Check if the user has an existing subscription
      } else {
        setUserId(null); // No user is logged in
        Alert.alert('Error', 'You must be logged in to manage subscriptions.');
        navigation.goBack(); // Navigate back if no user is logged in
      }
    });

    return () => unsubscribe(); // Cleanup the listener
  }, []);

  const checkUserSubscription = async (uid) => {
    try {
      const subscriptionRef = ref(database, `/subscriptions/${uid}`);
      const snapshot = await get(subscriptionRef);

      if (snapshot.exists()) {
        const userSubscription = snapshot.val();
        setSubscription(userSubscription); // Set the subscription details to state
      } else {
        setSubscription(null); // No subscription exists
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  const createPaymentLink = async (amount, description, remarks) => {
    try {
      const PAYMONGO_SECRET_KEY = 'sk_test_vitxniYC2jD3aDuHGc3AZriD'; // Replace with your PayMongo secret key

      const response = await fetch('https://api.paymongo.com/v1/links', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(PAYMONGO_SECRET_KEY)}`, // Base64 encode the secret key
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            attributes: {
              amount: amount * 100, // Convert PHP to centavos (e.g., 100 PHP becomes 10000 centavos)
              description: description,
              remarks: remarks,
              currency: 'PHP',
            },
          },
        }),
      });

      const data = await response.json();
      console.log('PayMongo Response:', data);

      if (data && data.data && data.data.attributes) {
        return data.data.attributes.checkout_url;
      } else {
        console.error('Invalid response from PayMongo:', data);
        Alert.alert('Error', 'Unable to create payment link. Invalid response from PayMongo.');
      }
    } catch (error) {
      console.error('Error creating payment link:', error);
      Alert.alert('Error', 'Unable to create payment link. Please try again.');
    }
  };

  const handleSubscription = (option) => {
    setSelectedOption(option);
    setModalVisible(true);
  };

  const handleProceedToPayment = async () => {
    setLoading(true);
    const amount = selectedOption === '1 month' ? 100 : selectedOption === '6 months' ? 500 : 1000;
    const description = `${selectedOption} subscriptio  n`;
    const remarks = 'Roadguard Subscription';

    const paymentLink = await createPaymentLink(amount, description, remarks);

    if (paymentLink) {
      setCheckoutUrl(paymentLink);
      setLoading(false);
      setModalVisible(false);
      setWebViewModalVisible(true);
    } else {
      setLoading(false);
      Alert.alert('Error', 'Failed to generate payment link.');
    }
  };

  const calculateEndDate = (durationInMonths) => {
    const currentDate = new Date();
    const endDate = new Date(currentDate);
    endDate.setMonth(currentDate.getMonth() + durationInMonths);
    return endDate.toISOString().split('T')[0];
  };

  const handlePaymentSuccess = async () => {
    const durationInMonths = selectedOption === '1 month' ? 1 : selectedOption === '6 months' ? 6 : 12;
    const amount = selectedOption === '1 month' ? '₱100' : selectedOption === '6 months' ? '₱500' : '₱1000';
    const startDate = new Date().toISOString().split('T')[0];
    const endDate = calculateEndDate(durationInMonths);
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      Alert.alert('Error', 'User not logged in');
      return;
    }

    const subscriptionDetails = {
      amount,
      duration: selectedOption,
      startDate,
      endDate,
      active: true,
      email: currentUser.email,
    };

    try {
      await set(ref(database, `/subscriptions/${currentUser.uid}`), subscriptionDetails);

      Alert.alert('Payment successful!', 'Thank you for subscribing.');

      setSubscription(subscriptionDetails);
      setWebViewModalVisible(false);
    } catch (error) {
      console.error('Failed to save subscription:', error);
      Alert.alert('Error', 'Failed to save your subscription. Please try again.');
    }
  };

  const handleWebViewNavigationStateChange = (navState) => {
    if (navState.url.includes('success')) {
      handlePaymentSuccess();
    } else if (navState.url.includes('failure')) {
      Alert.alert('Payment failed', 'Please try again.');
      setWebViewModalVisible(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <FontAwesome name="arrow-left" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>ROADGUARD</Text>
        <FontAwesome name="cog" size={24} color={theme.text} />
      </View>

      <Image source={require('../assets/sub_pic.png')} style={styles.image} />

      <Text style={[styles.title, { color: theme.headerText }]}>Upgrade to Premium</Text>
      <View>
        <Text style={[styles.subtitle, { color: theme.subtitle }]}>Use RoadGuard for unlimited hazard alerts</Text>
        <Text style={[styles.subtitle, { color: theme.subtitle }]}>Use RoadGuard ad-free</Text>
      </View>

      {subscription ? (
        <View style={[styles.subscriptionContainer, { backgroundColor: theme.subscriptionBackground }]}>
          <Text style={[styles.subscriptionText, { color: theme.text }]}>Your Subscription:</Text>
          <Text style={[styles.subscriptionDetails, { color: theme.text }]}>
            {subscription.duration} for {subscription.amount}
          </Text>
          <Text style={[styles.subscriptionDetails, { color: theme.text }]}>Start Date: {subscription.startDate}</Text>
          <Text style={[styles.subscriptionDetails, { color: theme.text }]}>End Date: {subscription.endDate}</Text>
          <Text style={[styles.subscriptionDetails, { color: theme.text }]}>Status: {subscription.active ? 'Active' : 'Inactive'}</Text>
        </View>
      ) : (
        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={[styles.option, selectedOption === '1 month' && { borderColor: theme.selectedBorderColor }]}
            onPress={() => handleSubscription('1 month')}
          >
            <Text style={[styles.optionText, { color: theme.text }]}>1 month</Text>
            <Text style={[styles.priceText, { color: theme.subtitle }]}>₱100</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.option, selectedOption === '6 months' && { borderColor: theme.selectedBorderColor }]}
            onPress={() => handleSubscription('6 months')}
          >
            <Text style={[styles.optionText, { color: theme.text }]}>6 months</Text>
            <Text style={[styles.priceText, { color: theme.subtitle }]}>₱500</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.option, selectedOption === '12 months' && { borderColor: theme.selectedBorderColor }]}
            onPress={() => handleSubscription('12 months')}
          >
            <Text style={[styles.optionText, { color: theme.text }]}>12 months</Text>
            <Text style={[styles.priceText, { color: theme.subtitle }]}>₱1000</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={[styles.modalContainer, { backgroundColor: theme.modalBackground }]}>
          <Text style={[styles.modalText, { color: theme.text }]}>Confirm Subscription: {selectedOption}</Text>
          <TouchableOpacity onPress={handleProceedToPayment}>
            <Text style={[styles.confirmButton, { color: theme.confirmText }]}>Proceed to Payment</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setModalVisible(false)}>
            <Text style={[styles.cancelButton, { color: theme.cancelText }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal animationType="slide" transparent visible={webViewModalVisible} onRequestClose={() => setWebViewModalVisible(false)}>
        <View style={{ flex: 1 }}>
          {checkoutUrl ? (
            <WebView
              source={{ uri: checkoutUrl }}
              startInLoadingState
              renderLoading={() => <ActivityIndicator size="large" color={theme.headerText} />}
              onNavigationStateChange={handleWebViewNavigationStateChange}
            />
          ) : (
            <ActivityIndicator size="large" color={theme.headerText} style={{ marginTop: 20 }} />
          )}
          <TouchableOpacity style={styles.cancelButton} onPress={() => setWebViewModalVisible(false)}>
            <Text style={[styles.cancelButtonText, { color: theme.cancelText }]}>Close Payment</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {loading && <ActivityIndicator size="large" color={theme.headerText} style={styles.loading} />}
    </View>
  );
};

export default SubscriptionScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#FFD700',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#555',
    marginBottom: 30,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  option: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    width: '30%',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    borderColor: '#FFD700',
  },
  optionText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  priceText: {
    fontSize: 16,
    color: '#555',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalText: {
    fontSize: 20,
    color: '#fff',
    marginBottom: 20,
  },
  confirmButton: {
    fontSize: 18,
    color: '#FFD700',
    marginBottom: 10,
  },
  cancelButton: {
    fontSize: 18,
    color: 'red',
  },
  cancelButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'red',
  },
  loading: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'contain',
    borderRadius: 10,
    marginBottom: 20,
  },
  subscriptionContainer: {
    backgroundColor: '#EEE',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  subscriptionText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subscriptionDetails: {
    fontSize: 16,
    marginBottom: 5,
  },
});
