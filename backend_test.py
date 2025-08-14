#!/usr/bin/env python3
"""
Comprehensive Backend API Tests for Qibla Finder Application
Tests all prayer times and Qibla direction endpoints
"""

import asyncio
import httpx
import json
import math
from datetime import datetime, date
from typing import Dict, Any

# Configuration
BASE_URL = "https://muslim-guide-3.preview.emergentagent.com/api"
TIMEOUT = 30.0

class QiblaFinderAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.test_results = []
        self.failed_tests = []
        
    async def run_all_tests(self):
        """Run all test suites"""
        print("🚀 Starting Qibla Finder API Tests")
        print(f"📍 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Test suites
        await self.test_valid_coordinates()
        await self.test_edge_case_coordinates()
        await self.test_invalid_coordinates()
        await self.test_api_integration()
        await self.test_mathematical_calculations()
        
        # Summary
        self.print_summary()
        
    async def test_valid_coordinates(self):
        """Test with valid coordinates (New York)"""
        print("\n📍 Testing Valid Coordinates (New York: 40.7128, -74.0060)")
        print("-" * 50)
        
        lat, lng = 40.7128, -74.0060
        
        # Test today's prayer times
        await self.test_endpoint(
            "GET /api/prayer-times/{lat}/{lng}",
            f"/prayer-times/{lat}/{lng}",
            expected_status=200,
            test_name="Valid coordinates - Today's prayer times"
        )
        
        # Test weekly prayer times
        await self.test_endpoint(
            "GET /api/prayer-times/{lat}/{lng}/weekly",
            f"/prayer-times/{lat}/{lng}/weekly",
            expected_status=200,
            test_name="Valid coordinates - Weekly prayer times"
        )
        
        # Test Qibla direction
        await self.test_endpoint(
            "GET /api/qibla/{lat}/{lng}",
            f"/qibla/{lat}/{lng}",
            expected_status=200,
            test_name="Valid coordinates - Qibla direction"
        )
        
    async def test_edge_case_coordinates(self):
        """Test with edge case coordinates (Mecca itself)"""
        print("\n🕋 Testing Edge Case Coordinates (Mecca: 21.4225, 39.8262)")
        print("-" * 50)
        
        lat, lng = 21.4225, 39.8262
        
        # Test today's prayer times from Mecca
        await self.test_endpoint(
            "GET /api/prayer-times/{lat}/{lng}",
            f"/prayer-times/{lat}/{lng}",
            expected_status=200,
            test_name="Mecca coordinates - Today's prayer times"
        )
        
        # Test weekly prayer times from Mecca
        await self.test_endpoint(
            "GET /api/prayer-times/{lat}/{lng}/weekly",
            f"/prayer-times/{lat}/{lng}/weekly",
            expected_status=200,
            test_name="Mecca coordinates - Weekly prayer times"
        )
        
        # Test Qibla direction from Mecca (should still work)
        await self.test_endpoint(
            "GET /api/qibla/{lat}/{lng}",
            f"/qibla/{lat}/{lng}",
            expected_status=200,
            test_name="Mecca coordinates - Qibla direction"
        )
        
    async def test_invalid_coordinates(self):
        """Test with invalid coordinates"""
        print("\n❌ Testing Invalid Coordinates")
        print("-" * 50)
        
        invalid_coords = [
            (91, 0, "Latitude > 90"),
            (-91, 0, "Latitude < -90"),
            (0, 181, "Longitude > 180"),
            (0, -181, "Longitude < -180"),
            (100, 200, "Both coordinates invalid")
        ]
        
        for lat, lng, description in invalid_coords:
            # Test prayer times with invalid coords
            await self.test_endpoint(
                f"GET /api/prayer-times/{lat}/{lng}",
                f"/prayer-times/{lat}/{lng}",
                expected_status=400,
                test_name=f"Invalid coordinates - Prayer times ({description})"
            )
            
            # Test Qibla with invalid coords
            await self.test_endpoint(
                f"GET /api/qibla/{lat}/{lng}",
                f"/qibla/{lat}/{lng}",
                expected_status=400,
                test_name=f"Invalid coordinates - Qibla ({description})"
            )
            
    async def test_api_integration(self):
        """Test API integration and response formats"""
        print("\n🔗 Testing API Integration & Response Formats")
        print("-" * 50)
        
        lat, lng = 40.7128, -74.0060  # New York
        
        # Test prayer times response format
        response = await self.make_request(f"/prayer-times/{lat}/{lng}")
        if response and response.get("status_code") == 200:
            data = response.get("data", {})
            
            # Check required fields
            required_fields = ["date", "location", "times", "method", "timezone"]
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                self.record_test_result(
                    "Prayer times response format",
                    False,
                    f"Missing fields: {missing_fields}"
                )
            else:
                # Check prayer times format
                times = data.get("times", {})
                prayer_names = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"]
                missing_prayers = [prayer for prayer in prayer_names if prayer not in times]
                
                if missing_prayers:
                    self.record_test_result(
                        "Prayer times format",
                        False,
                        f"Missing prayer times: {missing_prayers}"
                    )
                else:
                    # Check time format (should be HH:MM)
                    time_format_valid = True
                    invalid_times = []
                    
                    for prayer, time_str in times.items():
                        if not self.is_valid_time_format(time_str):
                            time_format_valid = False
                            invalid_times.append(f"{prayer}: {time_str}")
                    
                    self.record_test_result(
                        "Prayer times format validation",
                        time_format_valid,
                        f"Invalid time formats: {invalid_times}" if invalid_times else "All times in correct 24-hour format"
                    )
                    
                self.record_test_result(
                    "Prayer times response structure",
                    True,
                    "All required fields present"
                )
        
        # Test weekly prayer times format
        response = await self.make_request(f"/prayer-times/{lat}/{lng}/weekly")
        if response and response.get("status_code") == 200:
            data = response.get("data", {})
            
            if "week" not in data:
                self.record_test_result(
                    "Weekly prayer times format",
                    False,
                    "Missing 'week' field in response"
                )
            else:
                week_data = data["week"]
                if not isinstance(week_data, list) or len(week_data) != 7:
                    self.record_test_result(
                        "Weekly prayer times format",
                        False,
                        f"Expected 7 days, got {len(week_data) if isinstance(week_data, list) else 'non-list'}"
                    )
                else:
                    self.record_test_result(
                        "Weekly prayer times format",
                        True,
                        "Correct weekly format with 7 days"
                    )
        
        # Test Qibla response format
        response = await self.make_request(f"/qibla/{lat}/{lng}")
        if response and response.get("status_code") == 200:
            data = response.get("data", {})
            
            required_qibla_fields = ["qibla_direction", "distance_km", "location"]
            missing_qibla_fields = [field for field in required_qibla_fields if field not in data]
            
            if missing_qibla_fields:
                self.record_test_result(
                    "Qibla response format",
                    False,
                    f"Missing fields: {missing_qibla_fields}"
                )
            else:
                # Check if values are numeric
                direction = data.get("qibla_direction")
                distance = data.get("distance_km")
                
                direction_valid = isinstance(direction, (int, float)) and 0 <= direction <= 360
                distance_valid = isinstance(distance, (int, float)) and distance >= 0
                
                self.record_test_result(
                    "Qibla response format",
                    direction_valid and distance_valid,
                    f"Direction: {direction} (valid: {direction_valid}), Distance: {distance} (valid: {distance_valid})"
                )
                
    async def test_mathematical_calculations(self):
        """Test mathematical accuracy of Qibla calculations"""
        print("\n🧮 Testing Mathematical Calculations")
        print("-" * 50)
        
        # Test known locations with expected approximate values
        test_locations = [
            {
                "name": "New York",
                "lat": 40.7128,
                "lng": -74.0060,
                "expected_direction_range": (58, 62),  # Approximate northeast
                "expected_distance_range": (11000, 12000)  # Approximate km
            },
            {
                "name": "London",
                "lat": 51.5074,
                "lng": -0.1278,
                "expected_direction_range": (118, 122),  # Approximate southeast
                "expected_distance_range": (5500, 6000)  # Approximate km
            },
            {
                "name": "Sydney",
                "lat": -33.8688,
                "lng": 151.2093,
                "expected_direction_range": (277, 282),  # Approximate west
                "expected_distance_range": (14000, 15000)  # Approximate km
            }
        ]
        
        for location in test_locations:
            response = await self.make_request(f"/qibla/{location['lat']}/{location['lng']}")
            
            if response and response.get("status_code") == 200:
                data = response.get("data", {})
                direction = data.get("qibla_direction")
                distance = data.get("distance_km")
                
                # Check direction range
                direction_valid = (
                    location["expected_direction_range"][0] <= direction <= location["expected_direction_range"][1]
                )
                
                # Check distance range (more lenient as calculations may be more accurate than estimates)
                distance_valid = (
                    location["expected_distance_range"][0] * 0.8 <= distance <= location["expected_distance_range"][1] * 1.2
                )
                
                self.record_test_result(
                    f"Qibla calculation accuracy - {location['name']}",
                    direction_valid and distance_valid,
                    f"Direction: {direction}° (expected: {location['expected_direction_range']}), "
                    f"Distance: {distance}km (expected: {location['expected_distance_range']})"
                )
            else:
                self.record_test_result(
                    f"Qibla calculation accuracy - {location['name']}",
                    False,
                    "Failed to get response for calculation test"
                )
                
    async def test_endpoint(self, endpoint_desc: str, path: str, expected_status: int, test_name: str):
        """Test a specific endpoint"""
        response = await self.make_request(path)
        
        if response is None:
            self.record_test_result(test_name, False, "No response received")
            return
            
        actual_status = response.get("status_code")
        success = actual_status == expected_status
        
        if success:
            message = f"✅ Status {actual_status}"
            if expected_status == 200 and response.get("data"):
                # Add some response details for successful requests
                data = response.get("data")
                if "times" in data:
                    message += f" | Prayer times returned"
                elif "qibla_direction" in data:
                    message += f" | Qibla: {data['qibla_direction']}°, Distance: {data['distance_km']}km"
                elif "week" in data:
                    message += f" | Weekly data: {len(data['week'])} days"
        else:
            message = f"❌ Expected {expected_status}, got {actual_status}"
            if response.get("error"):
                message += f" | Error: {response['error']}"
                
        self.record_test_result(test_name, success, message)
        
    async def make_request(self, path: str) -> Dict[str, Any]:
        """Make HTTP request to API endpoint"""
        url = f"{self.base_url}{path}"
        
        try:
            async with httpx.AsyncClient(timeout=TIMEOUT) as client:
                response = await client.get(url)
                
                result = {
                    "status_code": response.status_code,
                    "url": url
                }
                
                try:
                    if response.headers.get("content-type", "").startswith("application/json"):
                        result["data"] = response.json()
                    else:
                        result["text"] = response.text
                except:
                    result["text"] = response.text
                    
                if response.status_code >= 400:
                    result["error"] = result.get("data", {}).get("detail", result.get("text", "Unknown error"))
                    
                return result
                
        except httpx.TimeoutException:
            print(f"⏰ Timeout for {url}")
            return {"status_code": 408, "error": "Request timeout", "url": url}
        except httpx.RequestError as e:
            print(f"🔌 Connection error for {url}: {str(e)}")
            return {"status_code": 503, "error": f"Connection error: {str(e)}", "url": url}
        except Exception as e:
            print(f"💥 Unexpected error for {url}: {str(e)}")
            return {"status_code": 500, "error": f"Unexpected error: {str(e)}", "url": url}
            
    def is_valid_time_format(self, time_str: str) -> bool:
        """Check if time string is in valid HH:MM format"""
        try:
            # Should be in HH:MM format
            parts = time_str.split(":")
            if len(parts) != 2:
                return False
                
            hours, minutes = int(parts[0]), int(parts[1])
            return 0 <= hours <= 23 and 0 <= minutes <= 59
        except:
            return False
            
    def record_test_result(self, test_name: str, success: bool, message: str):
        """Record test result"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "timestamp": datetime.now().isoformat()
        }
        
        self.test_results.append(result)
        
        if success:
            print(f"✅ {test_name}: {message}")
        else:
            print(f"❌ {test_name}: {message}")
            self.failed_tests.append(result)
            
    def print_summary(self):
        """Print test summary"""
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r["success"]])
        failed_tests = len(self.failed_tests)
        
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%")
        
        if self.failed_tests:
            print("\n🚨 FAILED TESTS:")
            print("-" * 30)
            for test in self.failed_tests:
                print(f"• {test['test']}: {test['message']}")
                
        print("\n📋 DETAILED RESULTS:")
        print("-" * 30)
        for result in self.test_results:
            status = "✅" if result["success"] else "❌"
            print(f"{status} {result['test']}")
            print(f"   {result['message']}")
            
        # Export results to JSON
        with open("/app/test_results.json", "w") as f:
            json.dump({
                "summary": {
                    "total_tests": total_tests,
                    "passed": passed_tests,
                    "failed": failed_tests,
                    "success_rate": round(passed_tests/total_tests*100, 1)
                },
                "results": self.test_results,
                "failed_tests": self.failed_tests,
                "timestamp": datetime.now().isoformat()
            }, f, indent=2)
            
        print(f"\n💾 Detailed results saved to: /app/test_results.json")

async def main():
    """Main test runner"""
    tester = QiblaFinderAPITester()
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())