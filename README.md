# web-audio-scheduler
[![Bower](https://img.shields.io/bower/v/web-audio-scheduler.svg?style=flat)](https://github.com/mohayonao/web-audio-scheduler)
[![6to5](http://img.shields.io/badge/module-6to5-yellow.svg?style=flat)](https://6to5.org/)

> Event Scheduler for Web Audio API

If you want to learn about this module, should read this article.

  - http://www.html5rocks.com/en/tutorials/audio/scheduling/

## Installation

downloads:

- [web-audio-scheduler.js](https://raw.githubusercontent.com/mohayonao/web-audio-scheduler.js/master/build/web-audio-scheduler.js)
- [web-audio-scheduler.min.js](https://raw.githubusercontent.com/mohayonao/web-audio-scheduler.js/master/build/web-audio-scheduler.min.js)

bower:

```
bower install web-audio-scheduler
```

## Examples

```javascript
var scheduler = new WebAudioScheduler();

var metronome = function(e) {
  ticktack(e.playbackTime + 0.000, 880);
  ticktack(e.playbackTime + 0.500, 440);
  ticktack(e.playbackTime + 1.000, 440);
  ticktack(e.playbackTime + 1.500, 440);
  scheduler.insert(e.playbackTime + 2, metronome);
};

var ticktack = function(t0, freq) {
  var osc = audioContext.createOscillator();
  var amp = audioContext.createGain();

  osc.frequency.value = freq;
  osc.start(t0);

  amp.gain.setValueAtTime(0.25, t0);
  amp.gain.exponentialRampToValueAtTime(1e-6, t0 + 0.75);

  osc.connect(amp);
  amp.connect(audioContext.destination);

  scheduler.insert(t0 + 0.75, function(e) {
    osc.stop(e.playbackTime);
    osc.disconnect();
    amp.disconnect();
  });
};

scheduler.start();
scheduler.insert(0, metronome);
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

  [see the details](#customizes)

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
- `start(): self`
  - Start the scheduler timeline.
- `stop(): self`
  - Stop the scheduler timeline.
- `insert(time: number, callback:function): number`
  - Insert the callback function into the scheduler timeline.
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
      return scheduler.context.currentTime + +value.substr(1);
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
