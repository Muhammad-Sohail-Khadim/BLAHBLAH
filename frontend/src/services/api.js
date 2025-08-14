import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_BASE = `${BACKEND_URL}/api`;

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const prayerTimesAPI = {
  /**
   * Get today's prayer times for given coordinates
   */
  getTodaysTimes: async (latitude, longitude) => {
    try {
      const response = await apiClient.get(`/prayer-times/${latitude}/${longitude}`);
      return response.data;
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout. Please check your internet connection.');
      }
      if (error.response?.status === 400) {
        throw new Error('Invalid location coordinates.');
      }
      if (error.response?.status >= 500) {
        throw new Error('Prayer times service is temporarily unavailable.');
      }
      throw new Error('Failed to fetch prayer times. Please try again.');
    }
  },

  /**
   * Get weekly prayer times for given coordinates
   */
  getWeeklyTimes: async (latitude, longitude) => {
    try {
      const response = await apiClient.get(`/prayer-times/${latitude}/${longitude}/weekly`);
      return response.data;
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout. Please check your internet connection.');
      }
      if (error.response?.status === 400) {
        throw new Error('Invalid location coordinates.');
      }
      if (error.response?.status >= 500) {
        throw new Error('Prayer times service is temporarily unavailable.');
      }
      throw new Error('Failed to fetch weekly prayer times. Please try again.');
    }
  }
};

export const qiblaAPI = {
  /**
   * Get Qibla direction and distance for given coordinates
   */
  getQiblaDirection: async (latitude, longitude) => {
    try {
      const response = await apiClient.get(`/qibla/${latitude}/${longitude}`);
      return response.data;
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout. Please check your internet connection.');
      }
      if (error.response?.status === 400) {
        throw new Error('Invalid location coordinates.');
      }
      if (error.response?.status >= 500) {
        throw new Error('Qibla calculation service is temporarily unavailable.');
      }
      throw new Error('Failed to calculate Qibla direction. Please try again.');
    }
  }
};

export default {
  prayerTimes: prayerTimesAPI,
  qibla: qiblaAPI
};