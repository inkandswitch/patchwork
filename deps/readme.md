# to update the rootstock importmap from patchwork prod

this is, as all things are in this world, a temporary hack until there is the
time and hammocks to think about the problem for real.

## usage

```shell
# use pushwork to pull down the current deps
./clone.sh automerge:4NLSxeMB2scthNxKRJYjrBPqrQih lith

# use deno to update the lith dir (it outputs the new import map)
./lithify.ts | pbcopy

cd lith
pushwork sync
```

now go paste in the index.html
