import React, { useRef } from 'react';
import { StyleSheet, TouchableOpacity, Dimensions, Animated, PanResponder, View, Image, useColorScheme } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const FloatingButton = ({ onPress }) => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  // Define the theme styles
  const theme = {
    light: {
      backgroundColor: '#FFFFFF',
      shadowColor: '#000000',
    },
    dark: {
      backgroundColor: '#2C2C2C',
      shadowColor: '#FFFFFF',
    },
  };

  const currentTheme = isDarkMode ? theme.dark : theme.light;

  // Initial position in the top-left corner
  const pan = useRef(new Animated.ValueXY({ x: 20, y: 20 })).current; // Top-left corner
  const isDragging = useRef(false);
  const dragThreshold = 5;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value,
        });
        pan.setValue({ x: 0, y: 0 });
        isDragging.current = false;
      },
      onPanResponderMove: (evt, gestureState) => {
        if (Math.abs(gestureState.dx) > dragThreshold || Math.abs(gestureState.dy) > dragThreshold) {
          isDragging.current = true;
          Animated.event([null, { dx: pan.x, dy: pan.y }], {
            useNativeDriver: false,
          })(evt, gestureState);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        pan.flattenOffset();
        const snapToEdgeX = gestureState.moveX > screenWidth / 2 ? screenWidth - 80 : 20;
        const snapToEdgeY = Math.min(Math.max(gestureState.moveY, 20), screenHeight - 80);

        Animated.spring(pan, {
          toValue: { x: snapToEdgeX, y: snapToEdgeY },
          useNativeDriver: false,
        }).start();

        if (!isDragging.current) {
          onPress();
        }
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.floatingButton,
          {
            transform: pan.getTranslateTransform(),
            backgroundColor: currentTheme.backgroundColor,
            shadowColor: currentTheme.shadowColor,
          },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity style={styles.buttonContent} onPress={onPress}>
          <Image source={require('../assets/floating_icon.png')} style={styles.image} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'absolute',
    width: screenWidth,
    height: screenHeight,
  },
  floatingButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    elevation: 5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    zIndex: 1000, // Make sure the button stays above other content
  },
  buttonContent: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
});

export default FloatingButton;
