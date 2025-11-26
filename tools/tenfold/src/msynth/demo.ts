// @ts-ignore -- not a real error, see https://v3.vitejs.dev/guide/assets.html
import workletUrl from './msynth-worklet.ts?worker&url';

import * as midi from './midi-message-constructors.ts';
import { SAMPLE_RATE } from './constants';
import { MessageToWorklet } from './types.ts';

const uiDiv = document.getElementById('ui') as HTMLDivElement;

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d')!;
uiDiv.appendChild(canvas);

function updateCanvasSize() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;

  // setup the canvas for device-independent pixels
  if (devicePixelRatio !== 1) {
    const oldW = canvas.width;
    const oldH = canvas.height;
    canvas.width = oldW * devicePixelRatio;
    canvas.height = oldH * devicePixelRatio;
    canvas.style.width = oldW + 'px';
    canvas.style.height = oldH + 'px';
    ctx.scale(devicePixelRatio, devicePixelRatio);
  }
}

window.addEventListener('resize', updateCanvasSize);
updateCanvasSize();

// ---- stand-in for the UI ----

const MARGIN = 100;
const LETTER_WIDTH = 200;
const LETTER_HEIGHT = 200;

class Letter {
  public synth: AudioWorkletNode | null = null;
  public params: Float32Array<any> | null = null;

  readonly posX: number;
  readonly posY: number;

  constructor(
    readonly col: number,
    readonly row: number,
    public x = 0,
    public y = 0,
    public isActive = false,
  ) {
    this.posX = MARGIN + col * LETTER_WIDTH;
    this.posY = MARGIN + row * LETTER_HEIGHT;
  }

  contains(px: number, py: number) {
    return (
      this.posX <= px &&
      px <= this.posX + LETTER_WIDTH &&
      this.posY <= py &&
      py <= this.posY + LETTER_HEIGHT
    );
  }

  moveJoystick(px: number, py: number) {
    const cx = this.posX + LETTER_WIDTH / 2;
    const cy = this.posY + LETTER_HEIGHT / 2;
    this.x = Math.max(-1, Math.min((px - cx) / (LETTER_WIDTH / 2), 1));
    this.y = Math.max(-1, Math.min((py - cy) / (LETTER_HEIGHT / 2), 1));
    if (this.params) {
      this.params[1] = (this.x + 1) / 2;
      this.params[2] = (this.y + 1) / 2;
    }
  }

