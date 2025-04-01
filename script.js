// Initialize Cesium viewer
Cesium.Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJmMmY2MzEzMy00MDk0LTQ5OGEtYTBmNS0xZGI2YTJhZGI1NTEiLCJpZCI6Mjg0NTI1LCJpYXQiOjE3NDIwMzY5MDJ9.3SeYFhsy1IMwOwH0N2mHMaDHlXCRXZ8Mt58o7VyufaI";

// Create the Cesium viewer
const viewer = new Cesium.Viewer("cesiumContainer", {
  terrain: Cesium.Terrain.fromWorldTerrain(),
  baseLayerPicker: false,
  geocoder: false,
  homeButton: false,
  sceneModePicker: false,
  navigationHelpButton: false,
  animation: false,
  timeline: false,
  fullscreenButton: false,
  selectionIndicator: false,
  infoBox: false,
});

// Add Bing Maps Aerial imagery layer
(async () => {
  try {
    const layer = await viewer.imageryLayers.addImageryProvider(
      await Cesium.IonImageryProvider.fromAssetId(3)
    );
    console.log("Imagery layer added successfully");
  } catch (error) {
    console.error("Error adding imagery layer:", error);
  }
})();

// Set initial camera position
viewer.camera.flyTo({
  destination: Cesium.Cartesian3.fromDegrees(0, 0, 20000000),
  orientation: {
    heading: 0.0,
    pitch: -Math.PI / 2,
    roll: 0.0,
  },
});

// Weather data storage
let weatherData = [];
let filteredWeatherData = [];
let activeCategories = ["Clear", "Cloudy", "Rain", "Snow", "Storm"];

// Map for tracking entity by weather location ID
const weatherEntities = new Map();

// Load weather data from CSV
async function loadWeatherData() {
    try {
        const response = await fetch('weatherdata.csv');
        const csvData = await response.text();
        
        Papa.parse(csvData, {
            header: true,
            complete: function(results) {
                weatherData = results.data
                    .filter(item => item.latitude && item.longitude) // Filter out invalid entries
                    .map((item, index) => ({
                    id: `location_${index}`,
                    location: item.location,
                    temperature: parseFloat(item.temperature),
                    description: item.weather_descriptions,
                    windSpeed: parseFloat(item.wind_speed),
                        windDir: item.wind_dir,
                    humidity: parseFloat(item.humidity),
                    pressure: parseFloat(item.pressure),
                    feelsLike: parseFloat(item.feels_like),
                    visibility: parseFloat(item.visibility),
                    precipitation: parseFloat(item.precipitation),
                    cloudcover: parseFloat(item.cloudcover),
                    lat: parseFloat(item.latitude),
                    lng: parseFloat(item.longitude),
                    timestamp: new Date(item.timestamp),
                    category: getWeatherCategory(item.weather_descriptions)
                    }));

                console.log(`Loaded ${weatherData.length} weather locations`);
        filterWeatherByCategories();
            },
            error: function(error) {
                console.error("Error parsing CSV:", error);
            }
        });
  } catch (error) {
        console.error("Error loading weather data:", error);
    }
}

// Get weather category from description
function getWeatherCategory(description) {
    if (!description) return 'Clear';
    description = description.toLowerCase();
    if (description.includes('rain') || description.includes('drizzle')) return 'Rain';
    if (description.includes('snow')) return 'Snow';
    if (description.includes('storm') || description.includes('thunder')) return 'Storm';
    if (description.includes('cloud') || description.includes('overcast')) return 'Cloudy';
    return 'Clear';
}

// Filter weather by categories
function filterWeatherByCategories() {
    filteredWeatherData = weatherData.filter(item =>
    activeCategories.includes(item.category)
  );

    clearWeatherMarkers();
    addWeatherMarkers();
    populateWeatherList();
}

// Clear all weather markers
function clearWeatherMarkers() {
    weatherEntities.forEach(entity => {
    viewer.entities.remove(entity);
  });
    weatherEntities.clear();
}

