# to update the rootstock importmap from patchwork prod

this is, as all things are in this world, a temporary hack until there is the
time and hammocks to think about the problem for real.

this one even moreso, as it will change again when grafting patchwork onto
rootstock. this is EXTREMELY temporary.

## usage

```shell
# use pushwork to pull down the current deps
./clone.sh automerge:434kc7ecZMs377SjKdBiFQ9U4yr2 published

# use deno to update the lith dir (it outputs the new import map)
./generate.ts | pbcopy

cd published
pushwork sync
```

now go paste in the index.html
