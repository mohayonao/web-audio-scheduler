# web-audio-scheduler
[![Bower](https://img.shields.io/bower/v/web-audio-scheduler.svg?style=flat)](https://github.com/mohayonao/web-audio-scheduler)
[![6to5](http://img.shields.io/badge/module-6to5-yellow.svg?style=flat)](https://6to5.org/)

> Event Scheduler for Web Audio API

This module is developed based on the idea of this article.

 - http://www.html5rocks.com/en/tutorials/audio/scheduling/

## Installation

downloads:

- [web-audio-scheduler.js](https://raw.githubusercontent.com/mohayonao/web-audio-scheduler/master/build/web-audio-scheduler.js)
- [web-audio-scheduler.min.js](https://raw.githubusercontent.com/mohayonao/web-audio-scheduler/master/build/web-audio-scheduler.min.js)

bower:

```
bower install web-audio-scheduler
```

## Examples

[metronome](http://mohayonao.github.io/web-audio-scheduler/)

```javascript
var audioContext = new AudioContext();
var scheduler = new WebAudioScheduler({
  context: audioContext
});

function mertonome(e) {
  ticktack(e.playbackTime + 0.000, 880, 1.00);
  ticktack(e.playbackTime + 0.500, 220, 0.05);
  ticktack(e.playbackTime + 1.000, 220, 0.05);
  ticktack(e.playbackTime + 1.500, 220, 0.05);
  scheduler.insert(e.playbackTime + 2, mertonome);
}

function ticktack(t0, freq, dur) {
  var osc = audioContext.createOscillator();
  var amp = audioContext.createGain();

  osc.frequency.value = freq;
  amp.gain.setValueAtTime(0.5, t0);
  amp.gain.exponentialRampToValueAtTime(1e-6, t0 + dur);

  osc.start(t0);

  osc.connect(amp);
  amp.connect(audioContext.destination);

  scheduler.insert(t0 + dur, function(e) {
    osc.stop(e.playbackTime);
    scheduler.nextTick(function() {
      osc.disconnect();
      amp.disconnect();
    });
  });
}

scheduler.start(mertonome);
```

## API
### WebAudioScheduler
- `WebAudioScheduler(opts={})`
  - `context: AudioContext`
  - `interval: number` _default: **0.025**(25ms)._
  - `aheadTime: number` _default: **0.1**(100ms)._
  - `offsetTime: number` _default: **0.005**(5ms)._
  - `timerAPI: object` _default: `window || global`._
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
- `start(callback: function): self`
  - Start the schedule timeline, when `callback` given that is inserted in the head of the timeline.
- `stop(): self`
  - Stop the schedule timeline.
- `insert(time: number, callback: function): number`
  - Insert the callback function into the schedule timeline.
- `nextTick(callback: function): number`
  - Insert the callback function at next tick.
- `remove(schedId: number): number`
  - Remove the callback function from the scheduler timeline.

## Customize

### timeline

```
time(ms) 0----25---50---75---100--125--150--175--200---->
         *====|====|====|====|    |    |    |    |
         |    *====|====|====|====|    |    |    |
         |    |    *====|====|====|====|    |    |
         |    |    |    *====|====|====|====|    |
         |    |    |    |    *====|====|====|====|
         :    :    :    :    :    :    :    :    :
         |<-->|    :    :    |<----------------->|
         interval (25ms)       aheadTime (100ms)
         * offset (5ms)      = range of execution to events
```

### timerAPI

TimerAPI should have `setInterval` and `clearInterval` functions.

- [nulltask/stable-timer](https://github.com/nulltask/stable-timer)
  - A timer that is stable in any situation. e.g. tabs in background, the invisible state page.
- [mohayonao/tickable-timer](https://github.com/mohayonao/tickable-timer)
  - Manual ticking `setTimeout` / `setInterval` (for test CI)

### toSeconds

ToSeconds should be a function. This function receives `time: any` and instance of scheduler when calling `insert()`, and returns `time: number`. e.g. the below example supports relative time syntax.

```javascript
var toSeconds = function(value, scheduler) {
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
