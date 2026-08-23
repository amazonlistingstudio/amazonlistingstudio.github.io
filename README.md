# DEYARTS

Landing page for DEYARTS, an Amazon listing design studio.

Static site: HTML, CSS and a small amount of vanilla JavaScript. No build step,
no framework, no dependencies. Open `index.html` or serve the folder.

```
index.html          single page
css/style.css       design tokens and every component
js/app.js           before/after toggles, reveal on scroll
assets/fonts/       Cygre (RandomMaerks), see Cygre-LICENSE.pdf
assets/img/work/    ten listing cases, WebP, 1:1
assets/img/hero/    hero portrait
assets/img/process/ research screenshots
```

## Local preview

```
python3 -m http.server 4321
```

## Adding real numbers to a case

`data/results.json` drives the stat strip under each redesign case. Every array
starts empty, and an empty array renders nothing at all. Put sourced figures in
and the strip appears:

```json
"vicalina": { "metrics": [
  { "label": "Main image CTR", "value": "4.9%", "note": "from 3.1%", "dir": "up" }
] }
```

`dir` is `up` or `down` and only colours the arrow. Use figures you can point at
in Seller Central or a client report.

## Notes

Case before-galleries are labelled Concept redesign. They are reconstructions
built to show the design thinking, not a client's original listing, and carry
no performance metrics.
