import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TouchableWithoutFeedback, Keyboard, Image } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import axios from 'axios';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getDatabase, ref, onValue, get } from 'firebase/database';

const AddScreen = ({ navigation }) => {
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('Fetching address...');
  const [destinationAddress, setDestinationAddress] = useState('Destination address will appear here...');
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [distance, setDistance] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [searchVisible, setSearchVisible] = useState(false);
  const [postsWithPins, setPostsWithPins] = useState([]);
  const mapRef = useRef(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access location was denied');
        return;
      }

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000, // Update every 10 seconds
          distanceInterval: 10, // Update every 10 meters
        },
        async (currentLocation) => {
          const { latitude, longitude } = currentLocation.coords;

          setLocation({
            latitude,
            longitude,
            latitudeDelta: 0.005,  // Reduced for more zoom
            longitudeDelta: 0.0025, // Reduced for more zoom
          });

          const apiKey = 'AIzaSyACvMNE1lw18V00MT1wzRDW1vDlofnOZbw';
          try {
            const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`);
            if (response.data.status === 'OK') {
              const formattedAddress = response.data.results[0].formatted_address;
              setAddress(formattedAddress);
            } else {
              setAddress('Unable to fetch address');
            }
          } catch (error) {
            console.error(error);
            setAddress('Unable to fetch address');
          }
        }
      );

      return () => {
        subscription.remove();
      };
    })();
  }, []);


  useEffect(() => {
  if (mapRef.current && location) {
    // Define a zoomed-out region
    const zoomedOutRegion = {
      ...location,
      latitudeDelta: 0.2, // More zoomed out
      longitudeDelta: 0.2,
    };

    // Animate the map to the zoomed-out region first
    mapRef.current.animateToRegion(zoomedOutRegion, 1000); // Zoom out animation for 1 second

    // After a short delay, zoom into the user's location
    setTimeout(() => {
      if (mapRef.current) {  // Check if mapRef is still valid
        mapRef.current.animateToRegion(location, 1500); // Zoom into user's location after delay
      }
    }, 1000); // Adjust the delay to match the zoom-out animation timing
  }
}, [location]);

  useEffect(() => {
    (async () => {
      // Existing location logic here...
      // Fetch posts and pins
      fetchPostsWithPins();
    })();
  }, []);

  const fetchPostsWithPins = async () => {
  const db = getDatabase(); // Initialize Firebase Realtime Database
  const postsRef = ref(db, 'posts'); // Reference to the posts node

  onValue(postsRef, async (snapshot) => {
    const posts = snapshot.val();
    if (!posts) return;

    const postsArray = Object.keys(posts).map(key => ({ id: key, ...posts[key] }));
    const filteredPosts = postsArray.filter(post => post.upvotes === 2);

    // Fetch location for each post with 2 upvotes
    const fetchLocations = filteredPosts.map(async (post) => {
      const locationRef = ref(db, `posts/${post.id}/location`); // Correct path to location
      const locationSnapshot = await get(locationRef);
      const locationData = locationSnapshot.val();
      return {
        ...post,
        location: locationData,
      };
    });

    try {
      const pinnedPosts = await Promise.all(fetchLocations);
      setPostsWithPins(pinnedPosts);
    } catch (error) {
      console.error("Error fetching post locations:", error);
    }
  });
};

  useEffect(() => {
    if (mapRef.current && location) {
      mapRef.current.animateToRegion(location, 1000);
    }
  }, [location]);

  const handleDestinationSelect = async (data, details) => {
    const destLocation = details.geometry.location;
    setDestinationCoords({
      latitude: destLocation.lat,
      longitude: destLocation.lng,
    });

    setDestinationAddress(data.description);

    const apiKey = 'AIzaSyACvMNE1lw18V00MT1wzRDW1vDlofnOZbw';
    try {
      const routeResponse = await axios.get(`https://maps.googleapis.com/maps/api/directions/json?origin=${location.latitude},${location.longitude}&destination=${destLocation.lat},${destLocation.lng}&mode=driving&key=${apiKey}`);
      if (routeResponse.data.status === 'OK') {
        const points = routeResponse.data.routes[0].overview_polyline.points;
        setRouteCoordinates(decodePolyline(points));
        setDistance(routeResponse.data.routes[0].legs[0].distance.text);
      } else {
        alert('Unable to fetch route');
      }
    } catch (error) {
      console.error(error);
      alert('Unable to fetch route');
    }

    setSearchVisible(false);
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

  const handleSearchPress = () => {
    setSearchVisible(true);
  };

   const handleLocationPress = () => {
    if (mapRef.current && location) {
      mapRef.current.animateToRegion(location, 1000);
    }
  };

  const handleClickOutside = () => {
    if (searchVisible) {
      setSearchVisible(false);
      Keyboard.dismiss();
    }
  };

  const handleDrivingModePress = () => {
    if (destinationCoords && location) {
      navigation.navigate('DrivingModeScreen', {
        location,
        destinationCoords,
        destinationAddress,
      });
    } else {
      alert('Please set a destination first');
    }
  };

  return (
    <TouchableWithoutFeedback onPress={handleClickOutside}>
      <View style={styles.container}>
        <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            region={location}
            customMapStyle={mapStyle}
          >
            {location && (
              <Marker coordinate={location} title="You are here" description={address}>
                <Image
                  source={require('../assets/map_user.png')}
                  style={{ width: 40, height: 50 }}
                  resizeMode="stretch"
                />
              </Marker>
            )}
            {destinationCoords && (
              <Marker
                coordinate={destinationCoords}
                draggable
                onDragEnd={async (e) => {
                  const newCoords = e.nativeEvent.coordinate;
                  setDestinationCoords(newCoords);

                  // Recalculate route and address when the marker is dragged
                  const apiKey = 'YOUR_API_KEY';
                  try {
                    const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${newCoords.latitude},${newCoords.longitude}&key=${apiKey}`);
                    if (response.data.status === 'OK') {
                      const formattedAddress = response.data.results[0].formatted_address;
                      setDestinationAddress(formattedAddress);

                      // Fetch new route
                      const routeResponse = await axios.get(`https://maps.googleapis.com/maps/api/directions/json?origin=${location.latitude},${location.longitude}&destination=${newCoords.latitude},${newCoords.longitude}&mode=driving&key=${apiKey}`);
                      if (routeResponse.data.status === 'OK') {
                        const points = routeResponse.data.routes[0].overview_polyline.points;
                        setRouteCoordinates(decodePolyline(points));
                        setDistance(routeResponse.data.routes[0].legs[0].distance.text);
                      } else {
                        alert('Unable to fetch route');
                      }
                    } else {
                      setDestinationAddress('Unable to fetch address');
                    }
                  } catch (error) {
                    console.error(error);
                    setDestinationAddress('Unable to fetch address');
                  }
                }}
              />
            )}
            {routeCoordinates.length > 0 && (
              <Polyline
                coordinates={routeCoordinates}
                strokeWidth={4}
                strokeColor="black"
              />
            )}
            {postsWithPins.map(post => (
              post.location && (
                <Marker
                  key={post.id}
                  coordinate={{ latitude: post.location.latitude, longitude: post.location.longitude }}
                  title={post.title}
                  description={`Upvotes: ${post.upvotes}`}
                >
                  <Image
                    source={require('../assets/hazard_icon.png')}
                    style={{ width: 30, height: 30 }}
                    resizeMode="stretch"
                  />
                </Marker>
              )
            ))}
          </MapView>
        <View style={styles.infoContainer}>
          <View style={styles.locationContainer}>
            <Text style={styles.addressText}>{address}</Text>
            {distance && <Text style={styles.distanceText}>Distance: {distance}</Text>}
          </View>
          <View style={styles.destinationContainer}>
            <Text style={styles.destinationText}>{destinationAddress}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.searchButton} onPress={handleSearchPress}>
          <Icon name="search" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.locationButton} onPress={handleLocationPress}>
          <Icon name="person-pin-circle" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.drivingModeButton} onPress={handleDrivingModePress}>
          <Icon name="directions-car" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        {searchVisible && (
          <View style={styles.autocompleteContainer}>
            <GooglePlacesAutocomplete
              placeholder="Enter destination"
              fetchDetails={true}
              onPress={handleDestinationSelect}
              query={{
                key: 'AIzaSyACvMNE1lw18V00MT1wzRDW1vDlofnOZbw',  // Use your API key
                language: 'en',
                location: `${location.latitude},${location.longitude}`,  // Use current user location
                radius: 10000,  // Define the search radius (in meters)
              }}
              styles={{
                container: styles.autocompleteContainer,
                textInputContainer: styles.autocompleteTextInputContainer,
                textInput: styles.input,
                listView: styles.listView,
              }}
            />
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};



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




const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    position: 'absolute',
    top: 20,
    width: '100%',
    zIndex: 1,
  },
  locationContainer: {
    flex: 1,
    marginRight: 10,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
  },
  destinationContainer: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
  },
  addressText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  distanceText: {
    fontSize: 14,
    marginTop: 5,
    textAlign: 'center',
  },
  searchButton: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    backgroundColor: '#007BFF',
    padding: 15,
    borderRadius: 50,
  },
  locationButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 50,
  },
  drivingModeButton: {
    position: 'absolute',
    bottom: 140,
    right: 20,
    backgroundColor: '#dc3545',
    padding: 15,
    borderRadius: 50,
  },
  backButton: {
  position: 'absolute',
  bottom: 200, // Position above the driving mode icon
  right: 20, // Align with the other icons
  backgroundColor: '#007BFF',
  padding: 15,
  borderRadius: 50,
  zIndex: 2, // Ensure it's above other components
},
  autocompleteContainer: {
    position: 'absolute',
    top: 60,
    width: '100%',
    zIndex: 1,
  },
  autocompleteTextInputContainer: {
    top: 30,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
  },
  input: {
    height: 40,
    borderColor: '#ddd',
    borderBottomWidth: 1,
  },
  listView: {
    marginTop: 5,
  },
  
});

export default AddScreen;