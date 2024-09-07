import React, { useState } from 'react';
import { Modal, View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';

const PhoneNumberModal = ({ visible, onClose, email }) => {
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleSave = () => {
    onClose(phoneNumber);
  };

  return (
    <Modal
      transparent={true}
      visible={visible}
      onRequestClose={() => onClose(null)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Enter Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            onChangeText={setPhoneNumber}
            value={phoneNumber}
            keyboardType="phone-pad"
          />
          <TouchableOpacity style={styles.button} onPress={handleSave}>
            <Text style={styles.buttonText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeButton} onPress={() => onClose(null)}>
            <Text style={styles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    backgroundColor: '#FFF',
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 18,
    marginBottom: 10,
  },
  input: {
    width: '100%',
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  button: {
    width: '100%',
    height: 40,
    backgroundColor: '#E0C55B',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 16,
    color: '#FFF',
  },
  closeButton: {
    marginTop: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#E0C55B',
    textDecorationLine: 'underline',
  },
});

export default PhoneNumberModal;x