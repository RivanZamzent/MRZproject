import * as THREE from "https://esm.sh/three";
import { OrbitControls } from "https://esm.sh/three/examples/jsm/controls/OrbitControls.js";

const dateTimeEl = document.getElementById('dateTime');

function updateDateTime() {
    const now = new Date();
    const optionsDate = { weekday: 'long' };
    const optionsTime = { hour: '2-digit', minute: '2-digit', hour12: false };
    if (dateTimeEl) {
        dateTimeEl.textContent = `${now.toLocaleDateString(undefined, optionsDate)}, ${now.toLocaleTimeString([], optionsTime)}`;
    }
}
updateDateTime();
setInterval(updateDateTime, 60000);

const container = document.getElementById('cloud-container');

if (container) {
    const containerRect = container.getBoundingClientRect();
    const scene = new THREE.Scene();
    const cameraAspect = (containerRect.width > 0 && containerRect.height > 0) ? containerRect.width / containerRect.height : 1;
    const camera = new THREE.PerspectiveCamera(60, cameraAspect, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    renderer.setSize(containerRect.width, containerRect.height);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    camera.position.set(0, 0.5, 4.5);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
    directionalLight.position.set(2, 3, 2);
    scene.add(directionalLight);
    const pointLight = new THREE.PointLight(0xaabbee, 0.8, 15);
    pointLight.position.set(-1, 1, 3);
    scene.add(pointLight);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.rotateSpeed = 0.8;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.minPolarAngle = Math.PI / 3;
    controls.maxPolarAngle = Math.PI / 1.8;
    controls.target.set(0, 0, 0);

    const cloudGroup = new THREE.Group();
    scene.add(cloudGroup);

    const cloudMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xf0f8ff,
        transparent: true, opacity: 0.85, roughness: 0.6, metalness: 0.0,
        transmission: 0.1,
        ior: 1.3,
        specularIntensity: 0.2,
        sheen: 0.2, sheenColor: 0xffffff, sheenRoughness: 0.5,
        clearcoat: 0.05, clearcoatRoughness: 0.3,
    });

    function createCloudPart(radius, position) {
        const geometry = new THREE.SphereGeometry(radius, 20, 20);
        const mesh = new THREE.Mesh(geometry, cloudMaterial);
        mesh.position.copy(position);
        return mesh;
    }

    function createDetailedCloud(x, y, z, scale) {
        const singleCloudGroup = new THREE.Group();
        singleCloudGroup.position.set(x, y, z);
        singleCloudGroup.scale.set(scale, scale, scale);
        const parts = [
            { radius: 0.8, position: new THREE.Vector3(0, 0, 0) }, { radius: 0.6, position: new THREE.Vector3(0.7, 0.2, 0.1) },
            { radius: 0.55, position: new THREE.Vector3(-0.6, 0.1, -0.2) }, { radius: 0.7, position: new THREE.Vector3(0.1, 0.4, -0.3) },
            { radius: 0.5, position: new THREE.Vector3(0.3, -0.3, 0.2) }, { radius: 0.6, position: new THREE.Vector3(-0.4, -0.2, 0.3) },
            { radius: 0.45, position: new THREE.Vector3(0.8, -0.1, -0.2) }, { radius: 0.5, position: new THREE.Vector3(-0.7, 0.3, 0.3) },
        ];
        parts.forEach(part => singleCloudGroup.add(createCloudPart(part.radius, part.position)));
        singleCloudGroup.userData = {
            isRaining: false, rainColor: Math.random() > 0.5 ? 0x87CEFA : 0xB0E0E6,
            originalPosition: singleCloudGroup.position.clone(), bobOffset: Math.random() * Math.PI * 2,
            bobSpeed: 0.0005 + Math.random() * 0.0003, bobAmount: 0.15 + Math.random() * 0.1,
        };
        return singleCloudGroup;
    }

    const cloud1 = createDetailedCloud(-0.7, 0.2, 0, 1.0);
    const cloud2 = createDetailedCloud(0.7, -0.1, 0.3, 0.9);
    cloudGroup.add(cloud1, cloud2);
    cloudGroup.position.y = -0.2;
    let autoRotateSpeed = 0.002;

    const lightningLight = new THREE.PointLight(0xffffff, 0, 50);
    lightningLight.position.set(0, 0, 0);
    cloudGroup.add(lightningLight);
    let isThunderstorm = false;

    function createWeatherParticles(cloud, type) {
        const group = new THREE.Group();
        cloud.add(group);

        let color = type === 'snow' ? 0xffffff : cloud.userData.rainColor;
        let opacity = type === 'snow' ? 0.9 : 0.7;
        const material = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: opacity });

        const particles = [];
        for (let i = 0; i < 30; i++) {
            let geom = type === 'snow' ? new THREE.SphereGeometry(0.02, 4, 4) : new THREE.CylinderGeometry(0.015, 0.015, 0.25, 6);
            const mesh = new THREE.Mesh(geom, material);
            mesh.position.set((Math.random() - 0.5) * 1.8, -0.8 - Math.random() * 1.5, (Math.random() - 0.5) * 1.8);
            mesh.userData = {
                originalY: mesh.position.y - Math.random() * 0.5,
                speed: type === 'snow' ? 0.02 + Math.random() * 0.02 : 0.08 + Math.random() * 0.05,
                wobble: type === 'snow' ? Math.random() * Math.PI * 2 : 0
            };
            particles.push(mesh);
            group.add(mesh);
        }
        group.visible = false;
        return { group, particles, type };
    }

    cloud1.userData.rainSystem = createWeatherParticles(cloud1, 'rain');
    cloud1.userData.snowSystem = createWeatherParticles(cloud1, 'snow');
    cloud2.userData.rainSystem = createWeatherParticles(cloud2, 'rain');
    cloud2.userData.snowSystem = createWeatherParticles(cloud2, 'snow');

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    window.setEnvironment = function (timeOfDay, aqi) {
        if (timeOfDay === 'day') {
            ambientLight.color.setHex(0xffffff);
            ambientLight.intensity = 1.2;
            directionalLight.color.setHex(0xffffff);
            directionalLight.intensity = 2.0;
        } else if (timeOfDay === 'sunset') {
            ambientLight.color.setHex(0xffccaa);
            ambientLight.intensity = 1.0;
            directionalLight.color.setHex(0xff6622);
            directionalLight.intensity = 2.5;
        } else {
            ambientLight.color.setHex(0x5555aa);
            ambientLight.intensity = 0.6;
            directionalLight.color.setHex(0x333388);
            directionalLight.intensity = 0.8;
        }

        if (aqi > 100) {
            scene.fog = new THREE.FogExp2(0x888877, 0.15);
        } else {
            scene.fog = null;
        }
    };

    window.setWeatherEffect = function (conditionCode) {
        let isRaining = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(conditionCode);
        let isSnowing = [71, 73, 75, 77, 85, 86].includes(conditionCode);
        isThunderstorm = [95, 96, 99].includes(conditionCode);

        if (isThunderstorm) isRaining = true;

        [cloud1, cloud2].forEach(cloud => {
            if (cloud) {
                cloud.userData.rainSystem.group.visible = isRaining;
                cloud.userData.snowSystem.group.visible = isSnowing;
                cloud.userData.isRaining = isRaining || isSnowing;
            }
        });
        if (!isThunderstorm) lightningLight.intensity = 0;
    };

    renderer.domElement.addEventListener('click', (event) => {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(cloudGroup.children, true);

        if (intersects.length > 0) {
            let clickedObj = intersects[0].object;
            let physicallyClickedCloud = null;
            while (clickedObj.parent && clickedObj.parent !== cloudGroup) {
                clickedObj = clickedObj.parent;
            }

            if (clickedObj.parent === cloudGroup) {
                physicallyClickedCloud = clickedObj;

                let currentEffect = cloud1.userData.isRaining ? 0 : 61; // 0 = clear, 61 = rain
                if (window.setWeatherEffect) window.setWeatherEffect(currentEffect);

                if (physicallyClickedCloud) {
                    const originalScale = physicallyClickedCloud.scale.clone();
                    physicallyClickedCloud.scale.multiplyScalar(1.15);
                    setTimeout(() => {
                        physicallyClickedCloud.scale.copy(originalScale);
                    }, 150);
                }
            }
        }
    });

    const tooltip = document.getElementById('cloud-tooltip');
    setTimeout(() => {
        if (tooltip) tooltip.classList.add('opacity-100');
        setTimeout(() => { if (tooltip) tooltip.classList.remove('opacity-100'); }, 3500);
    }, 1500);

    function animate() {
        requestAnimationFrame(animate);
        const time = Date.now();
        cloudGroup.rotation.y += autoRotateSpeed;

        if (isThunderstorm && Math.random() > 0.98) {
            lightningLight.intensity = 5 + Math.random() * 10;
            setTimeout(() => { lightningLight.intensity = 0; }, 50 + Math.random() * 100);
        }

        [cloud1, cloud2].forEach(cloud => {
            if (cloud) {
                cloud.position.y = cloud.userData.originalPosition.y + Math.sin(time * cloud.userData.bobSpeed + cloud.userData.bobOffset) * cloud.userData.bobAmount;

                [cloud.userData.rainSystem, cloud.userData.snowSystem].forEach(system => {
                    if (system && system.group.visible) {
                        system.particles.forEach(p => {
                            p.position.y -= p.userData.speed;
                            if (system.type === 'snow') {
                                p.userData.wobble += 0.05;
                                p.position.x += Math.sin(p.userData.wobble) * 0.005;
                            }
                            if (p.position.y < -5) {
                                p.position.y = -0.8;
                                p.position.x = (Math.random() - 0.5) * 1.8 * cloud.scale.x;
                                p.position.z = (Math.random() - 0.5) * 1.8 * cloud.scale.z;
                            }
                        });
                    }
                });
            }
        });
        controls.update();
        renderer.render(scene, camera);
    }

    window.addEventListener('resize', () => {
        const newRect = container.getBoundingClientRect();
        if (newRect.width > 0 && newRect.height > 0) {
            camera.aspect = newRect.width / newRect.height;
            camera.updateProjectionMatrix();
            renderer.setSize(newRect.width, newRect.height);
        }
    });

    animate();

} else {
    console.error("Cloud container (id: 'cloud-container') not found! 3D cloud animation will not be initialized.");
}

