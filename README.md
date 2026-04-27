# Texas Natural Resource Atlas

Texas Natural Resource Atlas is a static web app for exploring selected Texas natural resource sites, broad resource-bearing regions, and public-source metadata on an interactive Leaflet map.

The app runs entirely in the browser and is designed to be hosted on GitHub Pages. There is no backend, database, build process, or package installation step.

## Screenshot

Add a project screenshot here after final visual review.

```markdown
![Texas Natural Resource Atlas screenshot](docs/screenshot.png)
```

## Main Features

- Interactive Leaflet map centered on Texas.
- Point markers for natural resource sites.
- Resource region and basin overlays.
- Solid Texas border reference layer.
- Resource type, site type, source category, and site name filters.
- Region overlay show/hide toggle.
- Marker and region popups with status, confidence, notes, and source links.
- Local Texas flag asset in the page header.
- Responsive layout for desktop, laptop, and narrow screens.

## Supported Resource Types

- Oil
- Natural Gas
- Lithium
- Coal/Lignite
- Uranium
- Rare Earth

## Map Layers and Data

### Point Markers

Point markers come from `data/resources.geojson`. Each record represents a resource-related site, project area, facility, mine, field, or public-record location. Marker color represents resource type, and marker shape represents site type.

### Resource Region Overlays

Resource region overlays come from `data/texas_resource_regions_basins.geojson`. These polygons represent broad basins, shale trends, lignite belts, uranium provinces, and mineralized districts. They are approximate educational overlays and are not official legal, lease, production, or exact geologic boundaries.

### Texas Border Layer

The Texas border layer comes from `data/texas_border.geojson`. It is a simplified Texas-only boundary used as a visual reference layer. It is not affected by filters or overlay toggles.

### Source Registry

Source metadata is stored in `data/sourceRegistry.json`. The app uses this registry for source categories and source validation. Individual marker and region popups link to their source records when source URLs are available.

## Tech Stack

- HTML
- CSS
- JavaScript
- Leaflet
- GeoJSON
- GitHub Pages

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

## Public-Record and Source Disclaimer

This project uses public-record, public-source, and manually curated data for educational MVP purposes. Records should be manually fact-checked before being used for research, operational, regulatory, financial, legal, or environmental decision-making.

The app does not claim that region polygons are official boundaries. It also does not claim that all site statuses, operators, or coordinates are current or exhaustive.

## Future Improvements

- Add more verified public-record site data.
- Add visible summary counts for filtered records.
- Add richer data-quality and fact-checking workflows.
- Add downloadable filtered datasets.
- Add better documentation for source review and record confidence.
- Add automated data validation scripts.
- Add a final project screenshot.

## AI Assistance Disclosure

This MVP was developed with AI assistance for planning, code generation, debugging, data-format validation, documentation drafting, and UI cleanup. The project owner remains responsible for reviewing, testing, fact-checking, and understanding the final code and data before publication.
