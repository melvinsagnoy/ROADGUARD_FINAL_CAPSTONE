import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from 'react-native-paper';
import { format } from 'date-fns';
import { ref, onValue, get, push, set, update, remove } from 'firebase/database';
import { database, auth, firestore } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

const PostDetail = ({ route, navigation }) => {
  const { colors } = useTheme();
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

  // Generate a unique key for the new comment using push()
  const commentRef = ref(database, `posts/${post.id}/comments`).push();

  await set(commentRef, {
    text: commentText,
    userId: currentUser.email, // Include the email of the user
    displayName: userData.displayName || 'Anonymous',
    profileImage: userData.photoURL || 'https://via.placeholder.com/30',
    createdAt: Date.now(),
    userEmail: currentUser.email // Storing the user's email for filtering purposes
  });

  setCommentText(''); // Reset the comment input field after submission
};

const handleVote = async (postId, voteType) => {
  setIsLoading(true); // Start loading indicator
  const currentUser = auth.currentUser;

  if (!currentUser || !currentUser.email) {
    console.error('User email is not available.');
    setIsLoading(false); // Stop loading
    return;
  }

  const userEmail = currentUser.email.toLowerCase().trim();
  const sanitizedEmail = userEmail.replace(/[.#$\/\[\]]/g, '_'); // Remove invalid characters

  try {
    // Get user data
    const userDocRef = doc(firestore, `users/${userEmail}`);
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
      throw new Error('User does not exist in Firestore');
    }
    const userData = userDoc.data();
    const displayName = userData.displayName || 'Anonymous';
    const photoURL = userData.photoURL || 'https://via.placeholder.com/150';

    // Get the post data from Firebase Realtime Database
    const postRef = ref(database, `posts/${postId}`);
    const postSnapshot = await get(postRef);
    const postData = postSnapshot.val();
    if (!postData) {
      throw new Error('Post does not exist');
    }

    // Destructure the current upvotes, downvotes, and voters
    let { upvotes = 0, downvotes = 0, voters = {} } = postData;

    // Convert voteType to match 'upvote' and 'downvote' convention
    const newVoteType = voteType === 'upvotes' ? 'upvote' : 'downvote';

    // Handle vote logic
    if (voters[sanitizedEmail] && voters[sanitizedEmail].voteType === newVoteType) {
      // Remove vote if the user clicks the same vote type again
      newVoteType === 'upvote' ? upvotes-- : downvotes--;
      delete voters[sanitizedEmail]; // Remove the voter from the list
    } else {
      // Add or change the vote
      if (voters[sanitizedEmail]) {
        // If the user is switching vote type, decrement the previous vote type
        voters[sanitizedEmail].voteType === 'upvote' ? upvotes-- : downvotes--;
      }
      // Increment the new vote type
      newVoteType === 'upvote' ? upvotes++ : downvotes++;

      // Update the voter's entry
      voters[sanitizedEmail] = {
        voteType: newVoteType,
        displayName,
        email: userEmail,
        photoURL,
        timestamp: Date.now() // Use integer timestamp (in milliseconds)
      };
    }

    // Update the post with new vote counts and voters
    await update(postRef, {
      upvotes,
      downvotes,
      voters
    });

    // Update the local state (if needed)
    setPost(prev => ({
      ...prev,
      upvotes,
      downvotes,
      voters
    }));
  } catch (error) {
    console.error('Error handling vote:', error);
  } finally {
    setIsLoading(false); // End loading
  }
};




  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={30} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerText}>Post Details</Text>
      </View>
      <View style={styles.feedItem}>
        <View style={styles.feedHeader}>
          <Image source={{ uri: post.photoURL || 'https://via.placeholder.com/50' }} style={styles.profileIcon} />
          <View style={styles.feedHeaderText}>
            <Text style={[styles.feedAuthor, { color: colors.text }]}>
              {post.displayName || 'Unknown User'}
            </Text>
            {post.location && (
              <Text style={[styles.feedLocation, { color: colors.text }]}>
                Location: {`${post.location.latitude}, ${post.location.longitude}`}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.feedContent}>
          {post.imageURL && <Image source={{ uri: post.imageURL }} style={styles.feedImage} />}
          <Text style={[styles.feedTitle, { color: colors.text }]}>{post.title || 'No title'}</Text>
          <Text style={[styles.feedBody, { color: colors.text }]}>{post.body || 'No content available.'}</Text>
          <Text style={styles.postDate}>{format(new Date(post.createdAt || Date.now()), 'PPpp')}</Text>
        </View>
      </View>
      <View style={styles.voteSection}>
        <TouchableOpacity onPress={() => handleVote(post.id, 'upvotes')} style={styles.voteButton}>
          <MaterialIcons name="thumb-up" size={24} color="blue" />
          <Text style={styles.voteCount}>{(post.upvotes || 0).toString()}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleVote(post.id, 'downvotes')} style={styles.voteButton}>
          <MaterialIcons name="thumb-down" size={24} color="red" />
          <Text style={styles.voteCount}>{(post.downvotes || 0).toString()}</Text>
        </TouchableOpacity>
      </View>
      {comments.map((comment, index) => (
        <View key={index} style={styles.commentItem}>
          <Image source={{ uri: comment.profileImage || 'https://via.placeholder.com/30' }} style={styles.commentProfileIcon} />
          <View style={styles.commentTextContainer}>
            <Text style={styles.commentUserName}>{comment.displayName || 'Anonymous'}</Text>
            <Text style={styles.commentText}>{comment.text}</Text>
            <Text style={styles.commentDate}>{format(new Date(comment.createdAt), 'PPpp')}</Text>
          </View>
        </View>
      ))}
      <View style={styles.commentInputContainer}>
        <TextInput
          style={styles.commentInput}
          placeholder="Write a comment..."
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
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
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
    borderBottomColor: '#ddd',
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
    color: '#888',
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
    color: '#333',
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
    color: '#888',
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
    backgroundColor: '#f1f1f1',
    marginRight: 10,
  },
  sendButton: {
    padding: 5,
  },
});

export default PostDetail;
