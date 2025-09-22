## sdk/library/render()

- [ ] provide tools a way of adding stylesheets (in codemirror,
      https://github.com/codemirror/view/blob/9ad612ac32a3e44b831999061d7bcbeec063df5d/src/dom.ts
      gets the root and then style-mod adds to adoptedStylesheets)

## breaking compat

If we're temporarily breaking compatibility with patchwork here are some things
to look into:

- [ ] <rootstock-tool doc={docUrl} tool={toolUrl}> (and a
      rootstock-tool-finder/selector element)
- [ ] always put the tool in the shadow
- [ ] ?remove the shim code?
- [ ] ?remove the importmap and shared dependencies code?
