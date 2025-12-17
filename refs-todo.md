## refs (packages/refs)

### done

1. simplify the name and just call them RefUrl instead of AutomergeRefUrl
2. add shorthand to allow themeRef.change("dark") for primitive values
3. throw an error when cursor() is followed by more segments (instead of ignoring)
4. create `RefOfType<T>` type utility so we can do `addComment(thread: RefOfType<Todo>)` which says "this is any ref whose value is of type Todo"
5. Make the `ref()` factory return the same ref instance for the same path globally
6. rename MatchPattern to just Pattern
7. Replace tilde `~` escape character with `\`
8. add tests to ensure that ref url encoding survives URI encoding/decoding as a whole, which it might not. Currently we use URI encoding _within_ a ref URL, but what happens if we then URI encode that whole URL (e.g. to put in browser address bar) and then try to decode it? what breaks? What might we have to rethink about our encoding scheme?
