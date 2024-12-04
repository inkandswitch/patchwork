import { SongConfig } from "../config";
import { Step } from "../music/instrument-scheduler";
import { File, Track, Midi } from "./jsmidgen";

export type SongMidiData = {
    "instrument": Uint8Array,
    "drum": Uint8Array,
}

export function stepsToMidiData(steps: Step[], config: SongConfig): SongMidiData {
    var instFile = new Midi.File();
    var drumFile = new Midi.File();
    var instChannel = 0;
    var drumChannel = 10;
    var instTrack = new Midi.Track();
    instTrack.setTempo(config.tempo);
    instFile.addTrack(instTrack);
    var drumTrack = new Midi.Track();
    drumTrack.setTempo(config.tempo);
    drumFile.addTrack(drumTrack);
    var stepDurTicks = 64;

    var instOffset = 0;
    var drumOffset = 0;
    for (var step of steps) {
        let instNoteNames: string[] = [];
        for (var note of Object.values(step.instrument)) {
            instNoteNames.push(note.note);
        }
        instOffset = addStepNotes(instNoteNames, instTrack, instChannel, stepDurTicks, instOffset);
        let drumNoteNames: string[] = [];
        for (var note of Object.values(step.drum)) {
            drumNoteNames.push(drumMidiFor(note.note));
        }
        drumOffset = addStepNotes(drumNoteNames, drumTrack, drumChannel, stepDurTicks, drumOffset);
    }

    return {
        "instrument": midiFileToData(instFile),
        "drum": midiFileToData(drumFile),
    }
}

// Returns updated offset
function addStepNotes(noteNames: string[], track: Track, channel: number, stepDurTicks: number, curOffset: number): number {
    let offset = curOffset;
    if (noteNames.length > 0) {
        noteNames.forEach(function (note_name) {
            track.addNoteOn(channel, note_name, offset);
            if (offset > 0) {
                offset = 0;
            }
        });
        noteNames.forEach(function (note_name, index) {
            if (index === 0) {
                track.addNoteOff(channel, note_name, stepDurTicks);
            } else {
                track.addNoteOff(channel, note_name);
            }
        });
        offset = 0;
    } else {
        offset += stepDurTicks;
    }
    return offset
}

function midiFileToData(midiFile: File): Uint8Array {
    let str = midiFile.toBytes();
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

function drumMidiFor(note: string): string {
    switch (note) {
        case "kick":
            return "B1"
        case "snare":
            return "E2"
        case "hi-hat":
            return "F#2"
        case "percussion":
            return "F#3"
    }
    return "B1"
}
