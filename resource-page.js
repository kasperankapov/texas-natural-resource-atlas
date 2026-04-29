const resourcePage = document.querySelector("[data-resource-page]");
const currentResourceType = resourcePage?.dataset.resourceType || "";
let oilMiniMapRegionData = null;
let oilMiniMapTexasBounds = null;
const chartColorsByResource = {
  Oil: "#27313a",
  "Natural Gas": "#1f7a5c",
  Lithium: "#7b5ea7",
  "Coal/Lignite": "#8a5a24",
  Uranium: "#c49a1f",
  "Rare Earth": "#1c7f93"
};
const siteTypeLabels = {
  deposit: "Deposit",
  production: "Production Site",
  facility: "Processing Facility",
  exploration: "Exploration",
  "historical mine": "Historical Mine"
};
const resourceChartConfig = {
  "natural-gas-production-chart": {
    kind: "line",
    label: "Texas Natural Gas Gross Withdrawals, 1967-2024",
    labels: [1967, 1975, 1985, 1995, 2005, 2010, 2015, 2020, 2021, 2022, 2023, 2024],
    values: [5.1, 7.3, 6.7, 5.9, 6.1, 7.3, 8, 10.49, 10.74, 11.44, 12.23, 12.92],
    yTitle: "Trillion cubic feet, rounded"
  },
  "natural-gas-share-chart": {
    kind: "donut",
    labels: ["Texas", "Rest of U.S."],
    values: [28, 72],
    colors: ["#1f7a5c", "#d6dde3"]
  },
  "lithium-development-chart": {
    kind: "line",
    label: "Texas Lithium Development Timeline, 2007-2026",
    labels: [2007, 2014, 2020, 2022, 2023, 2024, 2025, 2026],
    values: [1, 2, 2, 3, 5, 6, 8, 8],
    yTitle: "Relative development activity index"
  },
  "lithium-site-type-chart": {
    kind: "siteTypeDonut",
    resourceType: "Lithium"
  },
  "coal-production-chart": {
    kind: "line",
    label: "Texas Coal/Lignite Production Trend, 1884-2024",
    labels: [1884, 1901, 1913, 1930, 1945, 1950, 1954, 1975, 1986, 2000, 2010, 2020, 2024],
    values: [0.125, 1.108, 2.43, 0.95, 0.09, 0.018, 1.0, 11.002, 48.346, 47, 42, 18, 12],
    yTitle: "Million short tons, rounded"
  },
  "coal-site-type-chart": {
    kind: "siteTypeDonut",
    resourceType: "Coal/Lignite"
  },
  "uranium-development-chart": {
    kind: "line",
    label: "Texas Uranium Development Timeline, 1955-2026",
    labels: [1955, 1965, 1975, 1980, 1990, 2005, 2015, 2024, 2026],
    values: [1, 3, 5, 6, 3, 5, 2, 5, 7],
    yTitle: "Relative development activity index"
  },
  "uranium-site-type-chart": {
    kind: "siteTypeDonut",
    resourceType: "Uranium"
  },
  "rare-earth-development-chart": {
    kind: "line",
    label: "Texas Rare Earth Development Timeline, 1980-2026",
    labels: [1980, 2007, 2014, 2020, 2022, 2024, 2025, 2026],
    values: [1, 2, 3, 5, 5, 6, 7, 8],
    yTitle: "Relative development activity index"
  },
  "rare-earth-site-type-chart": {
    kind: "siteTypeDonut",
    resourceType: "Rare Earth"
  }
};

async function initializeResourcePage() {
  if (!resourcePage) {
    return;
  }

  const resourceData = await loadResourceDataForPage();
  await initializeOilMiniMap(resourceData);
  updateMappedResourceSiteCount(resourceData);
  updateMappedResourceActiveCount(resourceData);
  await renderResourcePageCharts(resourceData);
}

