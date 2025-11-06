export function outdent(
  strings: TemplateStringsArray,
  ...values: any[]
): string {
  // Combine the strings and values into a single string
  let fullString = strings.reduce(
    (acc, str, i) => acc + str + (values[i] || ""),
    ""
  );

  // Split the string into lines
  const lines = fullString.split("\n");

  // Find the minimum indentation level that is not zero
  const minIndent = lines.reduce((min: number, line) => {
    const match = line.match(/^(\s*)\S/);
    if (match) {
      const indent = match[1].length;
      return min === -1 ? indent : Math.min(min, indent);
    }
    return min;
  }, -1);

  // Remove the minimum indentation from each line
  return lines
    .map((line) => line.slice(minIndent > 0 ? minIndent : 0))
    .join("\n")
    .trim();
}
