# Texas Natural Resource Atlas Grading Categories

Total: 100 points

## Functionality: 50 Points

The largest part of the grade should focus on whether the atlas works as an interactive map demo.

Evaluate whether:

- The Leaflet map loads correctly.
- Resource point markers display.
- Resource region/basin overlays display.
- The Texas border layer displays.
- Resource type filters work.
- Site type filters work.
- Source category filtering works.
- Site search works.
- Resource page links return to the map with the correct resource highlighted.
- The app can be demonstrated without major broken behavior.

## Data Organization: 20 Points

This category should evaluate whether the local data files are clean, consistent, and understandable.

Evaluate whether:

- Resource records use consistent fields.
- Coordinates use GeoJSON order: longitude, latitude.
- Site types are consistent enough to support filtering.
- `sourceId` values connect to `data/sourceRegistry.json`.
- Region overlays are stored separately from point data.

## User Interface: 20 Points

This category should evaluate whether the website is readable, visually clear, and usable for a short demo.

Evaluate whether:

- The layout is clean and readable.
- The map remains visible and usable.
- Site type legend is understandable.
- Marker and popup styling is readable.
- Resource pages match the style of the map page.
- Navigation between pages works.

## Technical Implementation: 5 Points

This category should evaluate whether the project is technically appropriate for a static GitHub Pages site.

Evaluate whether:

- The project uses HTML, CSS, JavaScript, Leaflet, and local data files.
- There is no unnecessary backend or build step.
- JavaScript is organized into reusable helper functions.
- There are no blocking console errors.

## Documentation: 5 Points

This category should evaluate whether the project is understandable to someone reviewing or running it.

Evaluate whether:

- `README.md` describes the project clearly.
- The tech stack is listed.
- Local run instructions are included.
- Data limitations and public-source disclaimers are included.
- Time log is included.
- Supporting data-source documentation is available.