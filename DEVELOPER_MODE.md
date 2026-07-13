# Developer mode

Start the local application with:

```bash
npm run dev
```

Open `http://localhost:5173/developer`. The Developer navigation item and its local write API are included only by the Vite development server; they are not available in a production build.

## Importing an article

Choose a directory whose root contains `article.md`. The folder may also contain a cover and a `resources/` directory. Developer mode validates the slug, front matter, Markdown, and local paths before moving the folder into `data/<slug>/`. Existing folders are never overwritten.

## Categories

The registry is stored in `data/categories.json`. Renaming a category also updates matching article front matter. Deleting a category removes it from matching articles, which makes those articles appear as `Uncategorized`.

## Backgrounds

Uploaded images are stored in `public/background/`; the active selection is stored in `data/site.json`. Use Reset Background to return to the built-in visual treatment.

After a change, use **Apply changes and reload**. All authored data and selected backgrounds are normal Git files and can be committed and pushed.