// --- Weather Data Fetching ---

function getWeatherCondition(code, isDay) {
    const conditions = {
        0: { text: "Clear sky", icon: isDay ? "☀️" : "🌙", rain: false },
        1: { text: "Mainly clear", icon: isDay ? "🌤️" : "☁️", rain: false },
        2: { text: "Partly cloudy", icon: "⛅", rain: false },
        3: { text: "Overcast", icon: "☁️", rain: false },
        45: { text: "Fog", icon: "🌫️", rain: false },
        48: { text: "Depositing rime fog", icon: "🌫️", rain: false },
        51: { text: "Drizzle: Light", icon: "🌦️", rain: true },
        53: { text: "Drizzle: Moderate", icon: "🌦️", rain: true },
        55: { text: "Drizzle: Dense", icon: "🌧️", rain: true },
        56: { text: "Freezing Drizzle: Light", icon: "🌧️❄️", rain: true },
        57: { text: "Freezing Drizzle: Dense", icon: "🌧️❄️", rain: true },
        61: { text: "Rain: Slight", icon: "🌧️", rain: true },
        63: { text: "Rain: Moderate", icon: "🌧️", rain: true },
        65: { text: "Rain: Heavy", icon: "🌧️", rain: true },
        66: { text: "Freezing Rain: Light", icon: "🌧️❄️", rain: true },
        67: { text: "Freezing Rain: Heavy", icon: "🌧️❄️", rain: true },
        71: { text: "Snow: Slight", icon: "🌨️", rain: false },
        73: { text: "Snow: Moderate", icon: "🌨️", rain: false },
        75: { text: "Snow: Heavy", icon: "🌨️", rain: false },
        77: { text: "Snow grains", icon: "🌨️", rain: false },
        80: { text: "Rain showers: Slight", icon: "🌦️", rain: true },
        81: { text: "Rain showers: Moderate", icon: "🌧️", rain: true },
        82: { text: "Rain showers: Violent", icon: "⛈️", rain: true },
        85: { text: "Snow showers slight", icon: "🌨️", rain: false },
        86: { text: "Snow showers heavy", icon: "🌨️", rain: false },
        95: { text: "Thunderstorm", icon: "⛈️", rain: true },
        96: { text: "Thunderstorm with hail", icon: "⛈️", rain: true },
        99: { text: "Thunderstorm with heavy hail", icon: "⛈️", rain: true },
    };
    return conditions[code] || { text: "Unknown", icon: "❓", rain: false };
}

