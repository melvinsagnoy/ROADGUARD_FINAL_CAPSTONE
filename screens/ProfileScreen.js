import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput, Image, Modal, FlatList, Alert  } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { auth, firestore, storage , database} from '../firebaseConfig';
import { doc, getDoc, updateDoc, setDoc, collection, query, orderBy, getDocs } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NavBar from './NavBar';
import { ref as dbRef, get, onValue } from 'firebase/database';  // For Realtime Database
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';  // For Storage
import ClaimingFormModal from './ClaimingFormModal'; 
import { useFocusEffect } from '@react-navigation/native';



const ProfileScreen = ({ navigation, activeNav, setActiveNav  }) => {
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

  
useFocusEffect(
  React.useCallback(() => {
    setActiveNav('Profile'); // Set active tab to 'Profile' when this screen is focused
  }, [])
);


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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <View style={styles.container}>
      
      <View style={styles.profileCard}>
        <TouchableOpacity onPress={pickImage}>
          <Image source={{ uri: newProfileImageUri || imageUri }} style={styles.profileImage} />
        </TouchableOpacity>
        <Text style={styles.name}>{user.displayName || 'No Name'}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <Text style={styles.phoneNumber}>{phoneNumber}</Text>
        <Text style={styles.points}>{points} points</Text>
      </View>
      <View style={styles.buttonRow}>
         <TouchableOpacity style={styles.button} onPress={handleRedeemRewards}>
          <Text style={styles.buttonText} color="black">Redeem Rewards</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => handleNavigation('SubscriptionScreen')}>
          <Text style={styles.buttonText} color="black">Subscribe</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.options}>
        <TouchableOpacity style={styles.option} onPress={() => setEditMode(true)}>
          <FontAwesome name="user" size={24} color="black" />
          <Text style={styles.optionText}>Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.option} onPress={fetchLeaderboardData}>
          <FontAwesome name="star" size={24} color="black" />
          <Text style={styles.optionText}>Leaderboards</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.option} onPress={fetchRedeemedRewards}>
        <FontAwesome name="gift" size={24} color="#000" style={styles.icon} />
        <Text style={styles.optionText}>View Redeemed Rewards</Text>
      </TouchableOpacity>
        <TouchableOpacity
          style={styles.option}
          onPress={() => navigation.navigate('ChatList')} // Use 'ChatList' not 'ChatListScreen'
        >
          <FontAwesome name="comments" size={24} color="black" />
          <Text style={styles.optionText}>Chats</Text>
        </TouchableOpacity>
        <TouchableOpacity
  style={styles.option}
  onPress={() => navigation.navigate('PrivacySecurityScreen')}
>
  <FontAwesome name="shield" size={24} color="black" />
  <Text style={styles.optionText}>Privacy & Security</Text>