async function initializeOilMiniMap(resourceData) {
  const miniMapContainer = document.querySelector("[data-resource-mini-map], #oil-mini-map");

  if (!miniMapContainer) {
    return;
  }

  const leafletLoaded = await loadLeafletForMiniMap();

  if (!leafletLoaded) {
    miniMapContainer.textContent = "Map preview could not load.";
    return;
  }

  const oilMiniMap = L.map(miniMapContainer, {
    scrollWheelZoom: false
  }).setView([31.0, -99.0], 5);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(oilMiniMap);

  oilMiniMapTexasBounds = await addTexasBorderToMiniMap(oilMiniMap);
  await loadOilMiniMapRegions();
  displayOilMiniMapRegions(oilMiniMap);

  const oilFeatures = getFeaturesByResourceType(resourceData, currentResourceType);
  console.log(`${currentResourceType} mini-map loaded ${oilFeatures.length} records from data/resources.geojson.`);
  const oilMarkerLatLngs = displayOilMiniMapMarkers(oilMiniMap, oilFeatures);
  fitOilMiniMapToMarkers(oilMiniMap, oilMarkerLatLngs);

  refreshMapSizeForSafari(oilMiniMap);
}

async function addTexasBorderToMiniMap(map) {
  try {
    const response = await fetch("../data/texas_border.geojson");

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    const texasBorderData = await response.json();
    const borderPane = map.createPane("miniMapTexasBorderPane");
    borderPane.style.zIndex = 400;

    const texasBorderLayer = L.geoJSON(texasBorderData, {
      pane: "miniMapTexasBorderPane",
      interactive: false,
      style: {
        color: "#263843",
        weight: 2,
        opacity: 0.85,
        fill: false,
        fillOpacity: 0
      }
    }).addTo(map);

    const texasBounds = texasBorderLayer.getBounds();

    if (texasBounds.isValid()) {
      map.fitBounds(texasBounds, {
        padding: [16, 16],
        maxZoom: 6
      });
      return texasBounds;
    }
  } catch (error) {
    console.warn("Could not load Texas border overlay for the resource mini-map.", error);
  }

  return null;
}

async function loadOilMiniMapRegions() {
  try {
    const response = await fetch("../data/texas_resource_regions_basins.geojson");

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    const regionData = await response.json();
    const features = Array.isArray(regionData.features) ? regionData.features : [];
    const oilRegionFeatures = features.filter((feature) => {
      const resourceTypes = feature.properties?.resourceTypes;
      return Array.isArray(resourceTypes) && resourceTypes.includes(currentResourceType) && Boolean(feature.properties?.name);
    });

    oilMiniMapRegionData = {
      ...regionData,
      features: oilRegionFeatures
    };

    const regionNames = oilRegionFeatures.map((feature) => feature.properties.name).join(", ");
    console.log(`${currentResourceType} mini-map loaded ${oilRegionFeatures.length} related region records for display: ${regionNames || "none"}.`);
  } catch (error) {
    oilMiniMapRegionData = null;
    console.warn("Could not load related region overlay data for the resource mini-map.", error);
  }
}

function displayOilMiniMapRegions(map) {
  if (!oilMiniMapRegionData?.features?.length) {
    return;
  }

  const regionPane = map.createPane("miniMapOilRegionPane");
  regionPane.style.zIndex = 420;

  L.geoJSON(oilMiniMapRegionData, {
    pane: "miniMapOilRegionPane",
    interactive: true,
    bubblingMouseEvents: false,
    style: {
      color: getCurrentResourceMapColor(),
      weight: 1.75,
      opacity: 0.72,
      fillColor: getCurrentResourceMapColor(),
      fillOpacity: 0.12,
      className: "oil-mini-map-region"
    },
    onEachFeature: (feature, layer) => {
      const regionName = feature.properties?.name;

      if (regionName) {
        layer.bindPopup(`<strong>${escapeHtml(regionName)}</strong>`);
      }
    }
  }).addTo(map);
}

function getFeaturesByResourceType(resourceData, resourceType) {
  const features = Array.isArray(resourceData?.features) ? resourceData.features : [];

  return features.filter((feature) => feature.properties?.resourceType === resourceType);
}

