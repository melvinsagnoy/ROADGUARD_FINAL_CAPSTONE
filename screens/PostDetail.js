import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  useColorScheme,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { format } from 'date-fns';
import { ref, onValue, get, push, set, update } from 'firebase/database';
import { database, auth, firestore } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

const PostDetail = ({ route, navigation }) => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  // Define the theme styles
  const theme = {
    light: {
      background: '#FFFFFF',
      text: '#000000',
      headerBackground: '#F5F5F5',
      borderColor: '#DDDDDD',
      inputBackground: '#F1F1F1',
      placeholderTextColor: '#888888',
    },
    dark: {
      background: '#1C1C1C',
      text: '#FFFFFF',
      headerBackground: '#2B2B2B',
      borderColor: '#444444',
      inputBackground: '#333333',
      placeholderTextColor: '#AAAAAA',
    },
  };

  const currentTheme = isDarkMode ? theme.dark : theme.light;

  const [post, setPost] = useState({});
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [userData, setUserData] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const postId = route.params?.postId;
    if (!postId) return;

    const fetchPostDetails = async () => {
      const postRef = ref(database, `posts/${postId}`);
      const snapshot = await get(postRef);
      if (snapshot.exists()) {
        setPost({ id: snapshot.key, ...snapshot.val() });
      }
    };

    fetchPostDetails();

    const commentsRef = ref(database, `posts/${postId}/comments`);
    onValue(commentsRef, (snapshot) => {
      const data = snapshot.val() || [];
      setComments(Object.values(data));
    });

    const fetchUserData = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userDocRef = doc(firestore, `users/${currentUser.email}`);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      }
    };

    fetchUserData();
  }, [route.params]);

  const submitComment = async () => {
    if (!commentText.trim()) return;
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error('User not logged in');
      return;
    }

    const commentRef = push(ref(database, `posts/${post.id}/comments`));

    await set(commentRef, {
      text: commentText,
      userId: currentUser.email,
      displayName: userData.displayName || 'Anonymous',
      profileImage: userData.photoURL || 'https://via.placeholder.com/30',
      createdAt: Date.now(),
      userEmail: currentUser.email,
    });

    setCommentText('');
  };

  const handleVote = async (postId, voteType) => {
    setIsLoading(true);
    const currentUser = auth.currentUser;

    if (!currentUser || !currentUser.email) {
      console.error('User email is not available.');
      setIsLoading(false);
      return;
    }

    const userEmail = currentUser.email.toLowerCase().trim();
    const sanitizedEmail = userEmail.replace(/[.#$\/\[\]]/g, '_');

    try {
      const userDocRef = doc(firestore, `users/${userEmail}`);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        throw new Error('User does not exist in Firestore');
      }
      const userData = userDoc.data();
      const displayName = userData.displayName || 'Anonymous';
      const photoURL = userData.photoURL || 'https://via.placeholder.com/150';

      const postRef = ref(database, `posts/${postId}`);
      const postSnapshot = await get(postRef);
      const postData = postSnapshot.val();
      if (!postData) {
        throw new Error('Post does not exist');
      }

      let { upvotes = 0, downvotes = 0, voters = {} } = postData;

      const newVoteType = voteType === 'upvotes' ? 'upvote' : 'downvote';

      if (voters[sanitizedEmail] && voters[sanitizedEmail].voteType === newVoteType) {
        newVoteType === 'upvote' ? upvotes-- : downvotes--;
        delete voters[sanitizedEmail];
      } else {
        if (voters[sanitizedEmail]) {
          voters[sanitizedEmail].voteType === 'upvote' ? upvotes-- : downvotes--;
        }
        newVoteType === 'upvote' ? upvotes++ : downvotes++;
        voters[sanitizedEmail] = {
          voteType: newVoteType,
          displayName,
          email: userEmail,
          photoURL,
          timestamp: Date.now(),
        };
      }

      await update(postRef, {
        upvotes,
        downvotes,
        voters,
      });

      setPost((prev) => ({
        ...prev,
        upvotes,
        downvotes,
        voters,
      }));
    } catch (error) {
      console.error('Error handling vote:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <View style={[styles.header, { backgroundColor: currentTheme.headerBackground }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={30} color={currentTheme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerText, { color: currentTheme.text }]}>Post Details</Text>
      </View>
      <View style={[styles.feedItem, { borderBottomColor: currentTheme.borderColor }]}>
        <View style={styles.feedHeader}>
          <Image source={{ uri: post.photoURL || 'https://via.placeholder.com/50' }} style={styles.profileIcon} />
          <View style={styles.feedHeaderText}>
            <Text style={[styles.feedAuthor, { color: currentTheme.text }]}>
              {post.displayName || 'Unknown User'}
            </Text>
            {post.location && (
              <Text style={[styles.feedLocation, { color: currentTheme.text }]}>
                Location: {`${post.location.latitude}, ${post.location.longitude}`}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.feedContent}>
          {post.imageURL && <Image source={{ uri: post.imageURL }} style={styles.feedImage} />}
          <Text style={[styles.feedTitle, { color: currentTheme.text }]}>{post.title || 'No title'}</Text>
          <Text style={[styles.feedBody, { color: currentTheme.text }]}>{post.body || 'No content available.'}</Text>
          <Text style={styles.postDate}>{format(new Date(post.createdAt || Date.now()), 'PPpp')}</Text>
        </View>
      </View>
      <View style={styles.voteSection}>
        <TouchableOpacity onPress={() => handleVote(post.id, 'upvotes')} style={styles.voteButton}>
          <MaterialIcons name="thumb-up" size={24} color="blue" />
          <Text style={[styles.voteCount, { color: currentTheme.text }]}>{(post.upvotes || 0).toString()}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleVote(post.id, 'downvotes')} style={styles.voteButton}>
          <MaterialIcons name="thumb-down" size={24} color="red" />
          <Text style={[styles.voteCount, { color: currentTheme.text }]}>{(post.downvotes || 0).toString()}</Text>
        </TouchableOpacity>
      </View>
      {comments.map((comment, index) => (
        <View key={index} style={styles.commentItem}>
          <Image source={{ uri: comment.profileImage || 'https://via.placeholder.com/30' }} style={styles.commentProfileIcon} />
          <View style={styles.commentTextContainer}>
            <Text style={[styles.commentUserName, { color: currentTheme.text }]}>{comment.displayName || 'Anonymous'}</Text>
            <Text style={[styles.commentText, { color: currentTheme.text }]}>{comment.text}</Text>
            <Text style={[styles.commentDate, { color: currentTheme.text }]}>{format(new Date(comment.createdAt), 'PPpp')}</Text>
          </View>
        </View>
      ))}
      <View style={styles.commentInputContainer}>
        <TextInput
          style={[
            styles.commentInput,
            { backgroundColor: currentTheme.inputBackground, color: currentTheme.text },
          ]}
          placeholder="Write a comment..."
          placeholderTextColor={currentTheme.placeholderTextColor}
          value={commentText}
          onChangeText={setCommentText}
        />
        <TouchableOpacity onPress={submitComment} style={styles.sendButton}>
          <MaterialIcons name="send" size={24} color="blue" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    top: 50,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 10,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  feedItem: {
    padding: 15,
    borderBottomWidth: 1,
  },
  feedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  feedHeaderText: {
    flex: 1,
  },
  feedAuthor: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  feedLocation: {
    fontSize: 14,
  },
  feedContent: {
    marginTop: 10,
  },
  feedImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
  feedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  feedBody: {
    fontSize: 16,
    marginTop: 5,
  },
  postDate: {
    marginTop: 10,
    fontSize: 12,
    color: '#888',
  },
  voteSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voteCount: {
    marginLeft: 5,
    fontSize: 16,
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  commentProfileIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  commentTextContainer: {
    flex: 1,
  },
  commentUserName: {
    fontWeight: 'bold',
  },
  commentText: {
    marginTop: 2,
    fontSize: 14,
  },
  commentDate: {
    marginTop: 2,
    fontSize: 12,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  commentInput: {
    flex: 1,
    padding: 10,
    borderRadius: 20,
    marginRight: 10,
  },
  sendButton: {
    padding: 5,
  },
});

export default PostDetail;
