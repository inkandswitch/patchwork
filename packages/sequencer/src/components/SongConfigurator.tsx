import { useState } from 'react';
import { SongConfig } from '../config'
import { drumConfigs } from '../music/drum';
import { MODES, ROOTS } from '../music/notes';
import { sampleInstrumentConfigs } from '../music/sample-instrument';
import { exportMidi } from '../midi/midi';

interface Props {
    config: SongConfig;
    isPlaying: boolean;
    instrumentVolume: number;
    drumVolume: number;
    handleConfigChange: (updateConfig: (config: SongConfig) => void) => void;
    handleInstrumentChange: (instrumentName: string) => void;
    handleDrumChange: (drumName: string) => void;
    duplicateFirstBarNotes: (isPlaying: boolean, instrumentVolume: number, drumVolume: number) => void,
    duplicateFirstBarDrums: (isPlaying: boolean, instrumentVolume: number, drumVolume: number) => void,
    fetchOverridingInstrument: (overridingInstrumentUrl: string) => boolean;
    setOverridingInstrumentChosen: (isChosen: boolean) => void;
    clearGrid: (isPlaying: boolean, instrumentVolume: number, drumVolume: number) => void,
    resetGrid: (isPlaying: boolean, instrumentVolume: number, drumVolume: number) => void;
}

