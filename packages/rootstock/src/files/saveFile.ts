export const saveFile = async (file: File, types: any) => {
  // Feature detection. The API needs to be supported
  // and the app not run in an iframe.
  const supportsFileSystemAccess =
    "showSaveFilePicker" in window &&
    (() => {
      try {
        return window.self === window.top;
      } catch {
        return false;
      }
    })();
  // If the File System Access API is supported…
  if (supportsFileSystemAccess) {
    try {
      // Show the file save dialog.
      // @ts-expect-error showSaveFilePicker is not in the TS types
      const handle = await showSaveFilePicker({
        suggestedName: file.name,
        types,
      });
      // Write the blob to the file.
      const writable = await handle.createWritable();
      await writable.write(file);
      await writable.close();
      return;
    } catch (err) {
      // Fail silently if the user has simply canceled the dialog.
      if ((err as any).name === "AbortError") {
        return;
      }
    }
  }
  // Fallback if the File System Access API is not supported…
  // Create the blob URL.
  const blobURL = URL.createObjectURL(file);
  // Create the `<a download>` element and append it invisibly.
  const a = document.createElement("a");
  a.href = blobURL;
  a.download = file.name;
  a.style.display = "none";
  document.body.append(a);
  // Programmatically click the element.
  a.click();
  // Revoke the blob URL and remove the element.
  setTimeout(() => {
    URL.revokeObjectURL(blobURL);
    a.remove();
  }, 1000);
};
