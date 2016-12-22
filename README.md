# web-audio-scheduler
[![Build Status](https://img.shields.io/travis/mohayonao/web-audio-scheduler.svg?style=flat-square)](https://travis-ci.org/mohayonao/web-audio-scheduler)
[![NPM Version](https://img.shields.io/npm/v/web-audio-scheduler.svg?style=flat-square)](https://www.npmjs.org/package/web-audio-scheduler)
[![License](https://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square)](https://mohayonao.mit-license.org/)

> Event Scheduler for Web Audio API

This module is developed based on the idea of this article.

 - https://www.html5rocks.com/en/tutorials/audio/scheduling/

## Installation

###### npm

```
npm install web-audio-scheduler
```

###### downloads

- [web-audio-scheduler.js](https://raw.githubusercontent.com/mohayonao/web-audio-scheduler/master/build/web-audio-scheduler.js)
- [web-audio-scheduler.min.js](https://raw.githubusercontent.com/mohayonao/web-audio-scheduler/master/build/web-audio-scheduler.min.js)

## Examples

[metronome](https://mohayonao.github.io/web-audio-scheduler/)

```js
const audioContext = new AudioContext();
const sched = new WebAudioScheduler({ context: audioContext });
let masterGain = null;

function metronome(e) {
  const t0 = e.playbackTime;

  sched.insert(t0 + 0.000, ticktack, { frequency: 880, duration: 1.0 });
  sched.insert(t0 + 0.500, ticktack, { frequency: 440, duration: 0.1 });
  sched.insert(t0 + 1.000, ticktack, { frequency: 440, duration: 0.1 });
  sched.insert(t0 + 1.500, ticktack, { frequency: 440, duration: 0.1 });
  sched.insert(t0 + 2.000, metronome);
}

function ticktack(e) {
  const t0 = e.playbackTime;
  const t1 = t0 + e.args.duration;
  const osc = audioContext.createOscillator();
  const amp = audioContext.createGain();

  osc.frequency.value = e.args.frequency;
  osc.start(t0);
  osc.stop(t1);
  osc.connect(amp);

  amp.gain.setValueAtTime(0.5, t0);
  amp.gain.exponentialRampToValueAtTime(1e-6, t1);
  amp.connect(masterGain);

  sched.nextTick(t1, () => {
    osc.disconnect();
    amp.disconnect();
  });
}

sched.on("start", () => {
  masterGain = audioContext.createGain();
  masterGain.connect(audioContext.destination);
});

sched.on("stop", () => {
  masterGain.disconnect();
  masterGain = null;
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    sched.aheadTime = 0.1;
  } else {
    sched.aheadTime = 1.0;
    sched.process();
  }
});

document.getElementById("start-button").addEventListener("click", () => {
  sched.start(metronome);  
});

document.getElementById("stop-button").addEventListener("click", () => {
  sched.stop(true);
});
```

## API
### WebAudioScheduler
- `WebAudioScheduler(opts = {})`
  - `context: AudioContext`
  - `interval: number` _default: **0.025** (25ms)_
  - `aheadTime: number` _default: **0.1** (100ms)_
  - `timerAPI: object` _default: `window || global`_

#### Instance properties
- `context: AudioContext`
- `interval: number`
- `aheadTime: number`
- `timerAPI: object`
- `playbackTime: number`
- `currentTime: number`
- `state: string`
- `events: object[]`

#### Instance methods
- `start([ callback: function, args: any ]): self`
  - Start the timeline.
  - The `callback` is inserted in the head of the event list if given.
- `stop([ reset = true: boolean ]): self`
  - Stop the timeline.
  - The event list is cleared if `reset` is truthy.
- `insert(time: number, callback: function, [ args: any ]): number`
  - Insert the `callback` into the event list.
  - The return value is `schedId`. It is used to `.remove()` the callback.
- `nextTick([ time: number ], callback: function, [ args: any ]): number`
  - Same as `.insert()`, but this callback is called at next tick.
  - This method is used to disconnect an audio node at the proper timing.
- `remove(schedId: number): number`
  - Remove a callback function from the event list.
- `removeAll(): void`
  - Remove all callback functions from the event list.
- `process(): void`
  - process events immediately (this is useful when transition to background tabs)

#### Events
- `"start"`
  - emitted when the scheduler started.
- `"stop"`
  - emitted when the scheduler stopped.
- `"process"`
  - emitted before each scheduler process.
- `"processed"`
  - emitted after each scheduler process.

#### Callback
A callback function receives a schedule event and given arguments at `.insert()`.

A schedule event has two parameters.

  - `playbackTime: number`
  - `args: any`

```js
sched.insert(0, callback, [ 1, 2 ]);

function callback(e) {
  assert(e.playbackTime === 0);
  assert(e.args[0] === 1);
  assert(e.args[1] === 2);
}
```

## Customize

### timeline

```
time(ms) 0----25---50---75---100--125--150--175--200---->
         =====|====|====|====|    |    |    |    |
         |    =====|====|====|====|    |    |    |
         |    |    =====|====|====|====|    |    |
         |    |    |    | ===|====|====|====|==  |
         |    |    |    |    | ===|====|====|====|==
         :    :    :    :    :    :    :    :    :
         |<-->|    :    :      |<------------------>|
         interval (25ms)       aheadTime (100ms)
                             = range of execution to events
```

The below example is the same configuration as defaults.

```js
const sched = new WebAudioScheduler({ interval: 0.025, aheadTime: 0.1 });
```

### timerAPI

TimerAPI is used instead of the native timer API. TimerAPI should have two functions, `setInterval` and `clearInterval`.

- [mohayonao/worker-timer](https://github.com/mohayonao/worker-timer)
  - A timer that is stable in any situation. e.g. tabs in background, the invisible state page.
- [mohayonao/tickable-timer](https://github.com/mohayonao/tickable-timer)
  - Manual ticking `setTimeout` / `setInterval` (for test CI)

The below example uses stable-timer instead of the native timer API.

```js
const WorkerTimer = require("worker-timer");
const sched = new WebAudioScheduler({ timerAPI: WorkerTimer });
```

## License

MIT
