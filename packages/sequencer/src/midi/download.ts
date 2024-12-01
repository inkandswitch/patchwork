
export function downloadMidi(data: Uint8Array, songName: string) {
    const blob = new Blob([data], { type: 'audio/midi' });
    const fileURL = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = fileURL;
    downloadLink.download = songName + ' - instrument.mid';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    URL.revokeObjectURL(fileURL);
}
