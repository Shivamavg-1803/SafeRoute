# SafeRoute model card

## Purpose

This browser experiment estimates **the number of reports submitted for an area in the next week**. It is included to demonstrate a reproducible machine-learning workflow in an individual SDG 5 project.

It does not forecast violence or crime, identify victims or perpetrators, rate a person's risk, establish an area's safety, or recommend a travel route. Submitted-report counts are influenced by awareness, access, platform usage, moderation, and willingness to report.

## Status and data

- Implementation: dependency-free JavaScript in `assets/js/model.js`.
- Default dataset: 312 synthetic records, six fictional areas, 52 weekly dates from 20 October 2025 through 12 October 2026.
- Default next forecast date: 19 October 2026, relative to the dataset, not the current calendar date.
- No real incident data or external training dataset was supplied.
- Explorer reports are a **different demonstration dataset** and are not aggregated to create the ML series.
- Imported CSVs are structurally validated but remain unverified for real-world use.

## Algorithm

Ridge regression minimizes squared errors plus an L2 penalty on coefficients. The penalty strength is fixed at `alpha = 1`. The intercept is unpenalized. Normal equations are solved using Gaussian elimination with partial pivoting.

Features for each area's week at index `t`, starting at zero:

1. One-hot indicators for the sorted area names.
2. The count observed at week `t - 1`.
3. The mean count observed at weeks `t - 4` through `t - 1`.
4. The timeline index `t`.
5. `sin(2 × pi × t / 52)`.
6. `cos(2 × pi × t / 52)`.

Each feature is standardized using the training mean and population standard deviation. Constant columns use scale 1. The model learns coefficients from the data; predictions are not a fixed score or hand-entered accuracy value. Negative estimates are clipped to zero; fractional estimates are retained because they represent expected counts.

The full area indicators and intercept are redundant without regularization. The ridge penalty handles that redundancy. The penalty is not tuned against the validation set.

## Chronological evaluation

1. Reserve the last `max(4, ceil(0.20 × number_of_weeks))` dates as validation.
2. Use the first four dates only as lag history.
3. Fit preprocessing and regression on eligible dates before the split.
4. Keep that validation model fixed while predicting the later dates.
5. Use **observed earlier counts** for each validation week's lag features, including earlier validation observations when available.
6. Compare with a baseline that repeats each area's previous observed count.

This is **one-step-ahead evaluation**, as though the previous week's data has arrived before each prediction. It is not a recursive multiweek forecast made at the split date. Training preprocessing and coefficients do not use held-out target values; the validation sequence deliberately uses already observed prior-week values as inputs.

After evaluation, a second model is fitted on all eligible rows and estimates **one next week** per area. The model exported under `fitted` is this refitted model; `validationModel` is the earlier model used for validation. Keep them distinct when reporting results.

## Metrics

- **MAE:** mean absolute error, in reports per area per week. Lower is better.
- **Baseline MAE:** error of repeating the prior week's count on exactly the same rows.
- **RMSE:** root mean squared error; included in the JSON export.

The interface calculates these metrics at runtime. It explicitly reports if the baseline performs as well as or better than the regression. A lower error on synthetic data is an educational result, not evidence of real-world performance.

In the bundled example there are 222 training rows and 66 validation rows across 11 held-out weeks. The exact floating-point results may differ slightly across implementations. Tests check recomputed metrics and data separation rather than a claimed real-world accuracy percentage.

## Illustrative error range

The chart and forecast display an estimate plus/minus the nearest-rank 80th percentile of **absolute validation errors pooled across all areas**. The lower bound is clipped to zero. This is an illustrative empirical-error band, **not a calibrated confidence or prediction interval**. It does not guarantee 80% future coverage and does not account separately for each area's uncertainty.

## Limits

- The bundled data is generated; it has no demonstrated relationship to actual incident or reporting patterns.
- Counts omit unreported experiences. More reports can reflect greater reporting access; fewer reports do not establish safety.
- The default series contains only one annual cycle. The annual terms are illustrative and cannot establish stable seasonality.
- A single chronological holdout does not show performance across locations, time periods, or changing reporting processes.
- A linear model can extrapolate poorly, especially under shifts in reporting practices. Nonnegative clipping is not a guarantee of plausible predictions.
- The pooled error band may hide different error patterns between areas.
- No subgroup fairness, deployment impact, or external validity has been established.
- The implementation is for small browser experiments; the CSV limits keep computation manageable.

## Reproducibility and export

The default generator uses a fixed seed and fixed dates. `data/sample-weekly-counts.csv` matches the generated weekly series. The JSON export includes the source label, feature order, both fitted models' preprocessing and coefficients, evaluation metrics, validation values, and next-week estimates.

Run `npm test` to check parsing, date/coverage validation, a known regression relationship, zero counts, chronological separation, model serialization, and recomputed metrics.

## Development beyond the demo

Before evaluating any real use case, define a legitimate target and appropriate data permissions, audit data coverage, compare multiple simple baselines, use rolling temporal evaluation and relevant external data, inspect errors across areas, and determine whether the output helps the intended users. Preserve the distinction between report volume and personal safety. See `PRODUCTION_ROADMAP.md` for the separate shared-reporting requirements.
