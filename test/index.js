"use strict";

require("run-with-mocha");

const assert = require("assert");
const index = require("../src");
const WebAudioScheduler = require("../src/WebAudioScheduler");

describe("index", () => {
  it("exports", () => {
    assert(index === WebAudioScheduler);
  });
});
