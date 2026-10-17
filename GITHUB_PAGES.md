# Publish SafeRoute on GitHub Pages

This folder is ready for GitHub Pages. You do not need to run a build or install dependencies.

## 1. Extract and check

Extract `SafeRoute_GitHub_Ready.zip` and open the `saferoute-site` folder. Double-click `index.html` to try it locally.

## 2. Create a repository

1. Sign in to GitHub and create a **new repository**.
2. Give it a name such as `saferoute`.
3. Choose **Public** for the simplest GitHub Free setup.
4. Create the repository.

## 3. Upload the website

Use **Add file → Upload files** (or the empty repository's upload link).

Drag the **contents inside `saferoute-site`** into the upload area. The repository root must contain `index.html`, `assets`, `data`, and `docs`. Keep the directory structure intact and commit the files.

Do not upload only the ZIP, and do not add an extra `saferoute-site` directory around the website. A successful root has paths such as:

- `index.html`
- `assets/css/styles.css`
- `assets/js/app.js`
- `assets/js/data.js`
- `assets/js/model.js`
- `data/sample-weekly-counts.csv`

Also include `.nojekyll` if your upload method shows hidden files. The project uses ordinary filenames, so accidental omission of this empty file does not prevent the main site from working. The file simply makes the static publishing intent explicit.

## 4. Enable Pages

1. Open the repository's **Settings → Pages**.
2. Under **Build and deployment**, select **Deploy from a branch**.
3. Select **main** (or the branch that contains your uploaded files).
4. Select **/(root)** as the publishing folder.
5. Click **Save**.

Wait for GitHub to complete the deployment. Its Pages settings will display the published URL. A project repository usually has this shape:

```text
https://YOUR_USERNAME.github.io/YOUR_REPOSITORY/
```

You do not need to enter a custom domain. Repository Pages availability depends on your GitHub plan and repository visibility; the public repository path above is the simplest option.

## 5. Check the published site

Open the displayed URL and try:

- Navigate to Explore, click a neighborhood, and reset filters.
- Open Insights lab; check that metrics, chart, and table appear.
- Download the sample CSV and import it after checking the data agreement.
- Add a fictional demo report, approve it in Local review, and find it in Explore.
- Open the site on a phone and use the mobile menu.

The URL with `#insights` or `#explore` should still work after refreshing.

## Update later

Edit your local files, upload the changed files to the same repository branch, and commit them. GitHub Pages deploys changes from that publishing source. Keep your own local copy or clone the repository so you can track changes.

## Troubleshooting

| Problem | Check |
| --- | --- |
| 404 page | `index.html` must be at the selected branch/folder root; wait for deployment to complete. |
| Plain page with no styling | Upload the entire `assets` folder and keep capitalization unchanged. |
| Buttons do nothing | Confirm all three JavaScript files are present and JavaScript is enabled. Check the browser console for errors. |
| It shows the old page | Refresh after deployment finishes; try a hard refresh or a new tab. |
| My report is missing on another device | Reports are local to the original browser and website origin. There is no shared database. |
| Imported CSV is gone after reload | CSV imports intentionally stay in memory only. Import the file again. |
| CSV rejected | Use the exact schema and a complete shared weekly timeline; read `DATA_SCHEMA.md`. |
| Root path works but a typed `/explore` path does not | Use the app's `#explore` hash link, not a separate `/explore` URL. |

## Official documentation

- [Creating a GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)
- [Configuring a publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

Instructions reviewed 17 October 2026. GitHub may adjust menu labels over time.
