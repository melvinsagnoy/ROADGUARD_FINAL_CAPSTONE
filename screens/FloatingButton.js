import React, { useRef } from 'react';
import { StyleSheet, TouchableOpacity, Dimensions, Animated, PanResponder, View, Image } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const FloatingButton = ({ onPress }) => {
  const pan = useRef(new Animated.ValueXY({ x: screenWidth - 80, y: screenHeight / 2 })).current;
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
          },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity style={styles.buttonContent} onPress={onPress}>
          {/* Replace FontAwesome icon with Image component */}
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
    backgroundColor: '#ffff',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
  },
  buttonContent: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 40, // Set the width of the image
    height: 40, // Set the height of the image
    resizeMode: 'contain', // Adjust the image size as needed
  },
});

export default FloatingButton;