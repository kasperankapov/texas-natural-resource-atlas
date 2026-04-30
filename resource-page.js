const resourcePage = document.querySelector("[data-resource-page]");
const currentResourceType = resourcePage?.dataset.resourceType || "";
let resourceMiniMapRegionData = null;
let resourceMiniMapTexasBounds = null;
const resourcePageDebugLoggingEnabled = new URLSearchParams(window.location.search).has("debug");
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
  "historical site": "Historical Site"
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
    kind: "timeline",
    xTitle: "Year",
    yTitle: "Project stage",
    showPointLabels: false,
    stages: [
      "Exploration",
      "Leasing",
      "Sampling",
      "Resource definition",
      "Pre-development",
      "Proposed commercial production"
    ],
    milestones: [
      {
        year: 2007,
        stage: "Exploration",
        label: "Round Top critical-mineral project enters the modern public project cycle",
        shortLabel: "Round Top"
      },
      {
        year: 2022,
        stage: "Leasing",
        label: "East Texas Franklin Project brine-mineral leasing begins",
        shortLabel: "Franklin leasing"
      },
      {
        year: 2023,
        stage: "Sampling",
        label: "Pine Forest 1 brine sample reports 806 mg/L lithium",
        shortLabel: "806 mg/L sample"
      },
      {
        year: 2025,
        stage: "Resource definition",
        label: "Franklin Project inferred resource filed for East Texas Smackover brines",
        shortLabel: "Inferred resource"
      },
      {
        year: 2026,
        stage: "Pre-development",
        label: "Continued appraisal, leasing, and project-area development planning",
        shortLabel: "Appraisal"
      },
      {
        year: 2026,
        stage: "Proposed commercial production",
        label: "Public project materials describe potential multi-phase lithium chemicals production",
        shortLabel: "Proposed production"
      }
    ]
  },
  "lithium-stage-chart": {
    kind: "mappedCategoryBar",
    resourceType: "Lithium",
    categories: [
      "Resource definition / leasing project",
      "Exploration sample area",
      "Deposit / prospective brine trend",
      "Pre-development project",
      "Produced-water opportunity"
    ],
    categoryGetter: getLithiumDevelopmentStage,
    colors: ["#7b5ea7", "#9478bd", "#b7a4d4", "#d8cbea", "#52616f"],
    xTitle: "Mapped records"
  },
  "coal-production-chart": {
    kind: "line",
    label: "Texas Coal/Lignite Production Trend, 1884-2024",
    labels: [1884, 1901, 1913, 1930, 1945, 1950, 1954, 1975, 1986, 2000, 2010, 2020, 2024],
    values: [0.125, 1.108, 2.43, 0.95, 0.09, 0.018, 1.0, 11.002, 48.346, 47, 42, 18, 12],
    yTitle: "Million short tons, rounded"
  },
  "coal-status-chart": {
    kind: "mappedCategoryDonut",
    resourceType: "Coal/Lignite",
    categories: [
      "Active",
      "Active / reclamation areas",
      "Reclamation",
      "Closed / legacy",
      "Historical mine"
    ],
    categoryGetter: getCoalRecordStatusGroup,
    colors: ["#1f7a5c", "#8a5a24", "#c49a1f", "#52616f", "#7b5ea7"]
  },
  "coal-generation-share-chart": {
    kind: "line",
    label: "Coal Share of Texas Net Generation, 2014-2024",
    labels: [2014, 2016, 2018, 2020, 2022, 2024],
    values: [34, 30, 24, 18, 16, 12],
    yTitle: "Percent of Texas net generation, rounded"
  },
  "uranium-development-chart": {
    kind: "timeline",
    xTitle: "Year",
    yTitle: "Project stage",
    showPointLabels: false,
    stages: [
      "Discovery / mining era",
      "ISR development",
      "Rosita operations",
      "Alta Mesa operations",
      "Goliad permitting",
      "Hub-and-spoke expansion"
    ],
    milestones: [
      {
        year: 1955,
        stage: "Discovery / mining era",
        label: "South Texas uranium discovery and early exploration era",
        shortLabel: "Discovery era"
      },
      {
        year: 1975,
        stage: "Discovery / mining era",
        label: "Historical South Texas uranium mining cycle",
        shortLabel: "Mining cycle"
      },
      {
        year: 1980,
        stage: "ISR development",
        label: "In-situ recovery becomes central to modern South Texas uranium development",
        shortLabel: "ISR"
      },
      {
        year: 2005,
        stage: "Goliad permitting",
        label: "Goliad project enters a modern permitting and development cycle",
        shortLabel: "Goliad"
      },
      {
        year: 2024,
        stage: "Rosita operations",
        label: "Rosita central processing plant and South Texas ISR activity return to prominence",
        shortLabel: "Rosita"
      },
      {
        year: 2024,
        stage: "Alta Mesa operations",
        label: "Alta Mesa is part of renewed U.S. ISR uranium production activity",
        shortLabel: "Alta Mesa"
      },
      {
        year: 2026,
        stage: "Hub-and-spoke expansion",
        label: "Burke Hollow, Hobson, and satellite projects frame the current hub-and-spoke platform",
        shortLabel: "Hub-and-spoke"
      }
    ]
  },
  "uranium-site-type-chart": {
    kind: "siteTypeDonut",
    resourceType: "Uranium"
  },
  "uranium-production-context-chart": {
    kind: "line",
    label: "U.S. Uranium Concentrate Production, 2010-2024",
    labels: [2010, 2012, 2014, 2016, 2018, 2019, 2021, 2022, 2023, 2024],
    values: [4228, 4146, 4891, 2916, 1447, 174, 21, 194, 50, 677],
    yTitle: "Thousand pounds U3O8"
  },
  "rare-earth-supply-chain-chart": {
    kind: "mappedCategoryBar",
    resourceType: "Rare Earth",
    categories: [
      "Deposit / mineral resource",
      "Exploration area",
      "Planned separation / processing",
      "Metal / alloy production",
      "Magnet manufacturing",
      "Recycling / secondary recovery"
    ],
    categoryGetter: getRareEarthSupplyChainStage,
    colors: ["#1c7f93", "#3a9daf", "#6db7c4", "#9ad0d8", "#52616f", "#8a5a24"],
    xTitle: "Mapped records"
  },
  "rare-earth-status-chart": {
    kind: "mappedCategoryBar",
    resourceType: "Rare Earth",
    categories: [
      "Operational",
      "Planned / engineering",
      "Pre-development",
      "Exploration / appraisal",
      "Research / demonstration",
      "Opportunity / uncertain",
      "Historical / legacy"
    ],
    categoryGetter: getRareEarthDevelopmentStatus,
    colors: ["#1f7a5c", "#1c7f93", "#8a5a24", "#7b5ea7", "#c49a1f", "#52616f", "#9b3d2e"],
    xTitle: "Mapped records"
  }
};

