import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import QiblaCompass from "./components/QiblaCompass";
import PrayerTimes from "./components/PrayerTimes";
import LocationService from "./services/LocationService";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { MapPin, Compass, Clock, Loader2 } from "lucide-react";
import { useToast } from "./hooks/use-toast";
import { Toaster } from "./components/ui/toaster";

const Home = () => {
  const [location, setLocation] = useState(null);
  const [qiblaDirection, setQiblaDirection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const position = await LocationService.getCurrentPosition();
      const userLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      };
      
      setLocation(userLocation);
      
      // Calculate Qibla direction
      const direction = LocationService.calculateQiblaDirection(
        userLocation.latitude, 
        userLocation.longitude
      );
      setQiblaDirection(direction);
      
      toast({
        title: "Location found",
        description: `Accuracy: ${Math.round(userLocation.accuracy)}m`,
      });
      
    } catch (err) {
      setError(err.message);
      toast({
        title: "Location Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCoordinates = (lat, lng) => {
    return `${Math.abs(lat).toFixed(4)}°${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lng).toFixed(4)}°${lng >= 0 ? 'E' : 'W'}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Qibla Finder</h1>
          <p className="text-gray-600">Prayer Times & Direction to Mecca</p>
        </div>

        {/* Location Status */}
        <Card className="shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="w-5 h-5 text-blue-600" />
              Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Getting your location...</span>
              </div>
            ) : error ? (
              <div className="space-y-3">
                <p className="text-red-600 text-sm">{error}</p>
                <Button onClick={getCurrentLocation} className="w-full">
                  Try Again
                </Button>
              </div>
            ) : location ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  {formatCoordinates(location.latitude, location.longitude)}
                </p>
                <p className="text-xs text-gray-500">
                  Accuracy: ±{Math.round(location.accuracy)}m
                </p>
                <Button 
                  onClick={getCurrentLocation} 
                  variant="outline" 
                  size="sm"
                  className="w-full mt-2"
                >
                  Refresh Location
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Qibla Compass */}
        {location && qiblaDirection !== null && (
          <Card className="shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Compass className="w-5 h-5 text-green-600" />
                Qibla Direction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <QiblaCompass 
                qiblaDirection={qiblaDirection}
                location={location}
              />
            </CardContent>
          </Card>
        )}

        {/* Prayer Times */}
        <Card className="shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="w-5 h-5 text-purple-600" />
              Prayer Times
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PrayerTimes location={location} />
          </CardContent>
        </Card>
      </div>
      <Toaster />
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;