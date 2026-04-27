# Data Sources

Texas Natural Resource Atlas uses public-record data so the MVP can be verified, cited, and explained without relying on private databases or undocumented sources. Public agency sources are also appropriate for a static GitHub Pages app because source metadata can be stored locally with the project.

The app's mapped sample records live in `data/resources.geojson`. Before public records are added to that GeoJSON file, some records may need manual selection, cleanup, location checking, field normalization, and citation review.

## Source Registry

`data/sourceRegistry.json` is a local registry of public data sources that may support future atlas records. It does not render on the map yet. Its purpose is to document where data may come from, what each source is useful for, and what limitations should be considered before adding records to the GeoJSON dataset.

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

This USGS source can support rare earth occurrence context and possible future mapped records, but records should be reviewed for Texas relevance, coordinate quality, and current significance.

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
