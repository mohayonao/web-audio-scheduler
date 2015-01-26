# web-audio-scheduler
[![Build Status](http://img.shields.io/travis/mohayonao/web-audio-scheduler.svg?style=flat-square)](https://travis-ci.org/mohayonao/web-audio-scheduler)
[![Bower](https://img.shields.io/bower/v/web-audio-scheduler.svg?style=flat-square)](https://github.com/mohayonao/web-audio-scheduler)
[![6to5](http://img.shields.io/badge/module-6to5-brightgreen.svg?style=flat-square)](https://6to5.org/)
[![License](http://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square)](http://mohayonao.mit-license.org/)

> Event Timeline for Web Audio API

This module is developed based on the idea of this article.

 - http://www.html5rocks.com/en/tutorials/audio/scheduling/

## Installation

bower:

```
bower install web-audio-scheduler
```

npm:

```
npm install web-audio-scheduler
```

downloads:

- [web-audio-scheduler.js](https://raw.githubusercontent.com/mohayonao/web-audio-scheduler/master/build/web-audio-scheduler.js)
- [web-audio-scheduler.min.js](https://raw.githubusercontent.com/mohayonao/web-audio-scheduler/master/build/web-audio-scheduler.min.js)

## Examples

[metronome](http://mohayonao.github.io/web-audio-scheduler/)

```javascript
var audioContext = new AudioContext();
var scheduler = new WebAudioScheduler({
  context: audioContext
});

function metronome(e) {
  scheduler.insert(e.playbackTime + 0.000, ticktack, [ 880, 1.00 ]);
  scheduler.insert(e.playbackTime + 0.500, ticktack, [ 440, 0.05 ]);
  scheduler.insert(e.playbackTime + 1.000, ticktack, [ 440, 0.05 ]);
  scheduler.insert(e.playbackTime + 1.500, ticktack, [ 440, 0.05 ]);
  scheduler.insert(e.playbackTime + 2.000, metronome);
}

function ticktack(e, freq, dur) {
  var t0 = e.playbackTime;
  var t1 = t0 + dur;
  var osc = audioContext.createOscillator();
  var amp = audioContext.createGain();

  osc.frequency.value = freq;
  amp.gain.setValueAtTime(0.5, t0);
  amp.gain.exponentialRampToValueAtTime(1e-6, t1);

  osc.start(t0);

  osc.connect(amp);
  amp.connect(audioContext.destination);

  scheduler.insert(t1, function(e) {
    osc.stop(e.playbackTime);
    scheduler.nextTick(function() {
      osc.disconnect();
      amp.disconnect();
    });
  });
}

function start() {
  scheduler.start(metronome);
}

function stop() {
  scheduler.stop(true);
}
```

## API
### WebAudioScheduler
- `WebAudioScheduler(opts={})`
  - `context: AudioContext`
  - `interval: number` _default: **0.025** (25ms)_
  - `aheadTime: number` _default: **0.1** (100ms)_
  - `offsetTime: number` _default: **0.005** (5ms)_
  - `timerAPI: object` _default: `window || global`_
  - `toSeconds: function` _default: `(value)=> +value`_

  [see the details](#customize)

#### Instance properties
- `context: AudioContext`
- `interval: number`
- `aheadTime: number`
- `offsetTime: number`
- `timerAPI: object`
- `toSeconds: function`
- `currentTime: number`
  - Current time of the audio context
- `playbackTime: number`
  - Playback time of the timeline
- `events: object[]`
  - Sorted list of scheduled items

#### Instance methods
- `start([callback: function]): self`
  - Start the timeline.
  - The `callback` is inserted in the head of the event list if given.
- `stop([reset: boolean]): self`
  - Stop the timeline.
  - The event list is cleared if `reset` is truthy.
- `insert(time: number, callback: function, [args: any[]]): number`
  - Insert the `callback` into the event list.
  - The return value is `schedId`. It is used to `.remove()` the callback.
- `nextTick(callback: function, [args: any[]]): number`
  - Same as `.insert()`, but this callback is called at next tick.
  - This method is used to disconnect an audio node at the proper timing.
- `remove([schedId: number]): number`
  - Remove a callback function from the event list.
  - Remove all callback functions from the event list if `schedId` is omitted.

#### Callback
A callback function receives a schedule event and given arguments at `.insert()`.

A schedule event has two parameters.

  - `target: WebAudioScheduler`
  - `playbackTime: number`

```javascript
scheduler.insert(0, callback, [ 1, 2 ]);

function callback(e, arg1, arg2) {
  assert(this === scheduler);
  assert(e.target === scheduler);
  assert(e.playbackTime === 0 + scheduler.offsetTime);
  assert(arg1 === 1);
  assert(arg2 === 2);
}
```

## Customize

### timeline

```
time(ms) 0----25---50---75---100--125--150--175--200---->
         *====|====|====|====|    |    |    |    |
         |    *====|====|====|====|    |    |    |
         |    |    *====|====|====|====|    |    |
         |    |    |    | *==|====|====|====|==  |
         |    |    |    |    | *==|====|====|====|==
         :    :    :    :    :    :    :    :    :
         |<-->|    :    :      |<------------------>|
         interval (25ms)       aheadTime (100ms)
         * offset (5ms)      = range of execution to events
```

The below example is the same configuration as defaults.

```javascript
var sched = new WebAudioScheduler({
  interval: 0.025,
  aheadTime: 0.1,
  offsetTime: 0.005
});
```

### timerAPI

TimerAPI is used instead of the native timer API. TimerAPI should have two functions, `setInterval` and `clearInterval`.

- [nulltask/stable-timer](https://github.com/nulltask/stable-timer)
  - A timer that is stable in any situation. e.g. tabs in background, the invisible state page.
- [mohayonao/tickable-timer](https://github.com/mohayonao/tickable-timer)
  - Manual ticking `setTimeout` / `setInterval` (for test CI)

The below example uses stable-timer instead of the native timer API.

```javascript
var shced = new WebAudioScheduler({
  timerAPI: StableTimer
});
```

### toSeconds

ToSeconds should be a function. This function receives `value: any` and an instance of scheduler when calling `insert()`, and should return `time: number`. e.g. the below example supports relative time syntax.

```javascript
function toSeconds(value, scheduler) {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    if (value.charAt(0) === "+") {
      return scheduler.currentTime + +value.substr(1);
    }
  }
  return 0;
};

var sched = new WebAudioScheduler({ toSeconds: toSeconds });

sched.insert("+0.5", function(e) {
  // this event will be called at currentTime + 500 milliseconds
});
```

## License

MIT
