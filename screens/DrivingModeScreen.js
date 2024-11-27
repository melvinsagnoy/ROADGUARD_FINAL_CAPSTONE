import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, Easing, Image } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker, Polyline, AnimatedRegion } from 'react-native-maps';
import { getDatabase, ref, onValue, get, update } from 'firebase/database';
import axios from 'axios';
import * as Speech from 'expo-speech';
import * as Location from 'expo-location';
import Icon from 'react-native-vector-icons/FontAwesome';
import BottomSheet from '@gorhom/bottom-sheet';
import constructionIcon from '../assets/construction.png';
import potholesIcon from '../assets/potholes.png';
import landslideIcon from '../assets/landslide.png';
import floodingIcon from '../assets/flooding.png';
import debrisIcon from '../assets/debris.png';
import brokenGlassIcon from '../assets/broken_glass.png';
import trafficAccidentsIcon from '../assets/traffic_accidents.png';
import roadwayErosionIcon from '../assets/roadway_erosion.png';
import looseGravelIcon from '../assets/loose_gravel.png';
import { getAuth } from 'firebase/auth';
import bridgeDamageIcon from '../assets/bridge_damage.png';
import { decode } from 'html-entities';
import { LinearGradient } from 'expo-linear-gradient';
import soundOnIcon from '../assets/sound_on.png';
import soundOffIcon from '../assets/sound_off.png';
import AsyncStorage from '@react-native-async-storage/async-storage';


