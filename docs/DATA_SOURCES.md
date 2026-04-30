# Data Sources

Texas Natural Resource Atlas uses public-record and public-source data so mapped records can be verified, cited, and explained without relying on private databases or undocumented sources. Public agency sources are also appropriate for a static GitHub Pages app because source metadata can be stored locally with the project.

The app's mapped records live in `data/resources.geojson`. Before public records are added to that GeoJSON file, some records may need manual selection, cleanup, location checking, field normalization, and citation review.

The current public interface exposes six resource types: Oil, Natural Gas, Lithium, Coal/Lignite, Uranium, and Rare Earth. The combined dataset may also include staged records for future categories such as Salt/Sulfur, Aggregates/Cement, Frac Sand, and Helium; those categories should not be treated as public UI features until filters, pages, and documentation are added.

## Source Registry

`data/sourceRegistry.json` is a local registry of public data sources used by the atlas. The app uses it for source category filtering and validation, while individual marker and region records keep their own `sourceName` and `sourceUrl` for direct citation links.

The registry documents where data may come from, what each source is useful for, and what limitations should be considered before adding or updating records in the GeoJSON dataset.

Each source object uses these fields:

- `id`: Stable internal identifier for the source.
- `name`: Human-readable source name.
- `agency`: Organization that publishes or maintains the source.
- `resourceTypes`: Resource categories the source may support.
- `accessType`: How the source is accessed, such as a public web page, linked documents, or data release.
- `sourceUrl`: Public URL for the source.
- `usedFor`: How the atlas may use the source.
- `updateStatus`: Whether the source is an official current source, official data release, or legacy/historical reference.
- `limitations`: Known issues that affect how the source should be interpreted.
- `citationNote`: Reminder for how to cite or qualify the source in project documentation.

## Source Coverage

### Oil

Oil records are supported by Railroad Commission of Texas formation pages and production resources, EIA Texas and refinery references, Texas State Historical Association history pages, and company/project sources for major refineries, terminals, and storage assets.

Many oil records are representative points for fields, basins, terminals, refineries, or historical sites. They should not be interpreted as exact lease boundaries or facility footprints.

### Natural Gas

Natural gas records are supported by Railroad Commission of Texas formation pages, EIA natural gas data, LNG/operator sources, storage and pipeline hub references, and public company materials.

Some natural gas records use detailed site labels such as pipeline hubs, storage facilities, LNG terminals, or processing plants while still mapping to broad filter categories.

### Lithium

Lithium records are supported by public project disclosures, company materials, public map references, critical-mineral sources, and selected geologic references.

Texas lithium records are mostly project-stage, brine-resource, produced-water opportunity, or facility records. Many are approximate project-area points rather than producing mine sites.

### Coal/Lignite

Coal/lignite records are supported by these Railroad Commission of Texas sources:

- `rrc-surface-mining`: Surface Mining & Reclamation
- `rrc-surface-mining-programs`: Surface Mining Programs
- `rrc-mining-permits`: Mining Permits

These sources are useful for regulatory context, program context, and permit-related materials. Some linked documents may require manual review before site records can be mapped.

### Uranium

Uranium records are supported by these Railroad Commission of Texas sources:

- `rrc-surface-mining`: Surface Mining & Reclamation
- `rrc-surface-mining-programs`: Surface Mining Programs
- `rrc-mining-permits`: Mining Permits

These sources help explain uranium exploration and surface mining regulation in Texas. They may not provide a clean map-ready dataset by themselves.

### Rare Earth

Rare earth and critical mineral records are supported by:

- `usgs-global-ree-occurrences`: Global Rare Earth Element Occurrence Database

Additional mapped rare earth records use public project, company, BEG, USGS, Mindat, and public reporting sources where appropriate.

This USGS source can support rare earth occurrence context and possible future mapped records, but records should be reviewed for Texas relevance, coordinate quality, and current significance.

### Resource Region Overlays

Resource region overlays in `data/texas_resource_regions_basins.geojson` use public source metadata in `data/sourceRegistry.json`. Their polygons are broad educational overlays and are not official legal, lease, production, or exact geologic boundaries.

### Staged Future Categories

The dataset includes staged records for Salt/Sulfur, Aggregates/Cement, Frac Sand, and Helium. Their sources are tracked in `data/sourceRegistry.json`, but the categories do not yet have filter controls, resource pages, or public-facing documentation equivalent to the six supported resource types.

### Legacy/Historical

The legacy/historical source is:

- `usgs-mrds`: Mineral Resources Data System

MRDS can provide historical reference information about mineral deposits, mines, prospects, and occurrences. It should not be treated as proof of current operating status without confirmation from newer sources.

## Known Limitations

- Public records may be spread across web pages, PDFs, spreadsheets, data releases, and legacy systems.
- Some sources provide regulatory context rather than map-ready point data.
- Linked permit documents may need manual extraction and cleanup.
- Coordinates may be missing, approximate, outdated, or unsuitable for precise mapping.
- Source terminology may not match the app's simplified `resourceType` and `siteType` values.
- Historical records may describe past activity rather than current operations.
- Records should be reviewed before being added to `data/resources.geojson`.
- Every mapped record should retain a source note so users can understand where the information came from.

## Data Update Workflow

When adding or changing records:

- Keep `sourceId`, `sourceName`, and `sourceUrl` filled in for every mapped record.
- Confirm `sourceId` exists in `data/sourceRegistry.json`.
- Use GeoJSON coordinate order: longitude first, latitude second.
- Use broad `siteType` values for filtering, and preserve more specific labels in `detailedSiteType` when available.
- Keep per-resource download files synchronized with `data/resources.geojson` for the six supported resource pages.
- Manually review approximate points, historical records, and project-area records before presenting them as current or exact.
