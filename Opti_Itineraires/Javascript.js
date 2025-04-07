// Fonction pour grouper les points les plus proches + mettre au bon format
function groupPoints(...lists) {
    const grouped = new Map();
    function getGridKey(lon, lat) {
        const latRad = (Math.PI / 180) * lat;
        const meterPerDegLat = (Math.PI * EARTH_RADIUS) / 180;
        const meterPerDegLon = meterPerDegLat * Math.cos(latRad);
        const x = Math.floor(lon * meterPerDegLon / GRID_SIZE);
        const y = Math.floor(lat * meterPerDegLat / GRID_SIZE);
        return `${x},${y}`;
    }
    lists.flat().forEach(([lon, lat, density]) => {
        const key = getGridKey(lon, lat);
        grouped.has(key) ? grouped.get(key).density += density : grouped.set(key, { lon, lat, density });
    });
    return Array.from(grouped.values());
}

// Formule Haversine pour avoir une idée de la distance
function calculateDistance(lat1, lon1, lat2, lon2) {
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Fonction pour calculer la distance d'un point à la ligne (user → destination) pour ne pas faire de trop grands détours
function calculatePerpendicularDistance(start, end, point) {
    let x0 = point.lon, y0 = point.lat;
    let x1 = start.lon, y1 = start.lat;
    let x2 = end.lon, y2 = end.lat;
    
    let numerator = Math.abs((y2 - y1) * x0 - (x2 - x1) * y0 + x2 * y1 - y2 * x1);
    let denominator = Math.sqrt((y2 - y1) ** 2 + (x2 - x1) ** 2);

    return (numerator / denominator) * 111; // Convert degrees to km
}

//Trouve d'autres points d'intérêt qui sont plus ou moins sur le passage
function findPointsOfInterest(points, userPosition, finishPoint) {
    const maxDistanceFromRoute = 0.3; // Distance maximale (en km) pour laquelle on peut s'éloigner du chemin
    const maxPOIs = 3; // Limite le nombre de POIs ajoutés
    // Pour l'instant ce nombre est à trois à cause de la limitation de l'accès gratuit à l'API GraphHopper
    
    // Filtre les points trop loins
    let pois = points.filter(point => {
        let distToRoute = calculatePerpendicularDistance(userPosition, finishPoint, point);
        return distToRoute <= maxDistanceFromRoute;
    }).slice(0, maxPOIs);
    
    // Tri des points, du plus proche de l'utilisateur, au plus éloigné
    pois.sort((a, b) => {
        const distanceA = calculateDistance(userLat, userLon, a.lat, a.lon);
        const distanceB = calculateDistance(userLat, userLon, b.lat, b.lon);
        return distanceA - distanceB;
    });
    
    return pois;
}


// Appel de GraphHopper API pour trouver la route
function calculateRoute() {
    let selectedPoint = document.querySelector('input[name="destination"]:checked');
    if (!selectedPoint) return;

    let [selectedLon, selectedLat] = selectedPoint.value.split(",").map(Number);
    let destination = points.find(p => p.lon === selectedLon && p.lat === selectedLat);
    if (!destination) return;

    const apiKey = "e3fc25cf-84c1-4044-9861-2aa1edd284a5"; //Clé gratuite donc pas trop grave de la mettre comme ça
    //Cependant, très mauvaise pratique, il faut éviter de la "hardcoder" dans le script
    const POIs = findPointsOfInterest(points, { lon: userLon, lat: userLat }, { lon: selectedLon, lat: selectedLat });

    //Construction de l'URL
    let url = `https://graphhopper.com/api/1/route?point=${userLat},${userLon}`;
    POIs.forEach(poi => {
        url += `&point=${poi.lat},${poi.lon}`;
    });
    url += `&point=${destination.lat},${destination.lon}&vehicle=bike&locale=fr&encoded=true&key=${apiKey}`;
  

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.paths?.length > 0) {
                if (routeLayer) map.removeLayer(routeLayer);

                //Décodage des données reçues
                const encodedPolyline = data.paths[0].points;
                const decodedRoute = polyline.decode(encodedPolyline);  //Utilise la librairie polyline
                const latLngs = decodedRoute.map(point => [point[0], point[1]]);
                routeLayer = L.polyline(latLngs, { color: 'blue', weight: 5 }).addTo(map);

                //affichage de la route
                map.fitBounds(routeLayer.getBounds());

                document.getElementById("tripTimeDisplay").innerText = `Temps estimé : ${(data.paths[0].time / 60000).toFixed(0)} min`;
            } else {
                alert("Impossible de calculer le trajet.");
            }
        })
        .catch(error => {
            console.error("GraphHopper API Error:", error);
            alert("Erreur lors de la récupération du trajet.");
        }); 
}

// Event Listeners
document.getElementById("confirmButton")?.addEventListener("click", () => {
    // Cache la sidebar
    document.getElementById("sidebar")?.classList.add("hidden");

    //Enlève les popups
    markersLayer.clearLayers();

    // Lance le calcul de la route
    calculateRoute();
});

//Si jamais l'utilisateur veut changer de trajet
document.getElementById("tripTimeDisplay")?.addEventListener("click", () => {
    document.getElementById("sidebar")?.classList.remove("hidden");
});

// Pour se focus sur le point sélectionné
document.querySelectorAll('input[name="destination"]').forEach(radio => {
    radio.addEventListener("change", (e) => {
        const selectedPoint = e.target;
        if (selectedPoint.checked) {
            const [lon, lat] = selectedPoint.value.split(",").map(Number);
            map.setView([lat, lon], 15);
        }
    });
});

//Mainscript

