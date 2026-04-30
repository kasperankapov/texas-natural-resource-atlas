# Texas Natural Resource Atlas

Texas Natural Resource Atlas is a static web app for exploring selected Texas natural resource sites, broad resource-bearing regions, and public-source metadata on an interactive Leaflet map.

The app runs entirely in the browser and is designed to be hosted on GitHub Pages. There is no backend, database, build process, or package installation step.


## Main Features

- Interactive Leaflet map centered on Texas.
- Point markers for natural resource sites.
- Resource region and basin overlays.
- Solid Texas border reference layer.
- Resource type, site type, source category, and advanced text search filters.
- Region overlay show/hide toggle.
- Optional marker clustering, with clusters separated by resource type.
- Visible summary counts for currently filtered supported records.
- Marker and region popups with status, confidence, notes, and source links.
- Individual resource pages for Oil, Natural Gas, Lithium, Coal/Lignite, Uranium, and Rare Earth.
- Per-resource GeoJSON download files for the six public UI resource pages.
- Local Texas flag asset in the page header.
- Responsive layout for desktop, laptop, and narrow screens.

## Supported Resource Types

- Oil
- Natural Gas
- Lithium
- Coal/Lignite
- Uranium
- Rare Earth

These six resource types are exposed in the map filters, resource pages, mini-maps, charts, and summary counts.

## Staged Data Not Exposed in UI

The combined dataset also contains a small number of staged records for resource categories that are not yet exposed in the filter UI or resource pages:

- Salt/Sulfur
- Aggregates/Cement
- Frac Sand
- Helium

These records remain in `data/resources.geojson` for future expansion, but the current public interface intentionally focuses on the six supported resource types above.

## Map Layers and Data

### Point Markers

Point markers come from `data/resources.geojson`. Each record represents a resource-related site, project area, facility, mine, field, or public-record location. Marker color represents resource type, and marker shape represents site type.

Resource page download buttons use filtered GeoJSON files such as `data/oil.geojson`, `data/natural-gas.geojson`, and `data/lithium.geojson`. Those files should be kept in sync with `data/resources.geojson` when records are added or changed.

### Resource Region Overlays

Resource region overlays come from `data/texas_resource_regions_basins.geojson`. These polygons represent broad basins, shale trends, lignite belts, uranium provinces, and mineralized districts. They are approximate reference overlays and are not official legal, lease, production, or exact geologic boundaries.

### Texas Border Layer

The Texas border layer comes from `data/texas_border.geojson`. It is a simplified Texas-only boundary used as a visual reference layer. It is not affected by filters or overlay toggles.

### Source Registry

Source metadata is stored in `data/sourceRegistry.json`. The app uses this registry for source categories and source validation. Individual marker and region popups link to their source records when source URLs are available.

The registry also includes source metadata for resource region overlays and staged data categories.

## Tech Stack

- HTML
- CSS
- JavaScript
- Leaflet
- Leaflet.markercluster
- Chart.js
- GeoJSON
- GitHub Pages

Leaflet, Leaflet.markercluster, and Chart.js are stored locally in `vendor/` so the deployed app is less dependent on third-party CDN availability.

## Run Locally

Because the app loads local data with `fetch()`, run it through a local static server instead of opening `index.html` directly with `file://`.

From the project folder:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://127.0.0.1:8000/
```

## Deploy with GitHub Pages

1. Push the project files to a GitHub repository.
2. In the repository, go to `Settings` > `Pages`.
3. Under `Build and deployment`, choose `Deploy from a branch`.
4. Select the branch that contains `index.html`, usually `main`.
5. Select the root folder, usually `/`.
6. Save the settings.
7. Open the GitHub Pages URL after deployment finishes.

The app should work on GitHub Pages because it uses relative paths and static local files.

## Data Limitations

- The dataset is static and does not update automatically.
- Some records use approximate coordinates.
- Some sites represent broad public-source project areas rather than exact facility boundaries.
- Region overlays are manually simplified for visualization.
- Source categories are generalized for browsing and do not replace reviewing individual source links.
- Staged data categories may be present in `data/resources.geojson` before they are exposed in the public UI.

## Public-Record and Source Disclaimer

This project uses public-record, public-source, and manually curated data. Records should be manually fact-checked before being used for research, operational, regulatory, financial, legal, or environmental decision-making.

The app does not claim that region polygons are official boundaries. It also does not claim that all site statuses, operators, or coordinates are current or exhaustive.

## Future Improvements

- Add more verified public-record site data.
- Add richer data-quality and fact-checking workflows.
- Add UI support for staged resource categories when records and source documentation are ready.
- Add better documentation for source review and record confidence.
- Add automated data validation scripts.
- Add a final project screenshot.

## Data Maintenance Notes

When updating data:

1. Add or edit records in `data/resources.geojson`.
2. Confirm each record has a valid `sourceId` in `data/sourceRegistry.json`.
3. Update the matching per-resource download file if the record belongs to one of the six supported resource pages.
4. Validate coordinates use GeoJSON order: longitude first, latitude second.
5. Check the map, filters, popups, resource page counts, and downloads locally before pushing.
