import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput, Image, Modal, FlatList, Alert, ScrollView, useColorScheme } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { auth, firestore, storage , database} from '../firebaseConfig';
import { doc, getDoc, updateDoc, setDoc, collection, query, orderBy, getDocs } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NavBar from './NavBar';
import { ref as dbRef, get, onValue, push } from 'firebase/database';  // For Realtime Database
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';  // For Storage
import ClaimingFormModal from './ClaimingFormModal'; 
import { useFonts } from 'expo-font';

// Chat modal component
const ChatModal = ({ visible, onClose, claimId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  // Fetch messages for the specific claim
  useEffect(() => {
    if (claimId) {
      const chatRef = dbRef(database, `claim_reward/${claimId}/chat`);
      onValue(chatRef, (snapshot) => {
        if (snapshot.exists()) {
          const chatMessages = Object.values(snapshot.val());
          setMessages(chatMessages);
        } else {
          setMessages([]);
        }
      });
    }
  }, [claimId]);

  // Send a message
  const sendMessage = async () => {
    if (!newMessage.trim()) {
      Alert.alert('Error', 'Message cannot be empty.');
      return;
    }

    try {
      const chatRef = dbRef(database, `claim_reward/${claimId}/chat`);
      const messageData = {
        sender: auth.currentUser?.email || 'Anonymous',
        text: newMessage,
        timestamp: Date.now(),
      };
      await push(chatRef, messageData);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.chatModal}>
          <Text style={styles.modalTitle}>Chat with Admin</Text>
          <FlatList
            data={messages}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={styles.chatMessage}>
                <Text style={styles.chatSender}>{item.sender}</Text>
                <Text style={styles.chatText}>{item.text}</Text>
                <Text style={styles.chatTimestamp}>
                  {new Date(item.timestamp).toLocaleTimeString()}
                </Text>
              </View>
            )}
            style={styles.chatList}
          />
          <View style={styles.chatInputContainer}>
            <TextInput
              style={styles.chatInput}
              placeholder="Type a message..."
              value={newMessage}
              onChangeText={setNewMessage}
            />
            <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
              <FontAwesome name="send" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const ProfileScreen = ({ navigation }) => {
  // Light and dark theme definitions
// Define light and dark themes
const lightTheme = {
  background: '#F5F5F5',
  text: '#000',
  cardBackground: '#FFD700',
  buttonBackground: '#FFF',
  inputBackground: '#FFF',
  modalBackground: '#FFF',
  closeButtonBackground: '#FF6347',
  redeemButtonBackground: '#E0C55B',
};

const darkTheme = {
  background: '#121212',
  text: '#E0E0E0',
  cardBackground: '#333',
  buttonBackground: '#444',
  inputBackground: '#333',
  modalBackground: '#1F1F1F',
  closeButtonBackground: '#FF6347',
  redeemButtonBackground: '#BB86FC',
};
const [fontsLoaded] = useFonts({
  'Poppins-Regular': require('../assets/fonts/Poppins-Regular.ttf'),
  'Poppins-Bold': require('../assets/fonts/Poppins-Bold.ttf'),
});
const colorScheme = useColorScheme();
const isDarkMode = colorScheme === 'dark';
const theme = isDarkMode ? darkTheme : lightTheme;
 const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [leaderboardVisible, setLeaderboardVisible] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [newName, setNewName] = useState('');
  const [imageUri, setImageUri] = useState('');
  const [newProfileImageUri, setNewProfileImageUri] = useState('');
  const [points, setPoints] = useState(0);
  const [needsNameUpdate, setNeedsNameUpdate] = useState(false);
  const [needsImageUpdate, setNeedsImageUpdate] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [rewardsModalVisible, setRewardsModalVisible] = useState(false);
  const [rewards, setRewards] = useState([]);
  const [claimingFormModalVisible, setClaimingFormModalVisible] = useState(false); // State for claiming form modal
  const [selectedReward, setSelectedReward] = useState(null); // State to store the selected reward
  const [redeemedRewards, setRedeemedRewards] = useState([]);
const [redeemedRewardsModalVisible, setRedeemedRewardsModalVisible] = useState(false);
const [chatModalVisible, setChatModalVisible] = useState(false);
const [selectedClaimId, setSelectedClaimId] = useState(null);
  
  

  useEffect(() => {
  const unsubscribe = auth.onAuthStateChanged(async (user) => {
    if (user) {
      setUser(user);
      setLoading(true);

      try {
        await AsyncStorage.setItem('userEmail', user.email);
        const userData = await fetchUserData(user.email);
        setUser((prevUser) => ({ ...prevUser, displayName: userData.displayName, photoURL: userData.photoURL }));
        setImageUri(userData.photoURL || 'https://via.placeholder.com/100'); // Default image URL
        setPhoneNumber(userData.phoneNumber || 'Not Provided'); // Set phone number
        setPoints(calculateTotalPoints(userData.scores));

        // Check if initial setup is required
        checkInitialSetup();
      } catch (error) {
        console.error('Error setting user credentials:', error);
      }

      setLoading(false);
    } else {
      setUser(null);
      setLoading(false);
      navigation.navigate('Landing');
    }
  });

  return () => unsubscribe();
}, [navigation]);

  const fetchUserData = async (email) => {
  const userRef = doc(firestore, 'users', email);
  const docSnap = await getDoc(userRef);
  if (docSnap.exists()) {
    console.log('User data fetched:', docSnap.data());
    return docSnap.data();
  } else {
    console.log('No user data found for:', email);
    return {};
  }
};

const fetchRewards = async () => {
    const rewardsRef = dbRef(database, 'rewards'); // Adjust the path as necessary
    try {
        const snapshot = await get(rewardsRef);
        if (snapshot.exists()) {
            const rewardsData = snapshot.val();
            const rewardsArray = Object.keys(rewardsData).map(key => ({
                id: key,
                ...rewardsData[key]
            }));
            setRewards(rewardsArray);
            setRewardsModalVisible(true); // Show modal when rewards are fetched
        } else {
            console.log('No rewards found.');
        }
    } catch (error) {
        console.error('Error fetching rewards:', error);
    }
};

 const fetchRedeemedRewards = async () => {
  try {
    const email = auth.currentUser?.email?.replace('.', '_').replace('@', '_');
    if (!email) {
      throw new Error('User email is undefined');
    }

    console.log('Sanitized email:', email); // Log the sanitized email

    const redeemedRewardsPath = `claim_reward/${email}`;
    console.log('Fetching data from path:', redeemedRewardsPath); // Log the database path

    const redeemedRewardsRef = dbRef(database, redeemedRewardsPath);
    const snapshot = await get(redeemedRewardsRef);

    if (!snapshot.exists()) {
      console.log('No redeemed rewards found.');
      return;
    }

    const data = snapshot.val();
    console.log('Data fetched:', data); // Log the fetched data

    if (data) {
      setRedeemedRewards([data]);
      setRedeemedRewardsModalVisible(true);
    }
  } catch (error) {
    console.error('Error fetching redeemed rewards:', error);
  }
};


  

const updatePhoneNumber = async () => {
  try {
    const email = auth.currentUser.email;
    const userRef = doc(firestore, 'users', email);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      await updateDoc(userRef, {
        phoneNumber: newPhoneNumber,
      });
      setPhoneNumber(newPhoneNumber);
      Alert.alert('Success', 'Phone number updated successfully!');
    } else {
      await setDoc(userRef, {
        phoneNumber: newPhoneNumber,
      });
      setPhoneNumber(newPhoneNumber);
      Alert.alert('Success', 'Phone number added successfully!');
    }
  } catch (error) {
    console.error('Error updating phone number:', error);
    Alert.alert('Error', 'Failed to update phone number.');
  }
};
  const handleClaimReward = async (userDetails) => {
    if (selectedReward) {
      // Handle reward claiming logic here...
      Alert.alert('Success', `Reward claimed with details: ${userDetails}`);
    }
  };

  const handleRedeem = (rewardId) => {
    console.log('Reward ID:', rewardId); // Check if it's missing or undefined
    if (!rewardId) {
      Alert.alert('Error', 'Reward ID is missing');
      return;
    }
    const reward = rewards.find(item => item.id === rewardId);
    if (reward && points >= reward.pointsRequired) {
      setSelectedReward(reward); // Set the selected reward
      setClaimingFormModalVisible(true);
    } else {
      Alert.alert('Insufficient Points', 'You do not have enough points to redeem this reward.');
    }
  };

const closeClaimingFormModal = () => {
  setClaimingFormModalVisible(false);
  setSelectedReward(null); // Reset the selected reward
};

 const handleRedeemRewards = () => {
    fetchRewards();
  };

  const closeModal = () => {
    setRewardsModalVisible(false); // Close the modal
  };

  const checkInitialSetup = async () => {
  try {
    const userRef = doc(firestore, 'users', auth.currentUser.email);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      const userData = docSnap.data();
      const nameComplete = !!userData.displayName;
      const imageComplete = !!userData.photoURL;

      setNeedsNameUpdate(!nameComplete);
      setNeedsImageUpdate(!imageComplete);
      setIsProfileComplete(nameComplete && imageComplete);

      if (!nameComplete || !imageComplete) {
        setEditMode(true); // Show profile update modal
      }
    }
  } catch (error) {
    console.error('Error checking initial setup:', error);
  }
};

  const calculateTotalPoints = (scores) => {
    if (!scores || !Array.isArray(scores)) return 0;
    return scores.reduce((total, scoreEntry) => total + scoreEntry.score, 0);
  };

  const fetchLeaderboardData = async () => {
    try {
      const leaderboardQuery = query(
        collection(firestore, 'users'),
        orderBy('scores', 'desc')
      );

      const leaderboardSnapshot = await getDocs(leaderboardQuery);
      const leaderboard = [];

      leaderboardSnapshot.forEach((doc) => {
        const data = doc.data();
        const highestScore = Math.max(...data.scores.map(score => score.score), 0); // Safeguard in case of empty scores
        leaderboard.push({
          displayName: data.displayName || 'Anonymous',
          score: highestScore,
        });
      });

      leaderboard.sort((a, b) => b.score - a.score); // Sort leaderboard data by score descending
      setLeaderboardData(leaderboard);
      setLeaderboardVisible(true);
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
    }
  };

  const handleLogout = async () => {
  try {
    await AsyncStorage.removeItem('userLoggedIn'); // Clear login persistence but keep credentials if "Remember Me" is checked
    await auth.signOut();
    navigation.navigate('Landing'); // Navigate back to login
  } catch (error) {
    console.error('Error logging out:', error);
    Alert.alert('Error', 'Failed to log out. Please try again.');
  }
};



  const updateDisplayName = async () => {
    try {
      const email = auth.currentUser.email;
      const userRef = doc(firestore, 'users', email);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        await updateDoc(userRef, {
          displayName: newName,
        });
        setUser({ ...user, displayName: newName });
        Alert.alert('Success', 'Display name updated successfully!');
      } else {
        await setDoc(userRef, {
          displayName: newName,
        });
        setUser({ ...user, displayName: newName });
        Alert.alert('Success', 'Display name added successfully!');
      }
    } catch (error) {
      console.error('Error updating display name:', error);
      Alert.alert('Error', 'Failed to update display name.');
    }
  };

  const pickImage = async () => {
  try {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const pickedImageUri = result.assets[0].uri;
      setNewProfileImageUri(pickedImageUri);

      const downloadURL = await uploadImage(pickedImageUri);
      await updateProfileImage(downloadURL);
    } else {
      console.error('Image picking was cancelled or URI is undefined');
    }
  } catch (error) {
    console.error('Error picking image:', error);
    Alert.alert('Error', 'Failed to pick image.');
  }
};

