import "./styles.css";
import { contextComputation, Ref, TextSpanRef } from "@patchwork/context";
import { useReactive } from "@patchwork/context-react";
import { Fragment } from "react/jsx-runtime";

const $refs = contextComputation((context) => context.refs);

export const ContextView = () => {
  const refs = useReactive($refs);

  // Sort refs by refToString
  const sortedRefs = refs.slice().sort((a, b) => {
    const aString = refToString(a);
    const bString = refToString(b);
    return aString.localeCompare(bString);
  });

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
          {sortedRefs.map((ref, index) => (
            <Fragment key={index}>
              <tr data-key={index}>
                <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">
                  <span className="bg-blue-100 border border-blue-300 rounded-md p-1 font-mono">
                    {refToString(ref)}
                  </span>
                </td>
                <td className="px-6 py-2 whitespace-nowrap text-sm text-blue-900 font-mono">
                  {valueToString(ref.value)}
                </td>
              </tr>
              {ref.fields.map(([key, value]) => (
                <tr key={key}>
                  <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">
                    {key}
                  </td>
                  <td className="px-6 py-2 whitespace-nowrap text-sm text-blue-900 font-mono">
                    {valueToString(value)}
                  </td>
                </tr>
              ))}
              <tr data-key={`${index}-separator`}>
                <td
                  colSpan={2}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                >
                  <hr className="border-gray-200" />
                </td>
              </tr>
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const refToString = (ref: Ref) => {
  const shortId = ref.docUrl.slice(10, 18);

  if (ref instanceof TextSpanRef) {
    return `${shortId}/${ref.path.join("/")}[${
      ref.from === ref.to ? ref.from : `${ref.from}:${ref.to}]`
    }]`;
  }

  return `${shortId}${ref.path.length > 0 ? "/" : ""}${ref.path.join("/")}`;
};

const valueToString = (value: any) => {
  return JSON.stringify(value, (key, value) => {
    if (value instanceof Ref) {
      return refToString(value);
    }

    return value;
  });
};
