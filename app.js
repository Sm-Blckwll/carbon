$(document).ready(function() {
    $("#startButton").click(function() {
        $("#loading").delay(100).fadeOut("fast");
    });
});

var map = L.map('mapid',{minZoom: 10}).setView([51.008, -4.467], 12);

L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 19,
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
}).addTo(map);

// Initialize the FeatureGroup to store editable layers
var drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

// Initialize the draw control and pass it the FeatureGroup of editable layers
var drawControl = new L.Control.Draw({
    draw: {
        polyline: false,
        circle: false,
        marker: false,
        circlemarker: false,
        rectangle: false,
        polygon: {
            shapeOptions: {
                color: 'white'
            },
        },
    },
});
map.addControl(drawControl);

// Carbon sequestration rates in tons per hectare per year
var sequestrationRates = {
    'forest': 2.5,
    'grassland': 1.0,
    'wetland': 2.0,
    'cropland': 0.5,
    'urban': 0.0,
    'peatland': 3.0
    // Add more as needed
};

var savedPolygons = []; // Array to store saved polygons

map.on(L.Draw.Event.CREATED, function (event) {
    var layer = event.layer;

    // Get the selected habitat types
    var currentHabitatType = document.getElementById('currentHabitatType').value;
    var newHabitatType = document.getElementById('newHabitatType').value;

    // Store the habitat types with the layer
    layer.currentHabitatType = currentHabitatType;
    layer.newHabitatType = newHabitatType;

    // Calculate the area of the polygon in hectares
    var area = turf.area(layer.toGeoJSON()) / 10000;

    // Update the area value in the sidebar
    document.getElementById('areaValue').textContent = area.toFixed(2) + ' ha';

    // Calculate the carbon sequestration for the current and new habitat types
    var currentSequestration = area * sequestrationRates[currentHabitatType];
    var newSequestration = area * sequestrationRates[newHabitatType];

    // Calculate the difference in carbon sequestration
    var sequestrationDifference = newSequestration - currentSequestration;

    // Store the carbon sequestration and difference with the layer
    layer.currentSequestration = currentSequestration;
    layer.newSequestration = newSequestration;
    layer.sequestrationDifference = sequestrationDifference;

    // Update the carbon values in the sidebar
    document.getElementById('currentCarbonValue').textContent = 'Current: ' + currentSequestration.toFixed(2) + ' t';
    document.getElementById('newCarbonValue').textContent = 'New: ' + newSequestration.toFixed(2) + ' t';
    document.getElementById('carbonDifference').textContent =  sequestrationDifference.toFixed(2) + ' t';

    drawnItems.addLayer(layer);
});


map.on(L.Draw.Event.EDITED, function (event) {
    var layers = event.layers;
    layers.eachLayer(function(layer) {
        // Get the selected habitat types
        var currentHabitatType = document.getElementById('currentHabitatType').value;
        var newHabitatType = document.getElementById('newHabitatType').value;

        // Store the habitat types with the layer
        layer.currentHabitatType = currentHabitatType;
        layer.newHabitatType = newHabitatType;

        // Calculate the area of the polygon in hectares
        var area = turf.area(layer.toGeoJSON()) / 10000;

        // Update the area value in the sidebar
        document.getElementById('areaValue').textContent = area.toFixed(2) + ' hectares';

        // Calculate the carbon sequestration for the current and new habitat types
        var currentSequestration = area * sequestrationRates[currentHabitatType];
        var newSequestration = area * sequestrationRates[newHabitatType];

        // Calculate the difference in carbon sequestration
        var sequestrationDifference = newSequestration - currentSequestration;

        // Store the carbon sequestration and difference with the layer
        layer.currentSequestration = currentSequestration;
        layer.newSequestration = newSequestration;
        layer.sequestrationDifference = sequestrationDifference;

        // Update the carbon values in the sidebar
        document.getElementById('currentCarbonValue').textContent = 'Current: ' + currentSequestration.toFixed(2) + ' t';
        document.getElementById('newCarbonValue').textContent = 'New: ' + newSequestration.toFixed(2) + ' t';
        document.getElementById('carbonDifference').textContent =  sequestrationDifference.toFixed(2) + ' t';
    });
});

