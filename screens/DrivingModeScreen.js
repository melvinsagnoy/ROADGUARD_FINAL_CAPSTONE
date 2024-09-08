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
        "color": "#ebe3cd"
      }
    ]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#523735"
      }
    ]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#f5f1e6"
      }
    ]
  },
  {
    "featureType": "administrative",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": "#c9b2a6"
      }
    ]
  },
  {
    "featureType": "administrative.land_parcel",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": "#dcd2be"
      }
    ]
  },
  {
    "featureType": "administrative.land_parcel",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#ae9e90"
      }
    ]
  },
  {
    "featureType": "landscape.natural",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#dfd2ae"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#dfd2ae"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#93817c"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": "#a5b076"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#447530"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#f5f1e6"
      }
    ]
  },
  {
    "featureType": "road.arterial",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#fdfcf8"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#f8c967"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": "#e9bc62"
      }
    ]
  },
  {
    "featureType": "road.highway.controlled_access",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#e98d58"
      }
    ]
  },
  {
    "featureType": "road.highway.controlled_access",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": "#db8555"
      }
    ]
  },
  {
    "featureType": "road.local",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#806b63"
      }
    ]
  },
  {
    "featureType": "transit.line",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#dfd2ae"
      }
    ]
  },
  {
    "featureType": "transit.line",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#8f7d77"
      }
    ]
  },
  {
    "featureType": "transit.line",
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#ebe3cd"
      }
    ]
  },
  {
    "featureType": "transit.station",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#dfd2ae"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": "#b9d3c2"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#92998d"
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
  const [posts, setPosts] = useState([]);
  const [hazardAlerted, setHazardAlerted] = useState(false);
  const mapRef = useRef(null);
  const [duration, setDuration] = useState(null);

  useEffect(() => {
  if (!location || !destinationCoords) return;
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
        setDuration(response.data.routes[0].legs[0].duration.text); // Set duration
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
      unsubscribe();
    };
  }, []);

  useEffect(() => {
  const handleLocationUpdate = () => {
  if (directions.length > 0 && routeCoordinates.length > 0) {
    const currentInstruction = directions[currentInstructionIndex];
    if (currentInstruction) {
      const nextInstructionIndex = currentInstructionIndex + 1;
      const nextInstruction = directions[nextInstructionIndex];

      const distanceToNextTurn = calculateDistanceToNextTurn(location, routeCoordinates, nextInstructionIndex);

      console.log(`Current Instruction: ${currentInstruction}`);
      console.log(`Next Instruction: ${nextInstruction}`);
      console.log(`Distance to Next Turn: ${distanceToNextTurn}`);

      // Check if the next turn is within 50 meters
      if (distanceToNextTurn < 50) {
        setNextTurnInstruction(nextInstruction);
        setCurrentInstructionIndex(nextInstructionIndex);
        // Announce the next turn instruction
        const turnDirection = nextInstruction.includes('left') ? 'left' :
                              nextInstruction.includes('right') ? 'right' : 'straight';
        Speech.speak(`Next turn ${turnDirection} in 50 meters: ${stripHtmlTags(nextInstruction)}`);
      }

      posts.forEach((post) => {
        const distanceToHazard = getDistance(
          location.latitude, location.longitude,
          post.location.latitude, post.location.longitude
        );

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

    Alert.alert(
      'Hazard Alert!',
      `Hazard ahead: ${post.title}. Upvotes: ${post.upvotes}`,
      [
        { text: 'Avoid', onPress: () => getAlternateRoute(post.location) },
        { text: 'Proceed', onPress: () => console.log('Proceeding with caution') }
      ]
    );

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
  return html.replace(/<\/?[^>]+(>|$)/g, ""); // Remove all HTML tags
};

  const handleDrivingModePress = () => {
    const url = `https://www.google.com/maps/dir/?api=1&origin=${location.latitude},${location.longitude}&destination=${destinationCoords.latitude},${destinationCoords.longitude}&travelmode=driving`;
    Linking.openURL(url).catch(err => console.error('Error opening URL:', err));
  };

    return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.nextTurnContainer}>
          <Icon
            name={
              nextTurnInstruction.includes('left') ? 'turn-left' :
              nextTurnInstruction.includes('right') ? 'turn-right' :
              'straight'
            }
            size={24}
            style={styles.directionIcon}
          />
          <View style={styles.nextTurnTextContainer}>
            <Text style={styles.nextTurnText}>Next Turn: {nextTurnInstruction}</Text>
          </View>
        </View>
      </View>

      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: location?.latitude || 0,
          longitude: location?.longitude || 0,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }}
        showsUserLocation
        showsMyLocationButton
        rotateEnabled
      >
        {destinationCoords && <Marker coordinate={destinationCoords} />}
        {routeCoordinates.length > 0 && (
          <Polyline coordinates={routeCoordinates} strokeWidth={4} strokeColor="black" />
        )}
        {posts.map((post, index) =>
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
        )}
      </MapView>

      <View style={styles.infoContainer}>
          <Text style={styles.addressText}>{destinationAddress}</Text>
          <Text style={styles.distanceText}>{distance}</Text>
          <Text style={styles.durationText}>{duration}</Text>
        </View>

      <TouchableOpacity style={styles.drivingModeButton} onPress={() => {/* Handle press */}}>
        <Text style={styles.drivingModeButtonText}>Open in Google Maps</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5', // Background color for the entire screen
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    zIndex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // Semi-transparent background for the header
    padding: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  backButton: {
    backgroundColor: '#E0C55B',
    padding: 10,
    borderRadius: 5,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
  },
  nextTurnContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // Background color for the next turn container
    padding: 10,
    borderRadius: 8,
    elevation: 2,
    flex: 1,
    marginLeft: 10,
  },
  directionIcon: {
    marginRight: 10,
    color: '#3b5998', // Adjust as needed
  },
  nextTurnTextContainer: {
    flex: 1,
  },
  nextTurnText: {
    fontSize: 16,
    color: '#333',
  },
  map: {
    flex: 1,
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
    backgroundColor: 'white', // Background color for the info container
    padding: 10,
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  addressText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  distanceText: {
    fontSize: 14,
    color: '#666',
  },
  durationText: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  drivingModeButton: {
    position: 'absolute',
    bottom: 20,
    left: 10,
    right: 10,
    backgroundColor: '#E0C55B',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  drivingModeButtonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default DrivingModeScreen;