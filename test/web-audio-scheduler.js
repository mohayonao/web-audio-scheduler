"use strict";

import "web-audio-test-api";
import assert from "power-assert";
import tickable from "tickable-timer";
import WebAudioScheduler from "../src/web-audio-scheduler";

describe("WebAudioScheduler", function() {
  describe("#constructor", function() {
    it("()", function() {
      let sched = new WebAudioScheduler();

      assert(sched.context instanceof AudioContext);
      assert(typeof sched.interval === "number");
      assert(typeof sched.aheadTime === "number");
      assert(typeof sched.offsetTime === "number");
      assert(sched.timerAPI === global);
    });
    it("(opts: object)", function() {
      let audioContext = new AudioContext();
      let sched = new WebAudioScheduler({
        context: audioContext,
        interval: 0.1,
        aheadTime: 0.25,
        offsetTime: 0,
        timerAPI: tickable,
      });

      assert(sched.context === audioContext);
      assert(sched.interval === 0.1);
      assert(sched.aheadTime === 0.25);
      assert(sched.offsetTime === 0);
      assert(sched.timerAPI === tickable);
    });
  });
  describe("#currentTime", function() {
    it("getter: number", function() {
      let sched = new WebAudioScheduler();

      assert(typeof sched.currentTime === "number");
    });
  });
  describe("#playbackTime", function() {
    it("getter: number", function() {
      let sched = new WebAudioScheduler();

      assert(typeof sched.playbackTime === "number");
    });
  });
  describe("#events", function() {
    it("getter: object[]", function() {
      let sched = new WebAudioScheduler();

      assert(Array.isArray(sched.events));
    });
  });
  describe("#start", function() {
    it("(): self", function() {
      let sched = new WebAudioScheduler({
        timerAPI: tickable
      });

      assert(sched.start() === sched);
    });
    it("(callback: function): self", function() {
      let callback = () => {};
      let sched = new WebAudioScheduler({
        timerAPI: tickable
      });

      assert(sched.start(callback) === sched);
      assert(sched.events[0].callback === callback);
    });
  });
  describe("#stop", function() {
    it("(): self", function() {
      let sched = new WebAudioScheduler({
        timerAPI: tickable
      });

      sched.insert(1, () => {});

      assert(sched.stop() === sched);
      assert(sched.events.length === 1);
    });
    it("(reset: boolean)", function() {
      let sched = new WebAudioScheduler({
        timerAPI: tickable
      });

      sched.insert(1, () => {});

      assert(sched.stop(true) === sched);
      assert(sched.events.length === 0);
    });
  });
  describe("#insert", function() {
    it("(time: number, callback: function, [args: any[]]): number", function() {
      let sched = new WebAudioScheduler();
      let e1 = { time: 1, callback: () => {} };
      let e2 = { time: 2, callback: () => {} };
      let e3 = { time: 3, callback: () => {} };

      let id1 = sched.insert(e1.time, e1.callback);
      let id3 = sched.insert(e3.time, e3.callback, [ 1, 2 ]);
      let id2 = sched.insert(e2.time, e2.callback, [ 3, 4 ]);

      assert.deepEqual(sched.events, [
        { id: id1, time: e1.time, callback: e1.callback, args: undefined },
        { id: id2, time: e2.time, callback: e2.callback, args: [ 3, 4 ] },
        { id: id3, time: e3.time, callback: e3.callback, args: [ 1, 2 ] },
      ]);
    });
  });
  describe("#nextTick", function() {
    it("(callback: function, [args: any[]]): number", function() {
      let sched = new WebAudioScheduler();
      let e1 = { callback: () => {} };
      let e2 = { callback: () => {} };
      let e3 = { callback: () => {} };

      let id1 = sched.nextTick(e1.callback);
      let id3 = sched.nextTick(e3.callback, [ 3, 4 ]);
      let id2 = sched.nextTick(e2.callback, [ 1, 2 ]);

      let nextTickTime = sched.playbackTime + sched.aheadTime;

      assert.deepEqual(sched.events, [
        { id: id1, time: nextTickTime, callback: e1.callback, args: undefined },
        { id: id3, time: nextTickTime, callback: e3.callback, args: [ 3, 4 ] },
        { id: id2, time: nextTickTime, callback: e2.callback, args: [ 1, 2 ] },
      ]);
    });
  });
  describe("#remove", function() {
    it("(schedId: number): number", function() {
      let sched = new WebAudioScheduler();
      let e1 = { time: 1, callback: () => {} };
      let e2 = { time: 2, callback: () => {} };
      let e3 = { time: 3, callback: () => {} };

      let id1 = sched.insert(e1.time, e1.callback);
      let id3 = sched.insert(e3.time, e3.callback);
      let id2 = sched.insert(e2.time, e2.callback);

      let removedId = sched.remove(id2);

      assert(id2 === removedId);
      assert.deepEqual(sched.events, [
        { id: id1, time: e1.time, callback: e1.callback, args: undefined },
        { id: id3, time: e3.time, callback: e3.callback, args: undefined },
      ]);
    });
  });

  describe("works", function() {
    let sched, passed, callback;

    before(function() {
      sched = new WebAudioScheduler({
        interval: 0.025,
        aheadTime: 0.1,
        offsetTime: 0.005,
        timerAPI: tickable,
        toSeconds: (value)=> value / 1000
      });
      callback = (e, arg1)=> {
        passed.push([ arg1, e.playbackTime ]);
      };
    });

    beforeEach(function() {
      passed = [];
    });

    it("00:00.000 -> 00:00.100", function() {
      assert(sched.events.length === 0);

      sched.start();
      sched.start();

      sched.insert(  0, callback, [   0 ]);
      sched.insert(100, callback, [ 100 ]);
      sched.insert(125, callback, [ 125 ]);
      sched.insert(150, callback, [ 150 ]);
      sched.insert(175, callback, [ 175 ]);

      tickable.tick(25);
      sched.context.$process(0.025);

      assert.deepEqual(passed, [
        [   0, 0.000 + 0.005 ],
      ]);

      assert(sched.events.length === 4); // 100, 125, 150, 175
    });
    it("00:00.025 -> 00:00.125", function() {
      assert(sched.events.length === 4); // 100, 125, 150, 175

      sched.insert(50, callback, [ 50 ]);
      sched.insert(75, callback, [ 75 ]);

      tickable.tick(25);
      sched.context.$process(0.025);

      assert.deepEqual(passed, [
        [  50, 0.050 + 0.005 ],
        [  75, 0.075 + 0.005 ],
        [ 100, 0.100 + 0.005 ],
      ]);

      assert(sched.events.length === 3); // 125, 150, 175
    });
    it("00:00.050 -> 00:00.150+", function() {
      assert(sched.events.length === 3); // 125, 150, 175

      sched.insert(25, callback, [ 25 ]);

      tickable.tick(25);
      sched.context.$process(0.025);

      assert.deepEqual(passed, [
        [  25, 0.050 + 0.005 ],
        [ 125, 0.125 + 0.005 ],
        [ 150, 0.150 + 0.005 ],
      ]);

      assert(sched.events.length === 1); // 175
    });
    it("00:00.075 -> 00:00.175", function() {
      assert(sched.events.length === 1); // 175

      sched.stop();
      sched.stop();

      tickable.tick(25);
      sched.context.$process(0.025);

      assert.deepEqual(passed, [
      ]);

      assert(sched.events.length === 1); // 175
    });
    it("00:00.100 -> 00:00.200", function() {
      assert(sched.events.length === 1); // 175

      sched.insert(250, callback, [ 250 ]);

      tickable.tick(25);
      sched.context.$process(0.025);

      assert.deepEqual(passed, []);

      assert(sched.events.length === 2); // 175, 250
    });
    it("00:00.125 -> 00:00.225", function() {
      assert(sched.events.length === 2); // 175, 250

      sched.start();
      sched.start();

      tickable.tick(25);
      sched.context.$process(0.025);

      assert.deepEqual(passed, [
        [ 175, 0.175 + 0.005 ],
      ]);

      assert(sched.events.length === 1); // 250
    });
    it("00:00.150 -> 00:00.250", function() {
      assert(sched.events.length === 1); // 250

      sched.stop();
      sched.stop();

      tickable.tick(25);
      sched.context.$process(0.025);

      assert.deepEqual(passed, []);

      assert(sched.events.length === 1); // 250
    });
    it("00:00.175 -> 00:00.275", function() {
      assert(sched.events.length === 1); // 250

      sched.remove();

      tickable.tick(25);
      sched.context.$process(0.025);

      assert.deepEqual(passed, []);

      assert(sched.events.length === 0);
    });
  });
});