async function fetchLocationName(lat, lon) {
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
        const data = await res.json();
        return data.address.city || data.address.town || data.address.village || data.address.county || "Unknown Location";
    } catch (e) {
        return "Unknown Location";
    }
}

let currentWeatherData = null;
let currentAqiData = null;
let currentLocationName = "";
let currentSelectedDay = 0; // 0 = today, 1 = tomorrow, etc.

function generateSmartTip(weatherCode, windSpeed, aqi, maxTemp) {
    if (aqi > 150) return "😷 Polusi sangat tinggi. Wajib gunakan masker tebal jika keluar.";
    if ([95, 96, 99].includes(weatherCode)) return "⚡ Badai petir mendekat. Cabut barang elektronik dan berlindung.";
    if ([65, 67].includes(weatherCode)) return "🌧️ Hujan sangat lebat. Risiko banjir/genangan tinggi.";
    if (windSpeed > 30) return "🌬️ Angin sangat kencang. Hindari berlindung di bawah pohon tua.";
    if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) return "❄️ Hujan salju. Gunakan jaket tebal dan hati-hati jalan licin.";
    if ([51, 53, 55, 56, 57, 61, 63, 80, 81, 82].includes(weatherCode)) return "☂️ Sedia payung sebelum hujan. Jalanan licin.";
    if (maxTemp > 35) return "🥵 Suhu ekstrem! Perbanyak minum air dan hindari matahari langsung.";
    if (aqi > 100) return "😷 Kualitas udara kurang sehat. Kurangi aktivitas berat di luar ruangan.";
    if ([0, 1].includes(weatherCode) && maxTemp >= 28) return "☀️ Cuaca sangat cerah! Gunakan tabir surya jika beraktivitas di luar.";
    if ([2, 3].includes(weatherCode)) return "☁️ Cuaca berawan teduh. Cocok untuk bersantai atau jalan sore.";
    return "💡 Cuaca normal. Lanjutkan aktivitasmu dengan senyuman!";
}

