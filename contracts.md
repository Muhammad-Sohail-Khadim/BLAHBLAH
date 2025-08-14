# API Contracts & Integration Plan

## Backend Implementation Plan

### 1. API Contracts

#### Prayer Times Endpoints
```
GET /api/prayer-times/{latitude}/{longitude}
Response: {
  "date": "2024-01-15",
  "location": { "latitude": 40.7128, "longitude": -74.0060 },
  "times": {
    "fajr": "05:15",
    "sunrise": "06:45", 
    "dhuhr": "12:30",
    "asr": "15:45",
    "maghrib": "18:20",
    "isha": "19:50"
  },
  "method": "Muslim World League",
  "timezone": "America/New_York"
}

GET /api/prayer-times/{latitude}/{longitude}/weekly
Response: {
  "week": [
    { "date": "2024-01-15", "times": {...} },
    ...
  ]
}
```

#### Location & Qibla Endpoints
```
GET /api/qibla/{latitude}/{longitude}
Response: {
  "qibla_direction": 58.5,
  "distance_km": 11045.2,
  "location": { "latitude": 40.7128, "longitude": -74.0060 }
}
```

### 2. Mock Data to Replace

**Frontend Files to Update:**
- `/app/frontend/src/services/mockData.js` → Remove/replace with API calls
- `/app/frontend/src/components/PrayerTimes.js` → Replace mockPrayerTimes calls
- `/app/frontend/src/App.js` → Add backend API integration for Qibla

**Mock Functions to Replace:**
```javascript
// Current mock calls:
mockPrayerTimes.getTodaysPrayerTimes(location) 
// → Replace with: API call to /api/prayer-times/{lat}/{lng}

LocationService.calculateQiblaDirection(lat, lng)
// → Keep calculation logic (it's accurate) OR add API verification
```

### 3. Backend Implementation Strategy

**External API Integration:**
- **AlAdhan API** (https://aladhan.com/prayer-times-api) - Free, no key required
- Endpoints: 
  - `https://api.aladhan.com/v1/timings/{timestamp}?latitude={lat}&longitude={lng}&method=2`
  - Multiple calculation methods available

**Backend Services:**
1. **Prayer Times Service** - Fetch from AlAdhan API
2. **Qibla Service** - Calculate bearing + distance  
3. **Caching Layer** - Cache prayer times for same location/date
4. **Error Handling** - Fallback to calculation if API fails

### 4. Frontend & Backend Integration

**API Client Updates:**
```javascript
// New API service file: /app/frontend/src/services/api.js
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export const prayerTimesAPI = {
  getTodaysTimes: async (latitude, longitude) => {
    const response = await axios.get(`${BACKEND_URL}/api/prayer-times/${latitude}/${longitude}`);
    return response.data;
  },
  getWeeklyTimes: async (latitude, longitude) => {
    const response = await axios.get(`${BACKEND_URL}/api/prayer-times/${latitude}/${longitude}/weekly`);
    return response.data;
  }
};
```

**Component Updates:**
- `PrayerTimes.js` → Replace mock calls with API calls
- Add loading states during API calls
- Add error handling for API failures
- Keep existing UI/UX exactly the same

### 5. Data Models

**Backend Pydantic Models:**
```python
class Location(BaseModel):
    latitude: float
    longitude: float

class PrayerTimesResponse(BaseModel):
    date: str
    location: Location
    times: Dict[str, str]
    method: str
    timezone: str

class QiblaResponse(BaseModel):
    qibla_direction: float
    distance_km: float
    location: Location
```

### 6. Implementation Steps

1. **Backend API Routes** - Create FastAPI endpoints
2. **AlAdhan Integration** - HTTP client for external API
3. **Qibla Calculation** - Port frontend logic to backend
4. **Error Handling** - Proper HTTP error responses
5. **Frontend Integration** - Replace mock calls with API calls
6. **Testing** - Verify all functionality works

### 7. Error Handling Strategy

**Backend:**
- API timeout handling
- Invalid coordinates validation
- External API failure fallbacks

**Frontend:**
- Network error handling
- Loading states
- Fallback to cached data
- User-friendly error messages

This plan ensures seamless transition from mock to real data while maintaining existing functionality and UX.