import { DocHandle, Repo } from "@automerge/automerge-repo";

/**
 * Abstract class for document migrations.
 * Subclass this to implement specific migrations for different document types.
 *
 * Note: we don't use a type parameter here, because with migrations we're frequently
 * dealing with documents that slightly differ in type from the current document type.
 * Down the road we probably want to keep around types for every version of a datatype,
 * but for now it's most straightforward to just loosen type constraints inside migrations.
 */
export abstract class DocMigration {
  /**
   * Human-readable description of what this migration does
   */
  abstract readonly description: string;

  /**
   * Check if this migration needs to be run on the given document
   * @param handle Document handle to check
   * @param repo Automerge repo instance
   * @returns Promise that resolves to true if migration is needed
   */
  abstract migrationNeedsToRun(
    handle: DocHandle<any>,
    repo: Repo
  ): Promise<boolean>;

  /**
   * Run the migration on the given document
   * @param handle Document handle to migrate
   * @param repo Automerge repo instance
   */
  abstract runMigration(handle: DocHandle<any>, repo: Repo): Promise<void>;
}
