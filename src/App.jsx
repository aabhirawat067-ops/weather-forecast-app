import { useEffect, useState } from "react";
import "./App.css";
function getDayName(date) {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "short",
  });
}

function App() {
  const [darkMode, setDarkMode] = useState(() => {
  return localStorage.getItem("darkMode") === "true";
});

useEffect(() => {
  localStorage.setItem("darkMode", darkMode);
}, [darkMode]);
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function getWeather() {
    if (!city.trim()) {
      setError("Please enter a city name");
      return;
    }

    setLoading(true);
    setError("");
    setWeather(null);

    try {
      // Find city
      const geoUrl = new URL(
        "https://geocoding-api.open-meteo.com/v1/search"
      );

      geoUrl.searchParams.set("name", city);
      geoUrl.searchParams.set("count", "1");
      geoUrl.searchParams.set("language", "en");
      geoUrl.searchParams.set("format", "json");

      const geoResponse = await fetch(geoUrl);
      const geoData = await geoResponse.json();

      if (!geoData.results || geoData.results.length === 0) {
        setError("City not found. Try another city.");
        return;
      }

      
      // Get weather
      const location = geoData.results[0];
      const weatherUrl = new URL(
        "https://api.open-meteo.com/v1/forecast"
      );

      weatherUrl.searchParams.set("latitude", location.latitude);
      weatherUrl.searchParams.set("longitude", location.longitude);
weatherUrl.searchParams.set(
  "daily",
  "weather_code,temperature_2m_max,temperature_2m_min"
);

weatherUrl.searchParams.set("timezone", "auto");
      weatherUrl.searchParams.set(
        "current",
        "temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code"
      );

      weatherUrl.searchParams.set("temperature_unit", "celsius");
      weatherUrl.searchParams.set("wind_speed_unit", "kmh");

      const weatherResponse = await fetch(weatherUrl);
      const weatherData = await weatherResponse.json();

      const current = weatherData.current;

      setWeather({
        city: location.name,
        country: location.country,
        temperature: current.temperature_2m,
        humidity: current.relative_humidity_2m,
        feelsLike: current.apparent_temperature,
        wind: current.wind_speed_10m,
        description: getWeatherDescription(current.weather_code),
        forecast: weatherData.daily,
      });
    } catch (err) {
      setError("Unable to fetch weather. Please try again.");
    } finally {
      setLoading(false);
    }
  }
  const getCurrentLocation = () => {
  if (!navigator.geolocation) {
    setError("Geolocation is not supported by your browser");
    return;
  }

  setLoading(true);
  setError("");

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;

      try {
        const url = new URL(
          "https://api.open-meteo.com/v1/forecast"
        );

        url.searchParams.set("latitude", latitude);
        url.searchParams.set("longitude", longitude);

        url.searchParams.set(
          "current",
          "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m"
        );

        url.searchParams.set(
          "daily",
          "weather_code,temperature_2m_max,temperature_2m_min"
        );

        url.searchParams.set("timezone", "auto");

        const response = await fetch(url);
        const data = await response.json();

        setWeather({
          city: "Current Location",
          country: "",
          temperature: data.current.temperature_2m,
          humidity: data.current.relative_humidity_2m,
          feelsLike: data.current.apparent_temperature,
          wind: data.current.wind_speed_10m,
          description: getWeatherDescription(
            data.current.weather_code
          ),
          forecast: {
            time: data.daily.time,
            weather_code: data.daily.weather_code,
            temperature_2m_max: data.daily.temperature_2m_max,
            temperature_2m_min: data.daily.temperature_2m_min,
          },
        });
      } catch (err) {
        setError("Unable to get current location weather");
      } finally {
        setLoading(false);
      }
    },
    () => {
      setLoading(false);
      setError("Please allow location access");
    }
  );
};

  function getWeatherDescription(code) {
    if (code === 0) return "Clear Sky ☀️";
    if (code <= 3) return "Partly Cloudy 🌤️";
    if (code <= 48) return "Foggy 🌫️";
    if (code <= 67) return "Rainy 🌧️";
    if (code <= 77) return "Snowy ❄️";
    if (code <= 82) return "Rain Showers 🌦️";
    if (code <= 86) return "Snow Showers 🌨️";
    if (code >= 95) return "Thunderstorm ⛈️";

    return "Unknown Weather";
  }

  return (
    <div
  className={
    "app " +
    (darkMode ? "dark " : "light ") +
    (weather ? weather.description.toLowerCase().replaceAll(" ", "-") : "")
  }
>
      <div className="weather-card">
        <h1>🌤️ Weather App</h1>
        <button
  className="theme-toggle"
  onClick={() => setDarkMode(!darkMode)}
>
  {darkMode ? "☀️" : "🌙"}
</button>

        <p className="subtitle">
          Check the weather anywhere
        </p>

        <div className="search-box">
          <input
            type="text"
            placeholder="Enter city name..."
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                getWeather();
              }
            }}
          />

          <button onClick={getWeather}>
            {loading ? "..." : "Search"}
          </button>
          <button onClick={getCurrentLocation}>
  📍 My Location
</button>
        </div>

        {error && <p className="error">{error}</p>}

        {weather && (
  <div className="weather-info">
    <h2>
      📍 {weather.city}, {weather.country}
    </h2>

    <div className="temperature">
      {Math.round(weather.temperature)}°C
    </div>

    <p>{weather.description}</p>

    <div className="details">
      <div>
        <span>💧</span>
        <p>Humidity</p>
        <strong>{weather.humidity}%</strong>
      </div>

      <div>
        <span>💨</span>
        <p>Wind</p>
        <strong>{weather.wind} km/h</strong>
      </div>

      <div>
        <span>🌡️</span>
        <p>Feels Like</p>
        <strong>
          {Math.round(weather.feelsLike)}°C
        </strong>
      </div>
    </div>

    <div className="forecast">
      <h3>7-Day Forecast</h3>

      <div className="forecast-list">
        {weather.forecast.time.map((date, index) => (
          <div className="forecast-day" key={date}>
            <p>{getDayName(date)}</p>

            <span>
              {getWeatherDescription(
                weather.forecast.weather_code[index]
              )}
            </span>

            <strong>
              {Math.round(
                weather.forecast.temperature_2m_max[index]
              )}° /
              {Math.round(
                weather.forecast.temperature_2m_min[index]
              )}°
            </strong>
          </div>
        ))}
      </div>
    </div>
  </div>
        )}
      </div>
    </div>
  );
}
  


export default App;