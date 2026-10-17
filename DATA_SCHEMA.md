# CSV data guide

The Insights lab accepts **aggregated weekly submitted-report counts**. Do not import raw incident narratives, contact details, personal identifiers, exact coordinates, or other sensitive information.

Only use data you have permission to process. Even aggregate data may expose people when groups are small; combine areas or suppress data appropriately before importing. The app cannot determine whether your dataset is sufficiently anonymous or reliable.

## Exact format

UTF-8 text with this header, in this order:

```csv
area,week,report_count
Example Area,2026-01-05,12
Example Area,2026-01-12,9
Example Area,2026-01-19,14
```

The snippet illustrates the format only. **At least 24 weeks per area are required.** Download the complete sample from the website or use `data/sample-weekly-counts.csv`.

| Field | Rule |
| --- | --- |
| `area` | 1–60 printable characters after trimming; use broad areas, not identifying addresses. |
| `week` | Real date in `YYYY-MM-DD` format; use a consistent weekly anchor such as Monday. |
| `report_count` | Whole number from 0 to 100,000. Empty, negative, decimal, or nonnumeric values are rejected. |

## Dataset rules

- 24–520 observations per area, from 1 to 20 areas.
- At most 10,000 total rows and a file no larger than 1,000,000 bytes.
- Every area's dates must be exactly seven days apart.
- Every area must cover **the same dates**.
- One row per area per week; duplicates are rejected.
- Row order does not matter; the model sorts the timeline.
- Quoted fields and escaped double quotes are supported. Empty lines and a UTF-8 BOM are accepted.
- The header is case-sensitive. Additional columns are not accepted.

Missing values are rejected rather than assumed to be zero. Use zero only if the reporting process actually observed zero reports for that period. A zero does not establish that no incidents occurred.

The lower limit allows a small educational demonstration. It does not establish that 24 weeks, or any other accepted length, is enough for your real forecasting problem. Annual seasonal terms are especially weakly supported by short histories.

## Import workflow

1. Open **Insights lab**.
2. Check the agreement that the file contains permitted aggregate data only.
3. Select your CSV. Validation and model evaluation happen on your device.
4. Review the held-out error, baseline comparison, and exact values in the table.
5. Use **Export model report** to download JSON results if needed.

An invalid file leaves the previous dataset unchanged. An accepted import replaces the lab dataset in memory only. It does **not** change the explorer's fictional reports. Reloading the page restores the bundled synthetic data.

The app validates structure and numeric ranges. It does not verify the truth, completeness, permissions, representativeness, or suitability of the uploaded data.
