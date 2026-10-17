# SafeRoute

**An individual SDG 5 (Gender Equality) project by Shivam Mathur.**

A complete, buildless website for exploring community information, finding official support resources, and experimenting with machine learning. It works on GitHub Pages with plain HTML, CSS, and JavaScript. No npm installation, API key, paid map, or backend is needed to run this version.

## Start here

1. Extract the ZIP. Keep the contents of `saferoute-site` together.
2. Open `index.html` in a current desktop browser. JavaScript must be enabled.
3. Try **Explore**, **Insights lab**, **Resources**, and **About**.
4. To publish, follow [the GitHub Pages guide](docs/GITHUB_PAGES.md).

Local browser storage can be limited when opening a `file://` URL or in private browsing. The app falls back to memory when a write is blocked. GitHub Pages provides a normal HTTPS origin. Opening the site locally and opening the published site use separate browser storage.

## Included features

| Area | Working behavior |
| --- | --- |
| Overview | Responsive introduction, fictional city map, navigation |
| Explorer | 72 fictional reports; area, category, time-window, and text filters; sorting; details; zoom |
| Reporting demo | Fictional report form; validation; local pending queue; approval/rejection/reopening; local export and deletion |
| Local review | Approve an entry to show it in this browser's explorer; flag bundled examples locally |
| Insights lab | Real ridge-regression training in JavaScript; chronological validation; baseline comparison; next-week count estimate; chart and exact-value table |
| CSV import | Validates aggregated weekly counts; fits/evaluates the model entirely in memory |
| Model export | Downloads model coefficients, preprocessing, metrics, validation values, and forecasts as JSON |
| Resources | Searchable links to official Indian emergency, complaint, cybercrime, and SDG information |

## What this version represents

This is a **functional academic prototype**. The bundled reports, neighborhoods, and weekly counts are fictional. The model estimates **submitted-report counts**, not violence, an individual's risk, a safe route, or a neighborhood's safety.

Report submissions are saved in the visitor's browser only. They are **not sent to you, a shared database, the police, or any support organization**. The local review screen is accessible to anyone using that browser; it is not an authenticated admin panel. This version does not provide maps of real places, route planning, live incidents, accounts, or notifications.

Hosting this static website publicly does not turn it into a public reporting service. A shared reporting service requires a backend and appropriate moderation/privacy processes; see [the production roadmap](docs/PRODUCTION_ROADMAP.md).

## Project files

| Path | Purpose |
| --- | --- |
| `index.html` | Main website and all application views |
| `assets/css/styles.css` | Responsive layout, colors, forms, charts, and dialogs |
| `assets/js/app.js` | Navigation, filters, forms, local review, resources, and model UI |
| `assets/js/data.js` | Fictional reports, neighborhood shapes, synthetic series generator, official resource links |
| `assets/js/model.js` | Dependency-free CSV validation and ridge-regression implementation |
| `assets/icons/favicon.svg` | Original SafeRoute vector mark |
| `data/sample-weekly-counts.csv` | 312 synthetic records for the ML demonstration |
| `data/README.md` | Provenance and the distinction between the two example datasets |
| `docs/` | Publishing, data, model, sources, production, and testing guides |
| `tests/` | Dependency-free Node tests for data/model and packaging contracts |
| `.nojekyll` | Serves the repository as plain static files on GitHub Pages |
| `package.json` | Optional test command only; no website build step |

## Machine learning

The lab trains a ridge regression from scratch in the browser. It uses an area indicator, previous-week count, four-week mean, time trend, and annual sine/cosine terms. It holds out the latest 20% of weekly dates (rounded up) and compares mean absolute error with repeating the previous week's count. It refits on all eligible history to estimate the next week.

Results are calculated on demand; the interface does not use fixed accuracy claims. Read [the model card](docs/MODEL_CARD.md) and [CSV schema](docs/DATA_SCHEMA.md) before describing the experiment in your presentation.

## Customize

- **Project/author text:** edit `index.html`, this README, and the footer.
- **Colors:** edit the variables at the beginning of `assets/css/styles.css`.
- **Fictional report examples and links:** edit `assets/js/data.js`.
- **Model:** edit `assets/js/model.js`; update the model card and tests if you change its behavior.
- **Your own aggregate data:** import a CSV in Insights lab. The import stays in memory. Do not upload personal incident details or confidential data to a public GitHub repository.

The header views use hash URLs such as `#explore`, so refreshing a view does not require a server rewrite. All file paths are relative, including when the repository is published under `/your-repository/`.

## Optional developer checks

With Node.js 18 or newer installed:

```sh
npm test
```

There are no packages to install. You can also run `node --test tests/*.test.cjs` directly. See [testing notes](docs/TESTING.md) for what was checked and the remaining browser review.

## Privacy and security

No accounts, analytics, third-party scripts, geolocation permissions, cookies, or background API calls are included. The hosting provider still receives ordinary page requests and may maintain access logs. External resource links open third-party services with their own policies.

Local reports and flags use the browser key `saferoute.demo.v1`. Use **About → Delete my local demo data** to remove them. Clearing browser site data also removes them. Imported CSVs are not stored; reloading clears them. Downloaded JSON exports remain on your device until you remove them.

The code escapes user-supplied text before display, validates imported data, and includes a Content Security Policy. Those measures do not provide authenticated moderation or make the prototype appropriate for real incident collection.

## Sources and verification

Official source links are recorded in [SOURCES.md](docs/SOURCES.md). No real incident dataset was provided or used. Automated checks were completed during packaging. Interactive browser and visual layout testing was unavailable in the build environment; use the short browser checklist in [TESTING.md](docs/TESTING.md) before presenting.
