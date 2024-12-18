

export const NOTE_NAMES = ["C3", "D3", "E3", "F3", "G3", "A3", "B3", "C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5", "D5"];
export const ROOTS = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
export const SHIFTED_NOTE_NAMES = ["Gb2", "G2", "Ab2", "A2", "Bb2", "B2", "C3", "Db3", "D3", "Eb3", "E3", "F3", "Gb3", "G3", "Ab3", "A3", "Bb3", "B3", "C4", "Db4", "D4", "Eb4", "E4", "F4", "Gb4", "G4", "Ab4", "A4", "Bb4", "B4", "C5", "Db5", "D5", "Eb5", "E5", "F5", "Gb5", "G5"];
export const MODES: Record<string, number[]> = {
    "major": [0, 2, 4, 5, 7, 9, 11],
    "dorian": [0, 2, 3, 5, 7, 9, 11],
    "phrygian": [0, 1, 3, 5, 7, 8, 10],
    "lydian": [0, 2, 4, 6, 7, 9, 11],
    "mixolydian": [0, 2, 4, 5, 7, 9, 10],
    "minor": [0, 2, 3, 5, 7, 8, 10],
    "locrian": [0, 1, 3, 5, 6, 8, 10],
    "harmonic": [0, 2, 3, 5, 7, 8, 11],
    "byzantine": [0, 1, 4, 5, 7, 8, 11],
    "freygish": [0, 1, 3, 5, 7, 8, 10],
    "hungarian": [0, 2, 3, 6, 7, 8, 11],
};
export const DRUM_PIECES = ["kick", "snare", "hi-hat", "percussion"];

export function idxToNote(idx: number, root: string, mode: string): string {
    let root_idx = ROOTS.indexOf(root);
    let low_root_note_idx = (root_idx + 6) % ROOTS.length;
    let offset = MODES[mode][idx % 7];
    let octave_multiplier = idx_to_octave_multiplier(idx);
    let shifted_name_idx = low_root_note_idx + offset + (12 * octave_multiplier);
    return SHIFTED_NOTE_NAMES[shifted_name_idx]
}

export function idxToDrumPiece(idx: number): string {
    return DRUM_PIECES[idx]
}

function idx_to_octave_multiplier(idx: number): number {
    return Math.floor(idx / 7)
}

export function noteNameFromYIdx(y_idx: number): string {
    return NOTE_NAMES[y_idx]
}

export function rootToIdx(root: string): number {
    return ROOTS.indexOf(root)
}

export function noteToNumber(note: string): number {
    switch (note) {
        case "C1":
            return 24;
        case "Db1":
            return 25;
        case "D1":
            return 26;
        case "Eb1":
            return 27;
        case "E1":
            return 28;
        case "F1":
            return 29;
        case "Gb1":
            return 30;
        case "G1":
            return 31;
        case "Ab1":
            return 32;
        case "A1":
            return 33;
        case "Bb1":
            return 34;
        case "B1":
            return 35;
        case "C2":
            return 36;
        case "Db2":
            return 37;
        case "D2":
            return 38;
        case "Eb2":
            return 39;
        case "E2":
            return 40;
        case "F2":
            return 41;
        case "Gb2":
            return 42;
        case "G2":
            return 43;
        case "Ab2":
            return 44;
        case "A2":
            return 45;
        case "Bb2":
            return 46;
        case "B2":
            return 47;
        case "C3":
            return 48;
        case "Db3":
            return 49;
        case "D3":
            return 50;
        case "Eb3":
            return 51;
        case "E3":
            return 52;
        case "F3":
            return 53;
        case "Gb3":
            return 54;
        case "G3":
            return 55;
        case "Ab3":
            return 56;
        case "A3":
            return 57;
        case "Bb3":
            return 58;
        case "B3":
            return 59;
        case "C4":
            return 60;
        case "Db4":
            return 61;
        case "D4":
            return 62;
        case "Eb4":
            return 63;
        case "E4":
            return 64;
        case "F4":
            return 65;
        case "Gb4":
            return 66;
        case "G4":
            return 67;
        case "Ab4":
            return 68;
        case "A4":
            return 69;
        case "Bb4":
            return 70;
        case "B4":
            return 71;
        case "C5":
            return 72;
        case "Db5":
            return 73;
        case "D5":
            return 74;
        case "Eb5":
            return 75;
        case "E5":
            return 76;
        case "F5":
            return 77;
        case "Gb5":
            return 78;
        case "G5":
            return 79;
        case "Ab5":
            return 80;
        case "A5":
            return 81;
        case "Bb5":
            return 82;
        case "B5":
            return 83;
    }
    return 0
}
