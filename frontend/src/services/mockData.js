// Mock data for prayer times - will be replaced with real API calls later
export const mockPrayerTimes = {
  getTodaysPrayerTimes: (location) => {
    // This is mock data based on approximate times for different regions
    // In real implementation, this will call AlAdhan API or similar service
    
    // Base times (approximate for Middle East region)
    const baseTimes = {
      fajr: '05:15',
      dhuhr: '12:30',
      asr: '15:45',
      maghrib: '18:20',
      isha: '19:50'
    };

    // Adjust times based on latitude (very basic approximation)
    const latitudeAdjustment = Math.round((location.latitude - 25) * 0.5);
    
    return {
      fajr: adjustTime(baseTimes.fajr, latitudeAdjustment * -1),
      sunrise: adjustTime('06:45', latitudeAdjustment * -1),
      dhuhr: adjustTime(baseTimes.dhuhr, 0), // Dhuhr is relatively stable
      asr: adjustTime(baseTimes.asr, latitudeAdjustment * 0.5),
      maghrib: adjustTime(baseTimes.maghrib, latitudeAdjustment),
      isha: adjustTime(baseTimes.isha, latitudeAdjustment),
      date: new Date().toISOString().split('T')[0],
      location: {
        latitude: location.latitude,
        longitude: location.longitude
      }
    };
  },

  getWeeklyPrayerTimes: (location) => {
    const today = new Date();
    const weekTimes = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      weekTimes.push({
        date: date.toISOString().split('T')[0],
        ...mockPrayerTimes.getTodaysPrayerTimes(location)
      });
    }
    
    return weekTimes;
  },

  // Method calculation settings (mock)
  methods: {
    'Muslim World League': 1,
    'Islamic Society of North America': 2,
    'Egyptian General Authority of Survey': 5,
    'Umm Al-Qura University, Makkah': 4,
    'University of Islamic Sciences, Karachi': 3
  }
};

// Helper function to adjust time by minutes
function adjustTime(timeString, minutesOffset) {
  const [hours, minutes] = timeString.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + minutesOffset;
  
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMinutes = totalMinutes % 60;
  
  return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
}

// Sample locations for testing
export const sampleLocations = {
  mecca: { latitude: 21.4225, longitude: 39.8262, name: 'Mecca, Saudi Arabia' },
  london: { latitude: 51.5074, longitude: -0.1278, name: 'London, UK' },
  newYork: { latitude: 40.7128, longitude: -74.0060, name: 'New York, USA' },
  dubai: { latitude: 25.2048, longitude: 55.2708, name: 'Dubai, UAE' },
  istanbul: { latitude: 41.0082, longitude: 28.9784, name: 'Istanbul, Turkey' },
  jakarta: { latitude: -6.2088, longitude: 106.8456, name: 'Jakarta, Indonesia' }
};

export default mockPrayerTimes;