function displayOilMiniMapMarkers(map, oilFeatures) {
  const markerLatLngs = [];

  oilFeatures.forEach((feature) => {
    const coordinates = feature.geometry?.coordinates;

    if (!validGeoJsonPointCoordinates(coordinates)) {
      return;
    }

    const [longitude, latitude] = coordinates;
    const latLng = [latitude, longitude];

    const marker = L.marker(latLng, {
      icon: createMiniMapOilMarkerIcon(feature.properties?.siteType),
      zIndexOffset: 1000
    }).addTo(map);

    marker.bindPopup(createOilMiniMapPopup(feature.properties || {}));
    markerLatLngs.push(latLng);
  });

  return markerLatLngs;
}

function fitOilMiniMapToMarkers(map, markerLatLngs) {
  if (oilMiniMapTexasBounds?.isValid()) {
    fitOilMiniMapToTexas(map);
    return;
  }

  if (!markerLatLngs.length) {
    fitOilMiniMapToTexas(map);
    return;
  }

  const bounds = L.latLngBounds(markerLatLngs);

  map.fitBounds(bounds, {
    padding: [28, 28],
    maxZoom: 7
  });
}

function fitOilMiniMapToTexas(map) {
  if (oilMiniMapTexasBounds?.isValid()) {
    map.fitBounds(oilMiniMapTexasBounds, {
      padding: [16, 16],
      maxZoom: 6
    });
    return;
  }

  map.setView([31.0, -99.0], 5);
}

function validGeoJsonPointCoordinates(coordinates) {
  return (
    Array.isArray(coordinates) &&
    coordinates.length >= 2 &&
    Number.isFinite(coordinates[0]) &&
    Number.isFinite(coordinates[1]) &&
    coordinates[0] >= -180 &&
    coordinates[0] <= 180 &&
    coordinates[1] >= -90 &&
    coordinates[1] <= 90
  );
}

function createMiniMapOilMarkerIcon(siteType) {
  const markerColor = getCurrentResourceMapColor();

  return L.icon({
    className: "resource-marker-icon oil-mini-map-marker",
    iconUrl: createSiteTypeMarkerIconUrl(siteType, {
      color: markerColor,
      fillColor: markerColor
    }),
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -9]
  });
}

function getCurrentResourceMapColor() {
  return chartColorsByResource[currentResourceType] || "#52616f";
}

function createOilMiniMapPopup(properties) {
  return `
    <div class="mini-map-popup">
      <h3>${escapeHtml(properties.name || `${currentResourceType} site`)}</h3>
      ${createMiniMapPopupRow("County", properties.county)}
      ${createMiniMapPopupRow("Site type", formatSiteTypeLabel(properties.siteType))}
      ${createMiniMapPopupRow("Status", properties.status)}
      ${createMiniMapPopupRow("Confidence", properties.confidence)}
    </div>
  `;
}

function createMiniMapPopupRow(label, value) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return "";
  }

  return `<p><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>`;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };

    return entities[character];
  });
}

function createSiteTypeMarkerIconUrl(siteType, markerStyle) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(createSiteTypeMarkerSvg(siteType, markerStyle))}`;
}

function createSiteTypeMarkerSvg(siteType, markerStyle) {
  const fillColor = sanitizeMarkerColor(markerStyle.fillColor);
  const strokeColor = sanitizeMarkerColor(markerStyle.color);
  const commonAttributes = `stroke="${strokeColor}" stroke-width="2"`;
  let shape = `<circle cx="10" cy="10" r="7" fill="${fillColor}" ${commonAttributes} />`;

  if (siteType === "production") {
    shape = `<rect x="3" y="3" width="14" height="14" rx="2" fill="${fillColor}" ${commonAttributes} />`;
  }

  if (siteType === "facility") {
    shape = `
      <rect x="3" y="3" width="14" height="14" rx="2" fill="${fillColor}" ${commonAttributes} />
      <path d="M5 15 L15 5 M2 12 L12 2 M8 18 L18 8" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity="0.9" />
    `;
  }

  if (siteType === "exploration") {
    shape = `<circle cx="10" cy="10" r="7" fill="${fillColor}" ${commonAttributes} stroke-dasharray="3 2" />`;
  }

  if (siteType === "historical mine") {
    shape = `<polygon points="10,2.5 17.5,10 10,17.5 2.5,10" fill="${fillColor}" ${commonAttributes} />`;
  }

  return `<svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">${shape}</svg>`;
}