const mapStyle =[
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
    "elementType": "labels",
    "stylers": [
      {
        "visibility": "off"
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
    "elementType": "labels.text",
    "stylers": [
      {
        "visibility": "off"
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
    "featureType": "poi.business",
    "stylers": [
      {
        "visibility": "off"
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
    "elementType": "labels.text",
    "stylers": [
      {
        "visibility": "off"
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
    "stylers": [
      {
        "visibility": "off"
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
    "featureType": "road.local",
    "elementType": "labels",
    "stylers": [
      {
        "visibility": "off"
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
  const [duration, setDuration] = useState(null);
  const [hazards, setHazards] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(location);
  const [currentHazard, setCurrentHazard] = useState(null);
  const mapRef = useRef(null);
  const [alertedHazards, setAlertedHazards] = useState(new Set());
  const [heading, setHeading] = useState(0);
  const bottomSheetRef = useRef(null);
  const [placeData, setPlaceData] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [receiveCount, setReceiveCount] = useState(0);
  const [turnInstructions, setTurnInstructions] = useState([]);
  const [currentInstructionIndex, setCurrentInstructionIndex] = useState(0);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true); 
  const [isLoading, setIsLoading] = useState(true);
  const markerPosition = useRef(new AnimatedRegion({
    latitude: location.latitude,
    longitude: location.longitude,
    latitudeDelta: 0.001,
    longitudeDelta: 0.001,
  })).current;
  const animateMarker = (newCoords) => {
    const { latitude, longitude } = newCoords;

    // Use an interpolation to make the animation smoother
    markerPosition
      .timing({
        latitude,
        longitude,
        duration: 1000, // Longer duration for smoother transition
        easing: Easing.inOut(Easing.ease), // Smooth easing for the animation
        useNativeDriver: false, // Keep it false for AnimatedRegion
      })
      .start();
  };


  useEffect(() => {
    const loadSpeechSetting = async () => {
      try {
        const savedSetting = await AsyncStorage.getItem('isSpeechEnabled');
        if (savedSetting !== null) {
          setIsSpeechEnabled(JSON.parse(savedSetting));
        }
      } catch (error) {
        console.error("Error loading speech setting:", error);
      } finally {
        setIsLoading(false); // Done loading setting, can proceed
      }
    };
    loadSpeechSetting();
  }, []);


  
  useEffect(() => {
    const fetchReceiveCount = async () => {
      const db = getDatabase();
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        console.error('No user is currently logged in');
        return;
      }

      const userEmail = currentUser.email.replace('.', '_'); // Replace '.' to avoid issues in Firebase keys
      const hazardRef = ref(db, `hazard_receive/${userEmail}/receive`);

      // Use Firebase's onValue listener to listen for real-time updates
      const unsubscribe = onValue(hazardRef, (snapshot) => {
        if (snapshot.exists()) {
          setReceiveCount(snapshot.val());
        } else {
          setReceiveCount(0); // Default to 0 if no value exists
        }
      });

      // Cleanup the listener when the component is unmounted
      return () => unsubscribe();
    };

    fetchReceiveCount();
  }, []);

  useEffect(() => {
    const checkCurrentInstruction = () => {
      if (currentLocation && turnInstructions.length > 0) {
        const nextInstruction = turnInstructions[currentInstructionIndex];
        
        if (nextInstruction && nextInstruction.location) {
          const distanceToNextInstruction = getDistanceFromLatLonInKm(
            currentLocation.latitude,
            currentLocation.longitude,
            nextInstruction.location.latitude,
            nextInstruction.location.longitude
          );
  
          // Only show turn-right or turn-left instructions within 100 meters
          if (distanceToNextInstruction < 0.1 && (nextInstruction.maneuver === 'turn-right' || nextInstruction.maneuver === 'turn-left')) {
            setCurrentInstructionIndex(currentInstructionIndex + 1);
          }
        }
      }
    };
  
    const interval = setInterval(checkCurrentInstruction, 20000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, [currentLocation, turnInstructions, currentInstructionIndex]);
  

  useEffect(() => {
    const fetchPlaceData = async () => {
      const placeId = await fetchPlaceIdFromCoords(destinationCoords.latitude, destinationCoords.longitude);
      if (placeId) {
        const placeDetails = await fetchPlaceDetails(placeId);
        setPlaceData(placeDetails);
      }
    };

    fetchPlaceData();
  }, [destinationCoords]);

  useEffect(() => {
    const subscribeToLocationAndHeadingUpdates = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, distanceInterval: 10 },
          (newLocation) => {
            const { latitude, longitude } = newLocation.coords;
            const newCoords = { latitude, longitude };
            setCurrentLocation(newLocation.coords);
            animateMarker(newCoords);
          }
        );

        await Location.watchHeadingAsync((headingData) => {
          setHeading(headingData.trueHeading);
        });
      } else {
        Alert.alert('Permission Denied', 'Location permission is required to use this feature.');
      }
    };

    subscribeToLocationAndHeadingUpdates();
    fetchRouteData();
    fetchHazardData();
  }, [location, destinationCoords]);

  useEffect(() => {
    if (currentLocation && hazards.length > 0) {
      checkForHazards(currentLocation); // Run the hazard proximity check when hazards or location changes
    }
  }, [currentLocation, hazards]);

  useEffect(() => {
    if (currentLocation && destinationCoords) {
      fetchUpdatedRouteData(currentLocation); // Fetch updated route based on current location
    }
  }, [currentLocation]);

  useEffect(() => {
    if (destinationAddress) {
      fetchPlaceDetailsByAddress(destinationAddress);
    }
  }, [destinationAddress]);

  useEffect(() => {
    if (mapRef.current && currentLocation && heading != null) {
      const chaseDistance = 0.0002; // Adjust to control how far the camera is behind the marker

      // Offset the camera slightly behind the user's position, based on heading direction
      const offsetLatitude = currentLocation.latitude - chaseDistance * Math.cos(heading * (Math.PI / 180));
      const offsetLongitude = currentLocation.longitude - chaseDistance * Math.sin(heading * (Math.PI / 180));

      mapRef.current.animateCamera({
        center: {
          latitude: offsetLatitude,
          longitude: offsetLongitude,
        },
        heading: heading,
        pitch: 60,
        zoom: 18,
        altitude: 200,
      }, { duration: 1000 });
    }
  }, [currentLocation, heading]);

  const toggleSpeech = async () => {
    try {
      const newSetting = !isSpeechEnabled;
      setIsSpeechEnabled(newSetting);
      await AsyncStorage.setItem('isSpeechEnabled', JSON.stringify(newSetting));
      
      // Stop any ongoing speech if disabling
      if (!newSetting) {
        Speech.stop();
      }
    } catch (error) {
      console.error("Error saving speech setting:", error);
    }
  };
  


  const TurnInstructionDisplay = ({ instruction, distance, direction }) => {
    return (
      <LinearGradient colors={['#1d1d1d', '#444444']} style={styles.turnInstructionContainer}>
        <Image source={getInstructionIcon(instruction)} style={styles.icon} />
        <Text style={styles.turnInstructionText}>
          {instruction || 'No instruction available.'} for {distance || 'N/A'}
        </Text>
      </LinearGradient>
    );
  };

  

  const isHazardOnRoute = (hazard, routeCoordinates) => {
    const proximityThreshold = 200; // meters

    // Function to calculate the perpendicular distance between a point and a line segment
    const pointToSegmentDistance = (px, py, ax, ay, bx, by) => {
      const dx = bx - ax;
      const dy = by - ay;
      const lengthSquared = dx * dx + dy * dy;
      let t = ((px - ax) * dx + (py - ay) * dy) / lengthSquared;
      t = Math.max(0, Math.min(1, t));
      const closestX = ax + t * dx;
      const closestY = ay + t * dy;
      return getDistanceFromLatLonInKm(px, py, closestX, closestY) * 1000; // Convert to meters
    };

    // Iterate through all route segments
    for (let i = 0; i < routeCoordinates.length - 1; i++) {
      const pointA = routeCoordinates[i];
      const pointB = routeCoordinates[i + 1];
      const distance = pointToSegmentDistance(
        hazard.location.latitude, 
        hazard.location.longitude, 
        pointA.latitude, 
        pointA.longitude, 
        pointB.latitude, 
        pointB.longitude
      );

      if (distance < proximityThreshold) {
        return true; // Hazard is close to the route
      }
    }

    return false; // No hazard close to the route
  };

  const getHazardIcon = (hazardTitle) => {
    switch (hazardTitle) {
      case 'Construction':
        return constructionIcon;
      case 'Potholes':
        return potholesIcon;
      case 'Landslide':
        return landslideIcon;
      case 'Flooding':
        return floodingIcon;
      case 'Debris':
        return debrisIcon;
      case 'Broken Glass':
        return brokenGlassIcon;
      case 'Traffic Accidents':
        return trafficAccidentsIcon;
      case 'Roadway Erosion':
        return roadwayErosionIcon;
      case 'Loose Gravel':
        return looseGravelIcon;
      case 'Bridge Damage':
        return bridgeDamageIcon;
      default:
        return null; // Fallback, you can use a default icon here
    }
  };

  const fetchPlaceDetails = async (placeId) => {
    const apiKey = 'AIzaSyDZShgCYNWnTIkKJFRGsqY8GZDax9Ykqo0'; // Ensure this is correct and active
    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}`;
      const response = await axios.get(url);

      if (response.data.status === 'OK') {
        return response.data.result;
      } else {
        console.error('Error fetching place details:', response.data.status);
        return null;
      }
    } catch (error) {
      console.error('Error making API call:', error.response ? error.response.data : error.message);
      return null;
    }
  };

  const fetchPlaceIdFromCoords = async (latitude, longitude) => {
    const apiKey = 'AIzaSyDZShgCYNWnTIkKJFRGsqY8GZDax9Ykqo0'; // Ensure this is correct and active
    try {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=100&key=${apiKey}`;
      const response = await axios.get(url);
      
      if (response.data.results.length > 0) {
        const placeId = response.data.results[0].place_id;
        return placeId;
      } else {
        console.error('No places found near the given coordinates.');
        return null;
      }
    } catch (error) {
      console.error('Error fetching place ID:', error);
      return null;
    }
  };


  const fetchPlaceDetailsByAddress = async (address) => {
    const apiKey = 'AIzaSyDZShgCYNWnTIkKJFRGsqY8GZDax9Ykqo0'; // Replace with your actual API key
    try {
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
      const geocodeResponse = await axios.get(geocodeUrl);
      
      if (geocodeResponse.data.status === 'OK' && geocodeResponse.data.results.length > 0) {
        const placeId = geocodeResponse.data.results[0].place_id;
        
        const placeDetailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}`;
        const placeDetailsResponse = await axios.get(placeDetailsUrl);
        
        if (placeDetailsResponse.data.status === 'OK') {
          setPlaceData(placeDetailsResponse.data.result);
        } else {
          console.error('Error fetching place details:', placeDetailsResponse.data.status);
        }
      } else {
        console.error('Error geocoding the address:', geocodeResponse.data.status);
      }
    } catch (error) {
      console.error('Error making API call:', error);
    }
  };

  const fetchUpdatedRouteData = async (newLocation) => {
    if (!newLocation || !destinationCoords) return;
  
    const apiKey = 'AIzaSyDZShgCYNWnTIkKJFRGsqY8GZDax9Ykqo0'; // Your actual API key
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${newLocation.latitude},${newLocation.longitude}&destination=${destinationCoords.latitude},${destinationCoords.longitude}&mode=driving&key=${apiKey}`
      );
  
      if (response.data.status === 'OK') {
        const points = response.data.routes[0].overview_polyline.points;
        setRouteCoordinates(decodePolyline(points));
        setDistance(response.data.routes[0].legs[0].distance.text);
        setDuration(response.data.routes[0].legs[0].duration.text);
  
        const steps = response.data.routes[0].legs[0].steps;
        setTurnInstructions(steps.map(step => ({
          distance: step.distance.text,
          instruction: step.html_instructions,
          maneuver: step.maneuver,
          location: {
            latitude: step.start_location.lat,
            longitude: step.start_location.lng,
          },
        })));
      } else {
        Alert.alert('Error', `Unable to fetch route: ${response.data.status}`);
      }
    } catch (error) {
      console.error('Axios Error:', error);
      Alert.alert('Network Error', 'Unable to fetch updated route. Please check your network connection or API key.');
    }
  };


  const fetchHazardData = () => {
    const database = getDatabase();
    const postsRef = ref(database, 'posts');
    
    onValue(postsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const hazardList = Object.values(data).filter(post => post.upvotes >= 2 && post.location); 
        setHazards(hazardList);
      } else {
        console.log('No posts data found');
      }
    }, (error) => {
      console.error('Firebase error:', error);
    });
  };

  const checkForHazards = (currentLocation) => {
    const proximityThreshold = 400; // 50 meters in distance

    hazards.forEach(hazard => {
      const hazardDistance = getDistanceFromLatLonInKm(currentLocation.latitude, currentLocation.longitude, hazard.location.latitude, hazard.location.longitude);
      const distanceInMeters = Math.round(hazardDistance * 1000); // Convert km to meters and round to nearest meter

      if (distanceInMeters < proximityThreshold && !alertedHazards.has(hazard.title)) {
        alertHazard(hazard, distanceInMeters);
        setAlertedHazards(prev => new Set(prev).add(hazard.title));
      }
    });
  };

  const alertHazard = (hazard, distanceInMeters) => {
    setCurrentHazard(hazard);
    const message = `Be careful, there's a ${hazard.title} ahead, just ${distanceInMeters} meters away. Stay alert!`;
  
    if (isSpeechEnabled) {
      Speech.speak(message, {
        language: 'fil-PH',
        pitch: 0.6,
        rate: 1,
      });
    }
  
    incrementHazardCount();
  
    if (isHazardOnRoute(hazard, routeCoordinates)) {
      Alert.alert(
        'WARNENG!',
        message,
        [
          {
            text: 'Proceed', 
            onPress: () => {
              if (isSpeechEnabled) {
                Speech.speak('Proceeding on the current route.', {
                  language: 'fil-PH',
                  pitch: 0.6,
                  rate: 1,
                });
              }
            }
          },
          { text: 'Alternate Route', onPress: () => fetchAlternateRoute(currentLocation) },
        ],
        { cancelable: false }
      );
    }
  };
  

  const fetchAlternateRoute = async (currentLocation) => {
    const apiKey = 'AIzaSyDZShgCYNWnTIkKJFRGsqY8GZDax9Ykqo0'; // Replace with your actual Google Maps API key
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${currentLocation.latitude},${currentLocation.longitude}&destination=${destinationCoords.latitude},${destinationCoords.longitude}&mode=driving&alternatives=true&avoid=highways&key=${apiKey}`
      );
  
      if (response.data.status === 'OK') {
        const localRoute = response.data.routes.find(route => !/highway/i.test(route.summary));
  
        if (localRoute) {
          const points = localRoute.overview_polyline.points;
          setRouteCoordinates(decodePolyline(points));
          setDistance(localRoute.legs[0].distance.text);
          setDuration(localRoute.legs[0].duration.text);
  
          if (isSpeechEnabled) {
            Speech.speak('Fetching an alternate route using local streets.', {
              language: 'fil-PH',
              pitch: 0.6,
              rate: 1,
            });
          }
        } else {
          Alert.alert('No Alternate Route', 'There are no alternate routes available that avoid highways.');
        }
      } else {
        Alert.alert('Error', `Unable to fetch alternate route: ${response.data.status}`);
      }
    } catch (error) {
      console.error('Error fetching alternate route:', error.response ? error.response.data : error.message);
      Alert.alert('Network Error', 'Unable to fetch alternate route. Please check your network connection or API key.');
    }
  };

  const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
  };

  const fetchRouteData = async () => {
    if (!location || !destinationCoords) return;
  
    const apiKey = 'AIzaSyDZShgCYNWnTIkKJFRGsqY8GZDax9Ykqo0';
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${location.latitude},${location.longitude}&destination=${destinationCoords.latitude},${destinationCoords.longitude}&mode=driving&key=${apiKey}`
      );
  
      if (response.data.status === 'OK') {
        const steps = response.data.routes[0].legs[0].steps;
  
        // Filter only "turn-right" and "turn-left" instructions
        const filteredSteps = steps.filter(
          (step) => step.maneuver === 'turn-right' || step.maneuver === 'turn-left'
        );
  
        setTurnInstructions(filteredSteps.map(step => ({
          distance: step.distance.text,
          instruction: step.html_instructions.replace(/<[^>]*>/g, ''), // Clean HTML tags
          maneuver: step.maneuver,
          location: {
            latitude: step.start_location.lat,
            longitude: step.start_location.lng,
          },
        })));
      } else {
        Alert.alert('Error', `Unable to fetch route: ${response.data.status}`);
      }
    } catch (error) {
      console.error('Axios Error:', error);
      Alert.alert('Network Error', 'Unable to fetch route. Please check your network connection or API key.');
    }
  };
  
  const cleanHTML = (html) => {
    // Decode HTML entities
    const decoded = decode(html);
  
    // Remove any HTML tags
    const stripped = decoded.replace(/<[^>]+>/g, '');
  
    // Replace multiple spaces or new lines with a single space
    const cleaned = stripped.replace(/\s+/g, ' ').trim();
  
    console.log('Original HTML:', html);
console.log('Decoded:', decoded);
console.log('Stripped:', stripped);
console.log('Cleaned:', cleaned);
    return cleaned;
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


  const getInstructionIcon = (instruction) => {
    // Check for common turn instructions
    if (instruction.includes('turn-right')) return require('../assets/right_arrow.png');
    if (instruction.includes('turn-left')) return require('../assets/left_arrow.png');
  
    // Check for directional instructions
    if (instruction.includes('Head west')) return require('../assets/left_arrow.png');
    if (instruction.includes('Head east')) return require('../assets/right_arrow.png');
    if (instruction.includes('Head north')) return require('../assets/head_north.png');
    if (instruction.includes('Head northwest')) return require('../assets/head_northwest.png');
    if (instruction.includes('Head northeast')) return require('../assets/head_northeast.png');
  
    
    // Default icon for general directions
    return require('../assets/default_icon.png');
  };

  const incrementHazardCount = async () => {
    const db = getDatabase();
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      console.error('No user is currently logged in');
      return;
    }

    const userEmail = currentUser.email.replace('.', '_'); // Replace '.' to avoid issues in Firebase keys
    const hazardRef = ref(db, `hazard_receive/${userEmail}/receive`);

    try {
      const snapshot = await get(hazardRef);
      let currentCount = snapshot.exists() ? snapshot.val() : 0; // Default to 0 if not found
      currentCount += 1; // Increment by 1

      await update(ref(db, `hazard_receive/${userEmail}`), { receive: currentCount });
    } catch (error) {
      console.error('Error updating hazard count:', error);
    }
  };

  const onMapReady = () => {
    if (mapRef.current && currentLocation) {
      mapRef.current.animateCamera({
        center: {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        },
        pitch: 80,
        heading: 0,
        altitude: 500,
        zoom: 19,
      }, { duration: 1000 });
    }
  };

  const handleSheetChanges = (index) => {
    setIsExpanded(index > 0);
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
        showsUserLocation={false}
        followUserLocation={true}
        showsCompass={true}
        showsTraffic={true}
        customMapStyle={mapStyle}
        onMapReady={onMapReady}
      >
        {destinationCoords && <Marker coordinate={destinationCoords} />}
        {routeCoordinates.length > 0 && (
          <Polyline coordinates={routeCoordinates} strokeWidth={5} strokeColor="#0000FF" />
        )}

        <Marker.Animated coordinate={markerPosition} />

        {hazards.map((hazard, index) => (
          <Marker
            key={index}
            coordinate={hazard.location}
            title={hazard.title}
            description={hazard.description}
          >
            <Image
              source={getHazardIcon(hazard.title)}
              style={{ width: 40, height: 40 }}
              resizeMode="contain"
            />
          </Marker>
        ))}
      </MapView>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
      <TouchableOpacity
  style={styles.soundToggleButton}
  onPress={toggleSpeech}
>
  <Image
    source={isSpeechEnabled ? soundOnIcon : soundOffIcon}
    style={styles.soundIcon}
  />
</TouchableOpacity>
      <TurnInstructionDisplay
  distance={turnInstructions.length > 0 && currentInstructionIndex < turnInstructions.length ? turnInstructions[currentInstructionIndex].distance : 'N/A'}
  instruction={turnInstructions.length > 0 && currentInstructionIndex < turnInstructions.length ? cleanHTML(turnInstructions[currentInstructionIndex].instruction) : 'No instructions available.'}
  direction={turnInstructions.length > 0 && currentInstructionIndex < turnInstructions.length ? turnInstructions[currentInstructionIndex].maneuver : ''}
/>

      <View style={styles.countContainer}>
        <Text style={styles.receiveCountText}>{receiveCount}</Text>
      </View>

      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={[220, '50%', '75%']}
        borderRadius={10}
        initialSnapIndex={0}
        backgroundStyle={styles.bottomSheetBackground}
        onChange={handleSheetChanges}
      >
        <View style={styles.sheetContent}>
          <Text style={styles.placeName}>
            {placeData?.name || "Destination: Unknown"}
          </Text>

          <Text style={styles.distanceText}>
            Distance: {distance ? `${distance}` : "N/A"}
          </Text>
          <Text style={styles.durationText}>
            Duration: {duration ? `${duration}` : "N/A"}
          </Text>

          {currentHazard && (
            <View style={styles.hazardContainer}>
              <Image source={getHazardIcon(currentHazard.title)} style={styles.hazardIcon} />
              <View style={styles.hazardDetails}>
                <Text style={styles.hazardTitle}>{currentHazard.title}</Text>
                <Text style={styles.hazardDescription}>{currentHazard.description || "No description available"}</Text>
                <Text style={styles.hazardUpvotes}>Upvotes: {currentHazard.upvotes}</Text>
                <Text style={styles.hazardReporter}>Reported by: {currentHazard.displayName || "Anonymous"}</Text>
              </View>
            </View>
          )}

          {isExpanded && (
            <>
              {placeData?.formatted_address && (
                <Text style={styles.placeAddress}>Address: {placeData.formatted_address}</Text>
              )}
              {placeData?.rating ? (
                <Text style={styles.placeRating}>Rating: {placeData.rating}</Text>
              ) : (
                <Text>No rating available</Text>
              )}
              {placeData?.photos && (
                <View style={styles.photosContainer}>
                  {placeData.photos.slice(0, 5).map((photo, index) => (
                    <Image
                      key={index}
                      style={styles.photo}
                      source={{ uri: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=YOUR_GOOGLE_MAPS_API_KEY` }}
                      resizeMode="cover"
                    />
                  ))}
                </View>
              )}
            </>
          )}
        </View>
      </BottomSheet>
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
  turnInstructionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    marginVertical: 5,
    position: 'absolute',
    top: 100,
    left: '13%',
    transform: [{ translateX: -50 }],
    zIndex: 10,
  },
  icon: {
    width: 35,
    height: 35,
    marginRight: 10,
  },
  turnInstructionText: {
    fontSize: 16,
    color: '#fff',
    flex: 1,
  },

  bottomSheetBackground: {
    backgroundColor: '#81818199', // Apply the background color to the entire bottom sheet
  },
  sheetContent: {
    padding: 16, 
  },
  addressText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  distanceText: {
    fontSize: 14,
    color: '#f1f1f1',
    marginTop: 5,
  },
  durationText: {
    fontSize: 14,
    color: '#f1f1f1',
  },
  hazardContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: 10,
  padding: 10,
  backgroundColor: '#333',
  borderRadius: 8,
},
hazardIcon: {
  width: 50,
  height: 50,
  marginRight: 10,
},
hazardDetails: {
  flex: 1,
},
hazardTitle: {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#fff',
},
hazardDescription: {
  fontSize: 14,
  color: '#ccc',
  marginTop: 5,
},
hazardUpvotes: {
  fontSize: 14,
  color: '#ccc',
},
hazardReporter: {
  fontSize: 14,
  color: '#ccc',
},
  infoContainer: {
    backgroundColor: '#333', // Add background color for each section
    padding: 10,
    color:'white',
    borderRadius: 8,
    marginVertical: 5,  // Adds vertical spacing between each container
  },
  addressText: {
  fontSize: 16,
  fontWeight: 'bold',
  color: '#fff',  // White for the address text
},
distanceText: {
  fontSize: 14,
  color: '#F0F8FF',  // Light blue for distance
},
durationText: {
  fontSize: 14,
  color: '#F0F8FF',  // Light blue for duration
},
placeName: {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#FFD700',  // Bright yellow for the destination place name
},
placeAddress: {
  fontSize: 14,
  color: '#FFFFFF',  // White for the address
},
placeRating: {
  fontSize: 16,
  color: '#FFD700',  // Bright yellow for rating
},
  photosContainer: {
  flexDirection: 'row',
  flexWrap: 'wrap', // Allows wrapping to new lines
  justifyContent: 'space-between', // Evenly distributes space between photos
  marginTop: 10,
},
photo: {
  width: 100, // Fixed width for each photo
  height: 100, // Fixed height to maintain consistency
  marginBottom: 10, // Adds spacing between rows
  borderRadius: 8,
},
  placeWebsite: {
    fontSize: 14,
    color: '#1e90ff',  // Make it blue for link style
    marginBottom: 5,
  },
  placeMapsLink: {
    fontSize: 14,
    color: '#1e90ff',
    marginBottom: 5,
  },
  countContainer: {
    position: 'absolute',
    top: 40,
    right: 10,
    backgroundColor: '#F6EF00', 
    borderRadius: 20,
    padding: 10,
    zIndex: 10, // Make sure it appears on top
  },
  receiveCountText: {
    fontSize: 18,
    color: '#000', // White text color
    fontWeight: 'bold',
  },
  soundToggleButton: {
    position: 'absolute',
    top: 40,
    right: 60,
    backgroundColor: '#ffffff',
    borderRadius: 25,
    padding: 10,
    zIndex: 10,
  },
  soundIcon: {
    width: 30,
    height: 30,
  },
});

export default DrivingModeScreen;