// 1eres constantes
const GRID_SIZE = 100;
const EARTH_RADIUS = 6371000;
const R = 6371;
let userLat, userLon, routeLayer;

// Datasets autour de Cachan (~3km radius)
const dataset1 = [
    [2.3260, 48.8050, 12], [2.3255, 48.8045, 15], [2.3250, 48.8040, 18], // Near Parc de Sceaux
    [2.3245, 48.8035, 14], [2.3240, 48.8030, 16], [2.3235, 48.8025, 20],
    [2.3230, 48.8020, 22], [2.3225, 48.8015, 19], [2.3220, 48.8010, 17],
    [2.3215, 48.8005, 15], [2.3210, 48.8000, 13], // Arcueil centre
    [2.3400, 48.7960, 25], [2.3395, 48.7955, 23], [2.3390, 48.7950, 21], // Near Laplace RER
    [2.3385, 48.7945, 20], [2.3380, 48.7940, 18], [2.3375, 48.7935, 16],
    [2.3370, 48.7930, 14], [2.3365, 48.7925, 12], [2.3360, 48.7920, 10],
    [2.3355, 48.7915, 15], [2.3350, 48.7910, 17], // Gentilly border
    [2.3345, 48.7905, 19], [2.3340, 48.7900, 21], [2.3335, 48.7895, 23],
    [2.3330, 48.7890, 25], [2.3325, 48.7885, 22], [2.3320, 48.7880, 20],
    [2.3315, 48.7875, 18], [2.3310, 48.7870, 16], // Towards Kremlin-Bicêtre
    [2.3305, 48.7865, 14], [2.3300, 48.7860, 12], [2.3295, 48.7855, 15],
    [2.3290, 48.7850, 17], [2.3285, 48.7845, 19], [2.3280, 48.7840, 21],
    [2.3275, 48.7835, 23], [2.3270, 48.7830, 25], [2.3265, 48.7825, 22],
    [2.3260, 48.7820, 20], [2.3255, 48.7815, 18], // Near Porte d'Italie
    [2.3250, 48.7810, 16], [2.3245, 48.7805, 14], [2.3240, 48.7800, 12],
    [2.3235, 48.7795, 15], [2.3230, 48.7790, 17], [2.3225, 48.7785, 19],
    [2.3220, 48.7780, 21], [2.3215, 48.7775, 23], [2.3210, 48.7770, 25]
];
const dataset2 = [
    [2.3150, 48.7900, 24], [2.3145, 48.7895, 22], [2.3140, 48.7890, 20], // Bagneux centre
    [2.3135, 48.7885, 18], [2.3130, 48.7880, 16], [2.3125, 48.7875, 14],
    [2.3120, 48.7870, 12], [2.3115, 48.7865, 15], [2.3110, 48.7860, 17],
    [2.3105, 48.7855, 19], [2.3100, 48.7850, 21], // Near Métro Bagneux
    [2.3095, 48.7845, 23], [2.3090, 48.7840, 25], [2.3085, 48.7835, 22],
    [2.3080, 48.7830, 20], [2.3075, 48.7825, 18], [2.3070, 48.7820, 16],
    [2.3065, 48.7815, 14], [2.3060, 48.7810, 12], [2.3055, 48.7805, 15],
    [2.3050, 48.7800, 17], // Towards Châtillon
    [2.3045, 48.7795, 19], [2.3040, 48.7790, 21], [2.3035, 48.7785, 23],
    [2.3030, 48.7780, 25], [2.3025, 48.7775, 22], [2.3020, 48.7770, 20],
    [2.3015, 48.7765, 18], [2.3010, 48.7760, 16], // Montrouge border
    [2.3005, 48.7755, 14], [2.3000, 48.7750, 12], [2.2995, 48.7745, 15],
    [2.2990, 48.7740, 17], [2.2985, 48.7735, 19], [2.2980, 48.7730, 21],
    [2.2975, 48.7725, 23], [2.2970, 48.7720, 25], [2.2965, 48.7715, 22],
    [2.2960, 48.7710, 20], [2.2955, 48.7705, 18], // Near Porte d'Orléans
    [2.2950, 48.7700, 16], [2.2945, 48.7695, 14], [2.2940, 48.7690, 12],
    [2.2935, 48.7685, 15], [2.2930, 48.7680, 17], [2.2925, 48.7675, 19],
    [2.2920, 48.7670, 21], [2.2915, 48.7665, 23], [2.2910, 48.7660, 25]
];

const groupedPoints = groupPoints(dataset1, dataset2); //La fonction peut prendre autant de liste que nécessaire
const points = groupedPoints.sort((a, b) => b.density - a.density)

// Initialize Map
let map = L.map('map').setView([48.8566, 2.3522], 12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Groupe pour tous les popups
const markersLayer = L.layerGroup().addTo(map);

// Geolocation
navigator.geolocation.getCurrentPosition(position => {
    userLat = position.coords.latitude;
    userLon = position.coords.longitude;
    L.marker([userLat, userLon]).addTo(markersLayer).bindPopup("Votre Postion");
    map.setView([userLat, userLon], 15);

    // Ajout des autres popups et update des distances dans la sidebar
    document.querySelectorAll('input[name="destination"]').forEach((radio, index) => {
        if (points[index]) {
            L.marker([points[index].lat, points[index].lon]).addTo(markersLayer).bindPopup(radio.value)

            radio.value = `${points[index].lon},${points[index].lat}`;
            let distanceSpan = document.querySelectorAll('.distance')[index];
            distanceSpan.textContent = `${calculateDistance(userLat, userLon, points[index].lat, points[index].lon).toFixed(1)} km`;
        }
    });
}, error => {
    alert("Veuillez autoriser la géolocalisation pour utiliser cette application.");
});
