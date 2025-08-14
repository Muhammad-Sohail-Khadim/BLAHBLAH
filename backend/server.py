from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
import uuid
from datetime import datetime, date
import httpx
import math
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Define Models
class Location(BaseModel):
    latitude: float
    longitude: float

class PrayerTimes(BaseModel):
    fajr: str
    sunrise: str
    dhuhr: str
    asr: str
    maghrib: str
    isha: str

class PrayerTimesResponse(BaseModel):
    date: str
    location: Location
    times: PrayerTimes
    method: str
    timezone: str

class QiblaResponse(BaseModel):
    qibla_direction: float
    distance_km: float
    location: Location

class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# Prayer Times Service
class PrayerTimesService:
    BASE_URL = "https://api.aladhan.com/v1"
    
    @classmethod
    async def get_prayer_times(cls, latitude: float, longitude: float, date_obj: date = None) -> Dict:
        """Fetch prayer times from AlAdhan API"""
        if date_obj is None:
            date_obj = date.today()
        
        # Convert date to timestamp
        timestamp = int(datetime.combine(date_obj, datetime.min.time()).timestamp())
        
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "method": 2,  # Islamic Society of North America
            "timestamp": timestamp
        }
        
        url = f"{cls.BASE_URL}/timings/{timestamp}"
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()
                
                if data.get("code") == 200:
                    return data["data"]
                else:
                    raise HTTPException(status_code=500, detail="Failed to fetch prayer times")
                    
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Prayer times service timeout")
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail="Prayer times service unavailable")
    
    @classmethod
    def format_prayer_times(cls, api_data: Dict, latitude: float, longitude: float) -> PrayerTimesResponse:
        """Format AlAdhan API response to our model"""
        timings = api_data["timings"]
        
        return PrayerTimesResponse(
            date=api_data["date"]["gregorian"]["date"],
            location=Location(latitude=latitude, longitude=longitude),
            times=PrayerTimes(
                fajr=cls.format_time(timings["Fajr"]),
                sunrise=cls.format_time(timings["Sunrise"]),
                dhuhr=cls.format_time(timings["Dhuhr"]),
                asr=cls.format_time(timings["Asr"]),
                maghrib=cls.format_time(timings["Maghrib"]),
                isha=cls.format_time(timings["Isha"])
            ),
            method=api_data["meta"]["method"]["name"],
            timezone=api_data["meta"]["timezone"]
        )
    
    @classmethod
    def format_time(cls, time_str: str) -> str:
        """Clean and format time string"""
        # Remove timezone info and extra characters
        time_part = time_str.split(" ")[0]
        return time_part

# Qibla Service
class QiblaService:
    KAABA_LAT = 21.4225
    KAABA_LNG = 39.8262
    
    @classmethod
    def calculate_qibla_direction(cls, user_lat: float, user_lng: float) -> float:
        """Calculate Qibla direction using spherical trigonometry"""
        # Convert to radians
        user_lat_rad = math.radians(user_lat)
        user_lng_rad = math.radians(user_lng)
        kaaba_lat_rad = math.radians(cls.KAABA_LAT)
        kaaba_lng_rad = math.radians(cls.KAABA_LNG)
        
        # Calculate bearing
        delta_lng = kaaba_lng_rad - user_lng_rad
        
        y = math.sin(delta_lng) * math.cos(kaaba_lat_rad)
        x = (math.cos(user_lat_rad) * math.sin(kaaba_lat_rad) - 
             math.sin(user_lat_rad) * math.cos(kaaba_lat_rad) * math.cos(delta_lng))
        
        bearing = math.atan2(y, x)
        bearing = math.degrees(bearing)
        bearing = (bearing + 360) % 360
        
        return bearing
    
    @classmethod
    def calculate_distance(cls, user_lat: float, user_lng: float) -> float:
        """Calculate distance to Mecca in kilometers"""
        R = 6371  # Earth's radius in kilometers
        
        # Convert to radians
        lat1_rad = math.radians(user_lat)
        lng1_rad = math.radians(user_lng)
        lat2_rad = math.radians(cls.KAABA_LAT)
        lng2_rad = math.radians(cls.KAABA_LNG)
        
        # Haversine formula
        dlat = lat2_rad - lat1_rad
        dlng = lng2_rad - lng1_rad
        
        a = (math.sin(dlat/2)**2 + 
             math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlng/2)**2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        
        return R * c

# API Routes
@api_router.get("/")
async def root():
    return {"message": "Qibla Finder API - Prayer Times & Direction"}

@api_router.get("/prayer-times/{latitude}/{longitude}", response_model=PrayerTimesResponse)
async def get_prayer_times(latitude: float, longitude: float):
    """Get today's prayer times for given coordinates"""
    # Validate coordinates
    if not (-90 <= latitude <= 90):
        raise HTTPException(status_code=400, detail="Invalid latitude. Must be between -90 and 90")
    if not (-180 <= longitude <= 180):
        raise HTTPException(status_code=400, detail="Invalid longitude. Must be between -180 and 180")
    
    try:
        api_data = await PrayerTimesService.get_prayer_times(latitude, longitude)
        return PrayerTimesService.format_prayer_times(api_data, latitude, longitude)
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Unexpected error getting prayer times: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@api_router.get("/prayer-times/{latitude}/{longitude}/weekly")
async def get_weekly_prayer_times(latitude: float, longitude: float):
    """Get prayer times for the next 7 days"""
    # Validate coordinates
    if not (-90 <= latitude <= 90):
        raise HTTPException(status_code=400, detail="Invalid latitude")
    if not (-180 <= longitude <= 180):
        raise HTTPException(status_code=400, detail="Invalid longitude")
    
    try:
        today = date.today()
        weekly_times = []
        
        # Get prayer times for next 7 days
        for i in range(7):
            current_date = date.fromordinal(today.toordinal() + i)
            api_data = await PrayerTimesService.get_prayer_times(latitude, longitude, current_date)
            formatted_times = PrayerTimesService.format_prayer_times(api_data, latitude, longitude)
            weekly_times.append(formatted_times)
        
        return {"week": weekly_times}
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Unexpected error getting weekly prayer times: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@api_router.get("/qibla/{latitude}/{longitude}", response_model=QiblaResponse)
async def get_qibla_direction(latitude: float, longitude: float):
    """Get Qibla direction and distance to Mecca"""
    # Validate coordinates
    if not (-90 <= latitude <= 90):
        raise HTTPException(status_code=400, detail="Invalid latitude")
    if not (-180 <= longitude <= 180):
        raise HTTPException(status_code=400, detail="Invalid longitude")
    
    try:
        qibla_direction = QiblaService.calculate_qibla_direction(latitude, longitude)
        distance_km = QiblaService.calculate_distance(latitude, longitude)
        
        return QiblaResponse(
            qibla_direction=round(qibla_direction, 1),
            distance_km=round(distance_km, 1),
            location=Location(latitude=latitude, longitude=longitude)
        )
        
    except Exception as e:
        logging.error(f"Error calculating Qibla: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to calculate Qibla direction")

# Legacy endpoints
@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()