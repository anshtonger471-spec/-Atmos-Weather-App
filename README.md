# Atmos — Weather, reimagined 🌦️

A responsive, portfolio-ready weather dashboard built with **HTML, CSS, and vanilla JavaScript**.

## Features
- Live current weather from Open-Meteo
- Search cities worldwide
- Optional current-location weather (browser permission required)
- Celsius/Fahrenheit toggle
- Five-day forecast with daily high/low and precipitation chance
- Eight-hour forecast
- Humidity, wind, UV index, visibility, sunrise and sunset
- Weather-aware tips and responsive desktop/mobile layout
- No API key required

## Run locally
1. Download or clone the project.
2. Open the folder in VS Code.
3. Open `index.html` with Live Server (recommended), or open it directly in a browser.
4. Ensure you have an internet connection for live weather data.

## Deploy with GitHub Pages
1. Push these files to a GitHub repository.
2. Open **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select branch `main` and folder `/ (root)`, then save.
5. Wait for the deployment to finish.

## Data source
Weather and forecast data are provided by [Open-Meteo](https://open-meteo.com/). City lookup uses the Open-Meteo Geocoding API. No API key is required for this demo.

## Project structure
```text
AtmosWeather/
├── index.html
├── style.css
├── app.js
└── README.md
```

## Customize
- Edit CSS variables at the top of `style.css` to change the theme.
- Update the default coordinates in `app.js` to change the initial city.
- Add features such as saved locations in local storage, severe-weather alerts, or a map view as future enhancements.
