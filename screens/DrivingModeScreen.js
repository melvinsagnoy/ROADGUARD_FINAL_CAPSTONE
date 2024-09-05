import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Linking, Alert } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker, Polyline } from 'react-native-maps';
import { getDatabase, ref, onValue } from 'firebase/database';
import { database } from '../firebaseConfig'; // Adjust the import path as needed
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import * as Speech from 'expo-speech'; // Import TTS




const mapStyle = [
  {
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#1d2c4d"
      }
    ]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#8ec3b9"
      }
    ]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#1a3646"
      }
    ]
  },
  {
    "featureType": "administrative.country",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": "#4b6878"
      }
    ]
  },
  {
    "featureType": "administrative.land_parcel",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#64779e"
      }
    ]
  },
  {
    "featureType": "administrative.province",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": "#4b6878"
      }
    ]
  },
  {
    "featureType": "landscape.man_made",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": "#334e87"
      }
    ]
  },
  {
    "featureType": "landscape.natural",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#023e58"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#283d6a"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#6f9ba5"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#1d2c4d"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": "#023e58"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#3C7680"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#304a7d"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#98a5be"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#1d2c4d"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#2c6675"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": "#255763"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#b0d5ce"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#023e58"
      }
    ]
  },
  {
    "featureType": "transit",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#98a5be"
      }
    ]
  },
  {
    "featureType": "transit",
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#1d2c4d"
      }
    ]
  },
  {
    "featureType": "transit.line",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": "#283d6a"
      }
    ]
  },
  {
    "featureType": "transit.station",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#3a4762"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#0e1626"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#4e6d70"
      }
    ]
  }
];

