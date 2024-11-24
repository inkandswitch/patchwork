import classnames from 'classnames'
import { Toggle } from "../datatype";
import { globalInstrumentSchedulers, Note, Step } from "../music/instrument-scheduler";
import { idxToDrumPiece, idxToNote } from "../music/notes";
import { ChangeEvent } from 'react';
import { SongConfig, stepDurationFromConfig } from '../config';

export function updateStepGridFromToggles(toggles: Toggle[][], drumToggles: Toggle[][], stepGrid: Step[], config: SongConfig) {
    for (let i = 0; i < stepGrid.length; i++) {
      for (var key in stepGrid[i]["instrument"]) {
        if (stepGrid[i]["instrument"].hasOwnProperty(key)) {
          delete stepGrid[i]["instrument"][key];
        }
      }
        for (var key in stepGrid[i]["drum"]) {
            if (stepGrid[i]["drum"].hasOwnProperty(key)) {
                delete stepGrid[i]["drum"][key];
            }
        }
    }
    toggles.forEach((row, y) => {
        row.forEach((toggle, x) => {
            updateStepFromToggle(toggle.toggled, x, y, stepGrid, config);
        })
    })
    drumToggles.forEach((row, y) => {
        row.forEach((toggle, x) => {
            updateStepFromDrumToggle(toggle.toggled, x, y, stepGrid, config);
        })
    })
}

function updateStepFromToggle(isToggled: boolean, x: number, y: number, stepGrid: Step[], config: SongConfig) {
    let stepDuration = stepDurationFromConfig(config);
    let offset = stepDuration * x;
    let noteName = idxToNote(y, config.root, config.mode);//noteNameFromYIdx(y)
    if (isToggled) {
        let note = new Note(noteName, stepDuration, offset);
        stepGrid[x]["instrument"][noteName] = note;
    } else {
        delete stepGrid[x]["instrument"][noteName];
    }
}

function updateStepFromDrumToggle(isToggled: boolean, x: number, y: number, stepGrid: Step[], config: SongConfig) {
    let stepDuration = stepDurationFromConfig(config);
    let offset = stepDuration * x;
    let drumPieceName = idxToDrumPiece(y);
    if (isToggled) {
        let note = new Note(drumPieceName, stepDuration, offset);
        stepGrid[x]["drum"][drumPieceName] = note;
    } else {
        delete stepGrid[x]["drum"][drumPieceName];
    }
}

interface Props {
    toggleRows: Toggle[][];
    drumToggleRows: Toggle[][];
    stepGrid: Step[];
    config: SongConfig;
    togglePlay: (instrumentVolume: number, drumVolume: number, overridingInstrumentChosen: boolean) => void;
    toggleDirection: () => void;
    instrumentVolume: number;
    setInstrumentVolume: (vol: number) => void;
    drumVolume: number;
    setDrumVolume: (vol: number) => void;
    overridingInstrumentChosen: boolean;
    isPlaying: boolean;
}

export const Player = ({
    toggleRows,
    drumToggleRows,
    stepGrid,
    config,
    togglePlay,
    toggleDirection: toggleDirection,
    instrumentVolume,
    setInstrumentVolume,
    drumVolume,
    setDrumVolume,
    overridingInstrumentChosen,
    isPlaying,
}: Props) => {
    function handleTogglePlay() {
        togglePlay(instrumentVolume, drumVolume, overridingInstrumentChosen);
    }

    function handleVolumeChange(e: any) {
        setInstrumentVolume(e.target.value);
        setDrumVolume(e.target.value);
        if (globalInstrumentSchedulers.length > 0) {
            globalInstrumentSchedulers[0].updateInstrumentVolumeModifier(e.target.value);
            globalInstrumentSchedulers[0].updateDrumVolumeModifier(e.target.value);
        }
    }

    function handleInstrumentVolumeChange(e: any) {
        setInstrumentVolume(e.target.value);
        if (globalInstrumentSchedulers.length > 0) {
            globalInstrumentSchedulers[0].updateInstrumentVolumeModifier(e.target.value);
        }
    }

    function handleDrumVolumeChange(e: any) {
        setDrumVolume(e.target.value);
        if (globalInstrumentSchedulers.length > 0) {
            globalInstrumentSchedulers[0].updateDrumVolumeModifier(e.target.value);
        }
    }

    updateStepGridFromToggles(toggleRows, drumToggleRows, stepGrid, config);
    let playClasses = classnames(
        'button',
        'float-left',
        {
            'playing-button': isPlaying,
        }
    );
    let text = "Play";
    if (isPlaying) {
        text = "Stop";
    }
    let directionClasses = classnames(
        'button',
        'direction-button',
        'float-left',
    );
    let direction = "Forward";
    if (config.stepDirection < 0) {
        direction = "Backward";
    }
    let volume = Math.max(instrumentVolume, drumVolume);
    return (
        <div>
            <button className={playClasses} onClick={handleTogglePlay}>{text}</button>
            <div className='horizontal-block'></div>
            <button className={directionClasses} onClick={toggleDirection}>{direction}</button>
            <div className='horizontal-block'></div>
            <div className='float-left'>
                <label>Volume:</label>
                <input onChange={handleVolumeChange} type="range" min="0.0" max="1.0" step="0.01" value={volume} id="myRange"></input>
                <label>Instrument Volume:</label>
                <input onChange={handleInstrumentVolumeChange} type="range" min="0.0" max="1.0" step="0.01" value={instrumentVolume} id="myRange"></input>
                <label>Drum Volume:</label>
                <input onChange={handleDrumVolumeChange} type="range" min="0.0" max="1.0" step="0.01" value={drumVolume} id="myRange"></input>
            </div>
            <div className="clear-block"></div>
        </div>
    );
};