function sanitizeMarkerColor(color) {
  return /^#[0-9a-fA-F]{3,8}$/.test(color) ? color : "#52616f";
}

function loadLeafletForMiniMap() {
  if (window.L) {
    return Promise.resolve(true);
  }

  const existingScript = document.querySelector('script[data-leaflet-mini-map-loader="true"]');

  if (existingScript) {
    return new Promise((resolve) => {
      existingScript.addEventListener("load", () => resolve(true), { once: true });
      existingScript.addEventListener("error", () => resolve(false), { once: true });
    });
  }

  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.defer = true;
    script.dataset.leafletMiniMapLoader = "true";
    script.addEventListener("load", () => resolve(Boolean(window.L)), { once: true });
    script.addEventListener("error", () => {
      console.warn("Leaflet did not load; the resource mini-map preview could not be initialized.");
      resolve(false);
    }, { once: true });
    document.head.appendChild(script);
  });
}

function refreshMapSizeForSafari(map) {
  const refresh = () => {
    map.invalidateSize();
  };

  requestAnimationFrame(refresh);
  window.addEventListener("load", refresh, { once: true });
  setTimeout(refresh, 150);
  setTimeout(refresh, 500);
}

async function loadResourceDataForPage() {
  try {
    const response = await fetch("../data/resources.geojson");

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    setResourceCountFallback("Unavailable");
    setResourceActiveCountFallback("Unavailable");
    console.warn("Could not load mapped site count from ../data/resources.geojson.", error);
    return null;
  }
}

function updateMappedResourceSiteCount(resourceData) {
  if (!resourceData || !currentResourceType) {
    setResourceCountFallback("Unavailable");
    return;
  }

  const features = Array.isArray(resourceData.features) ? resourceData.features : [];
  const resourceSiteCount = features.filter((feature) => {
    return feature.properties?.resourceType === currentResourceType;
  }).length;

  getResourceCountElements().forEach((countElement) => {
    countElement.textContent = resourceSiteCount.toLocaleString();
  });
}

function updateMappedResourceActiveCount(resourceData) {
  if (!resourceData || !currentResourceType) {
    setResourceActiveCountFallback("Unavailable");
    return;
  }

  const features = Array.isArray(resourceData.features) ? resourceData.features : [];
  const activeSiteCount = features.filter((feature) => {
    return feature.properties?.resourceType === currentResourceType && isActiveStatus(feature.properties?.status);
  }).length;

  getResourceActiveCountElements().forEach((countElement) => {
    countElement.textContent = activeSiteCount.toLocaleString();
  });
}

function isActiveStatus(status) {
  const normalizedStatus = String(status || "").toLowerCase();
  const inactivePhrases = [
    "inactive",
    "not active",
    "non-active",
    "closed",
    "legacy",
    "historical",
    "historic",
    "undeveloped",
    "uncertain",
    "retired"
  ];

  if (!normalizedStatus || inactivePhrases.some((inactivePhrase) => normalizedStatus.includes(inactivePhrase))) {
    return false;
  }

  return [
    "active",
    "operational",
    "producing",
    "exploration",
    "pre-development",
    "planned",
    "announced",
    "development",
    "permitted",
    "licensed",
    "concept"
  ].some((activePhrase) => normalizedStatus.includes(activePhrase));
}

function setResourceCountFallback(message) {
  getResourceCountElements().forEach((countElement) => {
    countElement.textContent = message;
  });
}

function setResourceActiveCountFallback(message) {
  getResourceActiveCountElements().forEach((countElement) => {
    countElement.textContent = message;
  });
}

