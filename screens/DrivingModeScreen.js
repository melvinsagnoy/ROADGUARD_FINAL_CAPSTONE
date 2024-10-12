import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, Easing, Image, Linking} from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker, Polyline, AnimatedRegion } from 'react-native-maps';
import { getDatabase, ref, onValue, update, get } from 'firebase/database';
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
  const [isExpanded, setIsExpanded] = useState(false); // Track if the BottomSheet is expanded
  const [receiveCount, setReceiveCount] = useState(0);
  

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
    const fetchPlaceData = async () => {
      const placeId = await fetchPlaceIdFromCoords(destinationCoords.latitude, destinationCoords.longitude);
      if (placeId) {
        const placeDetails = await fetchPlaceDetails(placeId);
        setPlaceData(placeDetails);
      }
    };

    fetchPlaceData();
  }, [destinationCoords]);

  const markerPosition = useRef(
    new AnimatedRegion({
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.001,
      longitudeDelta: 0.001,
    })
  ).current;

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
  if (currentLocation && hazards.length > 0) {
    checkForHazards(currentLocation); // Run the hazard proximity check when hazards or location changes
  }
}, [currentLocation, hazards]);

useEffect(() => {
  if (currentLocation && destinationCoords) {
    fetchUpdatedRouteData(currentLocation); // Fetch updated route based on current location
  }
}, [currentLocation]);



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
      console.log(`Fetching place details from: ${url}`); // Log the request URL
      const response = await axios.get(url);

      if (response.data.status === 'OK') {
        console.log('Place Details:', response.data.result); // Log the place details to debug
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
    console.log(`Fetching nearby place from: ${url}`); // Log the request URL
    const response = await axios.get(url);
    
    if (response.data.results.length > 0) {
      const placeId = response.data.results[0].place_id;
      console.log(`Found place ID: ${placeId}`); // Log the found place ID
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



useEffect(() => {
  if (destinationAddress) {
    fetchPlaceDetailsByAddress(destinationAddress);
  }
}, [destinationAddress]);


const fetchPlaceDetailsByAddress = async (address) => {
  const apiKey = 'AIzaSyDZShgCYNWnTIkKJFRGsqY8GZDax9Ykqo0'; // Replace with your actual API key
  try {
    // Make a request to Google Geocoding API to get the placeId from the address
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    const geocodeResponse = await axios.get(geocodeUrl);
    
    if (geocodeResponse.data.status === 'OK' && geocodeResponse.data.results.length > 0) {
      const placeId = geocodeResponse.data.results[0].place_id;
      console.log(`Found place ID from address: ${placeId}`);
      
      // Fetch the place details using the found placeId
      const placeDetailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}`;
      const placeDetailsResponse = await axios.get(placeDetailsUrl);
      
      if (placeDetailsResponse.data.status === 'OK') {
        console.log('Place Details:', placeDetailsResponse.data.result);
        setPlaceData(placeDetailsResponse.data.result); // Update state with place details
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

  const apiKey = 'AIzaSyDZShgCYNWnTIkKJFRGsqY8GZDax9Ykqo0'; // Replace with your actual Google Maps API key
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/directions/json?origin=${newLocation.latitude},${newLocation.longitude}&destination=${destinationCoords.latitude},${destinationCoords.longitude}&mode=driving&key=${apiKey}`
    );
    if (response.data.status === 'OK') {
      const points = response.data.routes[0].overview_polyline.points;
      setRouteCoordinates(decodePolyline(points));
      setDistance(response.data.routes[0].legs[0].distance.text);
      setDuration(response.data.routes[0].legs[0].duration.text);
    } else {
      Alert.alert('Error', `Unable to fetch route: ${response.data.status}`);
    }
  } catch (error) {
    console.error('Axios Error:', error.response ? error.response.data : error.message);
    Alert.alert('Network Error', 'Unable to fetch updated route. Please check your network connection or API key.');
  }
};

useEffect(() => {
  if (mapRef.current && currentLocation && heading != null) {
    const chaseDistance = 0.0002; // Adjust to control how far the camera is behind the marker

    // Offset the camera slightly behind the user's position, based on heading direction
    const offsetLatitude = currentLocation.latitude - chaseDistance * Math.cos(heading * (Math.PI / 180));
    const offsetLongitude = currentLocation.longitude - chaseDistance * Math.sin(heading * (Math.PI / 180));

    mapRef.current.animateCamera({
      center: {
        latitude: offsetLatitude,  // Apply the offset to the camera
        longitude: offsetLongitude, // Adjust the camera to be behind the user
      },
      heading: heading, // Keep the camera facing the user's direction of movement
      pitch: 60,   // Tilt the camera for a 3D effect
      zoom: 18,    // Adjust zoom level for closer view
      altitude: 200,  // Lower the altitude for a more realistic driving view
    }, { duration: 1000 }); // Smooth camera transition
  }
}, [currentLocation, heading]);



  // Fetch hazard data from Firebase
  const fetchHazardData = () => {
  const database = getDatabase();
  const postsRef = ref(database, 'posts'); // Reference the 'posts' node where hazards are stored
  
  onValue(postsRef, (snapshot) => {
    const data = snapshot.val();
    console.log('Firebase snapshot data from posts:', data); // Log full Firebase response
    if (data) {
      // Filter posts that should be treated as hazards (you might have some condition here, e.g., upvotes >= 2)
      const hazardList = Object.values(data).filter(post => post.upvotes >= 2 && post.location); 
      console.log('Hazards fetched:', hazardList); // Log fetched hazards
      setHazards(hazardList);
    } else {
      console.log('No posts data found');
    }
  }, (error) => {
    console.error('Firebase error:', error); // Log any errors from Firebase
  });
};

  // Check for nearby hazards
  
// Check for nearby hazards
const checkForHazards = (currentLocation) => {
  const proximityThreshold = 400; // 50 meters in distance

  hazards.forEach(hazard => {
    const hazardDistance = getDistanceFromLatLonInKm(currentLocation.latitude, currentLocation.longitude, hazard.location.latitude, hazard.location.longitude);
    const distanceInMeters = Math.round(hazardDistance * 1000); // Convert km to meters and round to nearest meter

    if (distanceInMeters < proximityThreshold && !alertedHazards.has(hazard.title)) {
      // Alert for this hazard if within 50 meters and not already alerted
      console.log(`Triggering hazard alert for: ${hazard.title}`);
      alertHazard(hazard, distanceInMeters);

      // Mark this hazard as alerted
      setAlertedHazards(prev => new Set(prev).add(hazard.title));
    }
  });
};



const alertHazard = (hazard, distanceInMeters) => {
  setCurrentHazard(hazard); 
  const message = `Pagbantay brats, kay naay ${hazard.title} sa unahan, ${distanceInMeters} metros nalang. Ayaw'g kompyansa brats!`;

  // Speak the hazard message
  Speech.speak(message, {
    language: 'fil-PH',
    pitch: 0.6,
    rate: 1,
  });

  // Increment the 'receive' field for the current user
  incrementHazardCount();

  if (isHazardOnRoute(hazard, routeCoordinates)) {
    Alert.alert(
      'WARNENG!',
      message,
      [
        { text: 'Proceed', onPress: () => Speech.speak('Proceeding on the current route.', { language: 'fil-PH', pitch: 0.6, rate: 1 }) },
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

    console.log('API Response:', response.data); // Log the full response

    if (response.data.status === 'OK') {
      // Filter to find a route that includes local streets
      const localRoute = response.data.routes.find(route => {
        // Check if the route summary does not contain "highway" or any major highways
        return !/highway/i.test(route.summary);
      });

      if (localRoute) {
        const points = localRoute.overview_polyline.points;

        // Update the state with the new route
        setRouteCoordinates(decodePolyline(points));
        setDistance(localRoute.legs[0].distance.text);
        setDuration(localRoute.legs[0].duration.text);
        Speech.speak('Fetching an alternate route using local streets.', {
          language: 'fil-PH',
          pitch: 0.6,
          rate: 1,
        });
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
  const apiKey = 'AIzaSyDZShgCYNWnTIkKJFRGsqY8GZDax9Ykqo0'; // Replace with your actual Google Maps API key
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/directions/json?origin=${location.latitude},${location.longitude}&destination=${destinationCoords.latitude},${destinationCoords.longitude}&mode=driving&key=${apiKey}`
    );
    if (response.data.status === 'OK') {
      const points = response.data.routes[0].overview_polyline.points;
      setRouteCoordinates(decodePolyline(points));
      setDistance(response.data.routes[0].legs[0].distance.text);
      setDuration(response.data.routes[0].legs[0].duration.text);
    } else {
      Alert.alert('Error', `Unable to fetch route: ${response.data.status}`);
    }
  } catch (error) {
    console.error('Axios Error:', error); // Log detailed error
    Alert.alert('Network Error', 'Unable to fetch route. Please check your network connection or API key.');
  }
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

  // Function to increment hazard count for the user
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
    // Retrieve the current 'receive' value and increment it
    const snapshot = await get(hazardRef);
    let currentCount = snapshot.exists() ? snapshot.val() : 0; // Default to 0 if not found
    currentCount += 1; // Increment by 1

    // Update the receive count in the database under the user's email
    await update(ref(db, `hazard_receive/${userEmail}`), { receive: currentCount });
  } catch (error) {
    console.error('Error updating hazard count:', error);
  }
};

  // Define onMapReady function to animate the camera when the map is ready
  const onMapReady = () => {
    if (mapRef.current && currentLocation) {
      mapRef.current.animateCamera({
        center: {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        },
        pitch: 80, // 3D-like tilt effect
        heading: 0,
        altitude: 500, // Adjust altitude for a better view
        zoom: 19,
      }, { duration: 1000 }); // Smooth transition
    }
  };

   const handleSheetChanges = (index) => {
    setIsExpanded(index > 0); // Expanded if index > 0 (i.e., user expands the sheet)
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
  showsUserLocation={false} // Hide the default blue user location marker
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

  {/* Animated Marker for current location */}
  <Marker.Animated coordinate={markerPosition} />

  {/* Display hazard markers */}
  {hazards.map((hazard, index) => (
  <Marker
    key={index}
    coordinate={hazard.location}
    title={hazard.title}
    description={hazard.description}
  >
    <Image
      source={getHazardIcon(hazard.title)} // Get the appropriate icon based on the title
      style={{ width: 40, height: 40 }} // Adjust the size here
      resizeMode="contain"
    />
  </Marker>
))}
</MapView>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
      <View style={styles.countContainer}>
        <Text style={styles.receiveCountText}>{receiveCount}</Text>
      </View>

          <BottomSheet
        ref={bottomSheetRef}
        snapPoints={[220, '50%', '75%']} // Set a taller snap point to accommodate all visible content
        borderRadius={10}
        initialSnapIndex={0}
        backgroundStyle={styles.bottomSheetBackground}
        onChange={handleSheetChanges}
      >
        <View style={styles.sheetContent}>
          {/* Always visible content (place name, distance, duration, hazard information) */}
          <Text style={styles.placeName}>
            {placeData?.name || "Destination: Unknown"}
          </Text>

          {/* Display Distance and Duration */}
          <Text style={styles.distanceText}>
            Distance: {distance ? `${distance}` : "N/A"}
          </Text>
          <Text style={styles.durationText}>
            Duration: {duration ? `${duration}` : "N/A"}
          </Text>

          {/* Display Hazard Information if available */}
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

          {/* Additional content that appears when expanded */}
          {isExpanded && (
            <>
              {/* Display formatted address */}
              {placeData?.formatted_address && (
                <Text style={styles.placeAddress}>Address: {placeData.formatted_address}</Text>
              )}

              {/* Display rating */}
              {placeData?.rating ? (
                <Text style={styles.placeRating}>Rating: {placeData.rating}</Text>
              ) : (
                <Text>No rating available</Text>
              )}

              {/* Display photos */}
              {placeData?.photos && (
                <View style={styles.photosContainer}>
                  {placeData.photos.slice(0, 5).map((photo, index) => (
                    <Image
                      key={index}
                      style={styles.photo}
                      source={{ uri: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=AIzaSyACvMNE1lw18V00MT1wzRDW1vDlofnOZbw` }}
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
});

export default DrivingModeScreen;