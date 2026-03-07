import { DocHandle } from "@automerge/automerge-repo";
import { annotations as globalAnnotations } from "@inkandswitch/annotations-context";
import { computed } from "@inkandswitch/subscribables";
import { useSubscribe } from "@inkandswitch/subscribables-react";
import type { Ref } from "@automerge/automerge-repo";
import { useRefValue } from "@inkandswitch/patchwork-refs-react";
import { Fragment } from "react/jsx-runtime";
import "./styles.css";

const $sortedRefs = computed(globalAnnotations, () =>
  Array.from(
    new Set(
      Array.from(globalAnnotations.refs).sort((a, b) =>
        a.toString().localeCompare(b.toString())
      )
    )
  )
);

(window as any).$context = {
  dump() {
    return Array.from([...globalAnnotations]).map(([ref, annotation]) => {
      return [
        ref.toString(),
        annotation.type.id,
        valueToString(annotation.value),
      ];
    });
  },
  refs: () => Array.from(globalAnnotations.refs),
};

export const ContextView = () => {
  const sortedRefs = useSubscribe($sortedRefs);

  return (
    <div className="w-full h-full overflow-auto">
      <table className="divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ref
            </th>
            <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Value
            </th>
          </tr>
        </thead>
        <tbody className="bg-white">
          {sortedRefs.map((ref, index) => {
            const isLast = index === sortedRefs.length - 1;
            return (
              <Fragment key={ref.toString()}>
                <RefView automergeRef={ref} />
                {!isLast && (
                  <tr>
                    <td colSpan={2} className="px-6 py-2">
                      <hr className="border-gray-200" />
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const RefView = ({ automergeRef: ref }: { automergeRef: Ref }) => {
  const annotations = useSubscribe(globalAnnotations.onRef(ref));
  const value = useRefValue(ref);

  return (
    <Fragment>
      <tr>
        <td
          className="px-6 py-2 whitespace-nowrap text-sm text-gray-900"
          colSpan={2}
        >
          <span className="bg-blue-100 border border-blue-300 rounded-md p-1 font-mono">
            {ref.toString()}
          </span>
        </td>
      </tr>
      <tr>
        <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">
          value
        </td>
        <td className="px-6 py-2 whitespace-nowrap text-sm text-blue-900 font-mono">
          {valueToString(value)}
        </td>
      </tr>
      {Array.from(annotations).map(([, annotation]) => (
        <tr key={annotation.type.id}>
          <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">
            {annotation.type.id}
          </td>
          <td className="px-6 py-2 whitespace-nowrap text-sm text-blue-900 font-mono">
            {valueToString(annotation.value)}
          </td>
        </tr>
      ))}
    </Fragment>
  );
};

const valueToString = (value: any) => {
  try {
    return JSON.stringify(value, (key, value) => {
      if (
        typeof value === "object" &&
        "docHandle" in value &&
        value.docHandle instanceof DocHandle &&
        "path" in value.docHandle
      ) {
        return value.toString();
      }

      return value;
    });
  } catch (e) {
    return String(value);
  }
};
