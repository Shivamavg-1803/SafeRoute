# Verification notes

Prepared 17 October 2026.

## Automated checks

Run from the project root with Node.js 18 or newer:

```sh
node --test tests/*.test.cjs
```

Or use `npm test`. No dependency installation is required.

The test suite covers:

- Reproducible synthetic data and CSV round trip, including quotes, commas, BOM, and CRLF.
- Rejection of malformed headers, quotations, missing fields, invalid dates, and invalid counts.
- Rejection of duplicate/missing weeks, mismatched area timelines, insufficient history, and unsupported sizes.
- Regression against a known linear relationship and an all-zero dataset.
- Independent recomputation of validation metrics and the empirical error band.
- Chronological separation: changing held-out target values cannot change the training preprocessing or validation-model coefficients.
- Invariance to row order and no mutation of the input dataset.
- Serialization of a fitted model without changing its predictions.
- Unique HTML IDs and matching fixed UI element bindings.
- Local HTML/Markdown links, relative asset paths, expected script load order, and JavaScript syntax.
- No runtime API calls, dynamic code evaluation, or external script dependencies in the application.

These are model, data, and structural checks. They do not replace browser tests, accessibility review, or evaluation with real data. The supplied suite contains 16 tests.

## Browser verification limit

The build environment did not provide the supported interactive browser testing tool. No live browser, mobile-device, visual screenshot, keyboard-navigation, or assistive-technology test was performed. Responsive CSS, labels, focus states, native dialogs, and keyboard map controls are implemented, but their behavior needs a real-browser review.

## Short browser checklist

Use a current Chrome, Firefox, Edge, or Safari browser. Test both the local files and the final GitHub Pages URL where possible.

1. **Overview:** check the map and typography; navigate between views and refresh a hash URL.
2. **Explorer:** combine search, neighborhood, category, and time-window filters; sort; reset; load more; open a report; zoom and reset the map.
3. **Keyboard:** use Tab, Enter, Space, and Escape; select map areas with the keyboard; check visible focus and dialog close behavior.
4. **Local report:** submit a fictional entry, open Local review, approve it, find it in Explore, reject it, and confirm it disappears from Explore.
5. **Persistence:** reload after saving; export local entries; delete local data in About and confirm it is removed after another reload.
6. **Flags:** flag a bundled example from its details, see it in Local review, and remove the flag.
7. **Model:** open Insights lab; select each area; compare the chart/table and baseline; export the JSON model report.
8. **CSV:** try the bundled CSV with the agreement checked; try an invalid/missing-week CSV and confirm a readable error appears without replacing the previous dataset.
9. **Privacy:** reload after import and confirm the bundled data returns. Browser developer tools should show no background API requests. External links are user-triggered navigation.
10. **Mobile:** check narrow and landscape layouts, the navigation menu, scrolling, buttons, dialogs, select menus, and the validation table.
11. **Resources:** open official links and confirm current information. Test telephone links only as appropriate; do not place a test emergency call.

Private browsing and `file://` storage rules differ by browser. If storage is blocked, confirm the app explains that changes last only in the open page. The production roadmap describes the separate work needed for shared reporting.
