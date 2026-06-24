// Initialize the Automerge Wasm modules before any test runs, so creating an
// in-memory Repo (which always builds a SubductionSource) works. Importing the
// fat entry points auto-calls initSync. Mirrors core/filesystem/test/setup.ts.
import "@automerge/automerge";
import "@automerge/automerge-subduction";
