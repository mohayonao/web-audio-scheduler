"use strict";

import "web-audio-test-api";
import assert from "power-assert";
import tickable from "tickable-timer";
import WebAudioScheduler from "../lib/web-audio-scheduler";

describe("WebAudioScheduler", ()=> {
  describe("#constructor", ()=> {
    it("()", ()=> {
      var sched = new WebAudioScheduler();

      assert(sched.context instanceof AudioContext);
      assert(typeof sched.interval === "number");
      assert(typeof sched.aheadTime === "number");
      assert(typeof sched.offsetTime === "number");
      assert(sched.timerAPI === global);
    });
    it("(opts: object)", ()=> {
      var audioContext = new AudioContext();
      var sched = new WebAudioScheduler({
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
  describe("#currentTime", ()=> {
    it("getter: number", ()=> {
      var sched = new WebAudioScheduler();

      assert(typeof sched.currentTime === "number");
    });
  });
  describe("#playbackTime", ()=> {
    it("getter: number", ()=> {
      var sched = new WebAudioScheduler();

      assert(typeof sched.playbackTime === "number");
    });
  });
  describe("#events", ()=> {
    it("getter: object[]", ()=> {
      var sched = new WebAudioScheduler();

      assert(Array.isArray(sched.events));
    });
  });
  describe("#start", ()=> {
    it("(): self", ()=> {
      var sched = new WebAudioScheduler({
        timerAPI: tickable
      });

      assert(sched.start() === sched);
    });
  });
  describe("#stop", ()=> {
    it("(): self", ()=> {
      var sched = new WebAudioScheduler({
        timerAPI: tickable
      });

      assert(sched.stop() === sched);
    });
  });
  describe("#insert", ()=> {
    it("(time: number, callback: function): number", ()=> {
      var sched = new WebAudioScheduler();
      var e1 = { time: 1, callback: ()=> {} };
      var e2 = { time: 2, callback: ()=> {} };
      var e3 = { time: 3, callback: ()=> {} };

      var id1 = sched.insert(e1.time, e1.callback);
      var id3 = sched.insert(e3.time, e3.callback);
      var id2 = sched.insert(e2.time, e2.callback);

      assert.deepEqual(sched.events, [
        { id: id1, time: e1.time, callback: e1.callback },
        { id: id2, time: e2.time, callback: e2.callback },
        { id: id3, time: e3.time, callback: e3.callback },
      ]);
    });
  });
  describe("#remove", ()=> {
    it("(schedId: number): number", ()=> {
      var sched = new WebAudioScheduler();
      var e1 = { time: 1, callback: ()=> {} };
      var e2 = { time: 2, callback: ()=> {} };
      var e3 = { time: 3, callback: ()=> {} };

      var id1 = sched.insert(e1.time, e1.callback);
      var id3 = sched.insert(e3.time, e3.callback);
      var id2 = sched.insert(e2.time, e2.callback);

      var removedId = sched.remove(id2);

      assert(id2 === removedId);
      assert.deepEqual(sched.events, [
        { id: id1, time: e1.time, callback: e1.callback },
        { id: id3, time: e3.time, callback: e3.callback },
      ]);
    });
  });

  describe("works", ()=> {
    var sched, passed;

    before(()=> {
      sched = new WebAudioScheduler({
        interval: 0.025,
        aheadTime: 0.1,
        offsetTime: 0.005,
        timerAPI: tickable,
        toSeconds: (value)=> value / 1000
      });
    });

    beforeEach(()=> {
      passed = [];
    });

    it("00:00.000 -> 00:00.100", ()=> {
      assert(sched.events.length === 0);

      sched.start();
      sched.start();

      sched.insert(0, (e)=> {
        passed.push([ 0, e.playbackTime ]);
      });
      sched.insert(100, (e)=> {
        passed.push([ 100, e.playbackTime ]);
      });
      sched.insert(125, (e)=> {
        passed.push([ 125, e.playbackTime ]);
      });
      sched.insert(150, (e)=> {
        passed.push([ 150, e.playbackTime ]);
      });
      sched.insert(175, (e)=> {
        passed.push([ 175, e.playbackTime ]);
      });

      tickable.tick(25);
      sched.context.$process(0.025);

      assert.deepEqual(passed, [
        [   0, 0.000 + 0.005 ],
        [ 100, 0.100 + 0.005 ],
      ]);

      assert(sched.events.length === 3); // f, g, h
    });
    it("00:00.025 -> 00:00.125", ()=> {
      assert(sched.events.length === 3); // f, g, h

      sched.insert(50, (e)=> {
        passed.push([ 50, e.playbackTime ]);
      });
      sched.insert(75, (e)=> {
        passed.push([ 75, e.playbackTime ]);
      });

      tickable.tick(25);
      sched.context.$process(0.025);

      assert.deepEqual(passed, [
        [  50, 0.050 + 0.005 ],
        [  75, 0.075 + 0.005 ],
        [ 125, 0.125 + 0.005 ],
      ]);

      assert(sched.events.length === 2); // g, h
    });
    it("00:00.050 -> 00:00.150", ()=> {
      assert(sched.events.length === 2); // g, h

      sched.insert(25, (e)=> {
        passed.push([ 25, e.playbackTime ]);
      });

      tickable.tick(25);
      sched.context.$process(0.025);

      assert.deepEqual(passed, [
        [  25, 0.050 + 0.005 ],
        [ 150, 0.150 + 0.005 ],
      ]);

      assert(sched.events.length === 1); // h
    });
    it("00:00.075 -> 00:00.175", ()=> {
      assert(sched.events.length === 1); // h

      sched.stop();
      sched.stop();

      tickable.tick(25);
      sched.context.$process(0.025);

      assert.deepEqual(passed, []);

      assert(sched.events.length === 1); // h
    });
    it("00:00.100 -> 00:00.200", ()=> {
      assert(sched.events.length === 1); // h

      sched.insert(250, (e)=> {
        passed.push([ 250, e.playbackTime ]);
      });

      tickable.tick(25);
      sched.context.$process(0.025);

      assert.deepEqual(passed, []);

      assert(sched.events.length === 2); // h, i
    });
    it("00:00.125 -> 00:00.225", ()=> {
      assert(sched.events.length === 2); // h, i

      sched.start();
      sched.start();

      tickable.tick(25);
      sched.context.$process(0.025);

      assert.deepEqual(passed, [
        [ 175, 0.175 + 0.005 ],
      ]);

      assert(sched.events.length === 1); // i
    });
    it("00:00.150 -> 00:00.250", ()=> {
      assert(sched.events.length === 1); // i

      sched.stop();
      sched.stop();

      tickable.tick(25);
      sched.context.$process(0.025);

      assert.deepEqual(passed, []);

      assert(sched.events.length === 1); // i
    });
    it("00:00.175 -> 00:00.275", ()=> {
      assert(sched.events.length === 1); // i

      sched.remove();

      tickable.tick(25);
      sched.context.$process(0.025);

      assert.deepEqual(passed, []);

      assert(sched.events.length === 0);
    });
  });
});
