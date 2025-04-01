import requests
import csv
import os
import time
from datetime import datetime

def fetch_weather_data(api_key, locations):
    """
    Fetch weather data from WeatherStack API for multiple locations
    
    Args:
        api_key (str): Your WeatherStack API key
        locations (list): List of location names to fetch data for
        
    Returns:
        list: List of dictionaries containing weather data for each location
    """
    base_url = "http://api.weatherstack.com/current"
    all_data = []
    
    print(f"Fetching weather data for {len(locations)} locations...")
    
    for location in locations:
        try:
            # Build parameters for the API request
            params = {
                'access_key': api_key,
                'query': location,
                'units': 'm'  # Metric units
            }
            
            # Make the API request
            response = requests.get(base_url, params=params)
            
            # Check if the request was successful
            if response.status_code == 200:
                data = response.json()
                
                # Check if the API returned an error
                if 'error' in data:
                    print(f"Error for {location}: {data['error']['info']}")
                    continue
                
                # Extract and format the data we want
                weather_data = {
                    'location': f"{data['location']['name']}, {data['location']['country']}",
                    'latitude': data['location']['lat'],
                    'longitude': data['location']['lon'],
                    'observation_time': data['current']['observation_time'],
                    'temperature': data['current']['temperature'],
                    'weather_descriptions': data['current']['weather_descriptions'][0] if data['current']['weather_descriptions'] else '',
                    'wind_speed': data['current']['wind_speed'],
                    'wind_dir': data['current']['wind_dir'],
                    'pressure': data['current']['pressure'],
                    'humidity': data['current']['humidity'],
                    'feels_like': data['current']['feelslike'],
                    'uv_index': data['current']['uv_index'],
                    'visibility': data['current']['visibility'],
                    'is_day': data['current']['is_day'],
                    'precipitation': data['current']['precip'],
                    'cloudcover': data['current']['cloudcover'],
                    'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                }
                
                all_data.append(weather_data)
                print(f"Successfully fetched data for {location}")
                
                # Add a small delay to avoid hitting rate limits
                time.sleep(1)
            else:
                print(f"Failed to fetch data for {location}. Status code: {response.status_code}")
        
        except Exception as e:
            print(f"Error fetching data for {location}: {str(e)}")
    
    return all_data

def save_to_csv(weather_data, filename='weatherdata.csv'):
    """
    Save weather data to a CSV file
    
    Args:
        weather_data (list): List of dictionaries containing weather data
        filename (str): Name of the CSV file to save data to
    """
    if not weather_data:
        print("No weather data to save.")
        return
    
    # Get the keys from the first data point to use as CSV headers
    fieldnames = weather_data[0].keys()
    
    # Write data to CSV file
    with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        
        # Write the header row
        writer.writeheader()
        
        # Write all data rows
        writer.writerows(weather_data)
    
    print(f"Weather data saved to {filename}")

def main():
    """
    Main function to run the weather data extraction process
    """
    # Get API key from environment variable or input
    api_key = "2251b2a556f03df0beae638d458a454a"
    if not api_key:
        api_key = input("Enter your WeatherStack API key: ")
    
    # Default locations to fetch data for
    default_locations = [
        "New York", "London", "Tokyo", "Sydney", "Paris", "Berlin", "Moscow", "Beijing", "Rio de Janeiro", "Cairo",
        "Mumbai", "Dubai", "Singapore", "Toronto", "Mexico City", "Istanbul", "Rome", "Amsterdam", "Madrid", "Barcelona",
        "Seoul", "Bangkok", "Kuala Lumpur", "Jakarta", "Manila", "Ho Chi Minh City", "Shanghai", "Hong Kong", "Delhi",
        "Mumbai", "Bangalore", "Chennai", "Kolkata", "Karachi", "Lahore", "Tehran", "Baghdad", "Riyadh", "Tel Aviv",
        "Athens", "Vienna", "Prague", "Warsaw", "Stockholm", "Oslo", "Copenhagen", "Helsinki", "Dublin", "Lisbon",
        "Brussels", "Zurich", "Geneva", "Milan", "Naples", "Munich", "Frankfurt", "Hamburg", "Vancouver", "Montreal",
        "Chicago", "Los Angeles", "San Francisco", "Miami", "Houston", "Boston", "Seattle", "Atlanta", "Dallas",
        "Las Vegas", "Phoenix", "Denver", "Portland", "San Diego", "Austin", "Philadelphia", "Washington DC",
        "Melbourne", "Brisbane", "Perth", "Auckland", "Wellington", "Johannesburg", "Cape Town", "Nairobi", "Lagos",
        "Casablanca", "Addis Ababa", "Buenos Aires", "Santiago", "Lima", "Bogota", "Sao Paulo", "Caracas", "Panama City",
        "San Jose", "Havana", "Kingston", "Nassau", "San Juan", "Manila", "Hanoi", "Phnom Penh", "Vientiane",
        "Yangon", "Dhaka", "Colombo", "Kathmandu", "Thimphu", "Ulaanbaatar", "Taipei", "Osaka", "Kyoto", "Busan"
    ]
    
    print("Default locations:", ", ".join(default_locations))
    custom_locations = input("Enter custom locations (comma-separated) or press Enter to use defaults: ")
    
    if custom_locations:
        locations = [loc.strip() for loc in custom_locations.split(',')]
    else:
        locations = default_locations
    
    # Fetch weather data
    weather_data = fetch_weather_data(api_key, locations)
    
    # Save data to CSV
    if weather_data:
        csv_filename = input("Enter filename to save data (default: weatherdata.csv): ").strip()
        if not csv_filename:
            csv_filename = "D:/College folder/SEM6/SE/Assignment/weatherdata.csv"
        
        save_to_csv(weather_data, csv_filename)
        print(f"Process completed. {len(weather_data)} location(s) data saved to {csv_filename}")
    else:
        print("No weather data was fetched. Please check your API key and try again.")

if __name__ == "__main__":
    main()