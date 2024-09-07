import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Image, Alert, TouchableWithoutFeedback, ActivityIndicator } from 'react-native';
import { ref, onValue, get, set, update, remove } from 'firebase/database';
import { useNavigation } from '@react-navigation/native';
import { useColorScheme } from 'react-native';
import { useTheme } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { database } from '../firebaseConfig'; // Adjust path as needed
import {getAuth} from 'firebase/auth';

const ChatListScreen = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [chats, setChats] = useState([]);
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const navigation = useNavigation();
  const colorScheme = useColorScheme(); // Detect color scheme
  const { colors } = useTheme(); // Get colors from theme provider

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        setCurrentUserEmail(user.email);
      }
    };

    fetchCurrentUser();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersSnapshot = await get(ref(database, 'users'));
        const usersList = [];
        usersSnapshot.forEach((userSnapshot) => {
          usersList.push({
            id: userSnapshot.key,
            ...userSnapshot.val(),
          });
        });
        setUsers(usersList);
        setFilteredUsers(usersList);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const chatSnapshot = await get(ref(database, 'chats'));
        const chatsList = [];
        chatSnapshot.forEach((chat) => {
          chatsList.push({
            id: chat.key,
            ...chat.val(),
          });
        });
        setChats(chatsList);
      } catch (error) {
        console.error('Error fetching chats:', error);
      }
    };

    fetchChats();
  }, []);

  const handleSearchChange = (text) => {
    setSearchTerm(text);
    if (text === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter((user) =>
        user.displayName.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  };

  const handleStartChat = async (user) => {
    try {
      const chatId = [user.id, currentUserEmail].sort().join('_');
      const sanitizedChatId = sanitizeId(chatId);
      const chatRef = ref(database, `chats/${sanitizedChatId}`);

      const chatSnapshot = await get(chatRef);

      if (!chatSnapshot.exists()) {
        await set(chatRef, {
          users: [currentUserEmail, user.id],
          name: user.displayName,
          photoURL: user.photoURL || 'default_photo_url',
          lastMessage: {
            text: '',
            senderEmail: '',
            timestamp: '',
          },
          lastReadMessageId: '',
        });
      }

      navigation.navigate('ChatScreen', { chatId: sanitizedChatId });
      setSearchTerm('');
      setIsDropdownVisible(false);
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  const handleOutsidePress = () => {
    setIsDropdownVisible(false);
  };

  const renderChatItem = ({ item }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => navigation.navigate('ChatScreen', { chatId: item.id })}
    >
      <Image source={{ uri: item.photoURL || 'default_photo_url' }} style={styles.userImage} />
      <View style={styles.chatInfo}>
        <Text style={styles.chatName}>{item.name}</Text>
        <Text style={styles.chatMessage}>{item.lastMessage.text}</Text>
      </View>
    </TouchableOpacity>
  );

  const sanitizeId = (id) => id.replace(/[^a-zA-Z0-9]/g, '_');

  const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginTop: 40
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    fontSize: 18,
    color: colors.primary, // Ensure this is correct
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: -60,
    flex: 1,
    textAlign: 'center',
    color: colors.text, // Ensure this is correct
  },
  input: {
    borderColor: colors.placeholder,
    borderWidth: 1,
    borderRadius: 30,
    padding: 10,
    margin: 10,
    backgroundColor: colors.surface,
    color: colors.text, // Ensure this is correct
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 60,
  },
  userImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  userText: {
    fontSize: 18,
    color: colors.text, // Ensure this is correct
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 50,
    position: 'relative',
  },
  chatInfo: {
    flex: 1,
    marginLeft: 10,
  },
  chatName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text, // Ensure this is correct
  },
  chatMessage: {
    color: colors.text, // Ensure this is correct
  },
  dropdown: {
    position: 'absolute',
    top: 180,
    left: 10,
    right: 10,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 5,
    zIndex: 1,
  },
  newMessageBackground: {
    backgroundColor: colors.background,
  },
  redDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'red',
    position: 'absolute',
    top: 15,
    right: 15,
  },
  deleteButton: {
    backgroundColor: '#FF4D4D',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    borderRadius: 50,
  },
  deleteText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});

  return (
    <TouchableWithoutFeedback onPress={handleOutsidePress}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chat</Text>
        </View>
        <TextInput
          style={styles.input}
          value={searchTerm}
          onChangeText={handleSearchChange}
          placeholder="Search for users"
          placeholderTextColor={colors.placeholder}
        />
        {isDropdownVisible && (
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleStartChat(item)}
                style={styles.userItem}
              >
                <Image source={{ uri: item.photoURL || 'default_photo_url' }} style={styles.userImage} />
                <Text style={styles.userText}>{item.displayName || 'Unknown'}</Text>
              </TouchableOpacity>
            )}
            style={styles.dropdown}
          />
        )}
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          renderItem={renderChatItem}
        />
      </View>
    </TouchableWithoutFeedback>
  );
};

export default ChatListScreen;