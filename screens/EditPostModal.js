import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

const EditPostModal = ({ visible, onClose, onSubmit, currentPostContent }) => {
  const [title, setTitle] = useState(currentPostContent.title);
  const [body, setBody] = useState(currentPostContent.body);

  // Use device preferences for light or dark mode
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  // Define themes based on device preference
  const theme = {
    background: isDarkMode ? '#1E1E1E' : '#FFFFFF',
    text: isDarkMode ? '#E0E0E0' : '#000000',
    inputBorder: isDarkMode ? '#444444' : '#CCCCCC',
    buttonBackground: isDarkMode ? '#BB86FC' : '#E0C55B',
    buttonText: isDarkMode ? '#E0E0E0' : '#000000',
    overlayBackground: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.5)',
  };

  const handleSave = () => {
    onSubmit({ title, body });
  };

  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View style={[styles.modalOverlay, { backgroundColor: theme.overlayBackground }]}>
        <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Post</Text>
          
          <Picker
            selectedValue={title}
            style={[styles.picker, { color: theme.text, borderColor: theme.inputBorder }]}
            onValueChange={(itemValue) => setTitle(itemValue)}
          >
            <Picker.Item label="Select an Issue" value="" />
            <Picker.Item label="Construction" value="Construction" />
            <Picker.Item label="Potholes" value="Potholes" />
            <Picker.Item label="Landslide" value="Landslide" />
            <Picker.Item label="Flooding" value="Flooding" />
            <Picker.Item label="Debris" value="Debris" />
            <Picker.Item label="Broken Glass" value="Broken Glass" />
            <Picker.Item label="Traffic Accidents" value="Traffic Accidents" />
            <Picker.Item label="Roadway Erosion" value="Roadway Erosion" />
            <Picker.Item label="Loose Gravel" value="Loose Gravel" />
            <Picker.Item label="Bridge Damage" value="Bridge Damage" />
          </Picker>

          <TextInput
            style={[
              styles.input,
              { borderColor: theme.inputBorder, color: theme.text, backgroundColor: theme.background },
            ]}
            value={body}
            onChangeText={setBody}
            placeholder="Body"
            placeholderTextColor={isDarkMode ? '#888888' : '#AAAAAA'}
            multiline
          />
          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={onClose} style={[styles.button, { backgroundColor: theme.buttonBackground }]}>
              <Text style={[styles.buttonText, { color: theme.buttonText }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} style={[styles.button, { backgroundColor: theme.buttonBackground }]}>
              <Text style={[styles.buttonText, { color: theme.buttonText }]}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  picker: {
    width: '100%',
    height: 40,
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
  },
  input: {
    height: 100,
    borderWidth: 1,
    marginBottom: 15,
    paddingLeft: 10,
    borderRadius: 5,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  buttonText: {
    fontWeight: 'bold',
  },
});

export default EditPostModal;
