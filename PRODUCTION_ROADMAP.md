# From personal prototype to a shared service

The downloadable site already supports the academic demonstration. This roadmap describes additional work only if you decide to build a real shared reporting service.

## Phase 1 — Define the real use case

- Speak with potential users and relevant support/community organizations about needs, terminology, access barriers, and risks.
- Decide which information the site should collect and which actions it can realistically support.
- Define retention periods, moderation rules, appeals, consent, and deletion before collecting real information.
- Keep emergency response separate and refer people to official services.

## Phase 2 — Shared reporting backend

- Keep this responsive frontend, then add an authenticated API and a database on a service that supports server execution. GitHub Pages itself does not run a database or private server API.
- Store broad area identifiers and only necessary fields. Avoid collecting names, exact locations, or incident narratives by default.
- Make submitted records private until review. Do not expose pending/rejected records through public endpoints.
- Add reviewer sign-in, server-side role checks, sessions, audit logs, rate limits, abuse prevention, retention jobs, and backups appropriate to the data.
- Implement deletion and moderation appeal workflows with clear ownership.
- Store server credentials outside public frontend code and GitHub commits.

The current local review screen is a demonstration, not a starting authentication mechanism. Hiding a link or placing a password in JavaScript would not secure review access.

## Phase 3 — Suitable aggregate data

- Obtain permission and record dataset provenance.
- Assess missingness, reporting access, data reliability, and selection bias.
- Define weekly aggregation and suppress or combine small groups where appropriate.
- Keep raw submissions away from public exports and avoid re-identification through exact locations and timestamps.

## Phase 4 — Evaluate useful ML behavior

- Define a measurable decision the report-count estimate can support.
- Compare simple forecasting baselines and use rolling chronological evaluations.
- Evaluate area-level errors and data drift; retain the simpler baseline when it performs better.
- Validate uncertainty on separate data before presenting a calibrated interval.
- Do not relabel predicted report volume as “safety”, crime likelihood, or individual risk.

## Phase 5 — Real product validation

- Complete desktop/mobile browser and assistive-technology testing.
- Review language, accessibility, and support workflows with intended users.
- Arrange appropriate privacy/security review for the actual deployment and data.
- Maintain source dates and contact information; define who responds to abuse and deletion requests.

These phases are optional future development. Do not present the static academic prototype as a live reporting, emergency response, or route navigation service.
