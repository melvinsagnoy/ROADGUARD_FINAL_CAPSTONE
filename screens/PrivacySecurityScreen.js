import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import CombinedModal from './CombinedModal'; // Ensure you import CombinedModal
import TermsModal from './TermsModal';

const PrivacySecurityScreen = ({ navigation }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('');

  const openModal = (type) => {
    setModalType(type);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setModalType('');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Privacy & Security</Text>

        {/* Sections as you already have */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Privacy</Text>
          <TouchableOpacity style={styles.option} onPress={() => {/* Navigate to profile privacy settings */}}>
            <Text style={styles.optionText}>Profile Visibility</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.option} onPress={() => {/* Navigate to location sharing settings */}}>
            <Text style={styles.optionText}>Location Sharing</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.option} onPress={() => {/* Navigate to data collection preferences */}}>
            <Text style={styles.optionText}>Data Collection Preferences</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security Settings</Text>
          <TouchableOpacity style={styles.option} onPress={() => {/* Navigate to change password */}}>
            <Text style={styles.optionText}>Change Password</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.option} onPress={() => {/* Toggle two-factor authentication */}}>
            <Text style={styles.optionText}>Two-Factor Authentication</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.option} onPress={() => {/* Navigate to security questions */}}>
            <Text style={styles.optionText}>Security Questions</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications & Alerts</Text>
          <TouchableOpacity style={styles.option} onPress={() => {/* Navigate to alert preferences */}}>
            <Text style={styles.optionText}>Alert Preferences</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.option} onPress={() => {/* Navigate to notification channels */}}>
            <Text style={styles.optionText}>Notification Channels</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          <TouchableOpacity style={styles.option} onPress={() => {/* Navigate to export data */}}>
            <Text style={styles.optionText}>Export Data</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.option} onPress={() => {/* Handle account deletion */}}>
            <Text style={styles.optionText}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <TouchableOpacity style={styles.option} onPress={() => openModal('privacy')}>
            <Text style={styles.optionText}>Privacy Policy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.option} onPress={() => openModal('privacy')}>
            <Text style={styles.optionText}>Terms of Service</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <TouchableOpacity style={styles.option} onPress={() => {/* Navigate to support or report issues */}}>
            <Text style={styles.optionText}>Report Issues</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.option} onPress={() => {/* Show contact details */}}>
            <Text style={styles.optionText}>Contact Support</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal */}
      <CombinedModal
        visible={modalVisible}
        onClose={closeModal}
        type={modalType}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  option: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
    borderColor: '#ddd',
    borderWidth: 1,
  },
  optionText: {
    fontSize: 16,
  },
  backButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignSelf: 'center',
    marginTop: 20,
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 16,
  },
});

export default PrivacySecurityScreen;
