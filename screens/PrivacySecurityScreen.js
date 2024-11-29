import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, useColorScheme } from 'react-native';
import ReportIssueScreen from './privacy_security/ReportIssueScreen';
import CombinedModal from './CombinedModal';
import NotificationChannelsScreen from './privacy_security/NotificationChannelsScreen'; // Import NotificationChannelsScreen

const PrivacySecurityScreen = ({ navigation }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [modalType, setModalType] = useState('');
  const [userEmail, setUserEmail] = useState('');

  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  // Theme styles
  const theme = {
    light: {
      background: '#f0f3f4',
      text: '#2a2a2a',
      sectionTitle: '#424242',
      optionBackground: '#FFF',
      optionText: '#555',
      borderColor: '#ddd',
      backButtonBackground: '#5a98d2',
      backButtonText: '#FFF',
      modalBackground: 'rgba(0, 0, 0, 0.5)',
    },
    dark: {
      background: '#1e1e1e',
      text: '#e0e0e0',
      sectionTitle: '#c0c0c0',
      optionBackground: '#2c2c2c',
      optionText: '#b0b0b0',
      borderColor: '#444',
      backButtonBackground: '#3a6da1',
      backButtonText: '#FFF',
      modalBackground: 'rgba(255, 255, 255, 0.1)',
    },
  };

  const currentTheme = isDarkMode ? theme.dark : theme.light;

  const openModal = (type) => {
    setModalType(type);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setModalType('');
  };

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={[styles.title, { color: currentTheme.text }]}>Privacy & Security</Text>


        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: currentTheme.sectionTitle }]}>Security Settings</Text>
          <TouchableOpacity style={[styles.option, { backgroundColor: currentTheme.optionBackground, borderColor: currentTheme.borderColor }]} onPress={() => navigation.navigate('ChangePasscode')}>
            <Text style={[styles.optionText, { color: currentTheme.optionText }]}>Change Passcode</Text>
          </TouchableOpacity>
          
        </View>

        

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: currentTheme.sectionTitle }]}>Support</Text>
          <TouchableOpacity style={[styles.option, { backgroundColor: currentTheme.optionBackground, borderColor: currentTheme.borderColor }]} onPress={() => openModal('report')}>
            <Text style={[styles.optionText, { color: currentTheme.optionText }]}>Report Issues or Feedback</Text>
          </TouchableOpacity>

        </View>

        <TouchableOpacity style={[styles.backButton, { backgroundColor: currentTheme.backButtonBackground }]} onPress={() => navigation.goBack()}>
          <Text style={[styles.backButtonText, { color: currentTheme.backButtonText }]}>Back</Text>
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
        <View style={[styles.modalContainer, { backgroundColor: currentTheme.modalBackground }]}>
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
    fontWeight: '600',
    marginBottom: 10,
  },
  option: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  optionText: {
    fontSize: 16,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignSelf: 'center',
    marginTop: 20,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PrivacySecurityScreen;
