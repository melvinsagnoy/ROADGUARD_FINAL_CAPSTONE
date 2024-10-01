// ChatbotModal.js
import React, { useState, useEffect, useRef } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Animated } from 'react-native';
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
  const [replying, setReplying] = useState(false); // State to track if AI is replying
  const scrollViewRef = useRef(null); // Create a ref for the ScrollView

  const GEMINI_API_KEY = 'AIzaSyC3YMwzYGLKRh-YTmrcuYBrlbf49YCG498'; // Replace with your actual API key
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

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

    // Display "Replying..." message while AI is generating a response
    setReplying(true);
    const replyingMessage = { role: 'assistant', content: 'Replying...' };
    const messagesWithReplying = [...updatedChatMessages, replyingMessage];
    setChatMessages(messagesWithReplying);

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const result = await model.generateContent(message);

      const botMessage = {
        role: 'assistant',
        content: result.response.text().trim(),
      };

      // Replace "Replying..." with the actual response from the AI
      const finalChatMessages = [...updatedChatMessages, botMessage];
      setChatMessages(finalChatMessages);
      saveChatHistory(finalChatMessages);
    } catch (error) {
      console.error('Error communicating with Gemini:', error.message);
      alert('Failed to get a response. Please try again.');
    }

    // Remove "Replying..." message and reset replying state
    setReplying(false);
  };

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>RoadGuard AI powered by Gemini</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              {/* Wrap the Icon in a Text component */}
              <Text>
                <Icon name="close-circle" size={30} color="#ff5c5c" />
              </Text>
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
                ]}
              >
                <Text style={styles.messageText}>{msg.content === 'Replying...' && replying ? <TypingIndicator /> : msg.content}</Text>
              </View>
            ))}
          </ScrollView>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Type your message..."
              placeholderTextColor="#888"
              value={message}
              onChangeText={setMessage}
            />
            <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage} disabled={replying}>
              {/* Wrap the Icon in a Text component */}
              <Text>
                <Icon name="send" size={25} color={replying ? '#ccc' : 'white'} />
              </Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '90%',
    height: '80%',
    backgroundColor: '#f7f7f7',
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
    color: '#333',
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
    alignSelf: 'flex-start',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#cce5ff',
    borderRadius: 15,
    padding: 10,
    borderBottomRightRadius: 0,
  },
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f0f0',
    borderRadius: 15,
    padding: 10,
    borderBottomLeftRadius: 0,
  },
  replyingMessage: {
    backgroundColor: '#fffae6',
    alignSelf: 'center',
  },
  messageText: {
    fontSize: 16,
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 25,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  input: {
    flex: 1,
    height: 40,
    borderColor: 'transparent',
    paddingHorizontal: 10,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginTop: 10,
    backgroundColor: 'transparent',
  },
  typingIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typingDot: {
    fontSize: 30,
    color: '#888',
    marginHorizontal: 2,
  },
});

export default ChatbotModal;
