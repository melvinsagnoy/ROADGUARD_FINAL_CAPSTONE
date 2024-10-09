import React, { useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Image } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

const NavBar = ({ activeNav, setActiveNav }) => {
  const navigation = useNavigation();

  // Function to handle navigation and update active state
  const handleNavigation = (screenName) => {
    console.log(`Navigating to: ${screenName}, Current ActiveNav: ${activeNav}`);

    // Only set the active state if it is not already the active screen
    if (activeNav !== screenName) {
      console.log(`Setting ActiveNav to: ${screenName}`);
      setActiveNav(screenName); // Update the active state
    }

    // Debugging to see if there's an issue during navigation
    try {
      navigation.navigate(screenName); // Navigate to the respective screen
    } catch (error) {
      console.log('Navigation error:', error);
    }
  };

  // Debugging: Log the active navigation state to verify updates
  useEffect(() => {
    console.log('Active Nav (NavBar):', activeNav);
  }, [activeNav]);

  return (
    <View style={styles.navContainer}>
      {/* Home Button */}
      <TouchableOpacity
        style={[styles.navItem, activeNav === 'Home' ? styles.activeItem : null]}
        onPress={() => handleNavigation('Home')}
      >
        <MaterialIcons name="home" size={30} color={activeNav === 'Home' ? '#FF7F50' : '#808080'} />
        <Text style={[styles.navText, activeNav === 'Home' ? styles.activeText : null]}>Home</Text>
      </TouchableOpacity>

      {/* Game Button */}
      <TouchableOpacity
        style={[styles.navItem, activeNav === 'Search' ? styles.activeItem : null]}
        onPress={() => handleNavigation('Search')}
      >
        <MaterialIcons name="sports-esports" size={30} color={activeNav === 'Search' ? '#FF7F50' : '#808080'} />
        <Text style={[styles.navText, activeNav === 'Search' ? styles.activeText : null]}>Game</Text>
      </TouchableOpacity>

      {/* Middle Button - Map Icon */}
      <View style={styles.middleButtonContainer}>
        <TouchableOpacity
          style={styles.middleButton}
          onPress={() => handleNavigation('AddScreen')}
        >
          <Image
            source={require('../assets/mapIcon.png')} // Replace with your mapIcon.png path
            style={styles.middleIcon}
          />
        </TouchableOpacity>
      </View>

      {/* Notifications Button */}
      <TouchableOpacity
        style={[styles.navItem, activeNav === 'Notifications' ? styles.activeItem : null]}
        onPress={() => handleNavigation('Notifications')}
      >
        <MaterialIcons name="notifications" size={30} color={activeNav === 'Notifications' ? '#FF7F50' : '#808080'} />
        <Text style={[styles.navText, activeNav === 'Notifications' ? styles.activeText : null]}>Notifications</Text>
      </TouchableOpacity>

      {/* Profile Button */}
      <TouchableOpacity
        style={[styles.navItem, activeNav === 'Profile' ? styles.activeItem : null]}
        onPress={() => handleNavigation('Profile')}
      >
        <MaterialIcons name="account-circle" size={30} color={activeNav === 'Profile' ? '#FF7F50' : '#808080'} />
        <Text style={[styles.navText, activeNav === 'Profile' ? styles.activeText : null]}>Profile</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  navContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  navItem: {
    alignItems: 'center',
    padding: 5,
    flex: 1,
  },
  middleButtonContainer: {
    position: 'absolute',
    bottom: 60,
    left: '50%',
    transform: [{ translateX: -30 }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  middleButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF7F50',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 15,
  },
  middleIcon: {
    width: 30,
    height: 30,
    tintColor: '#FFFFFF',
  },
  navText: {
    fontSize: 12,
    color: '#808080',
  },
  activeText: {
    color: '#FF7F50',
  },
  activeItem: {
    borderBottomWidth: 2,
    borderBottomColor: '#FF7F50',
  },
});

export default NavBar;
