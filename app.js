const $ = (id) => document.getElementById(id);
const state = { unit: "C", latitude: 28.6139, longitude: 77.2090, city: "Delhi", country: "India", forecast: null, current: null };

const weatherInfo = (code) => {
  if (code === 0) return ["Clear sky", "☀", "A clear sky is calling. Sunglasses and a little sunshine break sound like a great plan."];
  if ([1, 2].includes(code)) return ["Mostly clear", "🌤", "A mix of sunshine and clouds. A light layer should keep you comfortable as the day changes."];
  if (code === 3) return ["Overcast", "☁", "The sky is keeping things mellow. Great weather for a cozy café, a walk, or a focused work session."];
  if ([45, 48].includes(code)) return ["Foggy", "🌫", "Visibility may be reduced. Take extra care on the road and give yourself a little more travel time."];
  if ([51, 53, 55, 56, 57].includes(code)) return ["Drizzle", "🌦", "A light rain layer could come in handy. Keep an umbrella nearby just in case."];
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return ["Rainy", "🌧", "Rain is in the picture. Carry an umbrella and choose shoes that can handle wet sidewalks."];
  if ([71, 73, 75, 77, 85, 86].includes(code)) return ["Snowy", "❄", "Bundle up in warm layers and watch for slippery surfaces if you're heading outside."];
  if ([95, 96, 99].includes(code)) return ["Thunderstorm", "⛈", "Stormy conditions are possible. If thunder starts, head indoors and avoid open areas."];
  return ["Changeable", "🌥", "Weather can shift through the day. Check back before making outdoor plans."];
};
const displayTemp = (c) => state.unit === "C" ? Math.round(c) : Math.round(c * 9 / 5 + 32);
const temp = (c) => `${displayTemp(c)}°`;
const dayName = (date, options = { weekday: "short" }) => new Date(`${date}T12:00:00`).toLocaleDateString(undefined, options);
const timeLabel = (dateString) => new Date(dateString).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
const currentHourLabel = (dateString) => new Date(dateString).toLocaleTimeString([], { hour: "numeric" });
const kmh = (value) => Math.round(value);
const safe = (n, fallback = "--") => Number.isFinite(n) ? n : fallback;

function setLoading(isLoading) {
  $("loadingState").classList.toggle("show", isLoading);
  $("searchBtn").disabled = isLoading;
  $("searchBtn").style.opacity = isLoading ? ".6" : "1";
}
function showError(message) {
  $("errorBanner").textContent = message;
  $("errorBanner").classList.add("show");
}
function clearError() { $("errorBanner").classList.remove("show"); }

