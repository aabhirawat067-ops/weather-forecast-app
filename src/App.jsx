import { useEffect, useState } from "react";
import "./App.css";

function getDayName(date) {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "short",
  });
}

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

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  async function getWeather() {
    if (!city.trim()) {
      setError("Please enter a city name");
      return;
    }

    setLoading(true);
    setError("");
    setWeather(null);

    try {
      const geoUrl = new URL(
        "https://geocoding-api.open-meteo.com/v1/search"
      );

      geoUrl.searchParams.set("name", city);
      geoUrl.searchParams.set("count", "1");
      geoUrl.searchParams.set("language", "en");
      geoUrl.searchParams.set("format", "json");

      const geoResponse = await fetch(geoUrl);
      const geoData = await geoResponse.json();

      if (!geoData.results?.length) {
        setError("City not found. Try another city.");
        return;
      }

      const location = geoData.results[0];

      const weatherUrl = new URL(
        "https://api.open-meteo.com/v1/forecast"
      );

      weatherUrl.searchParams.set("latitude", location.latitude);
      weatherUrl.searchParams.set("longitude", location.longitude);

      weatherUrl.searchParams.set(
        "current",
        "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m"
      );

      weatherUrl.searchParams.set(
        "daily",
        "weather_code,temperature_2m_max,temperature_2m_min"
      );

      weatherUrl.searchParams.set("timezone", "auto");
      weatherUrl.searchParams.set("temperature_unit", "celsius");
      weatherUrl.searchParams.set("wind_speed_unit", "kmh");

      const response = await fetch(weatherUrl);
      const data = await response.json();

      setWeather({
        city: location.name,
        country: location.country,
        temperature: data.current.temperature_2m,
        humidity: data.current.relative_humidity_2m,
        feelsLike: data.current.apparent_temperature,
        wind: data.current.wind_speed_10m,
        description: getWeatherDescription(
          data.current.weather_code
        ),
        forecast: data.daily,
      });
    } catch (err) {
      console.error(err);
      setError("Unable to fetch weather. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function getCurrentLocation() {
    setError("");
    setWeather(null);

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          console.log("Latitude:", latitude);
          console.log("Longitude:", longitude);

          // Reverse geocoding
          const locationResponse = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );

          if (!locationResponse.ok) {
            throw new Error("City detection failed");
          }

          const locationData = await locationResponse.json();

          const detectedCity =
            locationData.city ||
            locationData.locality ||
            locationData.principalSubdivision ||
            "Current Location";

          const detectedCountry =
            locationData.countryName || "";

          console.log("Detected city:", detectedCity);

          // Weather
          const weatherUrl = new URL(
            "https://api.open-meteo.com/v1/forecast"
          );

          weatherUrl.searchParams.set("latitude", latitude);
          weatherUrl.searchParams.set("longitude", longitude);

          weatherUrl.searchParams.set(
            "current",
            "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m"
          );

          weatherUrl.searchParams.set(
            "daily",
            "weather_code,temperature_2m_max,temperature_2m_min"
          );

          weatherUrl.searchParams.set("timezone", "auto");
          weatherUrl.searchParams.set("temperature_unit", "celsius");
          weatherUrl.searchParams.set("wind_speed_unit", "kmh");

          const weatherResponse = await fetch(weatherUrl);

          if (!weatherResponse.ok) {
            throw new Error("Weather request failed");
          }

          const data = await weatherResponse.json();

          setWeather({
            city: detectedCity,
            country: detectedCountry,
            temperature: data.current.temperature_2m,
            humidity: data.current.relative_humidity_2m,
            feelsLike: data.current.apparent_temperature,
            wind: data.current.wind_speed_10m,
            description: getWeatherDescription(
              data.current.weather_code
            ),
            forecast: data.daily,
          });

          setCity(detectedCity);
        } catch (err) {
          console.error(err);
          setError(
            "Location detected, but city name could not be found."
          );
        } finally {
          setLoading(false);
        }
      },

      (geoError) => {
        console.error("Geolocation error:", geoError);

        setLoading(false);

        if (geoError.code === 1) {
          setError(
            "Location permission denied. Please allow location access for this website."
          );
        } else if (geoError.code === 2) {
          setError(
            "Location unavailable. Turn ON your phone GPS/location and try again."
          );
        } else if (geoError.code === 3) {
          setError(
            "Location request timed out. Please try again."
          );
        } else {
          setError(
            "Unable to detect your location."
          );
        }
      },

      {
        enableHighAccuracy: false,
        timeout: 20000,
        maximumAge: 60000,
      }
    );
  }

  return (
    <div className={"app " + (darkMode ? "dark" : "light")}>
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

        {error && (
          <p className="error">
            {error}
          </p>
        )}

        {weather && (
          <div className="weather-info">

            <h2>
              📍 {weather.city}
              {weather.country && `, ${weather.country}`}
            </h2>

            <div className="temperature">
              {Math.round(weather.temperature)}°C
            </div>

            <p>
              {weather.description}
            </p>

            <div className="details">

              <div>
                <span>💧</span>
                <p>Humidity</p>
                <strong>
                  {weather.humidity}%
                </strong>
              </div>

              <div>
                <span>💨</span>
                <p>Wind</p>
                <strong>
                  {weather.wind} km/h
                </strong>
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

                {weather.forecast.time.map(
                  (date, index) => (

                    <div
                      className="forecast-day"
                      key={date}
                    >

                      <p>
                        {getDayName(date)}
                      </p>

                      <span>
                        {getWeatherDescription(
                          weather.forecast.weather_code[index]
                        )}
                      </span>

                      <strong>
                        {Math.round(
                          weather.forecast
                            .temperature_2m_max[index]
                        )}
                        ° /
                        {Math.round(
                          weather.forecast
                            .temperature_2m_min[index]
                        )}
                        °
                      </strong>

                    </div>

                  )
                )}

              </div>

            </div>

          </div>
        )}

      
  
  </div>

      <div className="made-by">
        Made by <strong>Abhishek Rawat</strong>
      </div>
    </div>
  );
}

export default App;
  
  
