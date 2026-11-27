# Production layout — La batalla del paripé

The GitHub Pages entry point is \`index.html\`. It loads **one external stylesheet**
(\`game.css\`) and the 34 live JavaScript modules in their original dependency
order. \`game.css\` is an exact ordered concatenation of the previously loaded
13 CSS files and four inline style blocks. The CSS source comments label every
original segment for future maintenance; the cascade order has not changed.

## Historical source files

Older versions of root JS, CSS and obsolete alternative HTML entrypoints were
removed from \`main\` to avoid publishing redundant public versions. Their
contents are **still available in Git history**; this cleanup did not rewrite
history or alter the active gameplay assets. To recover a historical file,
view its earlier revision in GitHub or run \`git show <old-commit>:<path>\`.

\`tests/fixtures/sprite-import-v48.js\` remains as an intentional historical
test fixture to verify pixel-for-pixel parity with the current extractor.

## Adding CSS

Modify \`game.css\` directly and bump the \`?v=\` cache key in \`index.html\`
when changing browser-visible styling. Do not reintroduce a collection of
\`styles-vXX.css\` links or an alternate production HTML entrypoint.

## Validation

Run \`npm test\`. GitHub Actions checks live scripts, combat behavior, controls,
lossless sprite output, CSS source order, static assets, and the absence of
obsolete root production files.

The cleanup leaves images/audio in \`assets/\` intact: some historical-looking
resource names are still referenced by live JavaScript and are NOT safe to
delete merely because their filenames contain old version numbers.

The EX manager (`super-manager-v1.js`) dispatches all six character supers.
Its registration API replaces nested global wrappers; future supers register
hooks instead of replacing `strike`/`update`/`draw`/`updateHud`/`resetArcade`.