</TouchableOpacity>
        <TouchableOpacity
          style={styles.option}
          onPress={handleLogout}
        >
          <FontAwesome name="sign-out" size={24} color="black" />
          <Text style={styles.optionText}>Log out</Text>
        </TouchableOpacity>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={leaderboardVisible}
        onRequestClose={() => setLeaderboardVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.leaderboardModal}>
            <Text style={styles.modalTitle}>Leaderboard</Text>
            <FlatList
              data={leaderboardData}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item, index }) => (
                <View style={styles.leaderboardItem}>
                  <Text style={styles.rankText}>{index + 1}</Text>
                  <Text style={styles.leaderboardText}>{item.displayName}</Text>
                  <Text style={styles.leaderboardText}>{item.score}</Text>
                </View>
              )}
            />
            <TouchableOpacity style={styles.closeButton} onPress={() => setLeaderboardVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
  animationType="slide"
  transparent={true}
  visible={editMode}
  onRequestClose={() => setEditMode(false)}
>
  <View style={styles.editProfileContainer}>
    <TextInput
      style={styles.input}
      placeholder="Enter new display name"
      value={newName}
      onChangeText={setNewName}
    />
    <TextInput
  style={styles.input}
  placeholder="New Phone Number"
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
      style={[
        styles.cancelButton,
        { opacity: needsNameUpdate || needsImageUpdate ? 0.5 : 1 } // Adjust opacity based on profile completion
      ]}
      onPress={() => {
        if (!(needsNameUpdate || needsImageUpdate)) {
          setEditMode(false);
        }
      }}
      disabled={needsNameUpdate || needsImageUpdate} // Disable button based on profile completion
    >
      <Text style={styles.cancelButtonText}>Cancel</Text>
    </TouchableOpacity>
  </View>
</Modal>

  <Modal
        animationType="slide"
        transparent={true}
        visible={rewardsModalVisible}
        onRequestClose={() => setRewardsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.rewardModal}>
            <Text style={styles.modalTitle}>Available Rewards</Text>
            <Text style={styles.pointsText}>Your Points: {points}</Text>
            <View style={styles.rewardsGrid}>
              {rewards.map((item, index) => (
                <View
                  key={item.id}
                  style={[
                    styles.rewardItem,
                    { marginRight: (index % 2 === 0) ? 10 : 0 }
                  ]}
                >
                  <Image source={{ uri: item.imageUrl }} style={styles.rewardImage} />
                  <View style={styles.rewardDetails}>
                    <Text style={styles.rewardText}>{item.rewardName}</Text>
                    <Text style={styles.rewardPoints}>{item.pointsRequired} points</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.redeemButton}
                    onPress={() => handleRedeem(item.id)}
                  >
                    <Text style={styles.redeemButtonText}>Redeem</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={() => setRewardsModalVisible(false)}>
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
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
    <View style={{ width: '90%', backgroundColor: '#fff', borderRadius: 10, padding: 20, elevation: 5 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>Redeemed Rewards</Text>
      <FlatList
        data={redeemedRewards}
        keyExtractor={(item) => item.timestamp.toString()}
        renderItem={({ item }) => (
          <View style={{ marginBottom: 15, padding: 15, backgroundColor: '#f9f9f9', borderRadius: 10, borderWidth: 1, borderColor: '#ddd' }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 5 }}>Reward Claimed By:</Text>
            <Text style={{ fontSize: 16, marginBottom: 5 }}>{item.fullName}</Text>
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 5 }}>Address:</Text>
            <Text style={{ fontSize: 16, marginBottom: 5 }}>{item.address}</Text>
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 5 }}>Phone Number:</Text>
            <Text style={{ fontSize: 16, marginBottom: 5 }}>{item.phoneNumber}</Text>
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 5 }}>Status:</Text>
            <Text style={{ fontSize: 16, marginBottom: 5 }}>{item.status}</Text>
            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Timestamp:</Text>
            <Text style={{ fontSize: 16 }}>{new Date(item.timestamp).toLocaleString()}</Text>
          </View>
        )}
      />
      <TouchableOpacity
        style={{ marginTop: 15, backgroundColor: 'red', padding: 10, borderRadius: 5, alignItems: 'center' }}
        onPress={() => setRedeemedRewardsModalVisible(false)}
      >
        <Text style={{ color: '#fff', fontSize: 16 }}>Close</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

      <ClaimingFormModal
  visible={claimingFormModalVisible}
  onClose={closeClaimingFormModal}
  reward={selectedReward} // Pass the selected reward
  onClaim={handleClaimReward} // Pass the function to handle claiming the reward
/>


    </View>
  );
};

const styles = StyleSheet.create({
  navbarContainer: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
    borderTopWidth: 1,
    borderTopColor: '#DDD',
    backgroundColor: '#FFF', // Background color for NavBar
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    paddingTop: 20,
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
    fontWeight: 'bold',
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
  },
    modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
  },
  pointsText: {
  fontSize: 18,
  fontWeight: 'bold',
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
    fontWeight: 'bold',
  },
  profileCard: {
    backgroundColor: '#FFD700',
    alignItems: 'center',
    padding: 20,
    borderRadius: 10,
    width: '90%',
    marginBottom: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: '#555',
    marginBottom: 5,
  },
  points: {
    fontSize: 24,
    fontWeight: 'bold',
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
  },
  saveButtonText: {
    color: '#FFF',
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
  },
  cancelButtonText: {
    color: '#FFF',
    fontSize: 16,
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
    fontWeight: 'bold',
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
    fontWeight: 'bold',
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
    fontWeight: 'bold',
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
});



export default ProfileScreen;
