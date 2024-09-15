import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker, Polyline } from 'react-native-maps';
import { getDatabase, ref, onValue } from 'firebase/database';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import * as Speech from 'expo-speech';
import * as Location from 'expo-location';


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
  const [duration, setDuration] = useState(null);
  const [directions, setDirections] = useState([]);
  const [nextTurnInstruction, setNextTurnInstruction] = useState('');
  const [posts, setPosts] = useState([]);
  const mapRef = useRef(null);
  const [heading, setHeading] = useState(0);

  useEffect(() => {
    fetchRouteData();
    const headingInterval = setInterval(() => getHeading(), 1000);
    return () => clearInterval(headingInterval);
  }, [location, destinationCoords]);

  useEffect(() => {
    const postsRef = ref(getDatabase(), 'posts');
    onValue(postsRef, (snapshot) => {
      const postsData = snapshot.val();
      if (postsData) {
        const filteredPosts = Object.values(postsData).filter(post => post.upvotes >= 2);
        setPosts(filteredPosts);
        checkForHazards(filteredPosts);
      }
    });
  }, [location]);

  const fetchRouteData = async () => {
    if (!location || !destinationCoords) return;
    const apiKey = 'AIzaSyACvMNE1lw18V00MT1wzRDW1vDlofnOZbw'; // Use your actual Google Maps API key
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${location.latitude},${location.longitude}&destination=${destinationCoords.latitude},${destinationCoords.longitude}&mode=driving&key=${apiKey}`
      );
      if (response.data.status === 'OK') {
        const points = response.data.routes[0].overview_polyline.points;
        const steps = response.data.routes[0].legs[0].steps;
        setRouteCoordinates(decodePolyline(points));
        setDistance(response.data.routes[0].legs[0].distance.text);
        setDuration(response.data.routes[0].legs[0].duration.text);
        setDirections(steps.map(step => stripHtmlTags(step.html_instructions)));
        if (steps.length > 0) {
          setNextTurnInstruction(stripHtmlTags(steps[0].html_instructions));
        }
      } else {
        Alert.alert('Error', 'Unable to fetch route');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Unable to fetch route');
    }
  };

  const getHeading = async () => {
    const { heading } = await Location.getHeadingAsync();
    setHeading(heading);
  };

  const checkForHazards = (hazards) => {
    const proximityThreshold = 0.01; // Example threshold in degrees, approximately 1km
    hazards.forEach(hazard => {
      const distance = getDistanceFromLatLonInKm(location.latitude, location.longitude, hazard.location.latitude, hazard.location.longitude);
      if (distance < proximityThreshold) {
        alertHazard(hazard);
      }
    });
  };

  const alertHazard = (hazard) => {
    // Translating and adding a light-hearted twist to the alert message in Bisaya
    const message = `Pagbantay brats, kay naay ${hazard.title} sa unahan. Ayaw'g kompyansa brats!`;

    Speech.speak(message, {
      language: 'fil-PH',  // If 'fil-PH' is not supported, it will default to the device's setting.
      pitch: 0.6,  // Further reduced pitch to make the voice sound deeper
      rate: 1    // Slightly reduced rate to complement the lower pitch
    });

    Alert.alert("WARNENG!", message);
};

  const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2-lat1);
    const dLon = deg2rad(lon2-lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  };

  const deg2rad = (deg) => {
    return deg * (Math.PI/180);
  };

  const decodePolyline = (encoded) => {
    let points = [];
    let index = 0, len = encoded.length;
    let lat = 0, lng = 0;

    while (index < len) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charAt(index++).charCodeAt(0) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charAt(index++).charCodeAt(0) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      points.push({ latitude: lat / 1E5, longitude: lng / 1E5 });
    }
    return points;
  };

  const stripHtmlTags = (html) => {
    return html.replace(/<\/?[^>]+(>|$)/g, "");
  };

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        showsUserLocation={true}
        followUserLocation={true}
        showsCompass={true}
        showsTraffic={true}
      >
        {destinationCoords && <Marker coordinate={destinationCoords} />}
        {routeCoordinates.length > 0 && (
          <Polyline coordinates={routeCoordinates} strokeWidth={5} strokeColor="#0000FF" />
        )}
        {posts.map((post, index) =>
          <Marker
            key={index}
            coordinate={post.location}
            title={post.title}
            description={`Upvotes: ${post.upvotes}`}
            pinColor="red"
          />
        )}
      </MapView>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
      <View style={styles.infoContainer}>
        <Text style={styles.addressText}>{destinationAddress}</Text>
        <Text style={styles.distanceText}>Distance: {distance}</Text>
        <Text style={styles.durationText}>Duration: {duration}</Text>
      </View>
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
  backButton: {
    position: 'absolute',
    top: 40,
    left: 10,
    backgroundColor: '#ffffff',
    padding: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#000',
  },
  infoContainer: {
    position: 'absolute',
    bottom: 20,
    left: 10,
    right: 10,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  addressText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  distanceText: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  durationText: {
    fontSize: 14,
    color: '#666',
  },
});

export default DrivingModeScreen;