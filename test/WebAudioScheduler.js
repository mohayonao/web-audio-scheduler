"use strict";

require("web-audio-test-api");
const assert = require("power-assert");
const sinon = require("sinon");
const tickable = require("tickable-timer");
const WebAudioScheduler = require("../src/WebAudioScheduler");

describe("WebAudioScheduler", () => {
  let BuiltInDate = Date;
  let timestamp = 0;

  before(() => {
    BuiltInDate = global.Date;

    global.Date = {
      now() {
        return timestamp;
      }
    };
  });
  beforeEach(() => {
    timestamp = 0;
    tickable.clearAllTimers();
    tickable.removeAllListeners();
    tickable.on("tick", (tick) => {
      timestamp += tick;
    });
  });
  after(() => {
    global.Date = BuiltInDate;
  });
  describe("constructor(opts: object = {})", () => {
    it("works", () => {
      let sched = new WebAudioScheduler();

      assert(sched instanceof WebAudioScheduler);
      assert(typeof sched.interval === "number");
      assert(typeof sched.aheadTime === "number");
      assert(typeof sched.playbackTime === "number");
      assert(sched.timerAPI === global);
    });
    it("works with options", () => {
      let context = new global.AudioContext();
      let sched = new WebAudioScheduler({
        context,
        interval: 0.1,
        aheadTime: 0.25,
        timerAPI: tickable
      });

      assert(sched.context === context);
      assert(sched.interval === 0.1);
      assert(sched.aheadTime === 0.25);
      assert(sched.timerAPI === tickable);
    });
  });
  describe("#state: string", () => {
    it("works", () => {
      let sched = new WebAudioScheduler();

      assert(sched.state === "suspended");

      sched.start();
      assert(sched.state === "running");

      sched.stop();
      assert(sched.state === "suspended");
    });
  });
  describe("#currentTime: number", () => {
    it("works", () => {
      let sched = new WebAudioScheduler();

      assert(typeof sched.currentTime === "number");
    });
  });
  describe("#events: object[]", () => {
    it("works", () => {
      let sched = new WebAudioScheduler();

      assert(Array.isArray(sched.events));
      assert(sched.events !== sched.events);
    });
  });
  describe("#start(callback: function): self", () => {
    it("returns self", () => {
      let sched = new WebAudioScheduler({ timerAPI: tickable });
      let returnValue = sched.start();

      assert(returnValue === sched);
    });
    it("works", () => {
      let sched = new WebAudioScheduler({ timerAPI: tickable });
      let onStart = sinon.spy();

      sched.on("start", onStart);

      sched.start();

      assert(tickable.timers.length === 1);

      sched.start();

      assert(tickable.timers.length === 1);
      assert(onStart.callCount === 1);
    });
    it("works with callback", () => {
      let sched = new WebAudioScheduler({ timerAPI: tickable });
      let callback1 = sinon.spy();
      let callback2 = sinon.spy();

      sched.start(callback1);

      assert(tickable.timers.length === 1);
      assert(callback1.callCount === 1);

      sched.start(callback2);

      assert(tickable.timers.length === 1);
      assert(sched.events.length === 1);
      assert(sched.events[0].time === timestamp);
      assert(sched.events[0].callback === callback2);
    });
  });
  describe("#stop(reset: boolean): self", () => {
    it("returns self", () => {
      let sched = new WebAudioScheduler({ timerAPI: tickable });
      let returnValue = sched.stop();

      assert(returnValue === sched);
    });
    it("works", () => {
      let sched = new WebAudioScheduler({ timerAPI: tickable });
      let onStop = sinon.spy();

      sched.on("stop", onStop);

      sched.start();
      sched.stop();

      assert(tickable.timers.length === 0);

      sched.stop();

      assert(tickable.timers.length === 0);
      assert(onStop.callCount === 1);
    });
    it("works with reset flag", () => {
      let sched = new WebAudioScheduler({ timerAPI: tickable });
      let callback = sinon.spy();

      sched.start(callback);
      sched.stop(true);

      assert(tickable.timers.length === 0);
      assert(sched.events.length === 0);

      sched.stop(true);

      assert(tickable.timers.length === 0);
      assert(sched.events.length === 0);
    });
  });
  describe("#insert(time: number, callback: function, args: any[]): number", () => {
    it("works", () => {
      let sched = new WebAudioScheduler({ timerAPI: tickable });
      let t1 = sched.currentTime + 0.1, callback1 = sinon.spy(), args1 = [ 1, 2 ];
      let t2 = sched.currentTime + 0.3, callback2 = sinon.spy(), args2 = [ 3, 4 ];
      let t3 = sched.currentTime + 0.2, callback3 = sinon.spy(), args3 = [ 5, 6 ];
      let t4 = sched.currentTime + 0.4, callback4 = sinon.spy(), args4 = [ 7, 8 ];

      sched.insert(t1, callback1, args1);
      sched.insert(t2, callback2, args2);
      sched.insert(t3, callback3, args3);
      sched.insert(t4, callback4, args4);

      assert(sched.events.length === 4);
      assert(sched.events[0].time === t1);
      assert(sched.events[0].callback === callback1);
      assert(sched.events[0].args === args1);
      assert(sched.events[1].time === t3);
      assert(sched.events[1].callback === callback3);
      assert(sched.events[1].args === args3);
      assert(sched.events[2].time === t2);
      assert(sched.events[2].callback === callback2);
      assert(sched.events[2].args === args2);
      assert(sched.events[3].time === t4);
      assert(sched.events[3].callback === callback4);
      assert(sched.events[3].args === args4);
    });
  });
  describe("#nextTick(time: number, callback: function, args: any[]): number", () => {
    it("works", () => {
      let sched = new WebAudioScheduler({ timerAPI: tickable });
      let callback = sinon.spy(), args = [ 1, 2, 3, 4, 5 ];

      sched.nextTick(0.5, callback, args);

      assert(sched.events.length === 1);
      assert(sched.events[0].time = 0.5 + sched.aheadTime);
      assert(sched.events[0].callback === callback);
      assert(sched.events[0].args === args);
    });
    it("works without time", () => {
      let sched = new WebAudioScheduler({ timerAPI: tickable });
      let callback = sinon.spy(), args = [ 1, 2, 3, 4, 5 ];

      sched.nextTick(callback, args);

      assert(sched.events.length === 1);
      assert(sched.events[0].time = sched.playbackTime + sched.aheadTime);
      assert(sched.events[0].callback === callback);
      assert(sched.events[0].args === args);
    });
  });
  describe("#remove(schedId: number): number", () => {
    it("works", () => {
      let sched = new WebAudioScheduler({ timerAPI: tickable });
      let id1 = sched.insert(1, sinon.spy());
      let id2 = sched.insert(2, sinon.spy());
      let id3 = sched.nextTick(sinon.spy());

      assert(sched.events.length === 3);

      sched.remove(id1);

      assert(sched.events.length === 2);
      assert(sched.events.every(items => items.id !== id1));

      sched.remove(id2);
      sched.remove();

      assert(sched.events.length === 1);
      assert(sched.events.every(items => items.id !== id2));

      sched.remove(id3);
      sched.remove(id1);

      assert(sched.events.length === 0);
    });
  });
  describe("#removeAll(): void", () => {
    it("works", () => {
      let sched = new WebAudioScheduler({ timerAPI: tickable });

      sched.insert(1, sinon.spy());
      sched.insert(2, sinon.spy());
      sched.nextTick(sinon.spy());

      assert(sched.events.length === 3);

      sched.removeAll();

      assert(sched.events.length === 0);
    });
  });
  describe("process", () => {
    it("event", () => {
      let sched = new WebAudioScheduler({ timerAPI: tickable });
      let onprocess = sinon.spy();
      let onprocessed = sinon.spy();

      sched.on("process", onprocess);
      sched.on("processed", onprocessed);
      sched.start();

      tickable.tick(100);

      assert(onprocess.callCount === 4);
      assert(onprocess.args[0][0].playbackTime === 0.025);
      assert(onprocess.args[1][0].playbackTime === 0.05);
      assert(onprocess.args[2][0].playbackTime === 0.075);
      assert(onprocess.args[3][0].playbackTime === 0.1);
      assert(onprocessed.callCount === 4);
      assert(onprocessed.args[0][0].playbackTime === 0.025);
      assert(onprocessed.args[1][0].playbackTime === 0.05);
      assert(onprocessed.args[2][0].playbackTime === 0.075);
      assert(onprocessed.args[3][0].playbackTime === 0.1);

      sched.stop();

      onprocess.reset();
      onprocessed.reset();

      tickable.tick(100);

      assert(onprocess.callCount === 0);
      assert(onprocessed.callCount === 0);
    });
    it("works", () => {
      let sched = new WebAudioScheduler({ timerAPI: tickable });
      let t1 = sched.currentTime + 0.3, callback1 = sinon.spy(), args1 = [ 1, 2 ];
      let t2 = sched.currentTime + 0.2, callback2 = sinon.spy(), args2 = [ 3, 4 ];
      let t3 = sched.currentTime + 0.4, callback3 = sinon.spy(), args3 = [ 5, 6 ];
      let t4 = sched.currentTime + 0.1, callback4 = sinon.spy(), args4 = [ 7, 8 ];

      sched.start();
      sched.insert(t1, callback1, args1);
      sched.insert(t2, callback2, args2);
      sched.insert(t3, callback3, args3);
      sched.insert(t4, callback4, args4);

      tickable.tick(100);

      assert(sched.currentTime === 0.1);
      assert(callback1.callCount === 0);
      assert(callback2.callCount === 0);
      assert(callback3.callCount === 0);
      assert(callback4.callCount === 1);
      assert(callback4.args[0][0].playbackTime === 0.1);
      assert(callback4.args[0][0].args === args4);

      tickable.tick(100);

      assert(sched.currentTime === 0.2);
      assert(callback1.callCount === 1);
      assert(callback2.callCount === 1);
      assert(callback3.callCount === 0);
      assert(callback4.callCount === 1);
      assert(callback2.args[0][0].playbackTime === 0.2);
      assert(callback2.args[0][0].args === args2);
      // 0.2 + 0.1 = 0.30000000000000004
      assert(callback1.args[0][0].playbackTime === 0.3);
      assert(callback1.args[0][0].args === args1);

      tickable.tick(100);

      assert(sched.currentTime === 0.3);
      assert(callback1.callCount === 1);
      assert(callback2.callCount === 1);
      assert(callback3.callCount === 0);
      assert(callback4.callCount === 1);

      tickable.tick(100);

      assert(sched.currentTime === 0.4);
      assert(callback1.callCount === 1);
      assert(callback2.callCount === 1);
      assert(callback3.callCount === 1);
      assert(callback4.callCount === 1);
      assert(callback3.args[0][0].playbackTime === 0.4);
      assert(callback3.args[0][0].args === args3);
    });
    it("works with web audio api", () => {
      let audioContext = new global.AudioContext();
      let sched = new WebAudioScheduler({ context: audioContext, timerAPI: tickable });
      let t1 = sched.currentTime + 0.3, callback1 = sinon.spy(), args1 = [ 1, 2 ];
      let t2 = sched.currentTime + 0.2, callback2 = sinon.spy(), args2 = [ 3, 4 ];
      let t3 = sched.currentTime + 0.4, callback3 = sinon.spy(), args3 = [ 5, 6 ];
      let t4 = sched.currentTime + 0.1, callback4 = sinon.spy(), args4 = [ 7, 8 ];

      tickable.on("tick", (tick) => {
        audioContext.$process(tick / 1000);
      });

      sched.start();
      sched.insert(t1, callback1, args1);
      sched.insert(t2, callback2, args2);
      sched.insert(t3, callback3, args3);
      sched.insert(t4, callback4, args4);

      tickable.tick(100);

      assert(sched.currentTime === 0.1);
      assert(callback1.callCount === 0);
      assert(callback2.callCount === 0);
      assert(callback3.callCount === 0);
      assert(callback4.callCount === 1);
      assert(callback4.args[0][0].playbackTime === 0.1);
      assert(callback4.args[0][0].args === args4);

      tickable.tick(100);

      assert(sched.currentTime === 0.2);
      assert(callback1.callCount === 1);
      assert(callback2.callCount === 1);
      assert(callback3.callCount === 0);
      assert(callback4.callCount === 1);
      assert(callback2.args[0][0].playbackTime === 0.2);
      assert(callback2.args[0][0].args === args2);
      // 0.2 + 0.1 = 0.30000000000000004
      assert(callback1.args[0][0].playbackTime === 0.3);
      assert(callback1.args[0][0].args === args1);

      tickable.tick(100);

      assert(sched.currentTime === 0.3);
      assert(callback1.callCount === 1);
      assert(callback2.callCount === 1);
      assert(callback3.callCount === 0);
      assert(callback4.callCount === 1);

      tickable.tick(100);

      assert(sched.currentTime === 0.4);
      assert(callback1.callCount === 1);
      assert(callback2.callCount === 1);
      assert(callback3.callCount === 1);
      assert(callback4.callCount === 1);
      assert(callback3.args[0][0].playbackTime === 0.4);
      assert(callback3.args[0][0].args === args3);
    });
  });
});
