import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import ReportIssueScreen from './privacy_security/ReportIssueScreen';
import CombinedModal from './CombinedModal';
import NotificationChannelsScreen from './privacy_security/NotificationChannelsScreen'; // Import NotificationChannelsScreen

const PrivacySecurityScreen = ({ navigation }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [modalType, setModalType] = useState('');
  const [userEmail, setUserEmail] = useState('');

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
          <TouchableOpacity style={styles.option} onPress={() => navigation.navigate('ChangePasscode')}>
            <Text style={styles.optionText}>Change Passcode</Text>
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
          <TouchableOpacity style={styles.option} onPress={() => setNotificationModalVisible(true)}>
            <Text style={styles.optionText}>Notification Channels</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <TouchableOpacity style={styles.option} onPress={() => openModal('report')}>
            <Text style={styles.optionText}>Report Issues or Feedback</Text>
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

      <ReportIssueScreen
        visible={modalVisible && modalType === 'report'}
        onClose={closeModal}
        userEmail={userEmail}
      />

      <CombinedModal
        visible={modalVisible && modalType !== 'report'}
        onClose={() => setModalVisible(false)}
        onAgree={() => console.log('Agreed!')}
        showAgreeButton={false}
      />

      {/* Notification Channels Modal */}
      <Modal
        visible={notificationModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setNotificationModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <NotificationChannelsScreen onClose={() => setNotificationModalVisible(false)} />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f3f4',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2a2a2a',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 10,
  },
  option: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
    borderColor: '#ddd',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  optionText: {
    fontSize: 16,
    color: '#555',
  },
  backButton: {
    backgroundColor: '#5a98d2',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignSelf: 'center',
    marginTop: 20,
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});

export default PrivacySecurityScreen;
