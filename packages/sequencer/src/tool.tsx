import { useDocument, useHandle } from "@automerge/automerge-repo-react-hooks";

import { EditorProps, makeTool } from "@/tools";
import { next as A } from "@automerge/automerge";
import { useMemo, useState } from "react";
import { SequencerDoc, SequencerDocAnchor, SongConfig, Toggle } from "./datatype";
import { Player } from "./components/Player";
import { UIGrid } from "./components/SequencerGrid";
import { SongConfigurator } from "./components/SongConfigurator";
import { InstrumentSamplePlayerConfig, sampleInstrumentConfigs } from "./music/sample-instrument";
import { drumConfigs, DrumSamplePlayerConfig } from "./music/drum";
import { toggleFn } from "./music/toggle-play";
import { useCurrentAccount } from "@/explorer/account";
import { globalInstrumentSchedulers } from "./music/instrument-scheduler";
import { COL_COUNT, STEPS_PER_BAR } from "./config";
import { AutomergeUrl } from "@automerge/automerge-repo";
import { SamplePlayer } from "./music/sample-player";

function updateToggle(toggleRows: Toggle[][], x: number, y: number, isToggled: boolean, avatarUrl: AutomergeUrl | null) {
  toggleRows[y][x].toggled = isToggled;
  if (isToggled) {
    toggleRows[y][x].avatarUrl = avatarUrl;
    toggleRows[y][x].toggleOnTime = Date.now();
  } else {
    toggleRows[y][x].avatarUrl = null;
    toggleRows[y][x].toggleOnTime = 0;
  }
}

