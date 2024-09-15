import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  Animated,
  Switch,
  RefreshControl,
  TextInput
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import NavBar from './NavBar';
import { auth, firestore } from '../firebaseConfig';
import CreatePostModal from './CreatePostModal';
import { useFonts } from 'expo-font';
import { useTheme } from 'react-native-paper';
import { collection, getDocs, query, orderBy, doc, getDoc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import CommentModal from './CommentModal'; // Import the CommentModal component
import EditPostModal from './EditPostModal'; 
import { ActivityIndicator } from 'react-native';
import { formatDistanceToNow } from 'date-fns';
import { ref, onValue, update, get, child, push, set, remove } from 'firebase/database';
import { database } from '../firebaseConfig';
import { format } from 'date-fns';
import { BackHandler } from 'react-native';
import axios from 'axios';
import WeatherHeader from './WeatherHeader'; // Import the WeatherHeader component

const GOOGLE_API_KEY = 'AIzaSyACvMNE1lw18V00MT1wzRDW1vDlofnOZbw';


const HomeScreen = ({ navigation, toggleTheme, isDarkTheme }) => {
  

  const apiKey = 'b2529bcc950c7e261538c1ddb942c44e';
  const { colors } = useTheme();
  const [isCreatePostModalVisible, setCreatePostModalVisible] = useState(false);
  const [isMenuModalVisible, setMenuModalVisible] = useState(false);
  const [isSettingsModalVisible, setSettingsModalVisible] = useState(false);
  const [posts, setPosts] = useState([]);
  const [userVotes, setUserVotes] = useState({}); // Track user votes
  const [iconScales, setIconScales] = useState({
    home: new Animated.Value(1),
    search: new Animated.Value(1),
    add: new Animated.Value(1),
    bell: new Animated.Value(1),
    user: new Animated.Value(1),
  });
  const [activeNav, setActiveNav] = useState('home');
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({});
  const [fontsLoaded] = useFonts({
    Poppins: require('../assets/fonts/Poppins-Regular.ttf'),
  });
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [isCommentModalVisible, setCommentModalVisible] = useState(false);
 const [dropdownMenu, setDropdownMenu] = useState(null); 
  const [isEditPostModalVisible, setEditPostModalVisible] = useState(false);
const [currentPostContent, setCurrentPostContent] = useState({ title: '', body: '' });
const [isLoading, setIsLoading] = useState(false);
const [filter, setFilter] = useState('newest'); // Default to 'newest'
  const [commentText, setCommentText] = useState(''); // State for comment input
  const [comments, setComments] = useState({}); 
  
  
  

  useEffect(() => {
    // Fetch posts and comments on component mount
    fetchAllPosts();
    fetchComments();

    // Setup auth state listener
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      setUser(authUser);
      if (authUser) {
        fetchUserData(authUser.email);
      }
    });

    // Add back button handler
    const backAction = () => {
      // Exit the app or handle the back press
      BackHandler.exitApp();
      return true; // Indicates that we have handled the event
    };

    BackHandler.addEventListener('hardwareBackPress', backAction);

    // Clean up auth state listener and back button handler on unmount
    return () => {
      unsubscribe();
      BackHandler.removeEventListener('hardwareBackPress', backAction);
    };
  }, [filter]);

  
    useEffect(() => {
    // Fetch posts and comments on component mount
    fetchAllPosts();
    fetchComments();

    // Setup auth state listener
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      setUser(authUser);
      if (authUser) {
        fetchUserData(authUser.email);
      }
    });

    // Clean up auth state listener on unmount
    return () => unsubscribe();
  }, [filter]);

  const fetchComments = () => {
    try {
      const commentsRef = ref(database, 'posts');
      onValue(commentsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const fetchedComments = {};
          Object.keys(data).forEach(postId => {
            if (data[postId].comments) {
              fetchedComments[postId] = Object.values(data[postId].comments);
            }
          });
          setComments(fetchedComments);
        } else {
          setComments({});
        }
      });
    } catch (error) {
      console.error("Error fetching comments: ", error);
    }
  };

 


useEffect(() => {
  const unsubscribe = auth.onAuthStateChanged((authUser) => {
    setUser(authUser);
    if (authUser) {
      fetchUserData(authUser.email);
    }
  });

  return () => unsubscribe();
}, []);

