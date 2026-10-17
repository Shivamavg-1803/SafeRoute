# Data provenance

## Explorer dataset

`assets/js/data.js` generates 72 **fictional** report examples in six fictional neighborhoods. Descriptions are handwritten example scenarios about lighting, public transport, walkway access, and public-space concerns. Dates, categories, and areas use a deterministic seeded generator.

No examples describe a real person, place, or incident. The map is an original schematic with no latitude/longitude and no third-party map tiles. Report dates are anchored to 16 October 2026, so “last 30 demo days” is a data-relative filter rather than a live-feed claim. When approved local entries are added, filtering uses the latest date in the combined explorer collection.

## Machine-learning dataset

`sample-weekly-counts.csv` contains **312 separate synthetic observations**:

- Six areas with the same names as the fictional map.
- 52 weekly dates per area, from 20 October 2025 through 12 October 2026.
- Nonnegative integer counts generated using an area-specific level, a trend, a seasonal term, dependence on the previous count, and seeded noise.

These counts are **not totals of the 72 explorer reports**. The two datasets demonstrate different parts of the project. Neither is a real-world training or evaluation dataset.

To regenerate the CSV from the same source, with Node.js installed, run this from the project root:

```sh
node scripts/export-sample.cjs
```

The seed and exact generation rules are in `assets/js/data.js`. There is no dataset download or network request during website use.

## Local submissions

The report form accepts fictional practice entries only. Pending and rejected entries are excluded from the explorer. Approval affects only that browser. These entries do not feed into the ML dataset. They are kept in browser storage under `saferoute.demo.v1`, with an in-memory fallback when saving is blocked.

## Imported CSVs

Imported data replaces the Insights lab dataset in memory. It does not replace the explorer or write to the repository. The user is responsible for permissions, anonymization, provenance, and interpreting the results. Structural validation is not a data-quality audit.

## Real information included

Only the support/information directory points to real services. The entries use official sources, listed in `docs/SOURCES.md`. The author name and SDG project context are project metadata, not data used to train the model.