  render() {
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#aaa';
    ctx.strokeRect(this.posX, this.posY, LETTER_WIDTH, LETTER_HEIGHT);
    ctx.fillStyle = this.isActive ? '#aaa' : '#ccc';
    ctx.fillRect(this.posX, this.posY, LETTER_WIDTH, LETTER_HEIGHT);

    ctx.fillStyle = '#888';
    const cx = this.posX + LETTER_WIDTH / 2;
    const cy = this.posY + LETTER_HEIGHT / 2;
    const px = cx + (this.x * LETTER_WIDTH) / 2;
    const py = cy + (this.y * LETTER_HEIGHT) / 2;
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  noteOn(note: number, velocity: number) {
    sendToSynth(this.synth!, {
      command: 'process midi message',
      data: midi.noteOn(0, note, velocity),
    });
  }

  noteOff(note: number, velocity: number) {
    sendToSynth(this.synth!, {
      command: 'process midi message',
      data: midi.noteOff(0, note, velocity),
    });
  }
}

const letters: Letter[] = [];
for (let row = 0; row < 3; row++) {
  for (let col = 0; col < 3; col++) {
    letters.push(new Letter(col, row));
  }
}

let draggingLetter: Letter | null = null;

window.addEventListener('pointerdown', (e) => {
  for (const letter of letters) {
    if (letter.contains(e.clientX, e.clientY)) {
      draggingLetter = letter;
      break;
    }
  }
});

window.addEventListener('pointermove', (e) => {
  draggingLetter?.moveJoystick(e.clientX, e.clientY);
});

window.addEventListener('pointerup', (e) => {
  draggingLetter = null;
});

function render() {
  ctx.clearRect(0, 0, innerWidth, innerHeight);

  for (const letter of letters) {
    letter.render();
  }

  requestAnimationFrame(render);
}

render();

// ---- web audio -----

const patchLibrary = {
  duranDuran: `
    decay = 0.102
    delayAmt = 0.547
    detuneAmt = 0.252
    portamento = param1
    f1 = noteFreq eglide(portamento)
    f2 = f1 * detuneAmt escale(1.01, 1.05)
    oscs = (f1 pwm + f2 pwm) / 2
    dry = oscs * adsr(0, 0, 1, decay escale(0.1, 2))
    out = dry + delayAmt * dry delay(0.378)
  `,
  tomSawyer: `
    resonance = 0.655 // * 2 * param1 lglide(0.1)
    w = 0.5 + (1/5) sine normalize lscale(0, 0.4)
    detune1 = 0.091 * 0.01 // param1 lglide(0.1) * 0.01
    detune2 = 0.836 * 0.01 // detune * 3
    delayAmt = 0.127
    freq = noteFreq / 2
    oscs =
      (
        (freq * (1 - detune1)) pwm(w) +
        (freq * (1 + detune1)) pwm(w) +
        (freq * (1 - 3 * detune2)) pwm(w) +
        (freq * (1 + 3 * detune2)) pwm(w)
      ) / 4
    filterEnv = adsr(0.05, 0, 1, 3) escale(0, 1)
    ampEnv = adsr(0, 0, 1, 6)
    dry = oscs lpf12(10000 * filterEnv, resonance) * ampEnv
    out = dry + delayAmt * dry delay(0.15)
  `,
  rickAndMorty: `
    sound1 = noise bpf(0.2 sine * 800 + 1200, 1)
    sound2 = noise bpf(-(0.25 sine) * 800 + 1200, 1)
    ring = (sound1 + sound1 delay(2) + sound2) * 5.5 pwm normalize * 0.5
    out = ring * adsr(0.01, 0, 1, 2)
  `,
  saw: `
    out = noteFreq saw * adsr(0.01, 0, 1, 0.3)
  `,
  pwm: `
    out = noteFreq pwm(param1 lglide(0.05) lscale(0.2, 0.8)) * adsr(0.05, 0, 1, 0.4)
  `,
  slowSaw: `
    mod = (param1 lglide(0.1) * 10) sine * param2 lglide(0.1) lscale(0.01, 0.05)
    out = (noteFreq * (1 + mod)) saw * adsr(0.1, 0.2, 0.5, 1)
  `,
};

async function start() {
  const context = new AudioContext({
    latencyHint: 'balanced',
    sampleRate: SAMPLE_RATE,
  });

  await context.audioWorklet.addModule(workletUrl);

  // Demo #1
  // tempo = 100;
  // let patches = [patchLibrary.slowSaw];
  // let steps: number[][] = [[52, 60], [62], [64], [65], [64, 67], [69], [71], [72]];

  // Demo #2
  // tempo = 100;
  // let patches = [patchLibrary.pwm];
  // let steps: number[][] = [[60, 63], [62], [63], [65], [67], [68], [71], [72]];

  // Demo #3: cacophony
  tempo = 40;
  let patches = [...Object.values(patchLibrary)];
  let steps: number[][] = [[60, 63], [62], [63], [65], [67], [68], [71], [72], [67]];

  // Demo #4: save a prayer
  // tempo = 113;
  // let patches = [patchLibrary.duranDuran];
  // let steps = [[62], [64], [65], [69], [72], [69], [72], [69]];

  letters.forEach((letter, idx) => {
    const synth = new AudioWorkletNode(context, 'msynth');

    // Important!!!!!
    synth.channelInterpretation = 'discrete';
    synth.channelCount = 2;
    synth.channelCountMode = 'explicit';

    synth.connect(context.destination);
    synth.port.onmessage = (msg) => console.log('worklet:', msg.data);

    letter.synth = synth;
    letter.params = new Float32Array(new SharedArrayBuffer(128));

    // spatial sound: calculate delays for left and right ear
    const wallWidth = 10; // feet
    const distToWall = 10; // feet
    const headWidth = 0.6; // feet
    const speedOfSound = 1125; // feet per second
    const letterX = wallWidth * (letter.col === 0 ? -2 / 3 : letter.col === 1 ? 0 : 2 / 3);
    const leftEarX = -headWidth / 2;
    const rightEarX = headWidth / 2;
    const distToLeftEar = Math.sqrt(distToWall ** 2 + (letterX - leftEarX) ** 2);
    const distToRightEar = Math.sqrt(distToWall ** 2 + (letterX - rightEarX) ** 2);
    const delayLeft = distToLeftEar / speedOfSound;
    const delayRight = distToRightEar / speedOfSound;
    const pan = letter.col === 0 ? 1 / 6 : letter.col === 1 ? 0.5 : 5 / 6;

    sendToSynth(synth, {
      command: 'load patch',
      code: `
        ${patches[idx % patches.length]}
        pan = ${pan}
        left = out * (1 - pan) >> delay(${delayLeft})
        right = out * pan >> delay(${delayRight})
      `,
      params: letter.params.buffer,
    });
  });

  await seconds(0.5); // wait for patches to load
  sequence(steps);
}

window.addEventListener('pointerdown', start, { once: true });

function sendToSynth(synth: AudioWorkletNode, message: MessageToWorklet) {
  synth.port.postMessage(message);
}

// ---- sequencer -----

const order = [0, 1, 2, 5, 4, 3, 6, 7, 8, 5, 4, 3].map((idx) => letters[idx]);
let nextLetterIdx = 0;

let tempo = 120;
let triggerPeriod = 1 / 8;
let noteDuration = 1 / 16;
async function sequence(steps: number[][]) {
  while (true) {
    for (const step of steps) {
      const lettersForThisStep: Letter[] = [];
      if (draggingLetter) {
        step.forEach(() => lettersForThisStep.push(draggingLetter!));
        // while (order[nextLetterIdx] !== draggingLetter) {
        //   nextLetterIdx = (nextLetterIdx + 1) % order.length;
        // }
        // nextLetterIdx = (nextLetterIdx + 1) % order.length;
      } else {
        step.forEach(() => {
          const letter = order[nextLetterIdx];
          lettersForThisStep.push(letter);
          nextLetterIdx = (nextLetterIdx + 1) % order.length;
        });
      }

      step.forEach((note, idx) => {
        const letter = lettersForThisStep[idx];
        letter.noteOn(note, 127);
        letter.isActive = true;
      });
      await seconds((60 / tempo) * noteDuration * 4);

      step.forEach((note, idx) => {
        const letter = lettersForThisStep[idx];
        letter.noteOff(note, 127);
        letter.isActive = false;
      });
      await seconds((60 / tempo) * (triggerPeriod - noteDuration) * 4);
    }
  }
}

// ----- helpers -----

function seconds(s: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, s * 1000);
  });
}
