import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { getDatabase, ref, set } from 'firebase/database';
import { getAuth } from 'firebase/auth';

const ReportIssueScreen = ({ visible, onClose }) => {
  const [issueDescription, setIssueDescription] = useState('');

  // Handle the report submission
  const handleReport = () => {
    if (issueDescription === '') {
      Alert.alert('Error', 'Please enter a description for the issue');
      return;
    }

    // Get current user's email
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      const userEmail = user.email;
      const db = getDatabase();
      const reportId = new Date().getTime(); // Unique ID based on timestamp

      // Save the reported issue to the Realtime Database
      set(ref(db, 'reports/' + reportId), {
        userEmail,
        issueDescription,
        timestamp: new Date().toISOString(),
      })
        .then(() => {
          Alert.alert('Success', 'Your issue has been reported');
          setIssueDescription(''); // Reset input field after submission
          onClose();  // Close the modal after report submission
        })
        .catch((error) => {
          Alert.alert('Error', 'Failed to report the issue');
          console.error(error);
        });
    } else {
      Alert.alert('Error', 'User is not logged in');
    }
  };

  // Only render the modal if visible is true
  return (
    visible && (
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Report an Issue or Feedback</Text>
          <TextInput
            style={styles.input}
            placeholder="Describe your issue or Feedback"
            value={issueDescription}
            onChangeText={setIssueDescription}
            multiline
            numberOfLines={4}
          />
          <TouchableOpacity style={styles.button} onPress={handleReport}>
            <Text style={styles.buttonText}>Submit Report</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
  },
  modalContent: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    borderColor: '#ddd',
    borderWidth: 1,
    height: 100,
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
  },
  closeButton: {
    marginTop: 10,
    paddingVertical: 10,
    backgroundColor: '#f44336',
    borderRadius: 5,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFF',
    fontSize: 16,
  },
});

export default ReportIssueScreen;
