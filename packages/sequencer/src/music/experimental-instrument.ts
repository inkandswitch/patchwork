export const jsFromGist = async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch module: ${ response.statusText }");
    const code = await response.text();

    // Create a Blob from the code and turn it into a module URL
    const blob = new Blob([code], { type: 'application/javascript' });
    const moduleUrl = URL.createObjectURL(blob);

    // Dynamically import the module from the Blob URL
    const module = await import(moduleUrl);

    // Clean up the Blob URL
    URL.revokeObjectURL(moduleUrl);

    return module;
};