function getResourceCountElements() {
  return document.querySelectorAll("[data-resource-count], #mapped-oil-count");
}

function getResourceActiveCountElements() {
  return document.querySelectorAll("[data-resource-active-count]");
}

function setChartStatus(elementId, message) {
  const statusElement = document.querySelector(`#${elementId}`);

  if (statusElement) {
    statusElement.textContent = message;
    statusElement.hidden = message === "";
  }
}

async function renderResourcePageCharts(resourceData) {
  const chartCanvases = document.querySelectorAll("canvas[id$='-chart']");

  if (chartCanvases.length === 0) {
    return;
  }

  const chartJsLoaded = await loadChartJsForResourcePage();

  if (!chartJsLoaded) {
    document.querySelectorAll("canvas[id$='-chart']").forEach((canvas) => {
      setChartStatus(`${canvas.id}-status`, "Chart.js did not load. The page content remains available.");
    });
    return;
  }

  renderOilProductionChart();
  renderOilShareChart();

  Object.entries(resourceChartConfig).forEach(([canvasId, config]) => {
    const canvas = document.querySelector(`#${canvasId}`);

    if (!canvas) {
      return;
    }

    if (config.kind === "line") {
      renderLineChart(canvas, config);
      setChartStatus(`${canvasId}-status`, "");
      return;
    }

    if (config.kind === "donut") {
      renderDonutChart(canvas, config.labels, config.values, config.colors);
      setChartStatus(`${canvasId}-status`, "");
      return;
    }

    if (config.kind === "siteTypeDonut") {
      renderSiteTypeDonutChart(canvas, resourceData, config.resourceType);
    }
  });
}

function loadChartJsForResourcePage() {
  if (window.Chart) {
    return Promise.resolve(true);
  }

  const existingScript = document.querySelector('script[data-chartjs-resource-page-loader="true"], script[src*="chart.js"]');

  if (existingScript) {
    return new Promise((resolve) => {
      existingScript.addEventListener("load", () => resolve(Boolean(window.Chart)), { once: true });
      existingScript.addEventListener("error", () => resolve(false), { once: true });
    });
  }

  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/chart.js@4.4.8/dist/chart.umd.min.js";
    script.defer = true;
    script.dataset.chartjsResourcePageLoader = "true";
    script.addEventListener("load", () => resolve(Boolean(window.Chart)), { once: true });
    script.addEventListener("error", () => {
      console.warn("Chart.js did not load; resource page charts will not render.");
      resolve(false);
    }, { once: true });
    document.head.appendChild(script);
  });
}

function renderLineChart(canvas, config) {
  const color = chartColorsByResource[currentResourceType] || "#27313a";

  new Chart(canvas, {
    type: "line",
    data: {
      labels: config.labels,
      datasets: [
        {
          label: config.label,
          data: config.values,
          tension: 0.25,
          borderColor: color,
          backgroundColor: `${color}22`,
          borderWidth: 3,
          pointRadius: 4,
          pointBackgroundColor: color,
          pointBorderColor: "#ffffff",
          pointBorderWidth: 1,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          mode: "index",
          intersect: false
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Year"
          }
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: config.yTitle
          }
        }
      }
    }
  });
}

function renderDonutChart(canvas, labels, values, colors) {
  new Chart(canvas, {
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: colors,
          borderColor: labels.map(() => "#ffffff"),
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "62%",
      plugins: {
        legend: {
          position: "bottom"
        }
      }
    }
  });
}

function renderSiteTypeDonutChart(canvas, resourceData, resourceType) {
  if (!resourceData) {
    setChartStatus(`${canvas.id}-status`, "Could not load the local atlas dataset for this chart.");
    return;
  }

  const features = Array.isArray(resourceData.features) ? resourceData.features : [];
  const siteTypeCounts = features
    .filter((feature) => feature.properties?.resourceType === resourceType)
    .reduce((counts, feature) => {
      const siteType = feature.properties?.siteType || "Unknown";
      counts[siteType] = (counts[siteType] || 0) + 1;
      return counts;
    }, {});
  const labels = Object.keys(siteTypeCounts).map((siteType) => formatSiteTypeLabel(siteType));
  const values = Object.values(siteTypeCounts);

  if (labels.length === 0) {
    setChartStatus(`${canvas.id}-status`, "No mapped records are available for this chart.");
    return;
  }

  renderDonutChart(canvas, labels, values, ["#52616f", "#8a5a24", "#1f7a5c", "#7b5ea7", "#1c7f93"]);
  setChartStatus(`${canvas.id}-status`, "");
}