// Add event listeners for the 'change' event to both dropdowns
document.getElementById('currentHabitatType').addEventListener('change', updateSequestration);
document.getElementById('newHabitatType').addEventListener('change', updateSequestration);

function updateSequestration() {
    // Update the carbon sequestration for each layer
    drawnItems.eachLayer(function (layer) {
        // Get the selected habitat types
        var currentHabitatType = document.getElementById('currentHabitatType').value;
        var newHabitatType = document.getElementById('newHabitatType').value;

        // Calculate the area of the polygon in hectares
        var area = turf.area(layer.toGeoJSON()) / 10000;

        // Calculate the carbon sequestration for the current and new habitat types
        var currentSequestration = area * sequestrationRates[currentHabitatType];
        var newSequestration = area * sequestrationRates[newHabitatType];

        // Calculate the difference in carbon sequestration
        var sequestrationDifference = newSequestration - currentSequestration;

        // Store the new carbon sequestration and difference with the layer
        layer.currentSequestration = currentSequestration;
        layer.newSequestration = newSequestration;
        layer.sequestrationDifference = sequestrationDifference;

        // Update the carbon values in the sidebar
        document.getElementById('currentCarbonValue').textContent = 'Current: ' + currentSequestration.toFixed(2) + ' t';
        document.getElementById('newCarbonValue').textContent = 'New: ' + newSequestration.toFixed(2) + ' t';

        var differenceElement = document.getElementById('carbonDifference');
        if (sequestrationDifference > 0) {
            differenceElement.textContent = '+' + sequestrationDifference.toFixed(2);
            differenceElement.style.color = 'green';
        } else if (sequestrationDifference < 0) {
            differenceElement.textContent =  sequestrationDifference.toFixed(2); // The "-" sign is already included in the number
            differenceElement.style.color = 'red';
        } else {
            differenceElement.textContent =  sequestrationDifference.toFixed(2);
            differenceElement.style.color = 'black';
        }
    });
}

// Add a 'Save' button event listener
document.getElementById('saveButton').addEventListener('click', function () {
    // Get the selected new habitat type when the save button is clicked
    var newHabitatType = document.getElementById('newHabitatType').value;

    drawnItems.eachLayer(function (layer) {
        // Save the layer and its data to the list
        var savedPolygon = {
            layer: layer.toGeoJSON(),
            currentHabitatType: layer.currentHabitatType,
            newHabitatType: newHabitatType,  // Use the newHabitatType obtained at the button click
            currentSequestration: layer.currentSequestration,
            newSequestration: layer.newSequestration,
            sequestrationDifference: layer.sequestrationDifference
        };

        // Update the total carbon amount with the saved data
        savedPolygons.push(savedPolygon);

        var totalCarbon = savedPolygons.reduce(function (sum, savedPolygon) {
            return sum + savedPolygon.sequestrationDifference;
        }, 0);

        document.getElementById('totalCarbonValue').textContent =  totalCarbon.toFixed(2) + ' tons of CO2e per year';

        // Change the color of the saved polygon based on its new habitat type
        var habitatColor = getColor(savedPolygon.newHabitatType);

        // Create a new layer from the GeoJSON representation
        var savedLayer = L.geoJSON(savedPolygon.layer, {
            style: {
                fillColor: habitatColor,
                color: habitatColor,
                weight: 2
            }
        });

        // Add the saved polygon to the map
        map.addLayer(savedLayer);

        // Display the area and habitat name inside the polygon
        var area = turf.area(savedPolygon.layer) / 10000;
        savedLayer.bindTooltip('Area: ' + area.toFixed(2) + 'ha of\n' + savedPolygon.newHabitatType).openTooltip();
    });

    // Clear the drawn items layer after saving
    drawnItems.clearLayers();
});



// Function to get color based on habitat type
function getColor(habitatType) {
    switch (habitatType) {
        case 'urban':
            return 'red';
        case 'grassland':
            return 'lightgreen';
        case 'forest':
            return 'darkgreen';
        case 'cropland':
            return 'yellow';
        case 'wetland':
            return 'blue';
        case 'peatland':
            return 'brown';
        default:
            return 'gray'; // Default color for unknown types
    }
}
