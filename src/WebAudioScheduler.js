"use strict";

const events = require("events");
const defaults = require("./utils/defaults");
const defaultContext = require("./defaultContext");

class WebAudioScheduler extends events.EventEmitter {
  constructor(opts) {
    opts = opts || /* istanbul ignore next */ {};

    super();

    this.context = defaults(opts.context, defaultContext);
    this.interval = defaults(opts.interval, 0.025);
    this.aheadTime = defaults(opts.aheadTime, 0.1);
    this.timerAPI = defaults(opts.timerAPI, global);
    this.playbackTime = this.currentTime;

    this._timerId = 0;
    this._schedId = 0;
    this._scheds = [];
  }

  get state() {
    return this._timerId !== 0 ? "running" : "suspended";
  }

  get currentTime() {
    return this.context.currentTime;
  }

  get events() {
    return this._scheds.slice();
  }

  start(callback, args) {
    const loop = () => {
      let t0 = this.context.currentTime;
      let t1 = t0 + this.aheadTime;

      this._process(t0, t1);
    };

    if (this._timerId === 0) {
      this._timerId = this.timerAPI.setInterval(loop, this.interval * 1000);

      if (callback) {
        this.insert(this.context.currentTime, callback, args);
        loop();
      }

      this.emit("start");
    } else {
      this.insert(this.context.currentTime, callback, args);
    }

    return this;
  }

  stop(reset) {
    if (this._timerId !== 0) {
      this.timerAPI.clearInterval(this._timerId);
      this._timerId = 0;

      this.emit("stop");
    }

    if (reset) {
      this._scheds.splice(0);
    }

    return this;
  }

  insert(time, callback, args) {
    let id = ++this._schedId;
    let event = { id, time, callback, args };
    let scheds = this._scheds;

    if (scheds.length === 0 || scheds[scheds.length - 1].time <= time) {
      scheds.push(event);
    } else {
      for (let i = 0, imax = scheds.length; i < imax; i++) {
        if (time < scheds[i].time) {
          scheds.splice(i, 0, event);
          break;
        }
      }
    }

    return id;
  }

  nextTick(time, callback, args) {
    if (typeof time === "function") {
      args = callback;
      callback = time;
      time = this.playbackTime;
    }

    return this.insert(time + this.aheadTime, callback, args);
  }

  remove(schedId) {
    let scheds = this._scheds;

    if (typeof schedId === "number") {
      for (let i = 0, imax = scheds.length; i < imax; i++) {
        if (schedId === scheds[i].id) {
          scheds.splice(i, 1);
          break;
        }
      }
    }

    return schedId;
  }

  removeAll() {
    this._scheds.splice(0);
  }

  _process(t0, t1) {
    let scheds = this._scheds;

    this.playbackTime = t0;
    this.emit("process", { playbackTime: this.playbackTime });

    while (scheds.length && scheds[0].time < t1) {
      let event = scheds.shift();
      let playbackTime = event.time;
      let args = event.args;

      this.playbackTime = playbackTime;

      event.callback({ playbackTime, args });
    }

    this.playbackTime = t0;
    this.emit("processed", { playbackTime: this.playbackTime });
  }
}

module.exports = WebAudioScheduler;
