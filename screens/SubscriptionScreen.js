import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Modal, ActivityIndicator, useColorScheme } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

// Define theme styles
const lightTheme = {
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
    color: '#000',
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'contain',
    borderRadius: 10,
    marginBottom: 20,
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
    marginTop: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '90%',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
  },
  modalOption: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    width: '80%',
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 20,
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  proceedButton: {
    backgroundColor: '#FFD700',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
    width: '80%',
  },
  proceedButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  cancelButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '80%',
  },
  cancelButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'red',
  },
};

const darkTheme = {
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#121212',
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
    color: '#FFF',
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'contain',
    borderRadius: 10,
    marginBottom: 20,
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
    color: '#CCC',
    marginBottom: 30,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  option: {
    backgroundColor: '#333',
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
    color: '#FFF',
  },
  priceText: {
    fontSize: 16,
    color: '#CCC',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalView: {
    width: '90%',
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
  },
  modalOption: {
    backgroundColor: '#333',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    width: '80%',
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 20,
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#CCC',
  },
  proceedButton: {
    backgroundColor: '#FFD700',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
    width: '80%',
  },
  proceedButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  cancelButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '80%',
  },
  cancelButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'red',
  },
};

const SubscriptionScreen = ({ navigation }) => {
  const colorScheme = useColorScheme();
  const styles = colorScheme === 'dark' ? darkTheme : lightTheme;

  console.log(`Current theme: ${colorScheme}`); // Debugging line

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('credit_card'); // default payment method
  const [proofOfPayment, setProofOfPayment] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
    setIsModalVisible(true);
  };

  const handlePayment = async () => {
    if (!selectedOption) {
      Alert.alert('Error', 'Please select an option');
      return;
    }

    setLoading(true);
    // Handle payment processing here
    setLoading(false);
  };

  const handleImageUpload = async () => {
    // Request permission to access the device's camera roll
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'We need permission to access your photo library');
      return;
    }

    // Pick an image from the device's gallery
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setProofOfPayment(result.uri);
    }
  };

  const handleSubmit = () => {
    if (!proofOfPayment) {
      Alert.alert('Error', 'Please upload proof of payment');
      return;
    }

    setUploading(true);
    // Handle proof of payment submission here
    setUploading(false);
    Alert.alert('Success', 'Proof of payment submitted successfully');
    setProofOfPayment(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <FontAwesome name="arrow-left" size={24} color={colorScheme === 'dark' ? '#FFF' : '#000'} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ROADGUARD</Text>
        <FontAwesome name="cog" size={24} color={colorScheme === 'dark' ? '#FFF' : '#000'} />
      </View>

      <Image 
        source={require('../assets/sub_pic.png')} 
        style={styles.image}
      />

      <Text style={styles.title}>Upgrade to Premium</Text>
      <Text style={styles.subtitle}>Use Roadguard ad-free</Text>

      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[styles.option, selectedOption === 'basic' && styles.selectedOption]}
          onPress={() => handleOptionSelect('basic')}
        >
          <Text style={styles.optionText}>Basic</Text>
          <Text style={styles.priceText}>₱100/month</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.option, selectedOption === 'standard' && styles.selectedOption]}
          onPress={() => handleOptionSelect('standard')}
        >
          <Text style={styles.optionText}>Standard</Text>
          <Text style={styles.priceText}>₱250/quarter</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.option, selectedOption === 'premium' && styles.selectedOption]}
          onPress={() => handleOptionSelect('premium')}
        >
          <Text style={styles.optionText}>Premium</Text>
          <Text style={styles.priceText}>₱900/year</Text>
        </TouchableOpacity>
      </View>

      {/* Payment Modal */}
      <Modal
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Select Payment Method</Text>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setPaymentMethod('credit_card');
                handlePayment();
              }}
            >
              <Text style={styles.modalText}>Credit Card</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setPaymentMethod('paypal');
                handlePayment();
              }}
            >
              <Text style={styles.modalText}>PayPal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setIsModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Proof of Payment Modal */}
      <Modal
        transparent={true}
        visible={!!proofOfPayment}
        onRequestClose={() => setProofOfPayment(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Upload Proof of Payment</Text>
            {proofOfPayment ? (
              <>
                <Image
                  source={{ uri: proofOfPayment }}
                  style={styles.proofImage}
                />
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={handleSubmit}
                >
                  <Text style={styles.uploadButtonText}>Submit</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.placeholderImage}>
                <Text style={styles.placeholderText}>No image selected</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={handleImageUpload}
            >
              <Text style={styles.uploadButtonText}>Choose Image</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setProofOfPayment(null)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {loading && <ActivityIndicator size="large" color="#FFD700" />}
    </View>
  );
};

export default SubscriptionScreen;