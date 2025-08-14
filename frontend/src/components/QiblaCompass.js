import React, { useState, useEffect } from 'react';
import { Navigation, MapPin } from 'lucide-react';

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
    <div className="flex flex-col items-center space-y-6">
      {/* Modern Compass Circle */}
      <div className="relative w-56 h-56">
        {/* Outer glow ring */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 blur-xl"></div>
        
        {/* Main compass ring */}
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/20 shadow-2xl">
          
          {/* Inner compass ring */}
          <div className="absolute inset-4 rounded-full border border-white/10">
            
            {/* Cardinal directions with modern styling */}
            {/* North marker */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1">
              <div className="w-1 h-6 bg-gradient-to-b from-red-400 to-red-600 rounded-full shadow-lg"></div>
              <span className="absolute top-7 left-1/2 transform -translate-x-1/2 text-xs font-bold text-red-400">N</span>
            </div>
            
            {/* East marker */}
            <div className="absolute right-0 top-1/2 transform translate-x-1 -translate-y-1/2">
              <div className="w-6 h-1 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full"></div>
              <span className="absolute right-7 top-1/2 transform translate-x-1/2 -translate-y-1/2 text-xs text-gray-400">E</span>
            </div>
            
            {/* South marker */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1">
              <div className="w-1 h-6 bg-gradient-to-t from-gray-400 to-gray-500 rounded-full"></div>
              <span className="absolute bottom-7 left-1/2 transform -translate-x-1/2 text-xs text-gray-400">S</span>
            </div>
            
            {/* West marker */}
            <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2">
              <div className="w-6 h-1 bg-gradient-to-l from-gray-400 to-gray-500 rounded-full"></div>
              <span className="absolute left-7 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs text-gray-400">W</span>
            </div>
            
            {/* Degree markers */}
            {[30, 60, 120, 150, 210, 240, 300, 330].map(degree => (
              <div 
                key={degree}
                className="absolute w-0.5 h-3 bg-white/30 rounded-full"
                style={{
                  top: '50%',
                  left: '50%',
                  transformOrigin: '0 0',
                  transform: `translate(-50%, -50%) rotate(${degree}deg) translateY(-6.5rem)`
                }}
              ></div>
            ))}
          </div>
        </div>

        {/* Qibla direction arrow with modern design */}
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{ 
            transform: `rotate(${relativeQiblaDirection}deg)`,
            transition: compassSupported ? 'transform 0.5s ease-out' : 'none'
          }}
        >
          <div className="flex flex-col items-center">
            <div className="p-3 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl shadow-xl">
              <Navigation 
                className="w-10 h-10 text-white drop-shadow-lg" 
                fill="currentColor"
              />
            </div>
            <div className="mt-3 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-bold rounded-full shadow-lg">
              QIBLA
            </div>
          </div>
        </div>

        {/* Center point with modern design */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 bg-gradient-to-br from-white to-gray-300 rounded-full shadow-lg border border-white/50"></div>
        </div>
      </div>

      {/* Modern Direction Info Cards */}
      <div className="grid grid-cols-2 gap-4 w-full">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
          <p className="text-xs text-gray-300 mb-1 font-medium">Direction</p>
          <p className="text-2xl font-bold text-white">
            {Math.round(qiblaDirection)}°
          </p>
          <p className="text-xs text-emerald-400 font-medium">
            {getDirectionName(qiblaDirection)}
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
          <p className="text-xs text-gray-300 mb-1 font-medium">Distance</p>
          <p className="text-2xl font-bold text-white">
            {Math.round(distanceToMecca)}
          </p>
          <p className="text-xs text-blue-400 font-medium">kilometers</p>
        </div>
      </div>

      {/* Status indicator */}
      <div className="text-center">
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium ${
          compassSupported 
            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
            : 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            compassSupported ? 'bg-emerald-400' : 'bg-orange-400'
          }`}></div>
          {compassSupported ? 'Live Compass Active' : 'Static Direction Mode'}
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