// import fs from "fs";
import { SongConfig } from "../config";
import { Note, Step } from "../music/instrument-scheduler";
import Midi from "./jsmidgen";

export function stepsToMidiData(steps: Step[], config: SongConfig): Uint8Array {
    var file = new Midi.File();
    var track = new Midi.Track();
    track.setTempo(config.tempo);
    file.addTrack(track);
    var channel = 0;
    var stepDurTicks = 64;

    var offset = 0;
    for (var step of steps) {
        let notes: Note[] = [];
        for (var note of Object.values(step.instrument)) {
            notes.push(note);
        }
        if (notes.length > 0) {
            track.addChord(channel, notes.map((note) => {
                return note.note
            }), stepDurTicks, offset);
            offset = 0;
        } else {
            offset += stepDurTicks;
        }
    }

    let str = file.toBytes();
    var hex = '';
    for (var i = 0; i < str.length; i++) {
        var next = str.charCodeAt(i).toString(16);
        if (next.length == 1) {
            hex += '0';
        }
        hex += '' + next;
    }
    let match = hex.match(/.{1,2}/g);
    let parsed: any[] = [];
    if (match) {
        parsed = match.map((byte) => parseInt(byte, 16));
    }
    return Uint8Array.from(parsed);
}
