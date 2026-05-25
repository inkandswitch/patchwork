# Workspaces

## Motivation

Patchwork has no concept of branching. If you want to try a substantial
edit to a document — restructuring a long markdown file, revising a paper
you've already shared, exploring an experiment you might throw away —
your only options today are to do it in place on the shared doc, or to
fork it manually and lose any sense that the two are related.

Two things make this harder than "just copy the doc":

- **Documents reference each other.** A markdown doc might link to other
  docs, hold refs into them, or be opened by a tool that pulls in
  several related docs together. Branching a single doc leaves these
  references pointing at the wrong place.
- **There are a lot of tools, and we don't control most of them.**
  Anything that threads branch awareness through tool code has to be
  reapplied every time someone writes a new tool.

This document proposes _workspaces_ as the unit of branching, designed
so that tools can stay completely unaware that branching exists.

## Design

A **workspace** is a collection of documents that branches as one unit.
Workspaces form a tree; the root has no parent and corresponds to "main",
everything else is a branch. We use _draft_ only as the verb for the act
of branching — there is no separate "draft" noun.

A few design choices worth naming up front:

- **Group, not per-doc.** Because docs reference each other, the unit of
  branching has to be a group. A workspace is that group; drafting it
  produces a child workspace with its own copies of every doc.
- **Tree, not DAG.** Simpler to reason about and sufficient for the
  cases we care about. Merging changes back to the parent is a separate
  concern (see "Open questions").
- **Transparent to tools.** A tool that wants to read or write a doc
  asks for it the same way regardless of whether it's running on main
  or on a branch. The workspace machinery sits above the tool and
  rewrites those requests to point at the right copy.
- **Lazy by default.** Drafting a workspace doesn't copy anything up
  front. Copies are made on demand the first time a doc is written to.

The architectural shape that falls out of these choices: the workspace
doc owns a mapping from each original doc to its clone, and a provider
sitting above the tool intercepts repo requests and returns a proxy
handle that follows that mapping.

## Data model

Markdown doc:

```
{
    "@patchwork": {
        type: "markdown",
        workspaceUrl: "automerge:..."
    }
    ...
}
```

`workspaceUrl` points at the workspace this copy of the doc lives in.
On main it points at the main workspace; on a branch the clone's
`workspaceUrl` is rewritten to point at the child workspace.

Workspace doc:

```
{
    "@patchwork": { type: "workspace" },

    parentWorkspace: AutomergeUrl | null,
    childWorkspaces: AutomergeUrl[],

    clones: {
        [original: AutomergeUrl]: { cloneUrl: AutomergeUrl, copiedAt: Heads }
    }
}
```

`parentWorkspace` is `null` for the root. `childWorkspaces` lets a
workspace discover its branches. `clones` maps each original doc url to
the clone that stands in for it inside this workspace.

## Behavior

### Lazy cloning on write

Drafting a workspace doesn't eagerly copy every document. Reads of a
doc that hasn't been touched in this workspace fall through to the
original. The first write triggers a clone and adds an entry to
`clones`. This keeps drafting cheap regardless of workspace size.

### New documents

A tool can ask for a brand-new doc via `request(element, "repo:handle")`
with no url. There's no "original" to key against, so the new doc is
self-keyed in the clones map:

```
clones[newUrl] = { cloneUrl: newUrl, copiedAt: <empty> }
```

This marks the doc as born in this workspace and distinguishes it from
clones that have an upstream original.

### URL remapping

The proxy handle returned to tools rewrites two things:

- writes are routed to the clone,
- when the tool asks for a url, the proxy returns the _original_ url
  (the one the tool asked for), not the clone's.

This is what lets tools stay branch-unaware: they ask for a url, get
back a handle that looks like the doc they asked for, and never observe
that they're actually editing a copy.

### URL leakage is fine

Writing branch urls into the parent's `childWorkspaces` would normally
raise a privacy concern, but access in Patchwork is handled separately
by keyhive — having a url does not imply having permission to read the
doc. So leaking workspace urls through `childWorkspaces` is safe.

## Wiring

We expose repo access through the existing provider system rather than
using the repo directly:

```
const handle = await request(element, "repo:handle", { url: "automerge:..." })
```

A `CurrentWorkspaceProvider` sits above the tool in the DOM and
intercepts these requests. It looks up the requested url in its
workspace's `clones` and returns the proxy handle described above.

We're using the provider system here for the same reason we use it
elsewhere: it lets us layer behavior on top of repo access without any
involvement from the tool that's making the request.

The current workspace is passed into the provider as a `DocHandle`.
This is a temporary mechanism — we'll revisit how that wiring happens
once the rest of the design is in place.

Multiple `CurrentWorkspaceProvider`s can coexist on the same page,
which lets us show, for example, main and a branch side by side. This
is intentional.

## Open questions

The doc-level `@patchwork.workspaceUrl` field differs between an
original and its clone (each points at the workspace it lives in). When
we eventually merge a branch back into its parent, we'll want to merge
the actual data but _not_ overwrite the original's `workspaceUrl` with
the branch's. We can fake this for now by re-deleting the value after
merge, but the right way to exclude a single field from a merge is
still open (`changeAt` is one candidate).

Merge-back semantics more generally are out of scope for this doc.
