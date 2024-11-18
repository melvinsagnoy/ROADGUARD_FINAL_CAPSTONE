import React, { useState, useEffect, useRef } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Animated, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Icon from 'react-native-vector-icons/Ionicons';

const TypingIndicator = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateDot = (dot, delay) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(dot, { toValue: 1, duration: 300, delay, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, delay, useNativeDriver: true }),
        ]),
      ).start();
    };

    animateDot(dot1, 0);
    animateDot(dot2, 300);
    animateDot(dot3, 600);
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.typingIndicatorContainer}>
      <Animated.Text style={[styles.typingDot, { opacity: dot1 }]}>•</Animated.Text>
      <Animated.Text style={[styles.typingDot, { opacity: dot2 }]}>•</Animated.Text>
      <Animated.Text style={[styles.typingDot, { opacity: dot3 }]}>•</Animated.Text>
    </View>
  );
};

const ChatbotModal = ({ visible, onClose, userId }) => {
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [replying, setReplying] = useState(false);
  const scrollViewRef = useRef(null);
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const theme = {
    light: {
      background: '#f7f7f7',
      text: '#333',
      inputBackground: '#fff',
      inputBorder: '#ddd',
      buttonBackground: '#007AFF',
      buttonText: '#fff',
      overlayBackground: 'rgba(0, 0, 0, 0.5)',
    },
    dark: {
      background: '#1E1E1E',
      text: '#E0E0E0',
      inputBackground: '#2C2C2C',
      inputBorder: '#444',
      buttonBackground: '#BB86FC',
      buttonText: '#E0E0E0',
      overlayBackground: 'rgba(255, 255, 255, 0.1)',
    },
  };

  const currentTheme = isDarkMode ? theme.dark : theme.light;

  useEffect(() => {
    if (visible && userId) {
      loadChatHistory();
    }
  }, [visible, userId]);

  const loadChatHistory = async () => {
    try {
      const storedMessages = await AsyncStorage.getItem(`chat_history_${userId}`);
      if (storedMessages) {
        setChatMessages(JSON.parse(storedMessages));
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  const saveChatHistory = async (messages) => {
    try {
      await AsyncStorage.setItem(`chat_history_${userId}`, JSON.stringify(messages));
    } catch (error) {
      console.error('Failed to save chat history:', error);
    }
  };

  const handleSendMessage = async () => {
    if (message.trim() === '') return;

    const newMessage = { role: 'user', content: message };
    const updatedChatMessages = [...chatMessages, newMessage];
    setChatMessages(updatedChatMessages);
    saveChatHistory(updatedChatMessages);
    setMessage('');

    setReplying(true);
    const replyingMessage = { role: 'assistant', content: 'Replying...' };
    const messagesWithReplying = [...updatedChatMessages, replyingMessage];
    setChatMessages(messagesWithReplying);

    try {
      const genAI = new GoogleGenerativeAI('AIzaSyC3YMwzYGLKRh-YTmrcuYBrlbf49YCG498');
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(message);

      const botMessage = {
        role: 'assistant',
        content: result.response.text().trim(),
      };

      const finalChatMessages = [...updatedChatMessages, botMessage];
      setChatMessages(finalChatMessages);
      saveChatHistory(finalChatMessages);
    } catch (error) {
      console.error('Error communicating with Gemini:', error.message);
      alert('Failed to get a response. Please try again.');
    }

    setReplying(false);
  };

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={[styles.modalOverlay, { backgroundColor: currentTheme.overlayBackground }]}>
        <View style={[styles.modalContainer, { backgroundColor: currentTheme.background }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: currentTheme.text }]}>RoadGuard AI powered by Gemini</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Icon name="close-circle" size={30} color="#ff5c5c" />
            </TouchableOpacity>
          </View>
          <ScrollView
            style={styles.chatContainer}
            ref={scrollViewRef}
            onContentSizeChange={() => scrollViewRef.current.scrollToEnd({ animated: true })}
          >
            {chatMessages.map((msg, index) => (
              <View
                key={index}
                style={[
                  styles.messageContainer,
                  msg.role === 'user' ? styles.userMessage : styles.botMessage,
                  msg.content === 'Replying...' && styles.replyingMessage,
                  { backgroundColor: msg.role === 'user' ? currentTheme.inputBackground : currentTheme.background },
                ]}
              >
                <Text style={[styles.messageText, { color: currentTheme.text }]}>
                  {msg.content === 'Replying...' && replying ? <TypingIndicator /> : msg.content}
                </Text>
              </View>
            ))}
          </ScrollView>
          <View style={[styles.inputContainer, { backgroundColor: currentTheme.inputBackground, borderColor: currentTheme.inputBorder }]}>
            <TextInput
              style={[styles.input, { color: currentTheme.text }]}
              placeholder="Type your message..."
              placeholderTextColor={isDarkMode ? '#888' : '#555'}
              value={message}
              onChangeText={setMessage}
            />
            <TouchableOpacity style={[styles.sendButton, { backgroundColor: currentTheme.buttonBackground }]} onPress={handleSendMessage} disabled={replying}>
              <Icon name="send" size={25} color={replying ? '#ccc' : currentTheme.buttonText} />
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
  modalContainer: {
    width: '90%',
    height: '80%',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  chatContainer: {
    flex: 1,
    marginBottom: 10,
  },
  messageContainer: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    maxWidth: '75%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 0,
  },
  botMessage: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 0,
  },
  replyingMessage: {
    alignSelf: 'center',
    backgroundColor: '#fffae6',
  },
  messageText: {
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 25,
    paddingHorizontal: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  input: {
    flex: 1,
    height: 40,
    paddingHorizontal: 10,
    fontSize: 16,
  },
  sendButton: {
    padding: 10,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  closeButton: {
    alignSelf: 'flex-end',
    backgroundColor: 'transparent',
  },
  typingIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typingDot: {
    fontSize: 30,
    marginHorizontal: 2,
  },
});

export default ChatbotModal;
