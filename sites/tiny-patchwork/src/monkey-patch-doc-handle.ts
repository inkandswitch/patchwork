import {
  DocHandle,
  type Automerge,
  type ChangeFn,
  type UrlHeads,
} from "@automerge/vanillajs/slim";

/** Here we monkey patch the DocHandle to
 *  always add the currently logged in user as author
 *  and the current timestamp as metadata to each change.
 *
 *  Eventually, we would like to ship this functionality directly
 *  inside automerge-repo, but that's currently blocked on having a
 *  more efficient approach to storing change metadata in Automerge.
 *
 *  Once that's done we should remove this monkey patch.
 */
export default function monkeyPatchDocHandle(globalAuthor: string) {
  const oldChange = DocHandle.prototype.change;
  DocHandle.prototype.change = function <T>(
    callback: ChangeFn<T>,
    options: Automerge.ChangeOptions<T> = {}
  ) {
    const optionsWithAttribution: Automerge.ChangeOptions<T> = {
      time: Date.now(),
      message: JSON.stringify({ author: globalAuthor }),
      ...options,
    };
    oldChange.call(
      this,
      callback,
      optionsWithAttribution as Automerge.ChangeOptions<any>
    );
  };

  const oldChangeAt = DocHandle.prototype.changeAt;
  DocHandle.prototype.changeAt = function <T>(
    heads: UrlHeads,
    callback: ChangeFn<T>,
    options: Automerge.ChangeOptions<T> = {}
  ) {
    const optionsWithAttribution: Automerge.ChangeOptions<T> = {
      time: Date.now(),
      message: JSON.stringify({ author: globalAuthor }),
      ...options,
    };
    return oldChangeAt.call(
      this,
      heads,
      callback,
      optionsWithAttribution as Automerge.ChangeOptions<any>
    );
  };
}
