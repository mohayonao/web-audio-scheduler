!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.WebAudioScheduler=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
"use strict";

var _prototypeProperties = function (child, staticProps, instanceProps) {
  if (staticProps) Object.defineProperties(child, staticProps);
  if (instanceProps) Object.defineProperties(child.prototype, instanceProps);
};

/* istanbul ignore next */
var AudioContext = global.AudioContext || global.webkitAudioContext;

/**
 * @class WebAudioScheduler
 */
module.exports = (function () {
  /**
   * @constructor
   * @param {object} opts
   * @public
   */
  function WebAudioScheduler() {
    var opts = arguments[0] === undefined ? {} : arguments[0];
    this.context = opts.context || new AudioContext();
    this.interval = opts.interval || 0.025;
    this.aheadTime = opts.aheadTime || 0.1;
    this.offsetTime = opts.offsetTime || 0.005;
    this.timerAPI = opts.timerAPI || global;
    this.toSeconds = opts.toSeconds || function (value) {
      return +value;
    };
    this.playbackTime = 0;

    this._timerId = 0;
    this._schedId = 0;
    this._events = [];
  }

  _prototypeProperties(WebAudioScheduler, null, {
    currentTime: {

      /**
      * Current time of the audio context
      * @type {number}
      * @public
      */
      get: function () {
        return this.context.currentTime;
      },
      enumerable: true,
      configurable: true
    },
    events: {

      /**
       * Sorted list of scheduled items
       * @type {object[]}
       * @public
       */
      get: function () {
        return this._events.slice();
      },
      enumerable: true,
      configurable: true
    },
    start: {

      /**
       * Start the scheduler timeline.
       * @return {WebAudioScheduler} self
       * @public
       */
      value: function () {
        var _this = this;
        if (this._timerId === 0) {
          this._timerId = this.timerAPI.setInterval(function () {
            var t0 = _this.context.currentTime;
            var t1 = t0 + _this.aheadTime;

            _this._process(t0, t1);
          }, this.interval * 1000);
        }
        return this;
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    stop: {

      /**
       * Stop the scheduler timeline.
       * @return {WebAudioScheduler} self
       * @public
       */
      value: function () {
        if (this._timerId !== 0) {
          this.timerAPI.clearInterval(this._timerId);
          this._timerId = 0;
        }
        return this;
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    insert: {

      /**
       * Insert the callback function into the scheduler timeline.
       * @param {number} time
       * @param {function(object)} callback
       * @return {number} schedId
       * @public
       */
      value: function (time, callback) {
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
          for (var i = 0,
              imax = events.length; i < imax; i++) {
            if (time < events[i].time) {
              events.splice(i, 0, event);
              break;
            }
          }
        }

        return event.id;
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    remove: {

      /**
       * Remove the callback function from the scheduler timeline.
       * @param {number} schedId
       * @return {number} schedId
       * @public
       */
      value: function (schedId) {
        var events = this._events;

        if (typeof schedId === "undefined") {
          events.splice(0);
        } else {
          for (var i = 0,
              imax = events.length; i < imax; i++) {
            if (schedId === events[i].id) {
              events.splice(i, 1);
              break;
            }
          }
        }

        return schedId;
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    _process: {

      /**
       * @private
       */
      value: function (t0, t1) {
        var events = this._events;

        this.playbackTime = t0;

        while (events.length && events[0].time <= t1) {
          var event = events.shift();

          this.playbackTime = Math.max(this.context.currentTime, event.time) + this.offsetTime;

          event.callback({
            target: this,
            playbackTime: this.playbackTime
          });
        }

        this.playbackTime = t0;
      },
      writable: true,
      enumerable: true,
      configurable: true
    }
  });

  return WebAudioScheduler;
})();

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[1])(1)
});