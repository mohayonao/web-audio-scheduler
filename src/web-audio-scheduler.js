"use strict";

/* istanbul ignore next */
var AudioContext = global.AudioContext || global.webkitAudioContext;
var defaults = (value, defaultValue)=> (value !== undefined) ? value : defaultValue;

/**
 * @class WebAudioScheduler
 */
module.exports = class WebAudioScheduler {
  /**
   * @constructor
   * @param {object} opts
   * @public
   */
  constructor(opts={}) {
    this.context = opts.context || new AudioContext();
    this.interval = +defaults(opts.interval, 0.025);
    this.aheadTime = +defaults(opts.aheadTime, 0.1);
    this.offsetTime = +defaults(opts.offsetTime, 0.005);
    this.timerAPI = defaults(opts.timerAPI, global);
    this.toSeconds = defaults(opts.toSeconds, (value)=> +value);
    this.playbackTime = 0;

    this._timerId = 0;
    this._schedId = 0;
    this._events = [];
  }

  /**
  * Current time of the audio context
  * @type {number}
  * @public
  */
  get currentTime() {
    return this.context.currentTime;
  }

  /**
   * Sorted list of scheduled items
   * @type {object[]}
   * @public
   */
  get events() {
    return this._events.slice();
  }

  /**
   * Start the scheduler timeline.
   * @param {function} callback
   * @return {WebAudioScheduler} self
   * @public
   */
  start(callback) {
    if (this._timerId === 0) {
      this._timerId = this.timerAPI.setInterval(()=> {
        var t0 = this.context.currentTime;
        var t1 = t0 + this.aheadTime;

        this._process(t0, t1);
      }, this.interval * 1000);
    }
    if (callback) {
      this.insert(0, callback);
    }
    return this;
  }

  /**
   * Stop the scheduler timeline.
   * @param {boolean} reset
   * @return {WebAudioScheduler} self
   * @public
   */
  stop(reset) {
    if (this._timerId !== 0) {
      this.timerAPI.clearInterval(this._timerId);
      this._timerId = 0;
    }
    if (reset) {
      this._events.splice(0);
    }
    return this;
  }

  /**
   * Insert the callback function into the scheduler timeline.
   * @param {number} time
   * @param {function(object)} callback
   * @return {number} schedId
   * @public
   */
  insert(time, callback) {
    time = this.toSeconds(time, this);

    this._schedId += 1;

    var event = {
      id: this._schedId,
      time: time,
      callback: callback
    };
    var events = this._events;

    if (events.length === 0 || events[events.length - 1].time <= time) {
      events.push(event);
    } else {
      for (let i = 0, imax = events.length; i < imax; i++) {
        if (time < events[i].time) {
          events.splice(i, 0, event);
          break;
        }
      }
    }

    return event.id;
  }

  /**
   * Insert the callback function at next tick.
   * @param {function(object)} callback
   * @return {number} schedId
   * @public
   */
  nextTick(callback) {
    return this.insert(this.playbackTime + this.aheadTime, callback);
  }

  /**
   * Remove the callback function from the scheduler timeline.
   * @param {number} schedId
   * @return {number} schedId
   * @public
   */
  remove(schedId) {
    var events = this._events;

    if (typeof schedId === "undefined") {
      events.splice(0);
    } else {
      for (let i = 0, imax = events.length; i < imax; i++) {
        if (schedId === events[i].id) {
          events.splice(i, 1);
          break;
        }
      }
    }

    return schedId;
  }

  /**
   * @private
   */
  _process(t0, t1) {
    var events = this._events;

    this.playbackTime = t0;

    while (events.length && events[0].time < t1) {
      let event = events.shift();

      this.playbackTime = Math.max(this.context.currentTime, event.time) + this.offsetTime;

      event.callback({
        target: this,
        playbackTime: this.playbackTime
      });
    }

    this.playbackTime = t0;
  }
};