export const SongConfigurator = ({
    config,
    isPlaying,
    instrumentVolume,
    drumVolume,
    handleConfigChange,
    handleInstrumentChange,
    handleDrumChange,
    duplicateFirstBarNotes,
    duplicateFirstBarDrums,
    fetchOverridingInstrument,
    setOverridingInstrumentChosen,
    clearGrid,
    resetGrid,
}: Props) => {
    const [fetchUrl, setFetchUrl] = useState("");
    function flipMonophonic() {
        handleConfigChange((config) => {
            config.isMonophonic = !config.isMonophonic;
        });
    }
    function changeMode(e: any) {
        handleConfigChange((config) => {
            config.mode = e.target.value;
        });
    }
    function changeRoot(e: any) {
        handleConfigChange((config) => {
            config.root = e.target.value;
        });
    }
    function changeInstrument(e: any) {
        handleInstrumentChange(e.target.value);
    }
    function changeDrum(e: any) {
        handleDrumChange(e.target.value);
    }
    function changeTempo(e: any) {
        handleConfigChange((config) => {
            config.tempo = e.target.value;
        });
    }
    function changeBars(e: any) {
        handleConfigChange((config) => {
            config.bars = e.target.value;
        });
    }
    function changeStepsPerBar(e: any) {
        if (!confirm("WARNING: This will clear the grid. Proceed?")) {
            return
        }
        handleConfigChange((config) => {
            config.stepsPerBar = e.target.value;
        });
        resetGrid(isPlaying, instrumentVolume, drumVolume);
    }
    function handleDuplicateFirstBarNotes() {
        if (!confirm("WARNING: Are you sure you want to overwrite all other bars with the first bar notes?")) {
            return
        }
        duplicateFirstBarNotes(isPlaying, instrumentVolume, drumVolume);
    }
    function handleDuplicateFirstBarDrums() {
        if (!confirm("WARNING: Are you sure you want to overwrite all other bars with the first bar drums?")) {
            return
        }
        duplicateFirstBarDrums(isPlaying, instrumentVolume, drumVolume);
    }
    function handleDuplicateFirstBar() {
        if (!confirm("WARNING: Are you sure you want to overwrite all other bars with the first bar?")) {
            return
        }
        duplicateFirstBarNotes(isPlaying, instrumentVolume, drumVolume);
        duplicateFirstBarDrums(isPlaying, instrumentVolume, drumVolume);
    }
    function handleClearGrid() {
        clearGrid(isPlaying, instrumentVolume, drumVolume);
    }
    function handleSetFetchUrl(e: any) {
        setFetchUrl(e.target.value)
    }
    function handleFetchOverridingInstrument(_e: any) {
        if (fetchOverridingInstrument(fetchUrl)) {
            setOverridingInstrumentChosen(true);
        }
    }
    let text = "Poly";
    if (config.isMonophonic) {
        text = "Mono";
    }
    return (
        <div>
            <button className="button config-button float-left" onClick={flipMonophonic}>{text}</button>
            <div className='horizontal-block'></div>
            <div className='float-left'>
                <label>
                    Scale/Mode:
                    <select onChange={changeMode} value={config.mode}>
                        {Object.keys(MODES).map((name) => {
                            return <option value={name} key={name}>{name}</option>
                        })}
                    </select>
                </label>
            </div>
            <div className='horizontal-block'></div>
            <div className='float-left'>
                <label>
                    Root:
                    <select onChange={changeRoot} value={config.root}>
                        {ROOTS.map((name) => {
                            return <option value={name} key={name}>{name}</option>
                        })}
                    </select>
                </label>
            </div>
            <div className='horizontal-block'></div>
            <div className='float-left'>
                <label>
                    Bars:
                    <select onChange={changeBars} value={config.bars}>
                        <option value={1}>1</option>
                        <option value={2}>2</option>
                        <option value={3}>3</option>
                        <option value={4}>4</option>
                    </select>
                </label>
            </div>
            <div className='clear-block'></div>
            <div className='float-left'>
                <label>
                    Instrument:
                    <select onChange={changeInstrument} value={config.instrument["name"]}>
                        {Object.keys(sampleInstrumentConfigs).map((name) => {
                            return <option value={name} key={name}>{name}</option>
                        })}
                    </select>
                </label>
            </div>
            <div className='horizontal-block'></div>
            <div className='float-left'>
                <label>
                    Drum:
                    <select onChange={changeDrum} value={config.drum["name"]}>
                        {Object.keys(drumConfigs).map((name) => {
                            return <option value={name} key={name}>{name}</option>
                        })}
                    </select>
                </label>
            </div>
            <div className='horizontal-block'></div>
            <div className='float-left'>
                <label>
                    Tempo (stop + play to pick up)---
                    <input name="tempo" type="number" min="1" max="500" onChange={changeTempo} value={config.tempo} />
                </label>
            </div>
            <div className='clear'></div>
            <div className='horizontal-block'></div>
            <div className='explanation float-left'>The options below are destructive and can interfere with collaboration!</div>
            <div className='clear'></div>
            <div className='horizontal-block'></div>
            <button className="button duplicate-button float-left" onClick={handleDuplicateFirstBarNotes}>Paste Notes</button>
            <div className='horizontal-block'></div>
            <button className="button duplicate-button float-left" onClick={handleDuplicateFirstBarDrums}>Paste Drums</button>
            <div className='horizontal-block'></div>
            <button className="button duplicate-button float-left" onClick={handleDuplicateFirstBar}>Paste All</button>
            <div className='horizontal-block'></div>
            <button className="button clear-button float-left" onClick={handleClearGrid}>Clear</button>
            <div className='horizontal-block'></div>
            <div className='float-left'>
                <label>
                    Bar division (resets grid):
                    <select onChange={changeStepsPerBar} value={config.stepsPerBar}>
                        <option value={8} key="8steps">8</option>
                        <option value={16} key="16steps">16</option>
                    </select>
                </label>
            </div>
            <div className='clear-block'></div>
            <div className='clear-block'></div>
            <div className='clear-block'></div>
            <div className='clear-block'></div>
            <div className='clear-block'></div>
            <div className='horizontal-block'></div>
            <div className='solid-outline'>
                <label>
                    {"Load external instrument script (beware malicious code!)"}
                    <div className='horizontal-block'></div>
                    <input name='fetchUrl' className='solid-outline' style={{ marginLeft: "20px" }} type="string" onChange={handleSetFetchUrl}></input>
                    <button className='button fetch-button' style={{marginLeft: "20px"}} onClick={handleFetchOverridingInstrument}>Fetch</button>
                </label>
            </div>
        </div>
    );
}