export const Sequencer = ({
  docUrl,
  docHeads,
  annotations = [],
}: EditorProps<SequencerDocAnchor, string>) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playStartTime, setPlayStartTime] = useState(0);
  const [playingIdx, setPlayingIdx] = useState(0);
  const [instrumentVolume, setInstrumentVolume] = useState(1.0);
  const [drumVolume, setDrumVolume] = useState(1.0);
  const [latestDoc] = useDocument<SequencerDoc>(docUrl); // used to trigger re-rendering when the doc loads
  const handle = useHandle<SequencerDoc>(docUrl)!; // TODO: JAH strict fix

  const doc = useMemo(
    () => (latestDoc && docHeads ? A.view(latestDoc, docHeads) : latestDoc),
    [latestDoc, docHeads]
  );

  if (!doc) {
    return null;
  }

  const account = useCurrentAccount();
  let avatarUrl = account?.contactHandle.url;

  const incrementToggleAges = () => {
    handle.change((doc) => {
      doc.toggleRows.forEach((row) => {
        row.forEach((toggle) => {
          if (toggle.toggled) {
            toggle.toggleOnTime += 1;
          }
        })
      });
      doc.drumToggleRows.forEach((row) => {
        row.forEach((toggle) => {
          if (toggle.toggled) {
            toggle.toggleOnTime += 1;
          }
        })
      });
    })
  }

  const togglePlay = toggleFn(doc.stepGrid, setPlayingIdx, setIsPlaying, setPlayStartTime, incrementToggleAges, doc.config);

  const handleToggleChange = (isToggled: boolean, x: number, y: number) => {
    handle.change((doc) => {
      if (isToggled && doc.config.isMonophonic) {
        doc.toggleRows.forEach((row) => {
          row[x].toggled = false;
          row[x].avatarUrl = null;
          row[x].toggleOnTime = 0;
        })
      }
      updateToggle(doc.toggleRows, x, y, isToggled, avatarUrl);
    });
  };

  const handleDrumToggleChange = (isToggled: boolean, x: number, y: number) => {
    handle.change((doc) => {
      updateToggle(doc.drumToggleRows, x, y, isToggled, avatarUrl);
      doc.drumToggleRows[y][x].toggled = isToggled;
    });
  };

  const handleConfigChange = (updateConfig: (config: SongConfig) => void) => {
    handle.change((doc) => {
      updateConfig(doc.config);
      if (globalInstrumentSchedulers.length > 0) {
        globalInstrumentSchedulers[0].updateConfig(doc.config);
      }
    });
  }

  const toggleDirection = () => {
    handle.change((doc) => {
      if (!doc.config.stepDirection) {
        doc.config.stepDirection = 1;
      }
      doc.config.stepDirection = 0 - doc.config.stepDirection;
      if (globalInstrumentSchedulers.length > 0) {
        globalInstrumentSchedulers[0].updateConfig(doc.config);
      }
    })
  }

  const handleInstrumentChange = (instrumentName: string) => {
    handle.change((doc) => {
      doc.config.instrument = sampleInstrumentConfigs[instrumentName];
      if (globalInstrumentSchedulers.length > 0) {
        let instrumentSamplePlayerConfig = new InstrumentSamplePlayerConfig(doc.config.instrument);
        let samplePlayer = new SamplePlayer(instrumentSamplePlayerConfig, instrumentVolume);
        globalInstrumentSchedulers[0].updateInstrument(samplePlayer);
      }
    })
  }

  const handleDrumChange = (drumName: string) => {
    handle.change((doc) => {
      doc.config.drum = drumConfigs[drumName];
      if (globalInstrumentSchedulers.length > 0) {
        let drumSamplePlayerConfig = new DrumSamplePlayerConfig(doc.config.drum);
        let drumSamplePlayer = new SamplePlayer(drumSamplePlayerConfig, drumVolume);
        globalInstrumentSchedulers[0].updateDrum(drumSamplePlayer);
      }
    })
  }

  const duplicateFirstBarDrums = (isPlaying: boolean, instrumentVolume: number, drumVolume: number) => {
    if (isPlaying) {
      togglePlay(instrumentVolume, drumVolume);
    }
    handle.change((doc) => {
      let copyStepCount = STEPS_PER_BAR * doc.config.bars;
      let offset1 = copyStepCount;
      let offset2 = copyStepCount * 2;
      let offset3 = copyStepCount * 3;
      for (let i = 0; i < copyStepCount; i++) {
        let drumStep = Object.assign({}, doc.stepGrid[i]["drum"]);
        if ((i + offset1) < doc.stepGrid.length) {
          doc.stepGrid[i + offset1]["drum"] = drumStep;
        }
        if ((i + offset2) < doc.stepGrid.length) {
          doc.stepGrid[i + offset2]["drum"] = drumStep;
        }
        if ((i + offset3) < doc.stepGrid.length) {
          doc.stepGrid[i + offset3]["drum"] = drumStep;
        }
      }
      doc.drumToggleRows.forEach((row) => {
        for (let i = 0; i < copyStepCount; i++) {
          let v = Object.assign({}, row[i]);;
          if ((i + offset1) < doc.stepGrid.length) {
            row[i + offset1] = v;
          }
          if ((i + offset2) < doc.stepGrid.length) {
            row[i + offset2] = v;
          }
          if ((i + offset3) < doc.stepGrid.length) {
            row[i + offset3] = v;
          }
        }
      });
    })
  }

  const duplicateFirstBarNotes = (isPlaying: boolean, instrumentVolume: number, drumVolume: number) => {
    if (isPlaying) {
      togglePlay(instrumentVolume, drumVolume);
    }
    handle.change((doc) => {
      let copyStepCount = STEPS_PER_BAR * doc.config.bars;
      let offset1 = copyStepCount;
      let offset2 = copyStepCount * 2;
      let offset3 = copyStepCount * 3;
      for (let i = 0; i < copyStepCount; i++) {
        let instStep = Object.assign({}, doc.stepGrid[i]["instrument"]);
        if ((i + offset1) < doc.stepGrid.length) {
          doc.stepGrid[i + offset1]["instrument"] = instStep;
        }
        if ((i + offset2) < doc.stepGrid.length) {
          doc.stepGrid[i + offset2]["instrument"] = instStep;
        }
        if ((i + offset3) < doc.stepGrid.length) {
          doc.stepGrid[i + offset3]["instrument"] = instStep;
        }
      }
      doc.toggleRows.forEach((row) => {
        for (let i = 0; i < copyStepCount; i++) {
          let v = Object.assign({}, row[i]);;
          if ((i + offset1) < doc.stepGrid.length) {
            row[i + offset1] = v;
          }
          if ((i + offset2) < doc.stepGrid.length) {
            row[i + offset2] = v;
          }
          if ((i + offset3) < doc.stepGrid.length) {
            row[i + offset3] = v;
          }
        }
      });
    })
  }

  const clearGrid = (isPlaying: boolean, instrumentVolume: number, drumVolume: number) => {
    if (!confirm("WARNING: Are you sure you want to clear the entire grid?")) {
      return
    }
    if (isPlaying) {
      togglePlay(instrumentVolume, drumVolume);
    }
    handle.change((doc) => {
      doc.toggleRows.forEach((row) => {
        row.forEach((toggle) => toggle.toggled = false)
      })
      doc.drumToggleRows.forEach((row) => {
        row.forEach((toggle) => toggle.toggled = false)
      })
    })
  }

  // const cellAnnotations = annotations.map((annotation) => ({
  //   row: annotation.anchor.row,
  //   col: annotation.anchor.column,
  //   renderer: "addedCell",
  // }));

  return (
    <div className="w-full h-full overflow-hidden">
      <Player
        toggleRows={doc.toggleRows}
        drumToggleRows={doc.drumToggleRows}
        stepGrid={doc.stepGrid}
        config={doc.config}
        instrumentVolume={instrumentVolume}
        setInstrumentVolume={setInstrumentVolume}
        drumVolume={drumVolume}
        setDrumVolume={setDrumVolume}
        togglePlay={togglePlay}
        toggleDirection={toggleDirection}
        isPlaying={isPlaying}
      />
      <UIGrid
        toggleRows={doc.toggleRows}
        drumToggleRows={doc.drumToggleRows}
        handleToggleChange={handleToggleChange}
        handleDrumToggleChange={handleDrumToggleChange}
        playingIdx={playingIdx}
        playStartTime={playStartTime}
        isPlaying={isPlaying}
        config={doc.config}
      />
      <div className="clear-block"></div>
      <SongConfigurator
        config={doc.config}
        isPlaying={isPlaying}
        instrumentVolume={instrumentVolume}
        drumVolume={drumVolume}
        handleConfigChange={handleConfigChange}
        handleInstrumentChange={handleInstrumentChange}
        handleDrumChange={handleDrumChange}
        duplicateFirstBarNotes={duplicateFirstBarNotes}
        duplicateFirstBarDrums={duplicateFirstBarDrums}
        clearGrid={clearGrid}
      />
    </div>
  );
};

export const SequencerTool = makeTool({
  type: "patchwork:tool",
  id: "sequencer",
  name: "Sequencer",
  supportedDataTypes: ["sequencer"],
  EditorComponent: Sequencer,
});
