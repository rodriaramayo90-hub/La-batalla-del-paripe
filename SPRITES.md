# Sprite pipeline — v49

## What runs in the browser

1. Original WebP sheets remain the source of truth. No image, anatomy, outfit,
   pose or facial features are modified by this update.
2. On the first visit (or after changing the source filename/geometry),
   \`sprite-import-v49.js\` uses the existing 8-connected RGBA pixel extractor
   to isolate a full body and its connected hair, legs and accessories even
   when a drawing extends beyond its original cell.
3. Its extracted RGBA frames are packed into one canvas per source sheet.
   Each frame retains its original normalized \`left/top/width/height\` anchor.
   Rendering crops a rectangle from the packed bitmap rather than creating
   a separate browser texture for each pose.
4. The packed canvas is serialized to a **lossless PNG** and stored in
   IndexedDB under \`paripe-sprite-cache\` when the browser permits storage.
   Subsequent visits decode the prepared bitmap and skip the expensive
   full-image connected-component scan.
5. The cache key contains the algorithm version, image URL, dimensions,
   grid rows/columns and minimum silhouette height, so changed sprites
   cannot accidentally reuse the previous layout.

## Failure behavior

- No IndexedDB, disabled private-mode storage, corrupt cache, or quota full:
  extraction proceeds from the original WebP. The storage cache is optional.
- A missing silhouette in a sheet or an RGBA extraction error: the original
  rectangular atlas is drawn as a fallback for that sheet and a console
  warning is recorded. One defective sheet does not block the rest of the game.
- Packing fails due to texture size or canvas allocation: independent
  extracted sprite textures are retained as a fallback.
- A source WebP that fails to load at all remains a fatal missing asset:
  the game must not pretend the fighter is ready with no image.

## Debugging

In browser developer tools:

\`\`\`js
SpriteAtlas.stats
// { parsed, reused, fallback, stored, storeErrors }

SpriteAtlas.reports.filter(report => report.fallback)
SpriteAtlas.reports.filter(report => report.extendedFrames?.length)
\`\`\`

- \`parsed\`: images processed by the original silhouette extractor this session.
- \`reused\`: images loaded from the persistent packed cache.
- \`fallback\`: sheets using the legacy grid fallback.
- \`extendedFrames\`: extracted poses that include pixels outside their original
  tile, often legitimate extended arms, hair or tools, but worth visually
  checking if an accidental foot appears.
- To force a fresh extraction, clear this site's IndexedDB store
  \`paripe-sprite-cache\` using browser developer tools. Alternatively, change
  the \`CACHE_VERSION\` constant in the import script.
- Never crop a new character atlas without checking that the limbs are
  completely inside the intended cells; the extractor is a safety net, not
  a replacement for well-authored source sprites.

## Running tests

\`\`\`bash
npm test
\`\`\`

The test suite includes:
- Pixel-for-pixel comparison of the new renderer against the original v48
  extractor, with a pose that crosses an atlas cell boundary.
- Lossless cache storage/recovery, repeat prepare, corrupted/missing-pose
  fallback, and unchanged on-screen anchors.
- Combat/EX damage and keyboard/PS4/Joy-Con/touch regression tests.

GitHub Actions runs the suite on changes to \`main\` and pull requests.