const uploadImage = async (uri) => {
  try {
    console.log('Starting image upload...');
    const response = await fetch(uri);
    const blob = await response.blob();
    const storageRef = ref(storage, `images/${auth.currentUser.email}`);
    await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(storageRef);
    console.log('Image uploaded successfully. Download URL:', downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

const updateProfileImage = async (downloadURL) => {
  const email = auth.currentUser.email;
  const userRef = doc(firestore, 'users', email);

  try {
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      await updateDoc(userRef, {
        photoURL: downloadURL,
      });
      console.log('Profile image URL updated in Firestore:', downloadURL);
    } else {
      await setDoc(userRef, {
        photoURL: downloadURL,
      });
      console.log('Profile image URL set in new Firestore document:', downloadURL);
    }
    setImageUri(downloadURL);
  } catch (error) {
    console.error('Error updating profile image:', error);
  }
};
  const handleNavigation = (screen) => {
  if (isProfileComplete) {
    navigation.navigate(screen);
  } else {
    Alert.alert(
      'Profile Incomplete',
      'Please complete your profile before proceeding.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Complete Profile',
          onPress: () => setEditMode(true),
        },
      ],
      { cancelable: false }
    );
  }
};

  const saveProfileChanges = async () => {
  try {
    if (newName) {
      await updateDisplayName();
    }
if (newPhoneNumber.trim()) {
      await updatePhoneNumber();
    }
    if (newProfileImageUri) {
      const downloadURL = await uploadImage(newProfileImageUri);
      await updateProfileImage(downloadURL);
    }

    // Check if profile is complete
    const userData = await fetchUserData(auth.currentUser.email);
    const nameComplete = !!userData.displayName;
    const imageComplete = !!userData.photoURL;
    if (nameComplete && imageComplete) {
      setEditMode(false);
      setIsProfileComplete(true);
      Alert.alert('Success', 'Profile updated successfully!');
    } else {
      setIsProfileComplete(false);
      Alert.alert('Error', 'Please complete all profile fields.');
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    Alert.alert('Error', 'Failed to update profile.');
  }
};

const openChatModal = (claimId) => {
  setSelectedClaimId(claimId);
  setChatModalVisible(true);
};

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
      <ActivityIndicator size="large" color={theme.text} />
    </View>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Profile Card */}
      <View style={[styles.profileCard, { backgroundColor: theme.cardBackground }]}>
        <TouchableOpacity onPress={pickImage}>
          <Image source={{ uri: newProfileImageUri || imageUri }} style={styles.profileImage} />
        </TouchableOpacity>
        <Text style={[styles.name, { color: theme.text }]}>{user.displayName || 'No Name'}</Text>
        <Text style={[styles.email, { color: theme.text }]}>{user.email}</Text>
        <Text style={[styles.phoneNumber, { color: theme.text }]}>{phoneNumber}</Text>
        <Text style={[styles.points, { color: theme.text }]}>{points} points</Text>
      </View>
  
      {/* Button Row */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={[styles.button, { backgroundColor: theme.buttonBackground }]} onPress={handleRedeemRewards}>
          <Text style={[styles.buttonText, { color: theme.text }]}>Redeem Rewards</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, { backgroundColor: theme.buttonBackground }]} onPress={() => handleNavigation('SubscriptionScreen')}>
          <Text style={[styles.buttonText, { color: theme.text }]}>Subscribe</Text>
        </TouchableOpacity>
      </View>
  
      {/* Options */}
      <View style={styles.options}>
        <TouchableOpacity style={styles.option} onPress={() => setEditMode(true)}>
          <FontAwesome name="user" size={24} color={theme.text} />
          <Text style={[styles.optionText, { color: theme.text }]}>Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.option} onPress={fetchLeaderboardData}>
          <FontAwesome name="star" size={24} color={theme.text} />
          <Text style={[styles.optionText, { color: theme.text }]}>Leaderboards</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.option} onPress={fetchRedeemedRewards}>
          <FontAwesome name="gift" size={24} color={theme.text} />
          <Text style={[styles.optionText, { color: theme.text }]}>View Redeemed Rewards</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.option} onPress={() => navigation.navigate('PrivacySecurityScreen')}>
          <FontAwesome name="shield" size={24} color={theme.text} />
          <Text style={[styles.optionText, { color: theme.text }]}>Privacy & Security</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.option} onPress={handleLogout}>
          <FontAwesome name="sign-out" size={24} color={theme.text} />
          <Text style={[styles.optionText, { color: theme.text }]}>Log out</Text>
        </TouchableOpacity>
      </View>
  
      {/* Leaderboard Modal */}
      <Modal animationType="slide" transparent={true} visible={leaderboardVisible} onRequestClose={() => setLeaderboardVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={[styles.leaderboardModal, { backgroundColor: theme.modalBackground }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Leaderboard</Text>
            <FlatList
              data={leaderboardData}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item, index }) => (
                <View style={styles.leaderboardItem}>
                  <Text style={[styles.rankText, { color: theme.text }]}>{index + 1}</Text>
                  <Text style={[styles.leaderboardText, { color: theme.text }]}>{item.displayName}</Text>
                  <Text style={[styles.leaderboardText, { color: theme.text }]}>{item.score}</Text>
                </View>
              )}
            />
            <TouchableOpacity style={[styles.closeButton, { backgroundColor: theme.closeButtonBackground }]} onPress={() => setLeaderboardVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
  
      {/* Edit Profile Modal */}
      <Modal animationType="slide" transparent={true} visible={editMode} onRequestClose={() => setEditMode(false)}>
        <View style={styles.editProfileContainer}>
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text }]}
            placeholder="Enter new display name"
            placeholderTextColor={isDarkMode ? '#888' : '#aaa'}
            value={newName}
            onChangeText={setNewName}
          />
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text }]}
            placeholder="New Phone Number"
            placeholderTextColor={isDarkMode ? '#888' : '#aaa'}
            value={newPhoneNumber}
            onChangeText={setNewPhoneNumber}
          />
          <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
            <Text style={styles.imageButtonText}>Change Profile Image</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={saveProfileChanges}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.cancelButton, { backgroundColor: theme.closeButtonBackground }]}
            onPress={() => setEditMode(false)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
  

      {/* Rewards Modal */}
      <Modal animationType="slide" transparent={true} visible={rewardsModalVisible} onRequestClose={() => setRewardsModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={[styles.rewardModal, { backgroundColor: theme.modalBackground }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Available Rewards</Text>
            <Text style={[styles.pointsText, { color: theme.text }]}>Your Points: {points}</Text>
            <ScrollView contentContainerStyle={styles.rewardsGrid}>
              {rewards.map((item, index) => (
                <View key={item.id} style={styles.rewardItem}>
                  <Image source={{ uri: item.imageUrl }} style={styles.rewardImage} />
                  <View style={styles.rewardDetails}>
                    <Text style={[styles.rewardText, { color: theme.text }]}>{item.rewardName}</Text>
                    <Text style={[styles.rewardPoints, { color: theme.text }]}>{item.pointsRequired} points</Text>
                  </View>
                  <TouchableOpacity style={[styles.redeemButton, { backgroundColor: theme.redeemButtonBackground }]} onPress={() => handleRedeem(item.id)}>
                    <Text style={styles.redeemButtonText}>Redeem</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity style={[styles.closeButton, { backgroundColor: theme.closeButtonBackground }]} onPress={() => setRewardsModalVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
  
      <Modal
  animationType="slide"
  transparent={true}
  visible={redeemedRewardsModalVisible}
  onRequestClose={() => setRedeemedRewardsModalVisible(false)}
>
  <View style={styles.modalContainer}>
    <View style={styles.rewardModal}>
      <Text style={styles.modalTitle}>Redeemed Rewards</Text>
      {redeemedRewards.length > 0 ? (
        <FlatList
          data={redeemedRewards}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.redeemedRewardItem}>
              <Text style={styles.redeemedRewardText}>
                <Text style={{ fontWeight: 'bold' }}>Name:</Text> {item.fullName}
              </Text>
              <Text style={styles.redeemedRewardText}>
                <Text style={{ fontWeight: 'bold' }}>Reward:</Text> {item.rewardName}
              </Text>
              <Text style={styles.redeemedRewardText}>
                <Text style={{ fontWeight: 'bold' }}>Status:</Text> {item.status}
              </Text>
              <Text style={styles.redeemedRewardText}>
                <Text style={{ fontWeight: 'bold' }}>Redeemed At:</Text> {new Date(item.timestamp).toLocaleString()}
              </Text>
             
            </View>
            
          )}
        />
      ) : (
        <Text style={styles.modalText}>No redeemed rewards found.</Text>
      )}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => setRedeemedRewardsModalVisible(false)}
      >
        <Text style={styles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>
  
      {/* Claiming Form Modal */}
      <ClaimingFormModal
        visible={claimingFormModalVisible}
        onClose={closeClaimingFormModal}
        reward={selectedReward}
        onClaim={handleClaimReward}
      />
  


      {/* Navigation Bar */}
      <NavBar navigation={navigation} isProfileComplete={isProfileComplete} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    paddingTop: 20,
    fontFamily: 'Poppins-Regular',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: '#000',
    fontFamily: 'Poppins-Bold',
  },
   modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
    fontFamily: 'Poppins-Regular',
  },
    modalTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    fontFamily: 'Poppins-Regular',
  },
  pointsText: {
  fontSize: 18,
  fontFamily: 'Poppins-Bold',
  marginBottom: 10,
  textAlign: 'center',
},
  closeButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerText: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
  },
  profileCard: {
    backgroundColor: '#FFD700',
    alignItems: 'center',
    padding: 20,
    borderRadius: 10,
    width: '90%',
    marginBottom: 20,
    fontFamily: 'Poppins-Regular',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  name: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: '#555',
    marginBottom: 5,
    fontFamily: 'Poppins-Regular',
  },
  points: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '90%',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#FFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },

  options: {
    width: '90%',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  optionText: {
    marginLeft: 10,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
  },
  editProfileContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  input: {
    width: '80%',
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
    fontFamily: 'Poppins-Regular',
    backgroundColor: '#FFF',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 10,
    width: '80%',
    alignItems: 'center',
    fontFamily: 'Poppins-Regular',
  },
  saveButtonText: {
    color: '#FFF',
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#FF6347',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 10,
    width: '80%',
    alignItems: 'center',
    fontFamily: 'Poppins-Regular',
  },
  cancelButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  leaderboardModal: {
    width: '80%',
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    marginBottom: 20,
  },
  leaderboardItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  leaderboardText: {
    fontSize: 18,
  },
  rankText: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    marginRight: 10,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#FF6347',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  closeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
  },
  imageButton: {
  backgroundColor: '#4CAF50',
  paddingVertical: 10,
  paddingHorizontal: 20,
  borderRadius: 5,
  marginTop: 10,
  width: '80%',
  alignItems: 'center',
},
imageButtonText: {
  color: '#FFF',
  fontSize: 16,
  fontFamily: 'Poppins-Regular',
},
phoneNumber: {
  fontSize: 16,
  color: '#555',
  marginBottom: 5,
},
sendMessageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  sendMessageText: {
    marginLeft: 10,
    fontSize: 16,
  },
  rewardModal: {
    width: '90%',
    maxHeight: '80%', // Limit height
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
  },
  rewardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: 'auto', // Adjust based on padding and margin
  },
    rewardItem: {
    width: 'auto', // Two items per row with margin
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    alignItems: 'center',
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  rewardImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  rewardDetails: {
    marginTop: 10,
    alignItems: 'center',
  },
  rewardText: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
  },
  rewardPoints: {
    fontSize: 14,
    color: '#666',
  },
  redeemButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#E0C55B',
    borderRadius: 5,
  },
  redeemButtonText: {
    color: '#000',
    fontSize: 16,
  },
  redeemedRewardItem: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  redeemedRewardText: {
    fontSize: 16,
    marginBottom: 5,
    fontFamily: 'Poppins-Regular',
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Poppins-Regular',
  },
  closeButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: 'red',
    borderRadius: 5,
  },
  buttonText: {
    fontSize: 16,
    color: '#000',
  },
  chatModal: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 10,
    width: '90%',
    maxHeight: '80%',
  },
  chatList: {
    flexGrow: 1,
    marginVertical: 10,
  },
  chatMessage: {
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  chatSender: {
    fontWeight: 'bold',
  },
  chatText: {
    marginVertical: 5,
  },
  chatTimestamp: {
    fontSize: 12,
    color: '#888',
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatInput: {
    flex: 1,
    borderColor: '#CCC',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 8,
  },
  chatIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  chatIconText: {
    marginLeft: 5,
    color: '#007AFF',
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#FF6347',
    padding: 10,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#FFF',
    textAlign: 'center',
  },
});



export default ProfileScreen;