function renderUIFromState() {
    if (!currentWeatherData) return;

    const data = currentWeatherData;
    const isToday = currentSelectedDay === 0;

    const displayTemp = isToday ? Math.round(data.current.temperature_2m) : Math.round(data.daily.temperature_2m_max[currentSelectedDay]);
    const displayWeatherCode = isToday ? data.current.weather_code : data.daily.weather_code[currentSelectedDay];
    const displayWind = isToday ? data.current.wind_speed_10m : 10;
    const displayPrecip = isToday ? data.current.precipitation : (data.daily.precipitation_sum ? data.daily.precipitation_sum[currentSelectedDay] : 0);

    const isDay = isToday ? data.current.is_day === 1 : true;

    let timeOfDay = 'day';
    if (isToday) {
        timeOfDay = isDay ? 'day' : 'night';
        if (data.daily && data.daily.sunset && isDay) {
            const sunsetTime = new Date(data.daily.sunset[0]).getTime();
            const nowTime = new Date().getTime();
            if (sunsetTime - nowTime > 0 && sunsetTime - nowTime < 60 * 60 * 1000) {
                timeOfDay = 'sunset';
            }
        }
    }

    const widgetCard = document.getElementById('widgetCard');
    if (widgetCard) {
        widgetCard.classList.remove('bg-day', 'bg-night', 'bg-sunset', 'from-purple-700/70', 'via-indigo-800/60', 'to-blue-900/70');
        widgetCard.classList.add(`bg-${timeOfDay}`);
    }

    const condition = getWeatherCondition(displayWeatherCode, isDay);

    document.getElementById('temperature').textContent = `${displayTemp}°C`;
    document.getElementById('location').textContent = currentLocationName + (isToday ? "" : ` (${new Date(data.daily.time[currentSelectedDay]).toLocaleDateString(undefined, { weekday: 'short' })})`);

    const weatherIconEl = document.getElementById('weatherIcon');
    if (weatherIconEl) weatherIconEl.textContent = condition.icon;

    const warningBanner = document.getElementById('warningBanner');
    const warningText = document.getElementById('warningText');
    if (warningBanner && warningText) {
        if (displayWind > 40) {
            warningText.textContent = `High Wind Warning (${displayWind} km/h)!`;
            warningBanner.classList.remove('hidden');
        } else if ([95, 96, 99].includes(displayWeatherCode)) {
            warningText.textContent = "Thunderstorm Warning!";
            warningBanner.classList.remove('hidden');
        } else if ([65, 67].includes(displayWeatherCode)) {
            warningText.textContent = "Heavy Rain Warning!";
            warningBanner.classList.remove('hidden');
        } else {
            warningBanner.classList.add('hidden');
        }
    }

    let aqiValue = 0;
    if (currentAqiData && currentAqiData.current && currentAqiData.current.us_aqi) {
        aqiValue = isToday ? currentAqiData.current.us_aqi : 50;
        const aqiBadge = document.getElementById('aqiBadge');
        if (aqiBadge) {
            aqiBadge.classList.remove('hidden', 'aqi-good', 'aqi-moderate', 'aqi-unhealthy', 'aqi-hazardous');

            let aqiStatus = "Good";
            let aqiClass = "aqi-good";
            if (aqiValue > 50 && aqiValue <= 100) { aqiStatus = "Moderate"; aqiClass = "aqi-moderate"; }
            else if (aqiValue > 100 && aqiValue <= 200) { aqiStatus = "Unhealthy"; aqiClass = "aqi-unhealthy"; }
            else if (aqiValue > 200) { aqiStatus = "Hazardous"; aqiClass = "aqi-hazardous"; }

            aqiBadge.textContent = `AQI: ${aqiValue} (${aqiStatus})`;
            aqiBadge.classList.add(aqiClass);
        }
    }

    const smartTipEl = document.getElementById('smartTip');
    if (smartTipEl) {
        smartTipEl.textContent = "💡 Tip: " + generateSmartTip(displayWeatherCode, displayWind, aqiValue, displayTemp);
    }

    const formatTime = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (data.daily && data.daily.sunrise && data.daily.sunset) {
        document.getElementById('sunriseTime').textContent = formatTime(data.daily.sunrise[currentSelectedDay]);
        document.getElementById('sunsetTime').textContent = formatTime(data.daily.sunset[currentSelectedDay]);

        const sunrise = new Date(data.daily.sunrise[currentSelectedDay]);
        const sunset = new Date(data.daily.sunset[currentSelectedDay]);
        const diffMs = sunset - sunrise;
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        document.getElementById('dayLength').textContent = `${diffHrs} h ${diffMins} m`;
    }

    if (isToday) {
        document.getElementById('humidity').textContent = `Humidity: ${data.current.relative_humidity_2m}%`;
        document.getElementById('windSpeed').textContent = `Wind: ${data.current.wind_speed_10m} km/h`;
    } else {
        document.getElementById('humidity').textContent = `Est. Humidity: 70%`;
        document.getElementById('windSpeed').textContent = `Est. Wind: 10 km/h`;
    }

    const precipEl = document.getElementById('precipitationChance');
    if (precipEl) precipEl.textContent = `Precipitation: ${displayPrecip} mm`;

    const forecastContainer = document.getElementById('forecastContainer');
    if (forecastContainer && data.daily && data.daily.time) {
        forecastContainer.innerHTML = '';

        for (let i = 0; i < 4; i++) {
            const dateStr = data.daily.time[i];
            const dateObj = new Date(dateStr);
            const dayName = i === 0 ? 'Today' : dateObj.toLocaleDateString(undefined, { weekday: 'short' });

            const maxTemp = Math.round(data.daily.temperature_2m_max[i]);
            const minTemp = Math.round(data.daily.temperature_2m_min[i]);
            const dailyCondition = getWeatherCondition(data.daily.weather_code[i], true);

            const delayClass = `delay-${(5 + i) * 100}`;
            const activeClass = i === currentSelectedDay ? 'active-day' : '';

            const html = `
            <div onclick="window.selectForecastDay(${i})" class="forecast-day ${activeClass} bg-white/5 backdrop-blur-sm rounded-xl p-3 w-20 text-center border border-white/10 shadow-sm hover:bg-white/10 transition-all duration-200 cursor-pointer transform hover:-translate-y-1 animate-fadeInUp ${delayClass}">
                <div class="day-name text-xs font-medium mb-1 opacity-80">${dayName}</div>
                <div class="forecast-icon text-2xl my-1 drop-shadow-md">${dailyCondition.icon}</div>
                <div class="high-temp text-sm font-semibold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">${maxTemp}°</div>
                <div class="low-temp text-xs opacity-70">${minTemp}°</div>
            </div>`;
            forecastContainer.innerHTML += html;
        }
    }

    if (window.setWeatherEffect) window.setWeatherEffect(displayWeatherCode);
    if (window.setEnvironment) window.setEnvironment(timeOfDay, aqiValue);
}

