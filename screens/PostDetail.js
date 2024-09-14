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
import { ref, onValue, get, push, set, update } from 'firebase/database';
import { database, auth, firestore } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

const PostDetail = ({ route, navigation }) => {
  const { colors } = useTheme();
  const [post, setPost] = useState({});
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [userData, setUserData] = useState({});

  useEffect(() => {
    // Fetch the post details
    const fetchPostDetails = async () => {
      const postId = route.params?.postId;
      if (!postId) return;

      const postRef = ref(database, `posts/${postId}`);
      const snapshot = await get(postRef);
      if (snapshot.exists()) {
        setPost({ id: snapshot.key, ...snapshot.val() });
      }
    };

    // Fetch the comments for the post
    const fetchComments = () => {
      const commentsRef = ref(database, `posts/${route.params?.postId}/comments`);
      onValue(commentsRef, (snapshot) => {
        const data = snapshot.val() || [];
        setComments(Object.values(data));
      });
    };

    // Fetch user data from Firestore
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

    fetchPostDetails();
    fetchComments();
    fetchUserData();
  }, [route.params]);

  // Submit a comment
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
      userId: currentUser?.email,
      displayName: userData.displayName || 'Anonymous',
      profileImage: userData.photoURL || 'https://via.placeholder.com/30',
      createdAt: Date.now(),
    });

    setCommentText(''); // Reset the input
  };

  // Handle upvote
  const handleUpvote = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const userUpvoteRef = ref(database, `posts/${post.id}/upvotes/${currentUser.uid}`);
    const upvoteSnapshot = await get(userUpvoteRef);

    if (!upvoteSnapshot.exists()) {
      const postRef = ref(database, `posts/${post.id}`);
      await update(postRef, { upvotes: (post.upvotes || 0) + 1 });

      // Track that the user has upvoted
      await set(userUpvoteRef, true);
    }
  };

  // Handle downvote
  const handleDownvote = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const userDownvoteRef = ref(database, `posts/${post.id}/downvotes/${currentUser.uid}`);
    const downvoteSnapshot = await get(userDownvoteRef);

    if (!downvoteSnapshot.exists()) {
      const postRef = ref(database, `posts/${post.id}`);
      await update(postRef, { downvotes: (post.downvotes || 0) + 1 });

      // Track that the user has downvoted
      await set(userDownvoteRef, true);
    }
  };

  const formatDate = (timestamp) => {
    return format(new Date(timestamp), 'PPpp');
  };

  if (!post || !post.id) {
    return (
      <View style={styles.container}>
        <Text>Loading post details...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Back Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={30} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerText}>Post Details</Text>
      </View>

      <View style={styles.feedItem}>
        <View style={styles.feedHeader}>
          <Image
            source={{ uri: post.photoURL || 'https://via.placeholder.com/50' }}
            style={styles.profileIcon}
          />
          <View style={styles.feedHeaderText}>
            <Text style={[styles.feedAuthor, { color: colors.text }]}>
              {typeof post.displayName === 'string' ? post.displayName : 'Unknown User'}
            </Text>
            {post.location ? (
              <Text style={[styles.feedLocation, { color: colors.text }]}>
                Location: {post.location.latitude}, {post.location.longitude}
              </Text>
            ) : (
              <Text style={[styles.feedLocation, { color: colors.text }]}>
                Location: Not available
              </Text>
            )}
          </View>
        </View>

        <View style={styles.feedContent}>
          {post.imageURL ? (
            <Image source={{ uri: post.imageURL }} style={styles.feedImage} />
          ) : null}
          <Text style={[styles.feedTitle, { color: colors.text }]}>
            {typeof post.title === 'string' ? post.title : 'No title'}
          </Text>
          <Text style={[styles.feedBody, { color: colors.text }]}>
            {typeof post.body === 'string' ? post.body : 'No content available.'}
          </Text>
          <Text style={styles.postDate}>
            {formatDate(post.createdAt || Date.now())}
          </Text>
        </View>
      </View>

      <View style={styles.voteSection}>
        <TouchableOpacity onPress={handleUpvote} style={styles.voteButton}>
          <MaterialIcons name="thumb-up" size={24} color="blue" />
          <Text style={styles.voteCount}>{post.upvotes || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDownvote} style={styles.voteButton}>
          <MaterialIcons name="thumb-down" size={24} color="red" />
          <Text style={styles.voteCount}>{post.downvotes || 0}</Text>
        </TouchableOpacity>
      </View>

      {/* Render comments */}
      {comments.map((comment, index) => (
        <View key={index} style={styles.commentItem}>
          <Image
            source={{ uri: comment.profileImage || 'https://via.placeholder.com/30' }}
            style={styles.commentProfileIcon}
          />
          <View style={styles.commentTextContainer}>
            <Text style={styles.commentUserName}>
              {typeof comment.displayName === 'string' ? comment.displayName : 'Anonymous'}
            </Text>
            <Text style={styles.commentText}>{comment.text}</Text>
            <Text style={styles.commentDate}>{formatDate(comment.createdAt)}</Text>
          </View>
        </View>
      ))}

      {/* Comment input */}
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
