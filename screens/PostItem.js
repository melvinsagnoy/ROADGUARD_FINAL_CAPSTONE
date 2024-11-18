import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert, useColorScheme } from 'react-native';
import { getFirestore, doc, deleteDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { MaterialIcons } from '@expo/vector-icons';

const PostItem = ({ post, onEdit, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);
  const auth = getAuth();
  const firestore = getFirestore();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  // Theme styles
  const theme = {
    light: {
      background: '#FFFFFF',
      text: '#000000',
      borderColor: '#DDDDDD',
      menuBackground: '#FFFFFF',
      menuText: '#000000',
    },
    dark: {
      background: '#1E1E1E',
      text: '#FFFFFF',
      borderColor: '#444444',
      menuBackground: '#333333',
      menuText: '#FFFFFF',
    },
  };

  const currentTheme = isDarkMode ? theme.dark : theme.light;

  const handleEdit = () => {
    if (auth.currentUser.email === post.authorEmail) {
      onEdit(post.id);
    } else {
      Alert.alert('Error', 'You can only edit your own posts.');
    }
  };

  const handleDelete = async () => {
    if (auth.currentUser.email === post.authorEmail) {
      Alert.alert('Delete Post', 'Are you sure you want to delete this post?', [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(firestore, 'posts', post.id));
              onDelete(post.id);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete the post. Please try again.');
            }
          },
        },
      ]);
    } else {
      Alert.alert('Error', 'You can only delete your own posts.');
    }
  };

  return (
    <View style={[styles.postContainer, { backgroundColor: currentTheme.background, borderBottomColor: currentTheme.borderColor }]}>
      <View style={styles.postHeader}>
        <Text style={[styles.postTitle, { color: currentTheme.text }]}>{post.title}</Text>
        <TouchableOpacity onPress={() => setShowMenu(!showMenu)}>
          <MaterialIcons name="more-vert" size={24} color={currentTheme.text} />
        </TouchableOpacity>
      </View>
      {showMenu && (
        <View style={[styles.menu, { backgroundColor: currentTheme.menuBackground }]}>
          <TouchableOpacity onPress={handleEdit}>
            <Text style={{ color: currentTheme.menuText }}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete}>
            <Text style={{ color: currentTheme.menuText }}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
      {post.imageURL && <Image source={{ uri: post.imageURL }} style={styles.postImage} />}
      <Text style={{ color: currentTheme.text }}>{post.body}</Text>
      <Text style={{ color: currentTheme.text }}>
        {post.location ? `${post.location.latitude}, ${post.location.longitude}` : 'No location'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  postContainer: {
    padding: 10,
    borderBottomWidth: 1,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  postImage: {
    width: '100%',
    height: 200,
    marginVertical: 10,
  },
  menu: {
    position: 'absolute',
    right: 10,
    top: 40,
    borderRadius: 5,
    elevation: 5,
    padding: 10,
    zIndex: 10,
  },
});

export default PostItem;