window.selectForecastDay = function (index) {
    currentSelectedDay = index;
    renderUIFromState();
};

function updateWeatherUI(data, locationName, aqiData) {
    currentWeatherData = data;
    currentAqiData = aqiData;
    currentLocationName = locationName;
    currentSelectedDay = 0;
    renderUIFromState();
}

async function getWeatherData(lat, lon, customName = null) {
    document.getElementById('location').textContent = "Fetching data...";
    try {
        const locName = customName || await fetchLocationName(lat, lon);

        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,is_day,precipitation,weather_code,wind_speed_10m&daily=sunrise,sunset,weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;
        const weatherRes = await fetch(weatherUrl);
        const data = await weatherRes.json();

        const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi`;
        let aqiData = null;
        try {
            const aqiRes = await fetch(aqiUrl);
            aqiData = await aqiRes.json();
        } catch (e) { console.warn("AQI fetch failed"); }

        updateWeatherUI(data, locName, aqiData);
    } catch (error) {
        console.error("Error fetching weather:", error);
        document.getElementById('location').textContent = "Error loading weather";
    }
}

// Search Feature Logic
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');

async function handleSearch() {
    if (!searchInput || !searchBtn) return;
    const query = searchInput.value.trim();
    if (!query) return;

    searchBtn.textContent = "⏳";
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
        const data = await res.json();

        if (data && data.length > 0) {
            const lat = data[0].lat;
            const lon = data[0].lon;
            const name = data[0].name || query;
            getWeatherData(lat, lon, name);
            searchInput.value = "";
        } else {
            alert("City not found! Please try another name.");
        }
    } catch (e) {
        console.error("Search error", e);
    }
    searchBtn.textContent = "🔍";
}

if (searchBtn) searchBtn.addEventListener('click', handleSearch);
if (searchInput) searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});

function initWeather() {
    function fetchAndSchedule() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    getWeatherData(position.coords.latitude, position.coords.longitude);
                },
                (error) => {
                    console.warn("Geolocation denied or failed. Using default location (Jakarta).");
                    getWeatherData(-6.2088, 106.8456);
                }
            );
        } else {
            getWeatherData(-6.2088, 106.8456);
        }
    }

    fetchAndSchedule();
    setInterval(fetchAndSchedule, 900000);
}

initWeather();