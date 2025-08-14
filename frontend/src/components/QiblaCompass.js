import React, { useState, useEffect } from 'react';
import { Navigation } from 'lucide-react';

const QiblaCompass = ({ qiblaDirection, location }) => {
  const [deviceHeading, setDeviceHeading] = useState(0);
  const [compassSupported, setCompassSupported] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Check if device orientation is supported
    if (typeof DeviceOrientationEvent !== 'undefined') {
      const handleOrientation = (event) => {
        if (!mounted) return;
        
        // Get compass heading (alpha represents rotation around z-axis)
        let heading = event.alpha;
        
        if (heading !== null) {
          // Normalize heading to 0-360 degrees
          heading = heading < 0 ? heading + 360 : heading;
          setDeviceHeading(360 - heading); // Invert for correct direction
        }
      };

      // Request permission for iOS 13+
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
          .then(response => {
            if (response === 'granted') {
              window.addEventListener('deviceorientation', handleOrientation);
            } else {
              setCompassSupported(false);
            }
          })
          .catch(() => setCompassSupported(false));
      } else {
        // For Android and older iOS
        window.addEventListener('deviceorientation', handleOrientation);
      }

      return () => {
        mounted = false;
        window.removeEventListener('deviceorientation', handleOrientation);
      };
    } else {
      setCompassSupported(false);
    }
  }, []);

  // Calculate the relative direction to Qibla
  const relativeQiblaDirection = compassSupported 
    ? (qiblaDirection - deviceHeading + 360) % 360 
    : qiblaDirection;

  const distanceToMecca = location ? calculateDistance(
    location.latitude, 
    location.longitude, 
    21.4225, 
    39.8262
  ) : 0;

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Compass Circle */}
      <div className="relative w-48 h-48">
        {/* Outer compass ring */}
        <div className="absolute inset-0 rounded-full border-4 border-gray-300 bg-white shadow-inner">
          {/* Cardinal directions */}
          <div className="absolute inset-2 rounded-full border border-gray-200">
            {/* North marker */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1">
              <div className="w-1 h-4 bg-red-500 rounded-full"></div>
              <span className="absolute top-5 left-1/2 transform -translate-x-1/2 text-xs font-bold text-red-500">N</span>
            </div>
            
            {/* East marker */}
            <div className="absolute right-0 top-1/2 transform translate-x-1 -translate-y-1/2">
              <div className="w-4 h-1 bg-gray-400 rounded-full"></div>
              <span className="absolute right-5 top-1/2 transform translate-x-1/2 -translate-y-1/2 text-xs text-gray-500">E</span>
            </div>
            
            {/* South marker */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1">
              <div className="w-1 h-4 bg-gray-400 rounded-full"></div>
              <span className="absolute bottom-5 left-1/2 transform -translate-x-1/2 text-xs text-gray-500">S</span>
            </div>
            
            {/* West marker */}
            <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2">
              <div className="w-4 h-1 bg-gray-400 rounded-full"></div>
              <span className="absolute left-5 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs text-gray-500">W</span>
            </div>
          </div>
        </div>

        {/* Qibla direction arrow */}
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{ 
            transform: `rotate(${relativeQiblaDirection}deg)`,
            transition: compassSupported ? 'transform 0.3s ease' : 'none'
          }}
        >
          <div className="flex flex-col items-center">
            <Navigation 
              className="w-12 h-12 text-green-600 drop-shadow-lg" 
              fill="currentColor"
            />
            <div className="mt-2 px-2 py-1 bg-green-600 text-white text-xs rounded font-medium">
              QIBLA
            </div>
          </div>
        </div>

        {/* Center dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 bg-gray-800 rounded-full shadow-lg"></div>
        </div>
      </div>

      {/* Direction Info */}
      <div className="text-center space-y-2">
        <div className="bg-green-50 rounded-lg p-3">
          <p className="text-sm text-gray-600 mb-1">Qibla Direction</p>
          <p className="text-2xl font-bold text-green-700">
            {Math.round(qiblaDirection)}°
          </p>
          <p className="text-xs text-gray-500">
            {getDirectionName(qiblaDirection)}
          </p>
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p>Distance to Mecca: ~{Math.round(distanceToMecca)} km</p>
          {!compassSupported && (
            <p className="text-orange-600">
              Compass not available. Showing static direction.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper function to calculate distance between two points
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const toRadians = (degrees) => degrees * (Math.PI/180);

// Helper function to get direction name
const getDirectionName = (degrees) => {
  const directions = [
    'North', 'NNE', 'NE', 'ENE',
    'East', 'ESE', 'SE', 'SSE',
    'South', 'SSW', 'SW', 'WSW',
    'West', 'WNW', 'NW', 'NNW'
  ];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
};

export default QiblaCompass;