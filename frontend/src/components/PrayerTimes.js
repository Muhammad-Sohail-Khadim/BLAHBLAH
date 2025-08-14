import React, { useState, useEffect } from 'react';
import { Clock, Sun, Moon, Sunrise, Sunset, Loader2 } from 'lucide-react';
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
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500 text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
          <p>Fetching prayer times...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="text-red-500 text-center mb-4">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{error}</p>
        </div>
        <button 
          onClick={fetchPrayerTimes}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!prayerTimes) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500 text-center">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Location required for prayer times</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Next Prayer Alert */}
      {nextPrayer && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="text-blue-600">
              {getPrayerIcon(nextPrayer.name)}
            </div>
            <div>
              <p className="text-sm text-blue-800 font-medium">
                Next Prayer: {nextPrayer.name}
                {nextPrayer.tomorrow && ' (Tomorrow)'}
              </p>
              <p className="text-xs text-blue-600">
                {formatTime(nextPrayer.time)} • In {nextPrayer.timeLeft}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Prayer Times List */}
      <div className="space-y-2">
        {[
          { name: 'Fajr', time: prayerTimes.times.fajr, color: 'text-blue-600' },
          { name: 'Dhuhr', time: prayerTimes.times.dhuhr, color: 'text-yellow-600' },
          { name: 'Asr', time: prayerTimes.times.asr, color: 'text-orange-600' },
          { name: 'Maghrib', time: prayerTimes.times.maghrib, color: 'text-red-600' },
          { name: 'Isha', time: prayerTimes.times.isha, color: 'text-purple-600' }
        ].map((prayer) => (
          <div 
            key={prayer.name}
            className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
              isCurrentPrayer(prayer.name) 
                ? 'bg-green-50 border-green-200' 
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={prayer.color}>
                {getPrayerIcon(prayer.name)}
              </div>
              <div>
                <p className="font-medium text-gray-800">{prayer.name}</p>
                {isCurrentPrayer(prayer.name) && (
                  <p className="text-xs text-green-600 font-medium">Current Prayer</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="font-mono text-lg text-gray-800">
                {formatTime(prayer.time)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Today's Date & Method */}
      <div className="text-center pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-500">
          {currentTime.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {prayerTimes.method} • {prayerTimes.timezone}
        </p>
      </div>
    </div>
  );
};

export default PrayerTimes;