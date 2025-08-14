import React, { useState, useEffect } from 'react';
import { Clock, Sun, Moon, Sunrise, Sunset, Loader2, Bell, Calendar } from 'lucide-react';
import { prayerTimesAPI } from '../services/api';
import { useToast } from '../hooks/use-toast';

const PrayerTimes = ({ location }) => {
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [nextPrayer, setNextPrayer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    // Update current time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (location) {
      fetchPrayerTimes();
    }
  }, [location]);

  useEffect(() => {
    if (prayerTimes) {
      const next = findNextPrayer(prayerTimes, currentTime);
      setNextPrayer(next);
    }
  }, [prayerTimes, currentTime]);

  const fetchPrayerTimes = async () => {
    if (!location) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await prayerTimesAPI.getTodaysTimes(location.latitude, location.longitude);
      setPrayerTimes(data);
      
      toast({
        title: "Prayer times updated",
        description: `Using ${data.method} calculation method`,
      });
      
    } catch (err) {
      setError(err.message);
      toast({
        title: "Prayer Times Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const findNextPrayer = (times, now) => {
    const prayers = [
      { name: 'Fajr', time: times.times.fajr },
      { name: 'Dhuhr', time: times.times.dhuhr },
      { name: 'Asr', time: times.times.asr },
      { name: 'Maghrib', time: times.times.maghrib },
      { name: 'Isha', time: times.times.isha }
    ];

    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    for (const prayer of prayers) {
      const [hours, minutes] = prayer.time.split(':').map(Number);
      const prayerMinutes = hours * 60 + minutes;
      
      if (prayerMinutes > nowMinutes) {
        const timeLeft = prayerMinutes - nowMinutes;
        return {
          ...prayer,
          timeLeft: formatTimeLeft(timeLeft)
        };
      }
    }

    // If no prayer found today, next is Fajr tomorrow
    const [fajrHours, fajrMinutes] = prayers[0].time.split(':').map(Number);
    const fajrTomorrowMinutes = (24 * 60) + (fajrHours * 60) + fajrMinutes;
    const timeLeft = fajrTomorrowMinutes - nowMinutes;
    
    return {
      name: 'Fajr',
      time: prayers[0].time,
      timeLeft: formatTimeLeft(timeLeft),
      tomorrow: true
    };
  };

  const formatTimeLeft = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getPrayerIcon = (prayerName) => {
    switch (prayerName.toLowerCase()) {
      case 'fajr': return <Sunrise className="w-5 h-5" />;
      case 'dhuhr': return <Sun className="w-5 h-5" />;
      case 'asr': return <Sun className="w-5 h-5" />;
      case 'maghrib': return <Sunset className="w-5 h-5" />;
      case 'isha': return <Moon className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  const getPrayerGradient = (prayerName) => {
    switch (prayerName.toLowerCase()) {
      case 'fajr': return 'from-blue-500 to-indigo-600';
      case 'dhuhr': return 'from-yellow-500 to-orange-600';
      case 'asr': return 'from-orange-500 to-red-500';
      case 'maghrib': return 'from-red-500 to-pink-600';
      case 'isha': return 'from-purple-500 to-indigo-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const formatTime = (time24) => {
    const [hours, minutes] = time24.split(':');
    const hour12 = parseInt(hours) > 12 ? parseInt(hours) - 12 : parseInt(hours);
    const period = parseInt(hours) >= 12 ? 'PM' : 'AM';
    const displayHour = hour12 === 0 ? 12 : hour12;
    return `${displayHour}:${minutes} ${period}`;
  };

  const isCurrentPrayer = (prayerName) => {
    if (!prayerTimes) return false;
    
    const prayers = [
      { name: 'Fajr', time: prayerTimes.times.fajr },
      { name: 'Dhuhr', time: prayerTimes.times.dhuhr },
      { name: 'Asr', time: prayerTimes.times.asr },
      { name: 'Maghrib', time: prayerTimes.times.maghrib },
      { name: 'Isha', time: prayerTimes.times.isha }
    ];

    const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    
    for (let i = 0; i < prayers.length; i++) {
      const [hours, minutes] = prayers[i].time.split(':').map(Number);
      const prayerMinutes = hours * 60 + minutes;
      
      const nextPrayerTime = i < prayers.length - 1 
        ? prayers[i + 1].time 
        : '23:59'; // End of day for Isha
        
      const [nextHours, nextMins] = nextPrayerTime.split(':').map(Number);
      const nextPrayerMinutes = nextHours * 60 + nextMins;
      
      if (nowMinutes >= prayerMinutes && nowMinutes < nextPrayerMinutes) {
        return prayers[i].name === prayerName;
      }
    }
    
    return false;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="p-4 bg-white/10 rounded-2xl mb-4 inline-block">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
          </div>
          <p className="text-white font-medium">Fetching prayer times...</p>
          <p className="text-gray-400 text-sm mt-1">Connecting to prayer service</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-2xl mb-4">
          <Clock className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-red-300 font-medium text-sm">{error}</p>
        </div>
        <button 
          onClick={fetchPrayerTimes}
          className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-emerald-500/25 transition-all duration-300"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!prayerTimes) {
    return (
      <div className="text-center py-12">
        <div className="p-4 bg-white/10 rounded-2xl mb-4 inline-block">
          <Clock className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-white font-medium">Location Required</p>
        <p className="text-gray-400 text-sm mt-1">Enable location access to view prayer times</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Next Prayer Alert - Modern Design */}
      {nextPrayer && (
        <div className="bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 rounded-2xl p-4 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/30 rounded-xl">
              <Bell className="w-6 h-6 text-emerald-300" />
            </div>
            <div className="flex-1">
              <p className="text-emerald-300 font-bold text-lg">
                Next: {nextPrayer.name}
                {nextPrayer.tomorrow && ' (Tomorrow)'}
              </p>
              <p className="text-emerald-200 text-sm font-medium">
                {formatTime(nextPrayer.time)} • In {nextPrayer.timeLeft}
              </p>
            </div>
            <div className="text-emerald-400">
              {getPrayerIcon(nextPrayer.name)}
            </div>
          </div>
        </div>
      )}

      {/* Prayer Times List - Modern Cards */}
      <div className="space-y-3">
        {[
          { name: 'Fajr', time: prayerTimes.times.fajr },
          { name: 'Dhuhr', time: prayerTimes.times.dhuhr },
          { name: 'Asr', time: prayerTimes.times.asr },
          { name: 'Maghrib', time: prayerTimes.times.maghrib },
          { name: 'Isha', time: prayerTimes.times.isha }
        ].map((prayer, index) => (
          <div 
            key={prayer.name}
            className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${
              isCurrentPrayer(prayer.name) 
                ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border-emerald-500/40 shadow-lg shadow-emerald-500/20' 
                : 'bg-white/10 border-white/20 hover:bg-white/15'
            }`}
          >
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${getPrayerGradient(prayer.name)} shadow-lg`}>
                  <div className="text-white">
                    {getPrayerIcon(prayer.name)}
                  </div>
                </div>
                <div>
                  <p className="font-bold text-white text-lg">{prayer.name}</p>
                  {isCurrentPrayer(prayer.name) && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                      <p className="text-xs text-emerald-400 font-semibold">CURRENT PRAYER</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono text-2xl font-bold text-white">
                  {formatTime(prayer.time)}
                </p>
              </div>
            </div>
            
            {/* Decorative gradient line */}
            <div className={`h-1 bg-gradient-to-r ${getPrayerGradient(prayer.name)}`}></div>
          </div>
        ))}
      </div>

      {/* Footer Info - Modern Design */}
      <div className="bg-white/10 border border-white/20 rounded-2xl p-4 backdrop-blur-md">
        <div className="flex items-center gap-3 mb-3">
          <Calendar className="w-5 h-5 text-blue-400" />
          <div>
            <p className="text-white font-medium">
              {currentTime.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
            <p className="text-gray-400 text-sm">
              {prayerTimes.method} • {prayerTimes.timezone}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrayerTimes;