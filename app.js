const texasMap = L.map("map").setView([31.0, -99.0], 6);
const siteSearchInput = document.querySelector("#site-search");
const sourceFilterSelect = document.querySelector("#source-filter");
const resetFiltersButton = document.querySelector("#reset-filters");
const basinOverlayToggle = document.querySelector("#toggle-basin-overlays");
const resourceTypeCheckboxes = document.querySelectorAll('input[name="resourceType"]');
const siteTypeCheckboxes = document.querySelectorAll('input[name="siteType"]');
const resourceTypeConfig = [
  {
    label: "Oil",
    value: "Oil",
    markerStyle: {
      color: "#27313a",
      fillColor: "#27313a"
    },
    showInFilters: true,
    showInLegend: true
  },
  {
    label: "Natural Gas",
    value: "Natural Gas",
    markerStyle: {
      color: "#1f7a5c",
      fillColor: "#1f7a5c"
    },
    showInFilters: true,
    showInLegend: true
  },
  {
    label: "Lithium",
    value: "Lithium",
    markerStyle: {
      color: "#7b5ea7",
      fillColor: "#7b5ea7"
    },
    showInFilters: true,
    showInLegend: true
  },
  {
    label: "Coal/Lignite",
    value: "Coal/Lignite",
    markerStyle: {
      color: "#8a5a24",
      fillColor: "#8a5a24"
    },
    showInFilters: true,
    showInLegend: true
  },
  {
    label: "Uranium",
    value: "Uranium",
    markerStyle: {
      color: "#c49a1f",
      fillColor: "#c49a1f"
    },
    showInFilters: true,
    showInLegend: true
  },
  {
    label: "Rare Earth",
    value: "Rare Earth",
    markerStyle: {
      color: "#1c7f93",
      fillColor: "#1c7f93"
    },
    showInFilters: true,
    showInLegend: true
  }
];
const resourceTypesByValue = Object.fromEntries(
  resourceTypeConfig.map((resourceType) => [resourceType.value, resourceType])
);
const basinStyleConfig = {
  "oil-gas-basin": {
    borderColor: "#5d6974",
    fillColor: "#c6ced4",
    fillOpacity: 0.15,
    borderWeight: 2,
    borderOpacity: 0.68
  },
  "gas-basin": {
    borderColor: "#3c9b7a",
    fillColor: "#a6dcc6",
    fillOpacity: 0.14,
    borderWeight: 2,
    borderOpacity: 0.68
  },
  "coal-lignite-region": {
    borderColor: "#a37a46",
    fillColor: "#d9bd98",
    fillOpacity: 0.14,
    borderWeight: 2,
    borderOpacity: 0.66
  },
  "uranium-region": {
    borderColor: "#c9ad3b",
    fillColor: "#efe1a0",
    fillOpacity: 0.14,
    borderWeight: 2,
    borderOpacity: 0.68
  },
  "rare-earth-lithium-region": {
    borderColor: "#3a9daf",
    fillColor: "#a9dbe4",
    fillOpacity: 0.14,
    borderWeight: 2,
    borderOpacity: 0.68
  },
  "default-region": {
    borderColor: "#7b8994",
    fillColor: "#c3ccd2",
    fillOpacity: 0.12,
    borderWeight: 2,
    borderOpacity: 0.64
  }
};
const sourceFilterCategories = [
  {
    label: "Government and Public Data",
    value: "government-public"
  },
  {
    label: "Historical and Reference",
    value: "historical-reference"
  },
  {
    label: "Company and Project Disclosures",
    value: "company-project"
  },
  {
    label: "News, SEC, and Investor Filings",
    value: "news-filings"
  }
];
let sourceCategoryById = {};
let resourceData = null;
let basinData = null;
let resourceLayer = null;
let basinLayer = null;
let texasBorderLayer = null;

const basinPane = texasMap.createPane("basinPane");
basinPane.style.zIndex = 250;

const texasBorderPane = texasMap.createPane("texasBorderPane");
texasBorderPane.style.zIndex = 450;
texasBorderPane.style.pointerEvents = "none";

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(texasMap);

async function loadResourceData() {
  try {
    const response = await fetch("data/resources.geojson");

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    resourceData = await response.json();
    console.log("Successfully loaded resource GeoJSON data.", resourceData);
    applyFilters();
    validateResourceRecords(resourceData);
    generateGeoJsonValidationReport(resourceData);
  } catch (error) {
    console.error("Failed to load resource GeoJSON data from data/resources.geojson.", error);
  }
}

async function loadBasinData() {
  try {
    const response = await fetch("data/texas_resource_regions_basins.geojson");

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    basinData = await response.json();
    const basinFeatureCount = Array.isArray(basinData.features) ? basinData.features.length : 0;
    console.log(`Successfully loaded ${basinFeatureCount} Texas resource region/basin overlay features.`);
    generateBasinValidationReport(basinData);
    applyBasinOverlayFilters();
  } catch (error) {
    console.error("Failed to load Texas resource region/basin GeoJSON data from data/texas_resource_regions_basins.geojson.", error);
  }
}

async function loadTexasBorderData() {
  try {
    const response = await fetch("data/texas_border.geojson");

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    const texasBorderData = await response.json();
    console.log("Successfully loaded Texas state border outline.");
    displayTexasBorder(texasBorderData);
  } catch (error) {
    console.warn("Failed to load Texas state border GeoJSON data from data/texas_border.geojson.", error);
  }
}

async function validateResourceRecords(data) {
  try {
    const response = await fetch("data/sourceRegistry.json");

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    const sourceRegistry = await response.json();
    const sourceIds = new Set(sourceRegistry.map((source) => source.id));
    let hasValidationWarning = false;

    data.features.forEach((feature) => {
      const properties = feature.properties || {};
      const featureLabel = properties.id || properties.name || "unknown feature";

      if (!properties.sourceId) {
        console.warn(`Resource validation warning: ${featureLabel} is missing sourceId.`);
        hasValidationWarning = true;
      } else if (!sourceIds.has(properties.sourceId)) {
        console.warn(`Resource validation warning: ${featureLabel} references missing sourceId "${properties.sourceId}".`);
        hasValidationWarning = true;
      }

      if (!properties.confidence) {
        console.warn(`Resource validation warning: ${featureLabel} is missing confidence.`);
        hasValidationWarning = true;
      }

      if (!properties.recordStatus) {
        console.warn(`Resource validation warning: ${featureLabel} is missing recordStatus.`);
        hasValidationWarning = true;
      }
    });

    if (!hasValidationWarning) {
      console.log("Resource record validation passed. All records include source metadata.");
    }
  } catch (error) {
    console.warn("Resource record validation could not load data/sourceRegistry.json.", error);
  }
}

async function loadSourceFilterOptions() {
  if (!sourceFilterSelect) {
    return;
  }

  try {
    const response = await fetch("data/sourceRegistry.json");

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    const sourceRegistry = await response.json();
    populateSourceFilterOptions(sourceRegistry);
    console.log("Successfully loaded source filter options.");
  } catch (error) {
    console.warn("Failed to load source filter options from data/sourceRegistry.json.", error);
  }
}

function populateSourceFilterOptions(sourceRegistry) {
  sourceCategoryById = buildSourceCategoryLookup(sourceRegistry);
  sourceFilterSelect.innerHTML = "";
  sourceFilterSelect.appendChild(createSourceFilterOption("", "All sources"));

  const availableCategories = new Set(Object.values(sourceCategoryById));
  sourceFilterCategories.forEach((category) => {
    if (!availableCategories.has(category.value)) {
      return;
    }

    sourceFilterSelect.appendChild(createSourceFilterOption(category.value, category.label));
  });
}

function buildSourceCategoryLookup(sourceRegistry) {
  return Object.fromEntries(
    sourceRegistry
      .filter((source) => source.id)
      .map((source) => [source.id, getSourceCategory(source)])
  );
}

function getSourceCategory(source) {
  const sourceId = source.id || "";
  const agency = source.agency || "";
  const sourceName = source.name || "";
  const updateStatus = source.updateStatus || "";
  const sourceText = `${sourceId} ${agency} ${sourceName} ${updateStatus}`.toLowerCase();

  if (
    sourceText.includes("reuters") ||
    sourceText.includes("sec") ||
    sourceText.includes("pr newswire") ||
    sourceText.includes("investor")
  ) {
    return "news-filings";
  }

  if (
    sourceText.includes("historical") ||
    sourceText.includes("texas state historical association") ||
    sourceText.includes("texas almanac")
  ) {
    return "historical-reference";
  }

  if (
    sourceText.includes("railroad commission") ||
    sourceText.includes("u.s. geological survey") ||
    sourceText.includes("u.s. energy information administration") ||
    sourceText.includes("bureau of economic geology")
  ) {
    return "government-public";
  }

  return "company-project";
}

function createSourceFilterOption(value, label) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  return option;
}

async function generateGeoJsonValidationReport(data = resourceData) {
  try {
    const response = await fetch("data/sourceRegistry.json");

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    const sourceRegistry = await response.json();
    const report = buildGeoJsonValidationReport(data, sourceRegistry);
    logGeoJsonValidationReport(report);
    return report;
  } catch (error) {
    console.warn("GeoJSON validation report could not load data/sourceRegistry.json.", error);
    return null;
  }
}

function buildGeoJsonValidationReport(data, sourceRegistry) {
  const features = Array.isArray(data?.features) ? data.features : [];
  const sourceIds = new Set(sourceRegistry.map((source) => source.id));
  const warningsByRecord = features
    .map((feature, index) => {
      const properties = feature.properties || {};
      const recordId = isBlank(properties.id) ? `Record ${index + 1} (missing id)` : properties.id;
      const warnings = getGeoJsonRecordWarnings(feature, sourceIds);

      return {
        recordId,
        warnings
      };
    })
    .filter((record) => record.warnings.length > 0);

  return {
    totalRecords: features.length,
    validRecords: features.length - warningsByRecord.length,
    recordsWithWarnings: warningsByRecord.length,
    warningsByRecord
  };
}

function getGeoJsonRecordWarnings(feature, sourceIds) {
  const properties = feature.properties || {};
  const warnings = [];

  if (isBlank(properties.id)) {
    warnings.push("Missing id.");
  }

  if (isBlank(properties.name)) {
    warnings.push("Missing name.");
  }

  if (isBlank(properties.resourceType)) {
    warnings.push("Missing resourceType.");
  }

  if (isBlank(properties.siteType)) {
    warnings.push("Missing siteType.");
  }

  if (!hasPointCoordinates(feature)) {
    warnings.push("Missing coordinates.");
  }

  if (isBlank(properties.sourceId)) {
    warnings.push("Missing sourceId.");
  } else if (!sourceIds.has(properties.sourceId)) {
    warnings.push(`sourceId "${properties.sourceId}" was not found in data/sourceRegistry.json.`);
  }

  if (isBlank(properties.confidence)) {
    warnings.push("Missing confidence.");
  }

  if (isBlank(properties.recordStatus)) {
    warnings.push("Missing recordStatus.");
  }

  if (isBlank(properties.sourceUrl)) {
    warnings.push("Missing sourceUrl.");
  }

  return warnings;
}

function logGeoJsonValidationReport(report) {
  console.group("GeoJSON Validation Report");
  console.log(`Total records: ${report.totalRecords}`);
  console.log(`Valid records: ${report.validRecords}`);
  console.log(`Records with warnings: ${report.recordsWithWarnings}`);

  if (report.warningsByRecord.length === 0) {
    console.log("No validation warnings found.");
  } else {
    report.warningsByRecord.forEach((record) => {
      console.group(`Warnings for ${record.recordId}`);
      record.warnings.forEach((warning) => {
        console.warn(warning);
      });
      console.groupEnd();
    });
  }

  console.groupEnd();
}

function generateBasinValidationReport(data = basinData) {
  const report = buildBasinValidationReport(data);
  logBasinValidationReport(report);
  return report;
}

function buildBasinValidationReport(data) {
  const features = Array.isArray(data?.features) ? data.features : [];
  const warningsByFeature = features
    .map((feature, index) => {
      const properties = feature.properties || {};
      const featureId = isBlank(properties.id) ? `Feature ${index + 1} (missing id)` : properties.id;
      const warnings = getBasinFeatureWarnings(feature);

      return {
        featureId,
        warnings
      };
    })
    .filter((feature) => feature.warnings.length > 0);
  const warningCount = warningsByFeature.reduce((total, feature) => total + feature.warnings.length, 0);

  return {
    totalFeatures: features.length,
    validFeatures: features.length - warningsByFeature.length,
    warningCount,
    warningsByFeature
  };
}

function getBasinFeatureWarnings(feature) {
  const properties = feature.properties || {};
  const warnings = [];
  const configuredResourceTypes = new Set(resourceTypeConfig.map((resourceType) => resourceType.value));
  const configuredBasinStyleKeys = new Set(Object.keys(basinStyleConfig));

  if (isBlank(properties.id)) {
    warnings.push("Missing id.");
  }

  if (isBlank(properties.name)) {
    warnings.push("Missing name.");
  }

  if (isBlank(properties.regionType)) {
    warnings.push("Missing regionType.");
  }

  if (!Array.isArray(properties.resourceTypes) || properties.resourceTypes.length === 0) {
    warnings.push("resourceTypes must be a non-empty array.");
  } else {
    properties.resourceTypes.forEach((resourceType) => {
      if (!configuredResourceTypes.has(resourceType)) {
        warnings.push(`resourceTypes value "${resourceType}" is not a configured resource type.`);
      }
    });
  }

  if (isBlank(properties.primaryResourceType)) {
    warnings.push("Missing primaryResourceType.");
  }

  if (isBlank(properties.styleKey)) {
    warnings.push("Missing styleKey.");
  } else if (!configuredBasinStyleKeys.has(properties.styleKey)) {
    warnings.push(`styleKey "${properties.styleKey}" is not defined in basinStyleConfig.`);
  }

  if (!hasValidBasinGeometry(feature)) {
    warnings.push("Geometry must be Polygon or MultiPolygon with valid [longitude, latitude] coordinates.");
  }

  if (isBlank(properties.sourceId)) {
    warnings.push("Missing sourceId.");
  }

  if (isBlank(properties.sourceName)) {
    warnings.push("Missing sourceName.");
  }

  if (isBlank(properties.sourceUrl)) {
    warnings.push("Missing sourceUrl.");
  }

  if (isBlank(properties.confidence)) {
    warnings.push("Missing confidence.");
  }

  if (isBlank(properties.recordStatus)) {
    warnings.push("Missing recordStatus.");
  }

  return warnings;
}

function hasValidBasinGeometry(feature) {
  const geometry = feature.geometry;

  if (!geometry || !["Polygon", "MultiPolygon"].includes(geometry.type)) {
    return false;
  }

  if (!Array.isArray(geometry.coordinates) || geometry.coordinates.length === 0) {
    return false;
  }

  if (geometry.type === "Polygon") {
    return polygonCoordinatesAppearValid(geometry.coordinates);
  }

  return geometry.coordinates.every((polygon) => polygonCoordinatesAppearValid(polygon));
}

function polygonCoordinatesAppearValid(polygonCoordinates) {
  return (
    Array.isArray(polygonCoordinates) &&
    polygonCoordinates.length > 0 &&
    polygonCoordinates.every((ring) => linearRingCoordinatesAppearValid(ring))
  );
}

function linearRingCoordinatesAppearValid(ringCoordinates) {
  return (
    Array.isArray(ringCoordinates) &&
    ringCoordinates.length >= 4 &&
    ringCoordinates.every((position) => positionAppearsValidLongitudeLatitude(position))
  );
}

function positionAppearsValidLongitudeLatitude(position) {
  if (!Array.isArray(position) || position.length < 2) {
    return false;
  }

  const [longitude, latitude] = position;

  return (
    Number.isFinite(longitude) &&
    Number.isFinite(latitude) &&
    longitude >= -180 &&
    longitude <= 180 &&
    latitude >= -90 &&
    latitude <= 90
  );
}

function logBasinValidationReport(report) {
  console.group("Basin GeoJSON Validation Report");
  console.log(`Total basin features: ${report.totalFeatures}`);
  console.log(`Valid basin features: ${report.validFeatures}`);
  console.log(`Warnings: ${report.warningCount}`);

  if (report.warningsByFeature.length === 0) {
    console.log("No basin validation warnings found.");
  } else {
    report.warningsByFeature.forEach((feature) => {
      console.group(`Warnings for ${feature.featureId}`);
      feature.warnings.forEach((warning) => {
        console.warn(warning);
      });
      console.groupEnd();
    });
  }

  console.groupEnd();
}

function hasPointCoordinates(feature) {
  const coordinates = feature.geometry?.coordinates;

  return (
    Array.isArray(coordinates) &&
    coordinates.length >= 2 &&
    Number.isFinite(coordinates[0]) &&
    Number.isFinite(coordinates[1])
  );
}

function isBlank(value) {
  return value === null || value === undefined || String(value).trim() === "";
}

function displayResourceMarkers(data) {
  if (resourceLayer) {
    resourceLayer.removeFrom(texasMap);
  }

  resourceLayer = L.geoJSON(data, {
    pointToLayer: (feature, latlng) => {
      return L.marker(latlng, {
        icon: createResourceMarkerIcon(feature.properties)
      });
    },
    onEachFeature: (feature, layer) => {
      layer.bindPopup(createResourcePopup(feature.properties));
    }
  }).addTo(texasMap);
}

function displayBasinOverlays(data) {
  if (basinLayer) {
    basinLayer.removeFrom(texasMap);
  }

  basinLayer = L.geoJSON(data, {
    pane: "basinPane",
    style: (feature) => getBasinOverlayStyle(feature.properties || {}),
    onEachFeature: (feature, layer) => {
      layer.bindPopup(createBasinPopup(feature.properties || {}));
      layer.on({
        mouseover: () => {
          layer.setStyle(getBasinOverlayHoverStyle(feature.properties || {}));
        },
        mouseout: () => {
          layer.setStyle(getBasinOverlayStyle(feature.properties || {}));
        }
      });
    }
  }).addTo(texasMap);
}

function displayTexasBorder(data) {
  if (texasBorderLayer) {
    texasBorderLayer.removeFrom(texasMap);
  }

  // Visual reference only; this border is not affected by resource filters or overlay toggles.
  texasBorderLayer = L.geoJSON(data, {
    pane: "texasBorderPane",
    interactive: false,
    style: {
      color: "#1f2933",
      weight: 2.75,
      opacity: 1,
      fill: false,
      fillOpacity: 0
    }
  }).addTo(texasMap);
}

function applyBasinOverlayFilters() {
  if (!basinData) {
    return;
  }

  if (!basinOverlayToggle?.checked) {
    removeBasinOverlays();
    return;
  }

  const selectedResourceTypes = getSelectedResourceTypes();
  const filteredBasinData = {
    ...basinData,
    features: basinData.features.filter((feature) => {
      return basinMatchesSelectedResourceTypes(feature.properties?.resourceTypes, selectedResourceTypes);
    })
  };

  displayBasinOverlays(filteredBasinData);
}

function removeBasinOverlays() {
  if (basinLayer) {
    basinLayer.removeFrom(texasMap);
    basinLayer = null;
  }
}

function basinMatchesSelectedResourceTypes(basinResourceTypes, selectedResourceTypes) {
  const resourceTypes = Array.isArray(basinResourceTypes) ? basinResourceTypes : [basinResourceTypes];

  return resourceTypes.some((resourceType) => selectedResourceTypes.has(resourceType));
}

function getBasinOverlayStyle(properties = {}) {
  const style = basinStyleConfig[getBasinStyleKey(properties)] || basinStyleConfig["default-region"];

  return {
    color: style.borderColor,
    fillColor: style.fillColor,
    fillOpacity: style.fillOpacity,
    weight: style.borderWeight,
    opacity: style.borderOpacity,
    className: "basin-overlay-path"
  };
}

function getBasinStyleKey(properties = {}) {
  const primaryResourceType = properties.primaryResourceType;
  const resourceTypes = Array.isArray(properties.resourceTypes) ? properties.resourceTypes : [];

  if (primaryResourceType === "Rare Earth" || primaryResourceType === "Lithium") {
    return "rare-earth-lithium-region";
  }

  if (primaryResourceType === "Uranium") {
    return "uranium-region";
  }

  if (primaryResourceType === "Coal/Lignite") {
    return "coal-lignite-region";
  }

  if (primaryResourceType === "Oil") {
    return "oil-gas-basin";
  }

  if (primaryResourceType === "Natural Gas") {
    return "gas-basin";
  }

  if (resourceTypes.includes("Rare Earth") || resourceTypes.includes("Lithium")) {
    return "rare-earth-lithium-region";
  }

  if (resourceTypes.includes("Uranium")) {
    return "uranium-region";
  }

  if (resourceTypes.includes("Coal/Lignite")) {
    return "coal-lignite-region";
  }

  if (resourceTypes.includes("Oil")) {
    return "oil-gas-basin";
  }

  if (resourceTypes.includes("Natural Gas")) {
    return "gas-basin";
  }

  return properties.styleKey || "default-region";
}

function getBasinOverlayHoverStyle(properties = {}) {
  const baseStyle = getBasinOverlayStyle(properties);

  return {
    ...baseStyle,
    fillOpacity: Math.min(baseStyle.fillOpacity + 0.08, 0.26),
    weight: baseStyle.weight + 1,
    opacity: Math.min(baseStyle.opacity + 0.12, 0.9)
  };
}

function createResourceMarkerIcon(properties) {
  const markerStyle = getResourceMarkerStyle(properties.resourceType);

  return L.icon({
    className: "resource-marker-icon",
    iconUrl: createSiteTypeMarkerIconUrl(properties.siteType, markerStyle),
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10]
  });
}

function getResourceMarkerStyle(resourceType) {
  const defaultStyle = {
    color: "#52616f",
    fillColor: "#52616f"
  };
  const style = resourceTypesByValue[resourceType]?.markerStyle || defaultStyle;

  return {
    radius: 8,
    weight: 2,
    opacity: 1,
    fillOpacity: 0.85,
    ...style
  };
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

function applyFilters() {
  if (!resourceData) {
    return;
  }

  const selectedResourceTypes = getSelectedResourceTypes();
  const selectedSiteTypes = getSelectedSiteTypes();
  const selectedSourceCategory = getSelectedSourceCategory();
  const searchQuery = getSiteSearchQuery();
  const filteredData = {
    ...resourceData,
    features: resourceData.features.filter((feature) => {
      return (
        selectedResourceTypes.has(feature.properties.resourceType) &&
        selectedSiteTypes.has(feature.properties.siteType) &&
        sourceCategoryMatchesFilter(feature.properties.sourceId, selectedSourceCategory) &&
        siteNameMatchesSearch(feature.properties.name, searchQuery)
      );
    })
  };

  displayResourceMarkers(filteredData);
}

function getSelectedResourceTypes() {
  return new Set(
    Array.from(resourceTypeCheckboxes)
      .filter((checkbox) => checkbox.checked)
      .map((checkbox) => checkbox.value)
  );
}

function getSelectedSiteTypes() {
  return new Set(
    Array.from(siteTypeCheckboxes)
      .filter((checkbox) => checkbox.checked)
      .map((checkbox) => checkbox.value)
  );
}

function getSiteSearchQuery() {
  return siteSearchInput.value.trim().toLowerCase();
}

function getSelectedSourceCategory() {
  return sourceFilterSelect?.value.trim() || "";
}

function sourceCategoryMatchesFilter(featureSourceId, selectedSourceCategory) {
  if (!selectedSourceCategory) {
    return true;
  }

  return sourceCategoryById[featureSourceId] === selectedSourceCategory;
}

function siteNameMatchesSearch(siteName, searchQuery) {
  if (!searchQuery) {
    return true;
  }

  return String(siteName ?? "").toLowerCase().includes(searchQuery);
}

function resetFilters() {
  resourceTypeCheckboxes.forEach((checkbox) => {
    checkbox.checked = true;
  });

  siteTypeCheckboxes.forEach((checkbox) => {
    checkbox.checked = true;
  });

  siteSearchInput.value = "";

  if (sourceFilterSelect) {
    sourceFilterSelect.value = "";
  }

  applyFilters();
  applyBasinOverlayFilters();
}

function handleResourceTypeFilterChange() {
  applyFilters();
  applyBasinOverlayFilters();
}

resourceTypeCheckboxes.forEach((checkbox) => {
  checkbox.addEventListener("change", handleResourceTypeFilterChange);
});

siteTypeCheckboxes.forEach((checkbox) => {
  checkbox.addEventListener("change", applyFilters);
});

siteSearchInput.addEventListener("input", applyFilters);
sourceFilterSelect.addEventListener("change", applyFilters);
resetFiltersButton.addEventListener("click", resetFilters);
basinOverlayToggle.addEventListener("change", applyBasinOverlayFilters);

function createResourcePopup(properties) {
  return `
    <div class="resource-popup">
      <h3>${escapeHtml(properties.name)}</h3>
      ${createPopupRow("Resource type", properties.resourceType)}
      ${createPopupRow("Site type", formatSiteTypeLabel(properties.siteType))}
      ${createStatusRow(properties.status)}
      ${createPopupRow("County", properties.county)}
      ${createPopupRow("Operator", properties.operator)}
      ${createPopupRow("Description", properties.description)}
      ${createConfidenceBadge(properties.confidence)}
      ${createPopupRow("Record status", properties.recordStatus)}
      ${createSourceRow(properties.sourceName, properties.sourceUrl)}
      ${createPopupRow("Notes", properties.notes)}
    </div>
  `;
}

function formatSiteTypeLabel(siteType) {
  const siteTypeLabels = {
    deposit: "Deposit",
    production: "Production Site",
    facility: "Processing Facility",
    exploration: "Exploration",
    "historical mine": "Historical Mine"
  };

  if (isBlank(siteType)) {
    return siteType;
  }

  return siteTypeLabels[siteType] || titleCase(siteType);
}

function titleCase(value) {
  return String(value)
    .split(" ")
    .filter((word) => word.length > 0)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function createBasinPopup(properties) {
  return `
    <div class="basin-popup">
      <h3>${escapeHtml(properties.name)}</h3>
      ${createPopupRow("Region type", properties.regionType)}
      ${createPopupRow("Resource types", formatPopupList(properties.resourceTypes))}
      ${createStatusRow(properties.status)}
      ${createPopupRow("Description", properties.description)}
      ${createConfidenceBadge(properties.confidence)}
      ${createSourceRow(properties.sourceName, properties.sourceUrl)}
      ${createPopupRow("Notes", properties.notes)}
    </div>
  `;
}

function formatPopupList(value) {
  if (Array.isArray(value)) {
    return value.filter((item) => !isBlank(item)).join(", ");
  }

  return value;
}

function createStatusRow(status) {
  if (isBlank(status)) {
    return "";
  }

  const statusClass = getStatusClass(status);
  return `<p><strong>Status:</strong> <span class="status-badge ${statusClass}">${escapeHtml(status)}</span></p>`;
}

function getStatusClass(status) {
  const normalizedStatus = String(status).toLowerCase();

  if (
    normalizedStatus.includes("not active") ||
    normalizedStatus.includes("inactive") ||
    normalizedStatus.includes("closed") ||
    normalizedStatus.includes("retired") ||
    normalizedStatus.includes("former") ||
    normalizedStatus.includes("abandoned")
  ) {
    return "status-inactive";
  }

  if (normalizedStatus.includes("active")) {
    return "status-active";
  }

  return "status-other";
}

function createPopupRow(label, value) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return "";
  }

  return `<p><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>`;
}

function createConfidenceBadge(confidence) {
  const normalizedConfidence = normalizeConfidence(confidence);
  const badgeClass = `confidence-${normalizedConfidence.toLowerCase()}`;
  const confidenceMeaning = getConfidenceMeaning(normalizedConfidence);

  return `
    <div class="confidence-badge-row">
      <span class="confidence-badge ${badgeClass}">${escapeHtml(normalizedConfidence)}</span>
      <span class="confidence-meaning">${escapeHtml(confidenceMeaning)}</span>
    </div>
  `;
}

function normalizeConfidence(confidence) {
  const normalizedValue = String(confidence ?? "").trim();
  const allowedConfidenceLevels = ["High", "Medium", "Low"];

  return allowedConfidenceLevels.includes(normalizedValue) ? normalizedValue : "Unknown";
}

function getConfidenceMeaning(confidence) {
  const confidenceMeanings = {
    High: "Source provides strong location or record support.",
    Medium: "Source support is useful, but details may need review.",
    Low: "Record is approximate, demo, or needs confirmation.",
    Unknown: "Confidence has not been assigned."
  };

  return confidenceMeanings[confidence];
}

function createSourceRow(sourceName, sourceUrl) {
  if (isBlank(sourceName) && isBlank(sourceUrl)) {
    return "";
  }

  const sourceLabel = isBlank(sourceName) ? "Open source" : sourceName;

  if (isBlank(sourceUrl)) {
    return createPopupRow("Source", sourceLabel);
  }

  return `<p><strong>Source:</strong> <a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(sourceLabel)}</a></p>`;
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

loadResourceData();
loadSourceFilterOptions();
loadBasinData();
loadTexasBorderData();
