import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, FlatList, Image, ActivityIndicator } from 'react-native';
import { ref, set, onValue } from 'firebase/database';
import { firestore, auth, database } from '../firebaseConfig'; // Ensure proper exports
import { doc, getDoc } from 'firebase/firestore';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useColorScheme } from 'react-native';

const CommentModal = ({ visible, onClose, postId }) => {
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState(null); // Track which comment is being replied to
  const [showReplyInput, setShowReplyInput] = useState(null); // Manage reply input visibility for each comment
  const [expandedReplies, setExpandedReplies] = useState({}); // Manage expanded replies state
  const [commentLoading, setCommentLoading] = useState(false); // Loading state for submitting a comment
  const [replyLoading, setReplyLoading] = useState({}); // Loading state for submitting a reply (per comment)

  const colorScheme = useColorScheme(); // Detect device theme preference
  const isDarkMode = colorScheme === 'dark';

  // Define theme styles
  const theme = {
    light: {
      background: '#FFFFFF',
      text: '#000000',
      inputBackground: '#F2F2F2',
      buttonBackground: '#007AFF',
      buttonText: '#FFFFFF',
      borderColor: '#CCCCCC',
    },
    dark: {
      background: '#1E1E1E',
      text: '#E0E0E0',
      inputBackground: '#333333',
      buttonBackground: '#BB86FC',
      buttonText: '#E0E0E0',
      borderColor: '#555555',
    },
  };

  const currentTheme = isDarkMode ? theme.dark : theme.light;
  useEffect(() => {
    if (!postId) {
      console.log('No Post ID provided, exiting useEffect.');
      setComments([]);
      setLoading(false);
      return;
    }

    const commentsRef = ref(database, `posts/${postId}/comments`);

    const handleValueChange = (snapshot) => {
      const data = snapshot.val();
      console.log('Snapshot data:', data);

      if (data) {
        const commentsArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key],
          createdAt: data[key].createdAt, // Keep as timestamp
        }));

        // Filter out comments with empty displayName
        const filteredComments = commentsArray.filter(comment => comment.displayName.trim() !== '');
        console.log('Filtered comments:', filteredComments);
        setComments(filteredComments);
      } else {
        console.log('No comments data found.');
        setComments([]);
      }

      setLoading(false); // Update loading state
    };

    // Attach the listener
    const unsubscribe = onValue(commentsRef, handleValueChange, (error) => {
      console.error('Error reading comments:', error.message);
      setLoading(false); // Stop loading on error
    });

    // Cleanup listener on unmount
    return () => {
      console.log('Unsubscribing from comments listener.');
      unsubscribe(); // This will remove the listener
    };
  }, [postId]);

  const handleSubmit = async () => {
  if (comment.trim()) {
    setCommentLoading(true); // Start loading

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.error('No user is currently logged in.');
        setCommentLoading(false); // Stop loading
        return;
      }

      // Fetch user details from Firestore to ensure you have the latest displayName and photoURL
      const userDocRef = doc(firestore, `users/${currentUser.email}`);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        console.error('User profile does not exist');
        setCommentLoading(false); // Stop loading
        return;
      }

      const userData = userDoc.data();

      const newCommentRef = ref(database, `posts/${postId}/comments/${Date.now()}`);

      await set(newCommentRef, {
        text: comment,
        createdAt: Date.now(),
        displayName: userData.displayName || 'Anonymous', // Use displayName from Firestore
        profileImage: userData.photoURL || 'https://via.placeholder.com/30', // Use photoURL from Firestore
        email: currentUser.email // Including email in the comment data
      });

      setComment(''); // Clear the comment input field
      onClose(); // Close the modal or clear up state

      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setCommentLoading(false); // End loading
    }
  }
};

 const handleReplySubmit = async (parentId) => {
  if (comment.trim()) {
    setReplyLoading(prev => ({ ...prev, [parentId]: true })); // Start loading for this particular reply

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.error('No user is currently logged in.');
        setReplyLoading(prev => ({ ...prev, [parentId]: false })); // Stop loading
        return;
      }

      // Fetch user details from Firestore to ensure you have the latest displayName and photoURL
      const userDocRef = doc(firestore, `users/${currentUser.email}`);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        console.error('User profile does not exist');
        setReplyLoading(prev => ({ ...prev, [parentId]: false })); // Stop loading
        return;
      }

      const userData = userDoc.data();

      const replyId = Date.now().toString(); // Use a Unix timestamp as reply ID
      const replyRef = ref(database, `posts/${postId}/comments/${parentId}/replies/${replyId}`);

      await set(replyRef, {
        text: comment,
        createdAt: Date.now(),
        displayName: userData.displayName || 'Anonymous', // Use displayName from Firestore
        profileImage: userData.photoURL || 'https://via.placeholder.com/30', // Use photoURL from Firestore
        email: currentUser.email // Including email in the reply data
      });

      setComment(''); // Clear the reply input field
      setReplyingTo(null); // Reset the replying state
      setShowReplyInput(null); // Hide the reply input
      setSuccessMessage('Reply added successfully!');
      onClose(); // Close the modal or clear up state

      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error adding reply:', error);
    } finally {
      setReplyLoading(prev => ({ ...prev, [parentId]: false })); // End loading
    }
  }
};

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString(); // Adjust format as needed
  };

  const renderReply = ({ item }) => (
    <View style={[styles.replyContainer, { backgroundColor: currentTheme.inputBackground }]}>
      <View style={styles.replyHeader}>
        {item.profileImage ? (
          <Image source={{ uri: item.profileImage }} style={styles.profileImage} />
        ) : (
          <View style={styles.profileImagePlaceholder} />
        )}
        <View style={styles.replyContent}>
          <Text style={[styles.replyAuthor, { color: currentTheme.text }]}>{item.displayName || 'Anonymous'}</Text>
          <Text style={[styles.replyText, { color: currentTheme.text }]}>{item.text}</Text>
          <Text style={[styles.replyTime, { color: currentTheme.text }]}>{formatDate(item.createdAt)}</Text>
        </View>
      </View>
    </View>
  );

  const renderComment = ({ item }) => {
    const replies = Object.values(item.replies || {});
    const visibleReplies = expandedReplies[item.id] ? replies : replies.slice(0, 3);

    return (
      <View style={[styles.commentContainer, { backgroundColor: currentTheme.inputBackground }]}>
        <View style={styles.commentHeader}>
          {item.profileImage ? (
            <Image source={{ uri: item.profileImage }} style={styles.profileImage} />
          ) : (
            <View style={styles.profileImagePlaceholder} />
          )}
          <View style={styles.commentContent}>
            <Text style={[styles.commentAuthor, { color: currentTheme.text }]}>{item.displayName || 'Anonymous'}</Text>
            <Text style={[styles.commentText, { color: currentTheme.text }]}>{item.text}</Text>
            <Text style={[styles.commentTime, { color: currentTheme.text }]}>{formatDate(item.createdAt)}</Text>
            <TouchableOpacity
              style={styles.replyButton}
              onPress={() => setShowReplyInput(showReplyInput === item.id ? null : item.id)}
            >
              <Text style={[styles.replyButtonText, { color: currentTheme.buttonBackground }]}>Reply</Text>
            </TouchableOpacity>
            {showReplyInput === item.id && (
              <View style={styles.replyInputContainer}>
                <TextInput
                  style={[styles.textInput, { backgroundColor: currentTheme.inputBackground, color: currentTheme.text }]}
                  placeholder="Write a reply..."
                  placeholderTextColor={currentTheme.text}
                  value={comment}
                  onChangeText={setComment}
                />
                <TouchableOpacity
                  style={styles.sendButton}
                  onPress={() => handleReplySubmit(item.id)}
                  disabled={replyLoading[item.id]}
                >
                  {replyLoading[item.id] ? (
                    <ActivityIndicator size="small" color={currentTheme.buttonBackground} />
                  ) : (
                    <Icon name="send" size={20} color={currentTheme.buttonBackground} />
                  )}
                </TouchableOpacity>
              </View>
            )}
            {item.replies && (
              <>
                <FlatList
                  data={visibleReplies}
                  renderItem={renderReply}
                  keyExtractor={(reply) => reply.createdAt.toString()}
                  style={styles.repliesList}
                />
                {replies.length > 3 && (
                  <TouchableOpacity
                    style={styles.viewMoreButton}
                    onPress={() => setExpandedReplies(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                  >
                    <Text style={[styles.viewMoreText, { color: currentTheme.buttonBackground }]}>
                      {expandedReplies[item.id] ? 'View Less' : `View ${replies.length - 3} More Replies`}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} onRequestClose={onClose} animationType="slide">
      <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
        <Text style={[styles.title, { color: currentTheme.buttonBackground }]}>Comments</Text>
        {loading ? (
          <ActivityIndicator size="large" color={currentTheme.buttonBackground} />
        ) : (
          <FlatList
            data={comments}
            renderItem={renderComment}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={<Text style={[styles.noCommentsText, { color: currentTheme.text }]}>No comments yet.</Text>}
          />
        )}
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.textInput, { backgroundColor: currentTheme.inputBackground, color: currentTheme.text }]}
            placeholder="Write a comment..."
            placeholderTextColor={currentTheme.text}
            value={comment}
            onChangeText={setComment}
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSubmit} disabled={commentLoading}>
            {commentLoading ? (
              <ActivityIndicator size="small" color={currentTheme.buttonBackground} />
            ) : (
              <Icon name="send" size={20} color={currentTheme.buttonBackground} />
            )}
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: currentTheme.inputBackground }]}>
          <Text style={[styles.closeButtonText, { color: currentTheme.buttonBackground }]}>Close</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 20,
  },
  commentContainer: {
    marginBottom: 15,
    backgroundColor: '#f2f2f2',
    padding: 10,
    borderRadius: 8,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  profileImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ccc',
    marginRight: 10,
  },
  commentContent: {
    flex: 1,
  },
  commentAuthor: {
    fontWeight: 'bold',
    color: '#007AFF',
  },
  commentText: {
    color: '#000000',
    marginTop: 5,
  },
  commentTime: {
    fontSize: 12,
    color: '#666666',
    marginTop: 5,
  },
  replyButton: {
    alignSelf: 'flex-start',
    marginTop: 5,
  },
  replyButtonText: {
    color: '#007AFF',
    fontSize: 14,
  },
  replyContainer: {
    marginTop: 10,
    paddingLeft: 50,
    borderLeftWidth: 2,
    borderLeftColor: '#007AFF',
    paddingVertical: 5,
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  replyContent: {
    flex: 1,
  },
  replyAuthor: {
    fontWeight: 'bold',
    color: '#007AFF',
  },
  replyText: {
    color: '#000000',
    marginTop: 5,
  },
  replyTime: {
    fontSize: 12,
    color: '#666666',
    marginTop: 5,
  },
  replyInputContainer: {
    marginTop: 10,
  },
  replyToLabel: {
    color: '#666666',
    marginBottom: 5,
  },
  replyInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#f2f2f2',
    color: '#000000',
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  sendButton: {
    marginLeft: 10,
  },
  repliesList: {
    marginTop: 10,
  },
  viewMoreButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  viewMoreText: {
    color: '#007AFF',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  closeButton: {
    marginTop: 20,
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#007AFF',
    fontSize: 18,
  },
  noCommentsText: {
    textAlign: 'center',
    color: '#666666',
    marginTop: 20,
  },
});

export default CommentModal;
