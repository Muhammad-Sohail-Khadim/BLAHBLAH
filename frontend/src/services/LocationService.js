class LocationService {
  static async getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000 // 5 minutes
      };

      navigator.geolocation.getCurrentPosition(
        resolve,
        (error) => {
          let message;
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Location access denied. Please enable location permissions.';
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'Location information unavailable. Please try again.';
              break;
            case error.TIMEOUT:
              message = 'Location request timed out. Please try again.';
              break;
            default:
              message = 'An unknown error occurred while getting location.';
              break;
          }
          reject(new Error(message));
        },
        options
      );
    });
  }

  static calculateQiblaDirection(userLat, userLng) {
    // Kaaba coordinates in Mecca
    const kaabaLat = 21.4225;
    const kaabaLng = 39.8262;

    // Convert to radians
    const userLatRad = this.toRadians(userLat);
    const userLngRad = this.toRadians(userLng);
    const kaabaLatRad = this.toRadians(kaabaLat);
    const kaabaLngRad = this.toRadians(kaabaLng);

    // Calculate bearing using the formula
    const deltaLng = kaabaLngRad - userLngRad;
    
    const y = Math.sin(deltaLng) * Math.cos(kaabaLatRad);
    const x = Math.cos(userLatRad) * Math.sin(kaabaLatRad) - 
              Math.sin(userLatRad) * Math.cos(kaabaLatRad) * Math.cos(deltaLng);
    
    let bearing = Math.atan2(y, x);
    
    // Convert from radians to degrees
    bearing = this.toDegrees(bearing);
    
    // Normalize to 0-360 degrees
    bearing = (bearing + 360) % 360;
    
    return bearing;
  }

  static calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c;
  }

  static toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  static toDegrees(radians) {
    return radians * (180 / Math.PI);
  }

  static async watchPosition(callback, errorCallback) {
    if (!navigator.geolocation) {
      errorCallback(new Error('Geolocation is not supported'));
      return null;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60000 // 1 minute
    };

    return navigator.geolocation.watchPosition(
      callback,
      errorCallback,
      options
    );
  }

  static clearWatch(watchId) {
    if (navigator.geolocation && watchId) {
      navigator.geolocation.clearWatch(watchId);
    }
  }
}

export default LocationService;