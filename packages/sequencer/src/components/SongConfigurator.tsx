import { SongConfig } from '../datatype'
import { drumConfigs } from '../music/drum';
import { MODES, ROOTS } from '../music/notes';
import { sampleInstrumentConfigs } from '../music/sample-instrument';

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
    clearGrid: (isPlaying: boolean, instrumentVolume: number, drumVolume: number) => void,
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
    clearGrid,
}: Props) => {
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
        </div>
    );
}