async function initializeResourcePage() {
  if (!resourcePage) {
    return;
  }

  const resourceData = await loadResourceDataForPage();
  await initializeResourceMiniMap(resourceData);
  updateMappedResourceSiteCount(resourceData);
  updateMappedResourceActiveCount(resourceData);
  await renderResourcePageCharts(resourceData);
}

function logResourcePageDebug(...messages) {
  if (resourcePageDebugLoggingEnabled) {
    console.log(...messages);
  }
}

async function initializeResourceMiniMap(resourceData) {
  const miniMapContainer = document.querySelector("[data-resource-mini-map]");

  if (!miniMapContainer) {
    return;
  }

  const leafletLoaded = await loadLeafletForMiniMap();

  if (!leafletLoaded) {
    miniMapContainer.textContent = "Map preview could not load.";
    return;
  }

  const resourceMiniMap = L.map(miniMapContainer, {
    scrollWheelZoom: false
  }).setView([31.0, -99.0], 5);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(resourceMiniMap);

  resourceMiniMapTexasBounds = await addTexasBorderToMiniMap(resourceMiniMap);
  await loadResourceMiniMapRegions();
  displayResourceMiniMapRegions(resourceMiniMap);

  const resourceFeatures = getFeaturesByResourceType(resourceData, currentResourceType);
  logResourcePageDebug(`${currentResourceType} mini-map loaded ${resourceFeatures.length} records from data/resources.geojson.`);
  const resourceMarkerLatLngs = displayResourceMiniMapMarkers(resourceMiniMap, resourceFeatures);
  fitResourceMiniMapToMarkers(resourceMiniMap, resourceMarkerLatLngs);

  refreshMapSizeForSafari(resourceMiniMap);
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

async function loadResourceMiniMapRegions() {
  try {
    const response = await fetch("../data/texas_resource_regions_basins.geojson");

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    const regionData = await response.json();
    const features = Array.isArray(regionData.features) ? regionData.features : [];
    const resourceRegionFeatures = features.filter((feature) => {
      const resourceTypes = feature.properties?.resourceTypes;
      return Array.isArray(resourceTypes) && resourceTypes.includes(currentResourceType) && Boolean(feature.properties?.name);
    });

    resourceMiniMapRegionData = {
      ...regionData,
      features: resourceRegionFeatures
    };

    const regionNames = resourceRegionFeatures.map((feature) => feature.properties.name).join(", ");
    logResourcePageDebug(`${currentResourceType} mini-map loaded ${resourceRegionFeatures.length} related region records for display: ${regionNames || "none"}.`);
  } catch (error) {
    resourceMiniMapRegionData = null;
    console.warn("Could not load related region overlay data for the resource mini-map.", error);
  }
}

function displayResourceMiniMapRegions(map) {
  if (!resourceMiniMapRegionData?.features?.length) {
    return;
  }

  const regionPane = map.createPane("miniMapResourceRegionPane");
  regionPane.style.zIndex = 420;

  L.geoJSON(resourceMiniMapRegionData, {
    pane: "miniMapResourceRegionPane",
    interactive: true,
    bubblingMouseEvents: false,
    style: {
      color: getCurrentResourceMapColor(),
      weight: 1.75,
      opacity: 0.72,
      fillColor: getCurrentResourceMapColor(),
      fillOpacity: 0.12,
      className: "resource-mini-map-region"
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

function displayResourceMiniMapMarkers(map, resourceFeatures) {
  const markerLatLngs = [];

  resourceFeatures.forEach((feature) => {
    const coordinates = feature.geometry?.coordinates;

    if (!validGeoJsonPointCoordinates(coordinates)) {
      return;
    }

    const [longitude, latitude] = coordinates;
    const latLng = [latitude, longitude];

    const marker = L.marker(latLng, {
      icon: createResourceMiniMapMarkerIcon(feature.properties?.siteType),
      zIndexOffset: 1000
    }).addTo(map);

    marker.bindPopup(createResourceMiniMapPopup(feature.properties || {}));
    markerLatLngs.push(latLng);
  });

  return markerLatLngs;
}

function fitResourceMiniMapToMarkers(map, markerLatLngs) {
  if (resourceMiniMapTexasBounds?.isValid()) {
    fitResourceMiniMapToTexas(map);
    return;
  }

  if (!markerLatLngs.length) {
    fitResourceMiniMapToTexas(map);
    return;
  }

  const bounds = L.latLngBounds(markerLatLngs);

  map.fitBounds(bounds, {
    padding: [28, 28],
    maxZoom: 7
  });
}

function fitResourceMiniMapToTexas(map) {
  if (resourceMiniMapTexasBounds?.isValid()) {
    map.fitBounds(resourceMiniMapTexasBounds, {
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

function createResourceMiniMapMarkerIcon(siteType) {
  const markerColor = getCurrentResourceMapColor();

  return L.icon({
    className: "resource-marker-icon resource-mini-map-marker",
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

function createResourceMiniMapPopup(properties) {
  return `
    <div class="mini-map-popup">
      <h3>${escapeHtml(properties.name || `${currentResourceType} site`)}</h3>
      ${createMiniMapPopupRow("County", properties.county)}
      ${createMiniMapPopupRow("Site type", getSiteTypeDisplayLabel(properties))}
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

  if (siteType === "historical site") {
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
    script.src = "../vendor/leaflet/leaflet.js";
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

    if (config.kind === "timeline") {
      renderTimelineChart(canvas, config);
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
      return;
    }

    if (config.kind === "mappedCategoryBar") {
      renderMappedCategoryChart(canvas, resourceData, config, "bar");
      return;
    }

    if (config.kind === "mappedCategoryDonut") {
      renderMappedCategoryChart(canvas, resourceData, config, "donut");
    }
  });
}

function loadChartJsForResourcePage() {
  if (window.Chart) {
    return Promise.resolve(true);
  }

  const existingScript = document.querySelector('script[data-chartjs-resource-page-loader="true"]');

  if (existingScript) {
    return new Promise((resolve) => {
      existingScript.addEventListener("load", () => resolve(Boolean(window.Chart)), { once: true });
      existingScript.addEventListener("error", () => resolve(false), { once: true });
    });
  }

  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "../vendor/chartjs/chart.umd.min.js";
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
          intersect: false,
          callbacks: {
            title(items) {
              return items.length ? String(items[0].label) : "";
            },
            label(item) {
              return formatAxisTooltipValue(item.parsed.y, config.yTitle);
            }
          }
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

function renderTimelineChart(canvas, config) {
  const color = chartColorsByResource[currentResourceType] || "#27313a";
  const milestones = Array.isArray(config.milestones) ? config.milestones : [];
  const years = milestones.map((milestone) => milestone.year).filter(Number.isFinite);

  new Chart(canvas, {
    type: "scatter",
    data: {
      datasets: [
        {
          label: config.label || "Project milestones",
          data: milestones.map((milestone) => ({
            x: milestone.year,
            y: milestone.stage,
            label: milestone.label,
            shortLabel: milestone.shortLabel
          })),
          borderColor: color,
          backgroundColor: `${color}dd`,
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
          showLine: false,
          clip: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          right: 28
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
              return [
                item.raw.y,
                ...wrapTooltipText(item.raw.label, 46)
              ];
            }
          }
        },
        resourceTimelineLabels: {
          showLabels: config.showPointLabels !== false,
          color: "#33434f"
        }
      },
      scales: {
        x: {
          type: "linear",
          min: Math.min(...years) - 2,
          max: Math.max(...years) + 2,
          title: {
            display: true,
            text: config.xTitle || "Year"
          },
          ticks: {
            callback(value) {
              return Math.round(value);
            }
          }
        },
        y: {
          type: "category",
          labels: config.stages,
          offset: true,
          title: {
            display: false,
            text: config.yTitle || "Stage"
          },
          ticks: {
            autoSkip: false,
            padding: 8,
            callback(value) {
              return wrapAxisTickLabel(this.getLabelForValue(value), 18);
            }
          }
        }
      }
    },
    plugins: [createTimelineLabelPlugin()]
  });
}

function createTimelineLabelPlugin() {
  return {
    id: "resourceTimelineLabels",
    afterDatasetsDraw(chart, args, options) {
      if (options.showLabels === false) {
        return;
      }

      const dataset = chart.data.datasets[0];
      const meta = chart.getDatasetMeta(0);

      if (!dataset || !meta?.data) {
        return;
      }

      const context = chart.ctx;
      context.save();
      context.font = "11px Arial, Helvetica, sans-serif";
      context.fillStyle = options.color || "#33434f";
      context.textBaseline = "middle";

      meta.data.forEach((point, index) => {
        const raw = dataset.data[index] || {};
        const label = raw.shortLabel || raw.label;

        if (!label) {
          return;
        }

        context.fillText(label, point.x + 9, point.y);
      });

      context.restore();
    }
  };
}

function wrapTooltipText(text, maxLineLength) {
  const words = String(text || "").split(" ");
  const lines = [];
  let currentLine = "";

  words.forEach((word) => {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;

    if (nextLine.length > maxLineLength && currentLine) {
      lines.push(currentLine);
      currentLine = word;
      return;
    }

    currentLine = nextLine;
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function wrapAxisTickLabel(text, maxLineLength) {
  const lines = wrapTooltipText(text, maxLineLength);

  return lines.length ? lines : String(text || "");
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
        },
        tooltip: {
          callbacks: {
            label(item) {
              return formatCategoryTooltipValue(item.parsed, item.dataset.data);
            }
          }
        }
      }
    }
  });
}

function renderHorizontalBarChart(canvas, labels, values, colors, xTitle) {
  new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: colors,
          borderColor: colors,
          borderWidth: 1,
          borderRadius: 6,
          barThickness: 22
        }
      ]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            title(items) {
              return items.length ? String(items[0].label) : "";
            },
            label(item) {
              return `${Number(item.parsed.x).toLocaleString()} ${pluralizeRecordCount(item.parsed.x)}`;
            }
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          precision: 0,
          ticks: {
            stepSize: 1
          },
          title: {
            display: true,
            text: xTitle || "Mapped records"
          }
        }
      }
    }
  });
}

function renderMappedCategoryChart(canvas, resourceData, config, chartType) {
  if (!resourceData) {
    setChartStatus(`${canvas.id}-status`, "Could not load the local atlas dataset for this chart.");
    return;
  }

  const categories = Array.isArray(config.categories) ? config.categories : [];
  const counts = Object.fromEntries(categories.map((category) => [category, 0]));
  const features = Array.isArray(resourceData.features) ? resourceData.features : [];

  features
    .filter((feature) => feature.properties?.resourceType === config.resourceType)
    .forEach((feature) => {
      const category = config.categoryGetter(feature.properties || {});

      if (Object.prototype.hasOwnProperty.call(counts, category)) {
        counts[category] += 1;
      }
    });

  const labels = categories;
  const values = labels.map((label) => counts[label]);

  if (values.every((value) => value === 0)) {
    setChartStatus(`${canvas.id}-status`, "No mapped records are available for this chart.");
    return;
  }

  if (chartType === "donut") {
    renderDonutChart(canvas, labels, values, config.colors);
  } else {
    renderHorizontalBarChart(canvas, labels, values, config.colors, config.xTitle);
  }

  setChartStatus(`${canvas.id}-status`, "");
}

function formatAxisTooltipValue(value, axisTitle = "") {
  const numericValue = Number(value);
  const formattedValue = Number.isFinite(numericValue) ? numericValue.toLocaleString() : String(value);
  const normalizedTitle = axisTitle.toLowerCase();

  if (normalizedTitle.includes("percent")) {
    return `${formattedValue}%`;
  }

  if (normalizedTitle.includes("trillion cubic feet")) {
    return `${formattedValue} trillion cubic feet`;
  }

  if (normalizedTitle.includes("million short tons")) {
    return `${formattedValue} million short tons`;
  }

  if (normalizedTitle.includes("thousand pounds")) {
    return `${formattedValue} thousand pounds U3O8`;
  }

  if (normalizedTitle.includes("million barrels")) {
    return `${formattedValue} million barrels`;
  }

  return formattedValue;
}

function formatCategoryTooltipValue(value, allValues) {
  const numericValue = Number(value);
  const formattedValue = Number.isFinite(numericValue) ? numericValue.toLocaleString() : String(value);
  const total = allValues.reduce((sum, itemValue) => sum + Number(itemValue || 0), 0);

  if (total === 100) {
    return `${formattedValue}%`;
  }

  return `${formattedValue} ${pluralizeRecordCount(numericValue)}`;
}

function pluralizeRecordCount(count) {
  return Number(count) === 1 ? "record" : "records";
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

function getLithiumDevelopmentStage(properties) {
  const text = getCombinedPropertyText(properties);

  if (text.includes("produced water")) {
    return "Produced-water opportunity";
  }

  if (text.includes("sample") || text.includes("pine forest")) {
    return "Exploration sample area";
  }

  if (text.includes("pre-development") || text.includes("round top")) {
    return "Pre-development project";
  }

  if (text.includes("prospective") || text.includes("brine trend") || text.includes("deposit")) {
    return "Deposit / prospective brine trend";
  }

  return "Resource definition / leasing project";
}

function getCoalRecordStatusGroup(properties) {
  const status = String(properties.status || "").toLowerCase();
  const siteType = String(properties.siteType || "").toLowerCase();

  if (status.includes("active") && status.includes("reclamation")) {
    return "Active / reclamation areas";
  }

  if (status.includes("active")) {
    return "Active";
  }

  if (status.includes("closed") || status.includes("legacy")) {
    return "Closed / legacy";
  }

  if (status.includes("reclamation")) {
    return "Reclamation";
  }

  if (siteType.includes("historical")) {
    return "Historical mine";
  }

  return "Historical mine";
}

function getRareEarthSupplyChainStage(properties) {
  const text = getCombinedPropertyText(properties);

  if (
    text.includes("recycling") ||
    text.includes("recycled") ||
    text.includes("secondary") ||
    text.includes("coal ash") ||
    text.includes("coal-ash") ||
    text.includes("byproduct") ||
    text.includes("waste") ||
    text.includes("recovery")
  ) {
    return "Recycling / secondary recovery";
  }

  if (
    text.includes("rare earth metal facility") ||
    text.includes("metal production") ||
    text.includes("metallization") ||
    text.includes("alloy")
  ) {
    return "Metal / alloy production";
  }

  if (text.includes("magnet")) {
    return "Magnet manufacturing";
  }

  if (
    text.includes("separation") ||
    text.includes("processing") ||
    text.includes("demonstration") ||
    text.includes("accelerator") ||
    text.includes("gallium") ||
    text.includes("scandium")
  ) {
    return "Planned separation / processing";
  }

  if (text.includes("deposit") || text.includes("mineral resource")) {
    return "Deposit / mineral resource";
  }

  if (
    text.includes("exploration") ||
    text.includes("prospect") ||
    text.includes("appraisal") ||
    text.includes("permit") ||
    text.includes("sampling") ||
    text.includes("research") ||
    text.includes("pegmatite") ||
    text.includes("laccolith") ||
    text.includes("trend") ||
    text.includes("district") ||
    text.includes("historical")
  ) {
    return "Exploration area";
  }

  return "Deposit / mineral resource";
}

function getRareEarthDevelopmentStatus(properties) {
  const text = getCombinedPropertyText(properties);

  if (text.includes("historical") || text.includes("historic") || text.includes("legacy") || text.includes("inundated")) {
    return "Historical / legacy";
  }

  if (text.includes("operational") || text.includes("ramping")) {
    return "Operational";
  }

  if (text.includes("planned") || text.includes("engineering") || text.includes("announced")) {
    return "Planned / engineering";
  }

  if (text.includes("pre-development") || text.includes("mine planning") || text.includes("permitted lease")) {
    return "Pre-development";
  }

  if (text.includes("exploration") || text.includes("prospect") || text.includes("appraisal") || text.includes("sampling")) {
    return "Exploration / appraisal";
  }

  if (text.includes("research") || text.includes("demonstration") || text.includes("r&d")) {
    return "Research / demonstration";
  }

  return "Opportunity / uncertain";
}

function getCombinedPropertyText(properties) {
  return [
    properties.id,
    properties.name,
    properties.detailedSiteType,
    properties.broadSiteType,
    properties.siteType,
    properties.status,
    properties.operator,
    properties.description,
    properties.sourceName,
    properties.notes
  ].join(" ").toLowerCase();
}

function formatSiteTypeLabel(siteType) {
  return siteTypeLabels[siteType] || titleCase(siteType);
}

function getSiteTypeDisplayLabel(properties = {}) {
  return properties.detailedSiteType || formatSiteTypeLabel(properties.siteType);
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
