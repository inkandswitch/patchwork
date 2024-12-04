import { SongMidiData } from "./midi";
import JSZip from "jszip";

export function downloadMidi(data: SongMidiData, songName: string) {
    const zip = new JSZip();
    zip.file(songName + ' - instrument.mid', data.instrument);
    zip.file(songName + ' - drum.mid', data.drum);
    zip.generateAsync({ type: "uint8array" }).then((zipData: Uint8Array) => {
        downloadFile(zipData, songName + ' - MIDI.zip', 'application/zip');
    });
}

function downloadFile(data: Uint8Array, fileName: string, mimeType: string) {
    const blob = new Blob([data], { type: mimeType });
    const fileURL = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = fileURL;
    downloadLink.download = fileName;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    URL.revokeObjectURL(fileURL);
}