async function findCity(query) {
  const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`);
  if (!response.ok) throw new Error("City search is temporarily unavailable. Please try again.");
  const data = await response.json();
  if (!data.results?.length) throw new Error(`We couldn't find “${query}”. Try another city name.`);
  return data.results[0];
}
async function fetchWeather(latitude, longitude) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude, longitude, timezone: "auto", forecast_days: "5",
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m",
    hourly: "temperature_2m,precipitation_probability,weather_code,visibility,uv_index",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max"
  }).toString();
  const response = await fetch(url);
  if (!response.ok) throw new Error("Weather data couldn't be loaded. Check your connection and try again.");
  return response.json();
}
async function loadPlace(place) {
  clearError(); setLoading(true);
  try {
    const weather = await fetchWeather(place.latitude, place.longitude);
    state.latitude = place.latitude; state.longitude = place.longitude;
    state.city = place.name || place.city || "Your location";
    state.country = place.country || "";
    state.current = weather.current; state.forecast = weather;
    renderWeather(weather);
    $("cityName").textContent = [state.city, state.country].filter(Boolean).join(", ");
    const tip = weatherInfo(weather.current.weather_code)[2];
    $("weatherTip").textContent = tip.length > 66 ? tip.slice(0, 63) + "…" : tip;
  } catch (error) {
    showError(error.message || "Something went wrong. Please try again.");
  } finally { setLoading(false); }
}
function renderWeather(data) {
  const c = data.current, d = data.daily, h = data.hourly;
  const info = weatherInfo(c.weather_code);
  $("todayLabel").textContent = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }).toUpperCase();
  $("currentDate").textContent = `Today · ${new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
  $("mainGlyph").textContent = info[1];
  $("temperature").innerHTML = `${displayTemp(c.temperature_2m)}<span>°${state.unit}</span>`;
  $("condition").textContent = info[0];
  $("feelsLike").textContent = `Feels like ${temp(c.apparent_temperature)}`;
  $("highTemp").textContent = temp(d.temperature_2m_max[0]);
  $("lowTemp").textContent = temp(d.temperature_2m_min[0]);
  $("humidity").innerHTML = `${safe(c.relative_humidity_2m)}<small>%</small>`;
  $("humidityBar").style.width = `${Math.max(0, Math.min(100, c.relative_humidity_2m))}%`;
  $("humidityNote").textContent = c.relative_humidity_2m > 70 ? "Feels humid outside" : c.relative_humidity_2m < 35 ? "Air is on the dry side" : "Comfortable moisture level";
  $("wind").innerHTML = `${safe(kmh(c.wind_speed_10m))}<small> km/h</small>`;
  $("windNeedle").style.transform = `rotate(${c.wind_direction_10m}deg)`;
  $("windNote").textContent = c.wind_speed_10m > 30 ? "Quite breezy — secure loose items" : c.wind_speed_10m < 10 ? "A gentle breeze" : "Noticeable breeze";
  const uv = d.uv_index_max[0] ?? 0;
  $("uv").innerHTML = `${safe(Math.round(uv))}<small>/ 11</small>`;
  $("uvNote").textContent = uv < 3 ? "Low · usual protection" : uv < 6 ? "Moderate · consider SPF" : uv < 8 ? "High · use sun protection" : "Very high · limit midday sun";
  const hourIndex = Math.max(0, h.time.findIndex(t => t >= c.time));
  const vis = h.visibility?.[hourIndex];
  $("visibility").innerHTML = `${safe(vis == null ? NaN : Math.round(vis / 1000))}<small> km</small>`;
  $("sunrise").textContent = timeLabel(d.sunrise[0]);
  $("sunset").textContent = timeLabel(d.sunset[0]);
  const sunrise = new Date(d.sunrise[0]), sunset = new Date(d.sunset[0]);
  const mins = Math.max(0, Math.round((sunset - sunrise) / 60000));
  $("daylightLength").textContent = `${Math.floor(mins/60)}h ${mins%60}m of daylight`;
  renderForecast(data); renderHourly(data, hourIndex);
  $("insightText").textContent = info[2];
  $("insightTag").textContent = `FOR ${state.city.toUpperCase()}`;
}
function renderForecast(data) {
  const d = data.daily;
  $("forecastList").innerHTML = d.time.map((date, i) => {
    const info = weatherInfo(d.weather_code[i]);
    const label = i === 0 ? "Today" : dayName(date);
    const rain = d.precipitation_probability_max?.[i];
    return `<div class="forecast-day ${i === 0 ? "today" : ""}"><div class="day-name">${label}</div><div class="day-icon">${info[1]}</div><div class="day-condition" title="${info[0]}">${info[0]}</div><div class="day-temps"><span>${temp(d.temperature_2m_max[i])}</span><span>${temp(d.temperature_2m_min[i])}</span></div><div class="rain-chance">💧 ${rain ?? 0}%</div></div>`;
  }).join("");
}
function renderHourly(data, currentIndex) {
  const h = data.hourly;
  const indices = [];
  for (let i = currentIndex; i < Math.min(currentIndex + 8, h.time.length); i++) indices.push(i);
  $("hourlyList").innerHTML = indices.map((i, n) => {
    const info = weatherInfo(h.weather_code[i]);
    const label = n === 0 ? "Now" : currentHourLabel(h.time[i]);
    return `<div class="hour-item"><div class="hour-time">${label}</div><div class="hour-icon">${info[1]}</div><div class="hour-temp">${temp(h.temperature_2m[i])}</div></div>`;
  }).join("");
}
async function searchCity(query) {
  const value = (query || $("cityInput").value).trim();
  if (!value) { showError("Enter a city name first."); return; }
  try {
    clearError(); setLoading(true);
    const place = await findCity(value);
    $("cityInput").value = "";
    await loadPlace(place);
  } catch (error) { showError(error.message || "Couldn't search for that city."); setLoading(false); }
}
$("searchBtn").addEventListener("click", () => searchCity());
$("cityInput").addEventListener("keydown", e => { if (e.key === "Enter") searchCity(); });
document.querySelectorAll(".city-chip").forEach(btn => btn.addEventListener("click", () => searchCity(btn.dataset.city)));
$("unitToggle").addEventListener("click", () => {
  state.unit = state.unit === "C" ? "F" : "C";
  $("unitToggle").textContent = `°${state.unit}`;
  if (state.forecast) renderWeather(state.forecast);
});
$("locateBtn").addEventListener("click", () => {
  if (!navigator.geolocation) { showError("Location isn't supported by this browser. Search for your city instead."); return; }
  clearError(); setLoading(true);
  navigator.geolocation.getCurrentPosition(async pos => {
    try {
      const { latitude, longitude } = pos.coords;
      const response = await fetch(`https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&language=en&format=json`);
      const result = response.ok ? await response.json() : {};
      const place = result.results?.[0] || { latitude, longitude, name: "Your location", country: "" };
      place.latitude = latitude; place.longitude = longitude;
      await loadPlace(place);
    } catch { await loadPlace({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, name: "Your location", country: "" }); }
  }, () => { setLoading(false); showError("Location permission was unavailable. You can search for a city instead."); }, { timeout: 10000 });
});
$("forecastNav").addEventListener("click", () => $("forecastSection").scrollIntoView({ behavior: "smooth", block: "start" }));
$("savedNav").addEventListener("click", () => {
  const existing = document.querySelector(".saved-popover");
  if (existing) { existing.remove(); return; }
  const pop = document.createElement("div");
  pop.className = "saved-popover";
  pop.innerHTML = `<strong>Quick places</strong><p>Jump to a city you love.</p><div>${["Delhi","London","Tokyo","New York","Sydney"].map(city => `<button data-city="${city}">${city} <span>↗</span></button>`).join("")}</div>`;
  Object.assign(pop.style, { position:"fixed", zIndex:20, left:"76px", top:"190px", width:"190px", padding:"16px", background:"#17223e", border:"1px solid rgba(178,199,255,.18)", borderRadius:"14px", boxShadow:"0 18px 45px #0007", color:"#f3f6ff", fontSize:"12px" });
  pop.querySelector("p").style.cssText = "color:#8795b8;font-size:10px;margin:7px 0 12px";
  pop.querySelectorAll("button").forEach(b => { b.style.cssText = "display:flex;justify-content:space-between;width:100%;padding:9px 6px;border:0;border-top:1px solid #ffffff12;background:transparent;color:#c6d2ef;text-align:left;cursor:pointer;font:12px 'DM Sans',sans-serif"; b.addEventListener("click", () => { pop.remove(); searchCity(b.dataset.city); }); });
  document.body.appendChild(pop);
});
loadPlace({ latitude: state.latitude, longitude: state.longitude, name: state.city, country: state.country });
