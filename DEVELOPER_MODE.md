# Developer mode

Start the local application with:

```bash
npm run dev
```

Open `http://localhost:5173/developer`. The Developer navigation item and its local write API are included only by the Vite development server; they are not available in a production build.

## Importing an article

Choose a directory whose root contains `article.md` or exactly one `.md` file. The folder may also contain a cover and a `resources/` directory. Developer mode validates the slug, Markdown, and local paths before moving the folder into `data/<slug>/`. Existing folders are never overwritten.

Front matter is optional. When metadata is absent, Cyclopedia infers the title from the first H1 or folder slug, the description from the first paragraph, and accepts `date`, `publishedAt`, `published`, `created`, or `downloaded` as date fields. Missing dates use `1970-01-01`, missing tags become an empty list, and tags may be either a YAML list or a comma-separated string.

## Categories

The registry is stored in `data/categories.json`. Renaming a category also updates matching article front matter. Deleting a category removes it from matching articles, which makes those articles appear as `Uncategorized`.

## Backgrounds

Uploaded images are stored in `public/background/`; the active selection is stored in `data/site.json`. Use Reset Background to return to the built-in visual treatment.

After a change, use **Apply changes and reload**. All authored data and selected backgrounds are normal Git files and can be committed and pushed.

## Homepage identity

The Homepage Identity panel edits the public homepage title and description. These values are stored with the background selection in `data/site.json`.

## Visual styles

The palette selector in the site header switches between Editorial, Reading, Geek, and Minimal presentation modes. The selection is stored locally in the browser and remains independent of the light/dark color-theme control.

Public browse categories are generated automatically from distinct article tags. Adding or removing a tag in Markdown front matter updates the homepage topic list and Explore filters after content is rebuilt.

## Original source links

Article front matter may include `original_link: "https://example.com/article"`. Existing `source` and `originalUrl` URL fields are also recognized. The article reader displays a safe external link to the original website.
