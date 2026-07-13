# GitHub Pages deployment

This repository includes a GitHub Actions workflow at `.github/workflows/deploy-pages.yml`.

For the `Hajiwo/digital-garden` repository, enable **Settings → Pages → Source: GitHub Actions**. The site will be published at:

```text
https://hajiwo.github.io/digital-garden/
```

The workflow detects the repository name and sets the Vite base path automatically. If the repository itself is named `hajiwo.github.io`, it uses `/` instead.

The workflow does not modify the existing `hajiwo.github.io` homepage repository. It publishes this project as its own Pages site, so the root homepage remains untouched.