// Create weather marker billboard
function createWeatherBillboard(weatherItem) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 48;
    canvas.height = 48;

    // Draw marker background
    ctx.beginPath();
    ctx.arc(24, 24, 20, 0, 2 * Math.PI);
    
    // Set color based on temperature
    const temp = weatherItem.temperature;
    let color;
    if (temp <= 0) color = '#00f'; // Blue for cold
    else if (temp <= 15) color = '#0f0'; // Green for mild
    else if (temp <= 25) color = '#ff0'; // Yellow for warm
    else color = '#f00'; // Red for hot

    ctx.fillStyle = color;
    ctx.fill();

    // Add temperature text
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.round(temp)}°`, 24, 24);

    return canvas.toDataURL();
}

// Add weather markers to the globe
function addWeatherMarkers() {
    filteredWeatherData.forEach(item => {
      const entity = viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(item.lng, item.lat),
        billboard: {
                image: createWeatherBillboard(item),
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                scale: 1.0
        },
        properties: {
                weatherId: item.id,
                title: item.location,
                summary: `Temperature: ${item.temperature}°C
Wind: ${item.windSpeed} km/h ${item.windDir}
Humidity: ${item.humidity}%
Pressure: ${item.pressure} mb
Visibility: ${item.visibility} km
Cloud Cover: ${item.cloudcover}%`,
                category: item.category
            }
        });
        
        weatherEntities.set(item.id, entity);
    });
}

// Populate the weather list
function populateWeatherList() {
    const listElement = document.getElementById("weatherList");
    listElement.innerHTML = "";

    if (filteredWeatherData.length === 0) {
        listElement.innerHTML = '<div class="no-weather">No weather data available for the selected categories.</div>';
    return;
  }

    filteredWeatherData.forEach(item => {
        const weatherItem = document.createElement("div");
        weatherItem.className = `weatherItem ${item.category}`;
        weatherItem.dataset.id = item.id;

        weatherItem.innerHTML = `
            <div class="weatherItem-content">
                <h3>${item.location}</h3>
                <div class="weatherItem-meta">
          <span class="category category-${item.category}">${item.category}</span>
                    <span>${item.temperature}°C - ${item.description}</span>
        </div>
      </div>
    `;

        weatherItem.addEventListener("click", () => showWeatherDetails(item.id));
        listElement.appendChild(weatherItem);
    });
}

// Show weather details
function showWeatherDetails(weatherId) {
    const weatherItem = filteredWeatherData.find(item => item.id === weatherId);
    if (!weatherItem) return;

    document.getElementById("locationTitle").textContent = weatherItem.location;
    document.getElementById("weatherSummary").textContent = 
        `Temperature: ${weatherItem.temperature}°C
Feels Like: ${weatherItem.feelsLike}°C
         Weather: ${weatherItem.description}
Wind: ${weatherItem.windSpeed} km/h ${weatherItem.windDir}
Humidity: ${weatherItem.humidity}%
Pressure: ${weatherItem.pressure} mb
Visibility: ${weatherItem.visibility} km
Precipitation: ${weatherItem.precipitation} mm
Cloud Cover: ${weatherItem.cloudcover}%`;

    const categoryElem = document.getElementById("weatherCategory");
    categoryElem.textContent = weatherItem.category;
    categoryElem.className = `category category-${weatherItem.category}`;

    document.getElementById("weatherTimestamp").textContent = 
        `Last Updated: ${weatherItem.timestamp.toLocaleString()}`;

    document.getElementById("weatherDetails").style.display = "block";
    document.getElementById("weatherList").style.display = "none";

    viewer.flyTo(weatherEntities.get(weatherId), {
    duration: 1.5,
        offset: new Cesium.HeadingPitchRange(0, -Math.PI / 4, 200000)
  });
}

// Back button functionality
document.getElementById("backButton").addEventListener("click", () => {
    document.getElementById("weatherDetails").style.display = "none";
    document.getElementById("weatherList").style.display = "block";

  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(0, 0, 20000000),
    orientation: {
      heading: 0.0,
      pitch: -Math.PI / 2,
      roll: 0.0,
    },
    duration: 1.5,
  });
});

// Category filter buttons
document.querySelectorAll(".categoryButton").forEach((button) => {
  button.addEventListener("click", function () {
    const category = this.dataset.category;

    if (this.classList.contains("active")) {
      this.classList.remove("active");
      activeCategories = activeCategories.filter((cat) => cat !== category);
    } else {
      this.classList.add("active");
      activeCategories.push(category);
    }

    filterWeatherByCategories();
  });
});

// Initialize
viewer.scene.globe.tileLoadProgressEvent.addEventListener((remainingTiles) => {
  if (remainingTiles === 0) {
    document.getElementById("loadingIndicator").style.display = "none";
        loadWeatherData();
    }
});
