"use strict";

require("run-with-mocha");
require("web-audio-test-api");

const assert = require("assert");
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
      const sched = new WebAudioScheduler();

      assert(sched instanceof WebAudioScheduler);
      assert(typeof sched.interval === "number");
      assert(typeof sched.aheadTime === "number");
      assert(typeof sched.playbackTime === "number");
      assert(sched.timerAPI === global);
    });
    it("works with options", () => {
      const context = new global.AudioContext();
      const sched = new WebAudioScheduler({
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
      const sched = new WebAudioScheduler();

      assert(sched.state === "suspended");

      sched.start();
      assert(sched.state === "running");

      sched.stop();
      assert(sched.state === "suspended");
    });
  });
  describe("#currentTime: number", () => {
    it("works", () => {
      const sched = new WebAudioScheduler();

      assert(typeof sched.currentTime === "number");
    });
  });
  describe("#events: object[]", () => {
    it("works", () => {
      const sched = new WebAudioScheduler();

      assert(Array.isArray(sched.events));
      assert(sched.events !== sched.events);
    });
  });
  describe("#start(callback: function): self", () => {
    it("returns self", () => {
      const sched = new WebAudioScheduler({ timerAPI: tickable });
      const returnValue = sched.start();

      assert(returnValue === sched);
    });
    it("works", () => {
      const sched = new WebAudioScheduler({ timerAPI: tickable });
      const onStart = sinon.spy();

      sched.on("start", onStart);

      sched.start();

      assert(tickable.timers.length === 1);

      sched.start();

      assert(tickable.timers.length === 1);
      assert(onStart.callCount === 1);
    });
    it("works with callback", () => {
      const sched = new WebAudioScheduler({ timerAPI: tickable });
      const callback1 = sinon.spy();
      const callback2 = sinon.spy();

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
      const sched = new WebAudioScheduler({ timerAPI: tickable });
      const returnValue = sched.stop();

      assert(returnValue === sched);
    });
    it("works", () => {
      const sched = new WebAudioScheduler({ timerAPI: tickable });
      const onStop = sinon.spy();

      sched.on("stop", onStop);

      sched.start();
      sched.stop();

      assert(tickable.timers.length === 0);

      sched.stop();

      assert(tickable.timers.length === 0);
      assert(onStop.callCount === 1);
    });
    it("works with reset flag", () => {
      const sched = new WebAudioScheduler({ timerAPI: tickable });
      const callback = sinon.spy();

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
      const sched = new WebAudioScheduler({ timerAPI: tickable });
      const t1 = sched.currentTime + 0.1, callback1 = sinon.spy(), args1 = [ 1, 2 ];
      const t2 = sched.currentTime + 0.3, callback2 = sinon.spy(), args2 = [ 3, 4 ];
      const t3 = sched.currentTime + 0.2, callback3 = sinon.spy(), args3 = [ 5, 6 ];
      const t4 = sched.currentTime + 0.4, callback4 = sinon.spy(), args4 = [ 7, 8 ];

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
      const sched = new WebAudioScheduler({ timerAPI: tickable });
      const callback = sinon.spy(), args = [ 1, 2, 3, 4, 5 ];

      sched.nextTick(0.5, callback, args);

      assert(sched.events.length === 1);
      assert(sched.events[0].time = 0.5 + sched.aheadTime);
      assert(sched.events[0].callback === callback);
      assert(sched.events[0].args === args);
    });
    it("works without time", () => {
      const sched = new WebAudioScheduler({ timerAPI: tickable });
      const callback = sinon.spy(), args = [ 1, 2, 3, 4, 5 ];

      sched.nextTick(callback, args);

      assert(sched.events.length === 1);
      assert(sched.events[0].time = sched.playbackTime + sched.aheadTime);
      assert(sched.events[0].callback === callback);
      assert(sched.events[0].args === args);
    });
  });
  describe("#remove(schedId: number): number", () => {
    it("works", () => {
      const sched = new WebAudioScheduler({ timerAPI: tickable });
      const id1 = sched.insert(1, sinon.spy());
      const id2 = sched.insert(2, sinon.spy());
      const id3 = sched.nextTick(sinon.spy());

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
      const sched = new WebAudioScheduler({ timerAPI: tickable });

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
      const sched = new WebAudioScheduler({ timerAPI: tickable });
      const callback = sinon.spy();
      const onstart = sinon.spy();
      const onstop = sinon.spy();
      const onprocess = sinon.spy();
      const onprocessed = sinon.spy();

      sched.on("start", onstart);
      sched.on("stop", onstop);
      sched.on("process", onprocess);
      sched.on("processed", onprocessed);

      sched.start(callback);
      assert(callback.callCount === 1);
      assert(onstart.callCount === 1);
      assert(onstop.callCount === 0);
      assert(onprocess.callCount === 1);
      assert(onprocess.args[0][0].playbackTime === 0);
      assert(onprocessed.callCount === 1);
      assert(onprocessed.args[0][0].playbackTime === 0);
      assert(onstart.calledBefore(callback));

      onprocess.reset();
      onprocessed.reset();
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
      assert(onstop.callCount === 1);

      onprocess.reset();
      onprocessed.reset();

      tickable.tick(100);

      assert(onprocess.callCount === 0);
      assert(onprocessed.callCount === 0);
    });
    it("works", () => {
      const sched = new WebAudioScheduler({ timerAPI: tickable });
      const t1 = sched.currentTime + 0.3, callback1 = sinon.spy(), args1 = [ 1, 2 ];
      const t2 = sched.currentTime + 0.2, callback2 = sinon.spy(), args2 = [ 3, 4 ];
      const t3 = sched.currentTime + 0.4, callback3 = sinon.spy(), args3 = [ 5, 6 ];
      const t4 = sched.currentTime + 0.1, callback4 = sinon.spy(), args4 = [ 7, 8 ];

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
      const audioContext = new global.AudioContext();
      const sched = new WebAudioScheduler({ context: audioContext, timerAPI: tickable });
      const t1 = sched.currentTime + 0.3, callback1 = sinon.spy(), args1 = [ 1, 2 ];
      const t2 = sched.currentTime + 0.2, callback2 = sinon.spy(), args2 = [ 3, 4 ];
      const t3 = sched.currentTime + 0.4, callback3 = sinon.spy(), args3 = [ 5, 6 ];
      const t4 = sched.currentTime + 0.1, callback4 = sinon.spy(), args4 = [ 7, 8 ];

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