const DrivingModeScreen = ({ navigation, route }) => {
  const { location, destinationCoords, destinationAddress } = route.params;
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [distance, setDistance] = useState(null);
  const [directions, setDirections] = useState([]);
  const [currentInstructionIndex, setCurrentInstructionIndex] = useState(0);
  const [nextTurnInstruction, setNextTurnInstruction] = useState('');
  const [posts, setPosts] = useState([]); // New state for posts
  const [hazardAlerted, setHazardAlerted] = useState(false); // Track if hazard alert is already shown
  const mapRef = useRef(null);

  useEffect(() => {
    // Fetch route data
    const fetchRouteData = async () => {
      const apiKey = 'AIzaSyACvMNE1lw18V00MT1wzRDW1vDlofnOZbw'; // Replace with your actual API key
      try {
        const response = await axios.get(
          `https://maps.googleapis.com/maps/api/directions/json?origin=${location.latitude},${location.longitude}&destination=${destinationCoords.latitude},${destinationCoords.longitude}&mode=driving&key=${apiKey}`
        );
        if (response.data.status === 'OK') {
          const points = response.data.routes[0].overview_polyline.points;
          const steps = response.data.routes[0].legs[0].steps;
          setRouteCoordinates(decodePolyline(points));
          setDistance(response.data.routes[0].legs[0].distance.text);
          setDirections(steps.map(step => stripHtmlTags(step.html_instructions)));
        } else {
          Alert.alert('Error', 'Unable to fetch route');
        }
      } catch (error) {
        console.error(error);
        Alert.alert('Error', 'Unable to fetch route');
      }
    };

    fetchRouteData();
  }, [location, destinationCoords]);

  useEffect(() => {
  // Fetch posts (hazards) from Firebase Realtime Database
  const postsRef = ref(database, 'posts');
  const unsubscribe = onValue(postsRef, (snapshot) => {
    const postsData = snapshot.val();
    if (postsData) {
      const filteredPosts = Object.values(postsData).filter(post => post.upvotes >= 2);
      setPosts(filteredPosts);
    }
  }, (error) => {
    console.error('Error fetching posts:', error);
  });

  return () => {
    // Clean up listener on unmount
    unsubscribe();
  };
}, []);

  useEffect(() => {
    // Handle location updates and check for proximity to hazards
    const handleLocationUpdate = () => {
      if (directions.length > 0 && routeCoordinates.length > 0) {
        const currentInstruction = directions[currentInstructionIndex];
        if (currentInstruction) {
          const nextInstructionIndex = currentInstructionIndex + 1;
          const nextInstruction = directions[nextInstructionIndex];

          const distanceToNextTurn = calculateDistanceToNextTurn(location, routeCoordinates, nextInstructionIndex);

          if (distanceToNextTurn < 50) {
            setNextTurnInstruction(currentInstruction);
            setCurrentInstructionIndex(nextInstructionIndex);
          }

          // Check proximity to any hazard posts
          posts.forEach((post) => {
            const distanceToHazard = getDistance(
              location.latitude, location.longitude,
              post.location.latitude, post.location.longitude
            );

            // If within 100 meters of the hazard and not already alerted
            if (distanceToHazard < 100 && !hazardAlerted) {
              triggerHazardAlert(post);
            }
          });
        }
      }
    };

    handleLocationUpdate();
    const interval = setInterval(handleLocationUpdate, 5000);

    return () => clearInterval(interval);
  }, [location, directions, routeCoordinates, currentInstructionIndex, posts, hazardAlerted]);

  const triggerHazardAlert = (post) => {
    setHazardAlerted(true);

    // Visual alert
    Alert.alert(
      'Hazard Alert!',
      `Hazard ahead: ${post.title}. Upvotes: ${post.upvotes}`,
      [
        { text: 'Avoid', onPress: () => getAlternateRoute(post.location) },
        { text: 'Proceed', onPress: () => console.log('Proceeding with caution') }
      ]
    );

    // Voice alert
    Speech.speak(`Hazard ahead: ${post.title}. Please proceed with caution or take an alternate route.`);
  };

  const getAlternateRoute = async (hazardLocation) => {
    const apiKey = 'AIzaSyACvMNE1lw18V00MT1wzRDW1vDlofnOZbw';
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${location.latitude},${location.longitude}&destination=${destinationCoords.latitude},${destinationCoords.longitude}&avoid=hazards&mode=driving&key=${apiKey}`
      );
      if (response.data.status === 'OK') {
        const points = response.data.routes[0].overview_polyline.points;
        setRouteCoordinates(decodePolyline(points));
        Alert.alert('Alternate Route', 'An alternate route has been calculated.');
      } else {
        Alert.alert('Error', 'Unable to find an alternate route');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Unable to calculate alternate route');
    }
  };

  const decodePolyline = (t) => {
    let points = [];
    let index = 0, len = t.length;
    let lat = 0, lng = 0;

    while (index < len) {
      let b, shift = 0, result = 0;
      do {
        b = t.charAt(index++).charCodeAt(0) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = t.charAt(index++).charCodeAt(0) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      points.push({
        latitude: (lat / 1E5),
        longitude: (lng / 1E5)
      });
    }
    return points;
  };

  const calculateDistanceToNextTurn = (currentLocation, routeCoords, instructionIndex) => {
    if (instructionIndex >= routeCoords.length) return 0;

    const nextTurnLocation = routeCoords[instructionIndex];
    const distance = getDistance(
      currentLocation.latitude, currentLocation.longitude,
      nextTurnLocation.latitude, nextTurnLocation.longitude
    );
    return distance;
  };

  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c * 1000; // Distance in meters
    return distance;
  };

  const stripHtmlTags = (html) => {
    return html.replace(/<[^>]*>/g, '');
  };

  const handleDrivingModePress = () => {
    const url = `https://www.google.com/maps/dir/?api=1&origin=${location.latitude},${location.longitude}&destination=${destinationCoords.latitude},${destinationCoords.longitude}&travelmode=driving`;
    Linking.openURL(url).catch(err => console.error('Error opening URL:', err));
  };

    return (
    <View style={styles.container}>
    <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Home')}>
  <Text style={{ color: 'white' }}>Back</Text>
</TouchableOpacity>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }}
        showsUserLocation
        showsMyLocationButton
        rotateEnabled
        customMapStyle={mapStyle}
      >
        {location && (
          <Marker coordinate={location} title="You are here">
            <Image
              source={require('../assets/map_user.png')}
              style={styles.userMarker}
              resizeMode="stretch"
            />
          </Marker>
        )}
        {destinationCoords && <Marker coordinate={destinationCoords} />}
        {routeCoordinates.length > 0 && (
          <Polyline coordinates={routeCoordinates} strokeWidth={4} strokeColor="#E0C55B" />
        )}
        {posts.map((post, index) => (
          post.location && (
            <Marker
              key={index}
              coordinate={post.location}
              title={post.title}
              description={`Upvotes: ${post.upvotes}`}
            >
              <Image
                source={require('../assets/hazard_icon.png')}
                style={styles.hazardIcon}
                resizeMode="stretch"
              />
            </Marker>
          )
        ))}
      </MapView>

      <View style={styles.infoContainer}>
        <Text style={styles.addressText}>{destinationAddress}</Text>
        <Text style={styles.distanceText}>{distance}</Text>
      </View>

      <View style={styles.nextTurnContainer}>
        <Icon 
            name={nextTurnInstruction.includes('left') ? 'turn-left' : nextTurnInstruction.includes('right') ? 'turn-right' : 'straight'} 
            size={24} 
            style={styles.directionIcon} 
            />
        <View style={styles.nextTurnTextContainer}>
            <Text style={styles.nextTurnText}>Next Turn: {nextTurnInstruction}</Text>
        </View>
        </View>

      <TouchableOpacity style={styles.drivingModeButton} onPress={handleDrivingModePress}>
        <Text style={styles.drivingModeButtonText}>Open in Google Maps</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  userMarker: {
    width: 30,
    height: 30,
  },
  hazardIcon: {
    width: 24,
    height: 24,
  },
  infoContainer: {
    position: 'absolute',
    bottom: 70,
    left: 10,
    right: 10,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  addressText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  distanceText: {
    fontSize: 14,
    marginTop: 5,
  },
  nextTurnContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: 'white',
  padding: 10,
  marginHorizontal: 10,
  marginBottom: 10,
  borderRadius: 8,
  elevation: 2,
},
directionIcon: {
  marginRight: 10,
  color: '#3b5998', // Adjust the color as needed
},
nextTurnTextContainer: {
  flex: 1,
},
nextTurnText: {
  fontSize: 16,
  color: '#333',
},
  drivingModeButton: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: '#E0C55B',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  drivingModeButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
  backButton: {
    position: 'absolute',
    top: 40, // Adjust for status bar height if necessary
    left: 10,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Optional: to make the button stand out
    borderRadius: 20,
    padding: 10,
  },
});

export default DrivingModeScreen;