function formatSiteTypeLabel(siteType) {
  return siteTypeLabels[siteType] || titleCase(siteType);
}

function titleCase(value) {
  return String(value)
    .split(" ")
    .filter((word) => word.length > 0)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function createOilProductionAnnotationPlugin() {
  return {
    id: "oilProductionAnnotations",
    afterDatasetsDraw(chart, args, options) {
      const markers = options.markers || [];
      const xScale = chart.scales.x;
      const chartArea = chart.chartArea;

      if (!xScale || !chartArea) {
        return;
      }

      const context = chart.ctx;
      context.save();
      context.font = "11px Arial, Helvetica, sans-serif";
      context.fillStyle = "#52616f";
      context.strokeStyle = "rgba(82, 97, 111, 0.45)";
      context.lineWidth = 1;

      markers.forEach((marker, index) => {
        const x = xScale.getPixelForValue(marker.year);

        if (x < chartArea.left || x > chartArea.right) {
          return;
        }

        context.beginPath();
        context.moveTo(x, chartArea.top + 8);
        context.lineTo(x, chartArea.bottom);
        context.stroke();

        context.save();
        context.translate(x + 4, chartArea.top + 18 + (index % 2) * 28);
        context.rotate(-Math.PI / 2);
        context.fillText(`${marker.year}: ${marker.label}`, 0, 0);
        context.restore();
      });

      context.restore();
    }
  };
}

async function renderOilProductionChart() {
  const chartCanvas = document.querySelector("#oil-production-chart");

  if (!chartCanvas) {
    return;
  }

  try {
    const response = await fetch("../data/oilProductionHistory.json");

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    const historyData = await response.json();
    const points = Array.isArray(historyData.points) ? historyData.points : [];
    const annotations = Array.isArray(historyData.annotations) ? historyData.annotations : [];

    new Chart(chartCanvas, {
      type: "line",
      data: {
        datasets: [
          {
            label: "Production, million barrels per year",
            data: points.map((point) => ({
              x: point.year,
              y: point.productionMillionBarrels
            })),
            borderColor: "#27313a",
            backgroundColor: "rgba(39, 49, 58, 0.12)",
            borderWidth: 3,
            fill: true,
            pointBackgroundColor: "#27313a",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 1,
            pointRadius: 4,
            tension: 0.25
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: "nearest"
        },
        scales: {
          x: {
            type: "linear",
            min: 1900,
            max: 2024,
            title: {
              display: true,
              text: "Year"
            },
            ticks: {
              stepSize: 20,
              callback(value) {
                return Math.round(value);
              }
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Million barrels"
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              title(items) {
                return items.length ? String(items[0].raw.x) : "";
              },
              label(item) {
                return `${item.raw.y.toLocaleString()} million barrels`;
              }
            }
          },
          oilProductionAnnotations: {
            markers: annotations
          }
        }
      },
      plugins: [createOilProductionAnnotationPlugin()]
    });

    setChartStatus("oil-production-chart-status", "");
  } catch (error) {
    setChartStatus("oil-production-chart-status", "Could not load the local oil production history file.");
    console.warn("Could not render Texas crude oil production chart.", error);
  }
}

function renderOilShareChart() {
  const chartCanvas = document.querySelector("#oil-share-chart");

  if (!chartCanvas) {
    return;
  }

  renderDonutChart(chartCanvas, ["Texas", "Rest of U.S."], [43, 57], ["#27313a", "#d6dde3"]);
  setChartStatus("oil-share-chart-status", "");
}

initializeResourcePage();
