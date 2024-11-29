import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
  TextInput,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { getDatabase, ref, set, get, push } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { useColorScheme } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const CreatePostModal = ({ visible, onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [location, setLocation] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');

  const auth = getAuth();
  const database = getDatabase();
  const storage = getStorage();
  const firestore = getFirestore();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  // Define the theme based on light or dark mode
  const theme = {
    light: {
      background: '#FFFFFF',
      text: '#000000',
      inputBorder: '#CCCCCC',
      buttonBackground: '#4CAF50',
      buttonText: '#FFFFFF',
      overlayBackground: 'rgba(0, 0, 0, 0.5)',
    },
    dark: {
      background: '#1E1E1E',
      text: '#E0E0E0',
      inputBorder: '#444444',
      buttonBackground: '#BB86FC',
      buttonText: '#E0E0E0',
      overlayBackground: 'rgba(255, 255, 255, 0.1)',
    },
  };

  const currentTheme = isDarkMode ? theme.dark : theme.light;

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Location permission is required to post.');
        return;
      }

      let { coords } = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });

      const userEmail = auth.currentUser?.email;
      if (!userEmail) {
        Alert.alert('Error', 'User is not authenticated.');
        return;
      }

      try {
        const userDocRef = doc(firestore, 'users', userEmail);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userDoc = userDocSnap.data();
          setDisplayName(userDoc.displayName || 'Anonymous');
          setPhotoURL(userDoc.photoURL || '');
        } else {
          setDisplayName('Anonymous');
          setPhotoURL('');
        }
      } catch (error) {
        console.error('Error fetching display name and photo URL:', error);
        setDisplayName('Anonymous');
        setPhotoURL('');
      }
    })();
  }, []);

  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image.');
    }
  };

  const uploadImage = async (uri) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const imageRef = storageRef(storage, `posts/${Date.now()}`);
      await uploadBytes(imageRef, blob);
      const downloadURL = await getDownloadURL(imageRef);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const generatePostId = async () => {
    try {
      const postsRef = ref(database, 'posts');
      const postSnapshot = await get(postsRef);
      const posts = postSnapshot.val() || {};
      const postCount = Object.keys(posts).length;
      return `postId${postCount + 1}`;
    } catch (error) {
      console.error('Error generating post ID:', error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (!title || !body) {
      Alert.alert('Error', 'Title and body are required.');
      return;
    }

    setUploading(true);

    try {
      let imageURL = '';
      if (imageUri) {
        imageURL = await uploadImage(imageUri);
      }

      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Location permission is required to post.');
        return;
      }

      let { coords } = await Location.getCurrentPositionAsync({});
      const newLocation = {
        latitude: coords.latitude,
        longitude: coords.longitude,
      };

      // Use Firebase push() to generate a unique post ID
      const postsRef = ref(database, 'posts');
      const newPostRef = push(postsRef); // Generate a new unique ID for the post
      const postId = newPostRef.key; // This is the unique post ID generated by Firebase

      // Save the post data
      await set(newPostRef, {
        title,
        body,
        imageURL,
        location: newLocation,
        createdAt: new Date().toISOString(),
        displayName,
        photoURL,
        email: auth.currentUser.email,
      });

      Alert.alert('Success', 'Post created successfully!');
      setTitle('');
      setBody('');
      setImageUri(null);
      setLocation(null);
      onClose();
      if (onSubmit) onSubmit(); // Notify parent component to refresh data
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={[styles.modalContainer, { backgroundColor: currentTheme.overlayBackground }]}>
        <View style={[styles.modalContent, { backgroundColor: currentTheme.background }]}>
          {imageUri && <Image source={{ uri: imageUri }} style={styles.imagePreview} />}
          <Picker
            selectedValue={title}
            style={[styles.picker]}
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
            style={[styles.input, { borderColor: currentTheme.inputBorder, color: currentTheme.text, backgroundColor: currentTheme.background }]}
            placeholder="Body"
            placeholderTextColor={isDarkMode ? '#888888' : '#AAAAAA'}
            value={body}
            onChangeText={setBody}
            multiline
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity
                onPress={pickImage}
                style={[styles.imageButton]}
              >
                <MaterialIcons name="attach-file" size={24} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              style={[styles.submitButton]}
            >
              <Text style={[styles.submitButtonText]}>
                {uploading ? 'Uploading...' : 'Post'}
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>x</Text>
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
  },
  modalContent: {
    width: '80%',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  picker: {
    width: '80%',
    height: 40,
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 5,
    marginRight: 'auto',
  },
  input: {
    width: '100%',
    height: 100,
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 10,
  },
  imageButton: {
    position: 'relative',
    backgroundColor: 'transparent',
    padding: 3,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    width: 50,
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#F6EF00',
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 10,
    borderRadius: 25,
    maxWidth: '50%',
    marginLeft: 'auto',
  },
  cancelButton: {
    position: 'absolute',
    backgroundColor: '#FF6347',
    top: 10,
    right: 10,
    padding: 0,
    borderRadius: 8,
    width: 30,
    height: 30,
  },
  cancelButtonText: {
    textAlign: 'center',
    color: '#fff',
    fontSize: 20,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    marginBottom: 10,
    borderRadius: 5,
  },
  submitButtonText: {
    textAlign: 'center',
    fontSize: 16,
  },
  imageButtonText: {
    textAlign: 'center',
    fontSize: 16,
  },
});

export default CreatePostModal;
