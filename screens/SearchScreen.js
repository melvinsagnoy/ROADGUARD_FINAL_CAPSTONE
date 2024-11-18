import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Modal, Switch, ScrollView, useColorScheme  } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import NavBar from './NavBar';
import { auth, firestore } from '../firebaseConfig';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';


const SearchScreen = ({ navigation, toggleTheme, isDarkTheme }) => {
  // Define light and dark themes
const lightTheme = {
  background: '#FFFFFF',
  text: '#000000',
  primary: '#E0C55B',
  modalBackground: '#FFFFFF',
};

const darkTheme = {
  background: '#121212',
  text: '#E0E0E0',
  primary: '#1F1F1F',
  modalBackground: '#1F1F1F',
};
const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const theme = isDarkMode ? darkTheme : lightTheme;
  const [isMenuModalVisible, setMenuModalVisible] = useState(false);
  const [isSettingsModalVisible, setSettingsModalVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isLeaderboardModalVisible, setLeaderboardModalVisible] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPoints, setUserPoints] = useState(0);
  const [userRank, setUserRank] = useState(0);
  const [rankDescription, setRankDescription] = useState('');
  const [allUsers, setAllUsers] = useState([]);

  const fetchUserData = useCallback(async () => {
    const user = auth.currentUser;
    if (user) {
      const email = user.email;
      setUserEmail(email);

      const userDocRef = doc(firestore, 'users', email);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserName(userData.displayName || 'User');
        
        const totalPoints = userData.scores ? userData.scores.reduce((sum, score) => sum + score.score, 0) : 0;
        setUserPoints(totalPoints);
      }
    }
  }, []);

  const fetchAllUsersData = useCallback(async () => {
    const usersCollectionRef = collection(firestore, 'users');
    const usersSnapshot = await getDocs(usersCollectionRef);
    const usersData = usersSnapshot.docs.map(doc => {
      const data = doc.data();
      const totalPoints = data.scores ? data.scores.reduce((sum, score) => sum + score.score, 0) : 0;
      return { email: doc.id, displayName: data.displayName, totalPoints };
    });
    return usersData;
  }, []);

  const refreshData = useCallback(async () => {
    await fetchUserData();
    const usersData = await fetchAllUsersData();

    // Sort users by totalPoints in descending order
    const sortedUsers = usersData.sort((a, b) => b.totalPoints - a.totalPoints);
    setAllUsers(sortedUsers);

    // Find the current user's rank
    const currentUserRank = sortedUsers.findIndex(user => user.email === userEmail) + 1;
    setUserRank(currentUserRank);
    setRankDescription(`You rank ${currentUserRank}`);
  }, [fetchUserData, fetchAllUsersData, userEmail]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const toggleMenuModal = () => {
    setMenuModalVisible(prev => !prev);
  };

  const handleSettings = () => {
    setMenuModalVisible(false);
    setSettingsModalVisible(true);
  };

  const handleLogout = () => {
    auth.signOut().then(() => {
      setMenuModalVisible(false);
      navigation.navigate('Login');
    });
  };

  const handleViewLeaderboards = () => {
    setLeaderboardModalVisible(true);
  };

  const handleCloseLeaderboards = () => {
    setLeaderboardModalVisible(false);
  };

  const refreshScores = async () => {
    await refreshData();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      
      <Modal
        visible={isSettingsModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSettingsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <View style={styles.settingOption}>
              <Text style={[styles.settingText, { color: theme.text }]}>Dark Mode</Text>
              <Switch value={isDarkTheme} onValueChange={toggleTheme} />
            </View>
            <TouchableOpacity onPress={() => setSettingsModalVisible(false)}>
              <Text style={[styles.modalText2, { color: theme.text }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isLeaderboardModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseLeaderboards}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.leaderboardModalContent, { backgroundColor: theme.background }]}>
            <Text style={[styles.leaderboardTitle, { color: theme.text }]}>Leaderboards</Text>
            <ScrollView style={styles.leaderboardContainer}>
              {allUsers.map((user, index) => (
                <View key={user.email} style={[styles.leaderboardItem, { backgroundColor: theme.primary }]}>
                  {index + 1 === 1 && <Image source={require('../assets/gold_crown.png')} style={styles.crownImage} />}
                  {index + 1 === 2 && <Image source={require('../assets/silver_crown.png')} style={styles.crownImage} />}
                  {index + 1 === 3 && <Image source={require('../assets/bronze_crown.png')} style={styles.crownImage} />}
                  <Text style={[styles.leaderboardScore, { color: theme.text }]}>{user.totalPoints} points</Text>
                  <Text style={[styles.leaderboardName, { color: theme.text }]}>{user.displayName || 'Unknown'}</Text>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity style={[styles.closeButton, { backgroundColor: theme.primary }]}>
              <Text style={[styles.closeButtonText, { color: theme.text }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.text }]}>
        <Image source={require('../assets/icon.png')} style={styles.logo} />
        <Text style={[styles.headerTitle, { color: theme.text }]}>RoadGuard</Text>
      </View>

      {/* Rank Container */}
      <View style={[styles.rankContainer, { backgroundColor: theme.primary, shadowColor: theme.text }]}>
        <View style={styles.rankInfo}>
          <Text style={[styles.rankText, { color: theme.text }]}>{userName}</Text>
          <TouchableOpacity onPress={refreshScores} style={styles.refreshIcon}>
            <MaterialIcons name="refresh" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.rankBadgeContainer}>
          <View style={[styles.rankBadge, { backgroundColor: theme.background }]}>
            <Text style={[styles.rankBadgeText, { color: theme.text }]}>{userRank}</Text>
          </View>
          <View style={styles.pointsContainer}>
            <Text style={[styles.pointsText, { color: theme.text }]}>{userPoints} points</Text>
            <Text style={[styles.rankDescription, { color: theme.text }]}>{rankDescription}</Text>
            <TouchableOpacity onPress={handleViewLeaderboards}>
              <Text style={[styles.viewLeaderboard, { color: theme.primary }]}>View leaderboards →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Game Container */}
      <View style={[styles.gameContainer, { backgroundColor: theme.primary, shadowColor: theme.text }]}>
        <Image source={require('../assets/thumbnail.png')} style={styles.thumbnail} />
        <Text style={[styles.title, { color: theme.text }]}>RoadGuard Racer</Text>
        <Text style={[styles.description, { color: theme.text }]}>
          Mechanics:
          {"\n"}- Swipe to move the car left or right.
          {"\n"}- Avoid obstacles on the road.
          {"\n"}- Collect points by passing through gaps.
        </Text>
        <TouchableOpacity
          style={[styles.playButton, isHovered && styles.playButtonHover, { backgroundColor: theme.primary }]}
          onPress={() => navigation.navigate('GameScreen')}
          onPressIn={() => setIsHovered(true)}
          onPressOut={() => setIsHovered(false)}
        >
          <Text style={[styles.playButtonText, { color: theme.text }]}>{isHovered ? 'Play' : 'Play'}</Text>
        </TouchableOpacity>
      </View>

      <NavBar navigation={navigation} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    top: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 30,
    width: '100%',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  logo: {
    width: 50,
    height: 50,
    borderWidth: 1,
  },
  headerTitle: {
    left: -50,
    fontSize: 25,
    fontWeight: 'bold',
  },
  rankContainer: {
    padding: 20,
    borderRadius: 10,
    marginVertical: 20,
    width: '90%',
    alignSelf: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  rankInfo: {
    alignItems: 'flex-start',
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rankText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  rankBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  rankBadgeText: {
    fontSize: 30,
    fontWeight: 'bold',
  },
  pointsContainer: {
    alignItems: 'flex-start',
  },
  pointsText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  rankDescription: {
    fontSize: 16,
    marginTop: 5,
  },
  viewLeaderboard: {
    fontSize: 14,
    marginTop: 5,
    textDecorationLine: 'underline',
  },
  gameContainer: {
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
    marginBottom: 20,
    width: '90%',
    alignSelf: 'center',
  },
  thumbnail: {
    width: 150,
    height: 150,
    borderRadius: 10,
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  playButton: {
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    width: 80,
    marginVertical: 10,
  },
  playButtonHover: {
    backgroundColor: '#C0A346',
  },
  playButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  modalContent: {
    padding: 50,
    borderRadius: 10,
    width: '80%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalText1: {
    padding: 20,
    width: 200,
    borderRadius: 50,
    fontSize: 18,
    margin: 20,
  },
  modalText2: {
    padding: 20,
    width: 200,
    borderRadius: 50,
    fontSize: 18,
    margin: 20,
  },
  settingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 10,
  },
  settingText: {
    fontSize: 18,
  },
});

export default SearchScreen;