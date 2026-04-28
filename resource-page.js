const resourcePage = document.querySelector("[data-resource-page]");
const currentResourceType = resourcePage?.dataset.resourceType || "";
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
  updateMappedResourceSiteCount(resourceData);
  renderResourcePageCharts(resourceData);
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

function setResourceCountFallback(message) {
  getResourceCountElements().forEach((countElement) => {
    countElement.textContent = message;
  });
}

function getResourceCountElements() {
  return document.querySelectorAll("[data-resource-count], #mapped-oil-count");
}

function setChartStatus(elementId, message) {
  const statusElement = document.querySelector(`#${elementId}`);

  if (statusElement) {
    statusElement.textContent = message;
    statusElement.hidden = message === "";
  }
}

function renderResourcePageCharts(resourceData) {
  if (!window.Chart) {
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
