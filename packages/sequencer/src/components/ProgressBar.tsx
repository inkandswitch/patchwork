import classnames from 'classnames'
import { SongConfig } from '../config';

interface ProgressCellProps {
    config: SongConfig,
    playing: boolean;
}

const ProgressCell = ({
    config,
    playing,
}: ProgressCellProps) => {
    let display = "-";
    if (playing) {
        display = "*";
    }
    let classes = classnames(
        'progress-cell',
        {
            'lit': playing,
            'eighth-notes': config["stepsPerBar"] == 8,
            'sixteenth-notes': config["stepsPerBar"] == 16,
        }
    );

    return (
        <div className={classes}></div>
    );
}

interface ProgressBarProps {
    playingIdx: number;
    config: SongConfig;
}

export const ProgressBar = ({
    playingIdx,
    config,
}: ProgressBarProps) => {
    let bar = [];
    let width = config.bars * config["stepsPerBar"];
    let progressIdx = playingIdx;
    // TODO: This code exists because the playingIdx is one off
    // depending on direction.
    if (config.stepDirection > 0) {
        progressIdx = ((progressIdx - 1) + width) % width;
    } else {
        progressIdx = (progressIdx + 1) % width;
    }
    for (let i = 0; i < width; i++) {
        let playing = false;
        if (i == progressIdx) {
            playing = true;
        }
        bar.push(<ProgressCell config={config} playing={playing} key={"progress-cell:" + i}></ProgressCell>);
    }
    return bar
}
