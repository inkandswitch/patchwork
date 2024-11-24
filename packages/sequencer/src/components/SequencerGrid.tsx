import classnames from 'classnames'
import { Toggle } from '../datatype';
import { ProgressBar } from './ProgressBar';
import "../style.css";
import { ContactAvatar } from '@/explorer/components/ContactAvatar';
import { SongConfig, barCountFromConfig } from '../config';

interface CellProps {
    toggle: Toggle
    config: SongConfig,
    x: number,
    y: number,
    isPlaying: boolean,
    songIsPlaying: boolean,
    isDrum: boolean,
    playStartTime: number,
    currentTime: number,
    handleToggleChange: (is_toggled: boolean, x: number, y: number) => void,
}

export function Cell({
    toggle,
    config,
    x,
    y,
    isPlaying,
    songIsPlaying,
    isDrum,
    playStartTime,
    currentTime,
    handleToggleChange,
}: CellProps) {
    function onClick() {
        handleToggleChange(!toggle.toggled, x, y);
    }
    let rootColor = false;
    let barStart = false;
    if (y % 7 == 0 && !toggle.toggled && !isDrum) {
        rootColor = true;
    }
    if (x % config.stepsPerBar == 0) {
        barStart = true;
    }

    let toggleOnTime = Math.max(playStartTime, toggle.toggleOnTime);
    let age = currentTime - toggleOnTime;
    let showAged = toggle.toggled && songIsPlaying;
    let isNewToggle = showAged && age < 12000;
    let isYoungToggle = showAged && age >= 12000 && age < 24000;
    let isTeenageToggle = showAged && age >= 24000;

    let classes = classnames(
        'cell',
        {
            'cell-on': toggle.toggled,
            'eighth-notes': config.stepsPerBar == 8,
            'sixteenth-notes': config.stepsPerBar == 16,
            'drum-cell': isDrum,
            'root-color': rootColor,
            'bar-start-color': barStart,
            'playing': isPlaying,
            'new-toggle': isNewToggle,
            'young-toggle': isYoungToggle,
            'teenage-toggle': isTeenageToggle,
            // 'middle-age-toggle': toggle.toggled && toggle.age > 2 && toggle.age <= 3,
            // 'old-toggle': toggle.toggled && toggle.age > 3,
        }
    );
    let avatar = <></>;
    if (toggle.avatarUrl && toggle.toggled) {
        avatar = <ContactAvatar url={toggle.avatarUrl} size="sm" />;
    }
    return <button className={classes} onClick={onClick}>
        {avatar}
    </button>
}

interface GridProps {
    toggleRows: Toggle[][],
    drumToggleRows: Toggle[][],
    handleToggleChange: (isToggled: boolean, x: number, y: number) => void,
    handleDrumToggleChange: (isToggled: boolean, x: number, y: number) => void,
    playingIdx: number,
    playStartTime: number,
    isPlaying: boolean,
    config: SongConfig,
}

export function UIGrid({
    toggleRows,
    drumToggleRows,
    handleToggleChange,
    handleDrumToggleChange,
    playingIdx,
    playStartTime,
    isPlaying,
    config,
}: GridProps) {
    let stepCount = barCountFromConfig(config);
    let currentTime = Date.now();
    return (
        <>
            {toggleRows.map((row, y_idx) => {
                return (
                    <div className="grid-row" key={y_idx}>
                    {row.filter((_toggle, x_idx) => {
                        return x_idx < stepCount
                    }).map((toggle, x_idx) => {
                        let cellIsPlaying = false;
                        if (x_idx == playingIdx) {
                            cellIsPlaying = true;
                        }
                        let key = "cell:x:" + x_idx + ",y:" + y_idx;
                        return <Cell toggle={toggle} config={config} x={x_idx} y={y_idx} handleToggleChange={handleToggleChange} isPlaying={cellIsPlaying} songIsPlaying={isPlaying} isDrum={false} playStartTime={playStartTime} currentTime={currentTime} key={key}></Cell>
                    })}
                    </div>
                )
            }).reverse()}
            <ProgressBar playingIdx={playingIdx} config={config}></ProgressBar>
            <div className="clear"></div>
            {drumToggleRows.map((row, y_idx) => {
                return (
                    <div className="grid-row" key={"drum:" + y_idx}>
                        {row.filter((_toggle, x_idx) => {
                            return x_idx < stepCount
                        }).map((toggle, x_idx) => {
                            let cellIsPlaying = false;
                            if (x_idx == playingIdx) {
                                cellIsPlaying = true;
                            }
                            let key = "drum-cell:x:" + x_idx + ",y:" + y_idx;
                            return <Cell toggle={toggle} config={config} x={x_idx} y={y_idx} handleToggleChange={handleDrumToggleChange} isPlaying={cellIsPlaying} songIsPlaying={isPlaying} isDrum={true} playStartTime={playStartTime} currentTime={currentTime} key={key}></Cell>
                        })}
                    </div>
                )
            }).reverse()}
        </>
    );
}