const formatDate = (timestamp) => {
  try {
    const parsedDate = new Date(timestamp);
    if (isNaN(parsedDate.getTime())) throw new Error('Invalid date');

    // Format the date using 'date-fns' or similar library
    return format(parsedDate, 'PPpp'); // Example: 'Aug 26, 2024, 1:23 PM'
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

const fetchAddress = async (latitude, longitude) => {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}`
      );
      const address = response.data.results[0].formatted_address;
      return address;
    } catch (error) {
      console.error('Error fetching address:', error);
      return 'Address not available';
    }
  };

  const openCommentModal = (postId) => {
  console.log('Opening comment modal for Post ID:', postId); // Add this line to debug
  setSelectedPostId(postId);
  setCommentModalVisible(true);
};

const closeCommentModal = () => {
  console.log('Closing comment modal. Resetting Post ID'); // Add this line to debug
  setSelectedPostId(null);
  setCommentModalVisible(false);
};


  
const submitComment = async () => {
  if (!commentText.trim()) {
    // No comment text entered
    return;
  }

  try {
    // Add comment to the selected post's comments
    await set(push(ref(database, `posts/${selectedPostId}/comments`)), {
      text: commentText,
      userId: user.email,
      displayName: userData.displayName || 'Anonymous',
      photoURL: userData.photoURL || 'https://via.placeholder.com/150', // Ensure this is correct
      createdAt: Date.now(),
    });


    // Clear the input after submission
    setCommentText('');
  } catch (error) {
    console.error("Error submitting comment: ", error);
  }
};

  const fetchUserData = async (email) => {
  try {
    const userRef = doc(firestore, 'users', email);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      const userData = docSnap.data();
      setUserData({
        ...userData,
        photoURL: userData.photoURL || 'https://via.placeholder.com/150',
      });
    } else {
      console.log('No user data found for:', email);
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
  }
};

  const fetchAllPosts = async () => {
  try {
    const postsRef = ref(database, 'posts');
    onValue(postsRef, async (snapshot) => {
      const postsData = snapshot.val();
      if (postsData) {
        let postsArray = await Promise.all(
          Object.keys(postsData).map(async (key) => {
            const post = postsData[key];
            let address = 'Location not available';
            if (post.location) {
              address = await fetchAddress(post.location.latitude, post.location.longitude);
            }
            return {
              id: key,
              ...post,
              address, // Add the fetched address to the post data
            };
          })
        );

        // Sort posts by 'createdAt' in descending order (latest posts first)
        postsArray.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        setPosts(postsArray);
      } else {
        setPosts([]);
      }
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
  }
};

const handleFilterChange = (selectedFilter) => {
  setFilter(selectedFilter);
  fetchAllPosts(); // Refetch posts after filter change
};

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAllPosts();
    setRefreshing(false);
  }, []);

  const toggleCreatePostModal = () => {
    setCreatePostModalVisible(!isCreatePostModalVisible);
  };

  const toggleMenuModal = () => {
    setMenuModalVisible((prev) => !prev);
  };

  const handleSettings = () => {
    setMenuModalVisible(false);
    setSettingsModalVisible(true);
  };

  const handleLogout = () => {
    auth.signOut().then(() => {
      setMenuModalVisible(false);
      navigation.navigate('Login');
    }).catch((error) => {
      console.error('Error logging out: ', error);
    });
  };


const addNewPost = async (newPost) => {
  const postRef = ref(database, 'posts');
  const newPostRef = push(postRef); // Generate a new key
  await set(newPostRef, {
    ...newPost,
    createdAt: new Date().toISOString(),
    upvotes: 0,
    downvotes: 0,
    voters: {},
    photoURL: newPost.photoURL || null, // Include photoURL, default to null if not provided
    displayName: userData.displayName || 'Anonymous', // Add displayName here
  });
  await fetchAllPosts(); // Refresh posts after adding
};


 const sanitizeKey = (key) => {
  // Replace invalid characters with underscores or remove them
  return key.replace(/[.#$\/\[\]]/g, '_');
};

const handleVote = async (postId, voteType) => {
  setIsLoading(true); // Start loading indicator
  const currentUser = auth.currentUser;

  if (!currentUser || !currentUser.email) {
    console.error('User email is not available.');
    setIsLoading(false); // End loading
    return;
  }

  const userEmail = currentUser.email.toLowerCase().trim();
  const sanitizedEmail = sanitizeKey(userEmail); // Use the sanitized email

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

    // Determine the vote type ('upvote' or 'downvote') for consistency
    const newVoteType = voteType === 'upvotes' ? 'upvote' : 'downvote';

    // Handle voting logic
    const previousVote = voters[sanitizedEmail];
    if (previousVote && previousVote.voteType === newVoteType) {
      // Remove the vote
      newVoteType === 'upvote' ? upvotes-- : downvotes--;
      delete voters[sanitizedEmail];
    } else {
      // Change or add new vote
      if (previousVote) {
        // If changing the vote type, decrement the previous vote
        previousVote.voteType === 'upvote' ? upvotes-- : downvotes--;
      }
      // Increment the new vote type
      newVoteType === 'upvote' ? upvotes++ : downvotes++;
      voters[sanitizedEmail] = {
        voteType: newVoteType, // Ensure the vote type is consistent ('upvote' or 'downvote')
        displayName,
        email: userEmail,
        photoURL,
        timestamp: Date.now() // Save the timestamp as an integer in milliseconds
      };
    }

    // Update post in the database
    await update(postRef, {
      upvotes,
      downvotes,
      voters
    });

    // Optionally, refresh the local state to reflect the new votes
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId
          ? { ...post, upvotes, downvotes, voters }
          : post
      )
    );
  } catch (error) {
    console.error('Error handling vote:', error);
  } finally {
    setIsLoading(false);
  }
};



const handleMenuPress = (postId) => {
  if (dropdownMenu === postId) {
    setDropdownMenu(null);
  } else {
    setDropdownMenu(postId);
  }
};

const handleEditPost = (postId, currentContent) => {
  setCurrentPostContent(currentContent);
  setSelectedPostId(postId);
  setEditPostModalVisible(true);
};

const handleSaveEdit = async (editedContent) => {
  if (!selectedPostId) return;

  const postRef = ref(database, `posts/${selectedPostId}`);
  await update(postRef, {
    title: editedContent.title,
    body: editedContent.body,
    photoURL: editedContent.photoURL || null, // Update photoURL if provided
  });

  setEditPostModalVisible(false);
  await fetchAllPosts(); // Refresh posts after editing
};
// Include the EditPostModal component
const handleDeletePost = async (postId) => {
  try {
    const postRef = ref(database, `posts/${postId}`);
    await update(postRef, null); // Set to null to delete the post
    await fetchAllPosts(); // Refresh posts after deletion
    setDropdownMenu(null);
  } catch (error) {
    console.error('Error deleting post:', error);
  }
};
  
  const renderNewsFeed = () => {
  return posts.map((post) => (
    <View key={post.id} style={styles.feedItem}>
      <View style={styles.feedHeader}>
        <Image
          source={{ uri: post.photoURL || 'https://via.placeholder.com/50' }}
          style={styles.profileIcon}
        />
        <View style={styles.feedHeaderText}>
          <Text style={[styles.feedAuthor, { color: colors.text }]}>
            {post.displayName}
          </Text>
          {post.location ? (
            <Text style={styles.feedLocation}>
              {post.address ? post.address : 'Location not available'}
            </Text>
          ) : (
            <Text style={[styles.feedLocation, { color: colors.text }]}>
              Location: Not available
            </Text>
          )}
        </View>
        {user && user.email === post.id && (
          <TouchableOpacity onPress={() => handleMenuPress(post.id)} style={styles.menuButton}>
            <MaterialIcons name="more-vert" size={24} color={colors.text} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.feedContent}>
        {post.imageURL ? (
          <Image source={{ uri: post.imageURL }} style={styles.feedImage} />
        ) : null}
        <Text style={[styles.feedTitle, { color: colors.text }]}>
          {post.title}
        </Text>
        <Text style={[styles.feedBody, { color: colors.text }]}>
          {post.body}
        </Text>
        <Text style={styles.postDate}>
          {post.createdAt ? formatDate(post.createdAt) : 'Date not available'}
        </Text>

        <View style={styles.voteContainer}>
          <TouchableOpacity onPress={() => handleVote(post.id, 'upvotes')}>
            <MaterialIcons
              name="thumb-up"
              size={24}
              color={userVotes[post.id] === 'upvotes' ? '#E0C55B' : colors.text}
            />
          </TouchableOpacity>
          <Text style={styles.voteCount}>{post.upvotes || 0}</Text>
          <TouchableOpacity onPress={() => handleVote(post.id, 'downvotes')}>
            <MaterialIcons
              name="thumb-down"
              size={24}
              color={userVotes[post.id] === 'downvotes' ? '#E0C55B' : colors.text}
            />
          </TouchableOpacity>
          <Text style={styles.voteCount}>{post.downvotes || 0}</Text>
        </View>

        <TouchableOpacity onPress={() => openCommentModal(post.id)}>
          <Text style={[styles.commentButton, { color: colors.primary }]}>
            View Comments
          </Text>
        </TouchableOpacity>

        {selectedPostId === post.id && (
          <View style={styles.commentInputContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Write a comment..."
              value={commentText}
              onChangeText={(text) => setCommentText(text)}
            />
            <TouchableOpacity onPress={submitComment} style={styles.sendButton}>
              <MaterialIcons name="send" size={24} color="blue" />
            </TouchableOpacity>
          </View>
        )}

        {/* Render comments */}
        {comments[post.id] && comments[post.id]
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) // Sort by newest first
          .slice(0, 3) // Take only the 3 newest comments
          .map((comment, index) => (
            <View key={index} style={styles.commentItem}>
              <Image
                source={{ uri: comment.profileImage || 'https://via.placeholder.com/30' }}
                style={styles.commentProfileIcon}
              />
              <View style={styles.commentTextContainer}>
                <Text style={styles.commentUserName}>{comment.displayName || 'Anonymous'}</Text>
                <Text style={styles.commentText}>{comment.text}</Text>
                <Text style={styles.commentDate}>
                  {formatDate(comment.createdAt)}
                </Text>
              </View>
            </View>
          ))}
      </View>

      {dropdownMenu === post.id && (
        <View style={styles.dropdownMenu}>
          <TouchableOpacity 
            onPress={() => handleEditPost(post.id, { title: post.title, body: post.body })} 
            style={styles.dropdownItem}
          >
            <Text style={styles.dropdownText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDeletePost(post.id)} style={styles.dropdownItem}>
            <Text style={styles.dropdownText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  ));
};

  const animateIcon = (iconName) => {
    Animated.sequence([
      Animated.timing(iconScales[iconName], {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(iconScales[iconName], {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(iconScales[iconName], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const setActiveScreen = (screen, navButton) => {
    setActiveNav(navButton);
    navigation.navigate(screen);
  };

  const handleCreatePost = () => {
    setCreatePostModalVisible(true);
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
    <View style={styles.weatherHeaderContainer}>
    <WeatherHeader apiKey={apiKey} latitude={10.3157} longitude={123.8854} />
  </View>
    {isLoading && (
      <View style={styles.loadingOverlay}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )}
      <EditPostModal
        visible={isEditPostModalVisible}
        onClose={() => setEditPostModalVisible(false)}
        onSubmit={handleSaveEdit}
        currentPostContent={currentPostContent}
      />
      <CreatePostModal
        visible={isCreatePostModalVisible}
        onClose={() => {
          setCreatePostModalVisible(false);
        }}
        onSubmit={addNewPost}
        userId={user?.uid}
      />

      <CommentModal
        visible={isCommentModalVisible}
        onClose={closeCommentModal}
        postId={selectedPostId}
      />

      <Modal
        visible={isMenuModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={toggleMenuModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <TouchableOpacity onPress={handleSettings}>
              <Text style={[styles.modalText1, { color: colors.text }]}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout}>
              <Text style={[styles.modalText2, { color: colors.text }]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isSettingsModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSettingsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.settingOption}>
              <Text style={[styles.settingText, { color: colors.text }]}>Dark Mode</Text>
              <Switch value={isDarkTheme} onValueChange={toggleTheme} />
            </View>
            <TouchableOpacity onPress={() => setSettingsModalVisible(false)}>
              <Text style={[styles.modalText2, { color: colors.text }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

        
      <View style={styles.createPostButtonContainer}>
        <TouchableOpacity style={styles.createPostButton} onPress={handleCreatePost}>
          <MaterialIcons name="add" size={24} color="black" />
        </TouchableOpacity>
      </View>

      <View style={styles.headerHead}>
        <Image source={require('../assets/icon.png')} style={styles.headerIcon} />
        <Text style={[styles.headerTitle, { color: colors.text }]}>RoadGuard</Text>
        <TouchableOpacity style={styles.menuIconContainer} onPress={toggleMenuModal}>
          <MaterialIcons name="menu" size={30} color={colors.text} />
        </TouchableOpacity>

        {user && (
          <TouchableOpacity style={styles.profileIconContainer} onPress={() => navigation.navigate('Profile')}>
            <Image
              source={{ uri: userData.photoURL || 'https://via.placeholder.com/150' }}
              style={styles.profileIcon}
            />
          </TouchableOpacity>
        )}
        
      </View>

      <ScrollView
        style={[styles.newsFeedContainer, { backgroundColor: colors.background }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {renderNewsFeed()}
      </ScrollView>

      <NavBar
        navigation={navigation}
        animateIcon={animateIcon}
        activeNav={activeNav}
        setActiveScreen={setActiveScreen}
        iconScales={iconScales}
      />
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
    flex: 1,
    backgroundColor: '#fff', // Default background color
  },
  weatherHeaderContainer: {
  paddingTop: 10,
  paddingHorizontal: 20, // Light background for visibility
  borderBottomWidth: 2,
  borderBottomColor: '#dedede',
  top: 100
},

  commentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 4,
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
    // color will be set dynamically based on the theme
  },
  commentText: {
    // color will be set dynamically based on the theme
  },
  commentDate: {
    fontSize: 12,
    // color will be set dynamically based on the theme
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
    zIndex: 10,
  },
  container: {
    flex: 1,
    paddingTop: 15,
  },
  createPostButtonContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
   commentButton: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerHead: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 20,
    height: 120,
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  headerIcon: {
    width: 50,
    height: 50,
    position: 'absolute',
    top: 55,
    left: 15,
    zIndex: 1,
    borderRadius: 5,
    borderColor: '#7C7A7A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 25,
    fontWeight: 'bold',
    position: 'absolute',
    top: 65,
    left: 75,
  },
  menuIconContainer: {
    position: 'absolute',
    top: 60,
    right: 20,
  },
  profileIconContainer: {
    position: 'absolute',
    top: 60,
    right: 60,
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#000',
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
    textAlign: 'center',
    justifyContent: 'center',
    alignContent: 'center',
    alignItems: 'center',
  },
  modalText1: {
    backgroundColor: '#E0C55B',
    padding: 20,
    width: 200,
    borderRadius: 50,
    fontSize: 18,
    margin: 20,
    color: '#000',
  },
  modalText2: {
    backgroundColor: '#545151',
    padding: 20,
    width: 200,
    borderRadius: 50,
    fontSize: 18,
    margin: 20,
    color: '#fff',
  },
  newsFeedContainer: {
    marginTop: 140,
    padding: 10,
  },
   feedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  feedAuthor: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    fontFamily: 'Poppins',
  },
  feedItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 20,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  feedContent: {
    flex: 1,
  },
  feedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    fontFamily: 'Poppins',
  },
  feedBody: {
    fontSize: 14,
    marginBottom: 10,
    fontFamily: 'Poppins',
  },
  feedLocation: {
    fontSize: 12,
    marginBottom: 5,
    fontStyle: 'italic',
    fontFamily: 'Poppins',
  },
  feedImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
  createPostButton: {
    position: 'absolute',
    right: 7,
    top: 80,
    backgroundColor: '#E0C55B',
    padding: 10,
    paddingVertical: 13,
    borderRadius: 30,
    flexDirection: 'row',
    width: '13%',
    textAlign: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
    justifyContent: 'center',
    alignItems: 'center',
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
  voteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  voteCount: {
    fontSize: 14,
    marginHorizontal: 10,
  },
   menuButton: {
    marginLeft: 'auto',
  },
  dropdownMenu: {
  position: 'absolute',
  top: 40,
  right: 0,
  backgroundColor: '#fff',
  borderRadius: 5,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 5,
  elevation: 3,
  width: 150,
},
dropdownItem: {
  padding: 10,
  borderBottomWidth: 1,
  borderBottomColor: '#ddd',
},
dropdownText: {
  fontSize: 16,
  color: '#000',
},

filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
    backgroundColor: '#f5f5f5',
  },
  filterButton: {
    padding: 10,
  },
  activeFilter: {
    borderBottomWidth: 2,
    borderBottomColor: '#000',
  },
  filterText: {
    fontSize: 16,
  },
   commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 10,
  },
  commentInput: {
    flex: 1,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    padding: 8,
  },
  sendButton: {
    marginLeft: 10,
    color: '#E0C55B', // Add this line to set the color
  },
});

export default HomeScreen;