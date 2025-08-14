import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import QiblaCompass from "./components/QiblaCompass";
import PrayerTimes from "./components/PrayerTimes";
import LocationService from "./services/LocationService";
import { qiblaAPI } from "./services/api";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { MapPin, Compass, Clock, Loader2, Navigation, Zap } from "lucide-react";
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
      
      // Get Qibla direction from backend API
      try {
        const qiblaData = await qiblaAPI.getQiblaDirection(
          userLocation.latitude, 
          userLocation.longitude
        );
        setQiblaDirection(qiblaData.qibla_direction);
        
        toast({
          title: "Location found",
          description: `Accuracy: ${Math.round(userLocation.accuracy)}m`,
        });
      } catch (qiblaError) {
        console.warn('Backend Qibla API failed, using local calculation:', qiblaError.message);
        // Fallback to local calculation
        const direction = LocationService.calculateQiblaDirection(
          userLocation.latitude, 
          userLocation.longitude
        );
        setQiblaDirection(direction);
        
        toast({
          title: "Location found",
          description: `Using offline Qibla calculation`,
        });
      }
      
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 p-4 max-w-md mx-auto">
        {/* Modern Header */}
        <div className="text-center py-8 mb-6">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-2xl shadow-lg">
              <Navigation className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2">
            Qibla Finder
          </h1>
          <p className="text-gray-400 text-lg font-medium">Prayer Times & Sacred Direction</p>
          <div className="w-20 h-1 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full mx-auto mt-4"></div>
        </div>

        <div className="space-y-6">
          {/* Modern Location Card */}
          <Card className="bg-white/10 border-white/20 backdrop-blur-xl shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-white">
                <div className="p-2 bg-blue-500/20 rounded-xl">
                  <MapPin className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-lg font-semibold">Your Location</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center gap-3 text-gray-300">
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
                  <span className="font-medium">Detecting your location...</span>
                </div>
              ) : error ? (
                <div className="space-y-4">
                  <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
                    <p className="text-red-300 text-sm font-medium mb-2">⚠️ Location Access Required</p>
                    <p className="text-red-200 text-sm">{error}</p>
                  </div>
                  <Button 
                    onClick={getCurrentLocation} 
                    className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-emerald-500/25 transition-all duration-300"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Enable Location Access
                  </Button>
                </div>
              ) : location ? (
                <div className="space-y-3">
                  <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-xl">
                    <p className="text-green-300 text-sm font-medium">📍 Location Found</p>
                    <p className="text-green-200 text-sm mt-1">
                      {formatCoordinates(location.latitude, location.longitude)}
                    </p>
                    <p className="text-green-200/70 text-xs mt-1">
                      Accuracy: ±{Math.round(location.accuracy)}m
                    </p>
                  </div>
                  <Button 
                    onClick={getCurrentLocation} 
                    variant="outline" 
                    className="w-full border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all duration-300"
                  >
                    🔄 Refresh Location
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Modern Qibla Compass */}
          {location && qiblaDirection !== null && (
            <Card className="bg-white/10 border-white/20 backdrop-blur-xl shadow-xl overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-white">
                  <div className="p-2 bg-emerald-500/20 rounded-xl">
                    <Compass className="w-5 h-5 text-emerald-400" />
                  </div>
                  <span className="text-lg font-semibold">Qibla Direction</span>
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

          {/* Modern Prayer Times */}
          <Card className="bg-white/10 border-white/20 backdrop-blur-xl shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-white">
                <div className="p-2 bg-purple-500/20 rounded-xl">
                  <Clock className="w-5 h-5 text-purple-400" />
                </div>
                <span className="text-lg font-semibold">Prayer Times</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PrayerTimes location={location} />
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 pb-6">
          <p className="text-gray-400 text-sm">Made with ❤️ for the Muslim community</p>
        </div>
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