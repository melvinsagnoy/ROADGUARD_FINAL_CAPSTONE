// ChatbotModal.js
import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { GoogleGenerativeAI } from '@google/generative-ai'; // Import the Google Generative AI library

const ChatbotModal = ({ visible, onClose }) => {
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([]);

  // Gemini API key
  const GEMINI_API_KEY = 'AIzaSyC3YMwzYGLKRh-YTmrcuYBrlbf49YCG498'; // Your actual Gemini API key here

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY); // Initialize with the API key

  const handleSendMessage = async () => {
    if (message.trim() === '') return;

    const newMessage = { role: 'user', content: message };
    setChatMessages((prev) => [...prev, newMessage]); // Add user's message to chat

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }); // Use the Gemini model

      // Make the request to generate content based on user input
      const result = await model.generateContent(message);
      
      const botMessage = {
        role: 'assistant',
        content: result.response.text().trim(), // Extract the generated text from the response
      };
      setChatMessages((prev) => [...prev, botMessage]); // Add bot's message to chat
      
    } catch (error) {
      console.error('Error communicating with Gemini:', error.message);
      alert('Failed to get a response. Please try again.');
    }

    setMessage(''); // Clear the input field after sending the message
  };

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Chatbot AI</Text>
          <ScrollView style={styles.chatContainer}>
            {chatMessages.map((msg, index) => (
              <View
                key={index}
                style={[
                  styles.messageContainer,
                  msg.role === 'user' ? styles.userMessage : styles.botMessage,
                ]}
              >
                <Text style={styles.messageText}>{msg.content}</Text>
              </View>
            ))}
          </ScrollView>
          <TextInput
            style={styles.input}
            placeholder="Type your message..."
            value={message}
            onChangeText={setMessage}
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
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
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  chatContainer: {
    flex: 1,
    marginBottom: 10,
  },
  messageContainer: {
    padding: 10,
    borderRadius: 5,
    marginBottom: 5,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#DCF8C6',
  },
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#E3E3E3',
  },
  messageText: {
    fontSize: 16,
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  sendButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  closeButton: {
    marginTop: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'red',
  },
});

export default ChatbotModal;
