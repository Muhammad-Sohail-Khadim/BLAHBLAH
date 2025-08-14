import React, { useState, useEffect } from 'react';
import { Clock, Sun, Moon, Sunrise, Sunset } from 'lucide-react';
import { mockPrayerTimes } from '../services/mockData';

const PrayerTimes = ({ location }) => {
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [nextPrayer, setNextPrayer] = useState(null);

  useEffect(() => {
    // Update current time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (location) {
      // For now, use mock data. Later this will be replaced with real API calls
      const times = mockPrayerTimes.getTodaysPrayerTimes(location);
      setPrayerTimes(times);
    }
  }, [location]);

  useEffect(() => {
    if (prayerTimes) {
      const next = findNextPrayer(prayerTimes, currentTime);
      setNextPrayer(next);
    }
  }, [prayerTimes, currentTime]);

  const findNextPrayer = (times, now) => {
    const prayers = [
      { name: 'Fajr', time: times.fajr },
      { name: 'Dhuhr', time: times.dhuhr },
      { name: 'Asr', time: times.asr },
      { name: 'Maghrib', time: times.maghrib },
      { name: 'Isha', time: times.isha }
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
      { name: 'Fajr', time: prayerTimes.fajr },
      { name: 'Dhuhr', time: prayerTimes.dhuhr },
      { name: 'Asr', time: prayerTimes.asr },
      { name: 'Maghrib', time: prayerTimes.maghrib },
      { name: 'Isha', time: prayerTimes.isha }
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
          { name: 'Fajr', time: prayerTimes.fajr, color: 'text-blue-600' },
          { name: 'Dhuhr', time: prayerTimes.dhuhr, color: 'text-yellow-600' },
          { name: 'Asr', time: prayerTimes.asr, color: 'text-orange-600' },
          { name: 'Maghrib', time: prayerTimes.maghrib, color: 'text-red-600' },
          { name: 'Isha', time: prayerTimes.isha, color: 'text-purple-600' }
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

      {/* Today's Date */}
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
          Times calculated for your location
        </p>
      </div>
    </div>
  );
};

export default PrayerTimes;