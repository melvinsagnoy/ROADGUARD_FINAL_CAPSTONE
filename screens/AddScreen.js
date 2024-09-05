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
          {destinationCoords && <Marker coordinate={destinationCoords} />}
          {routeCoordinates.length > 0 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeWidth={4}
              strokeColor="#E0C55B"
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
                  source={require('../assets/hazard_icon.png')}  // Adjust path as needed
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
                key: 'AIzaSyACvMNE1lw18V00MT1wzRDW1vDlofnOZbw',
                language: 'en',
                location: { lat: 10.3157, lng: 123.8854 },
                radius: 10000,
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