"use strict";

require("run-with-mocha");

const assert = require("assert");
const defaults = require("../../src/utils/defaults");

describe("defaults(value: any, defaultValue: any): any", () => {
  it("works", () => {
    assert(defaults(0, 1) === 0);
    assert(defaults(null, 1) === null);
    assert(defaults(false, 1) === false);
    assert(defaults(undefined, 1) === 1);
  });
});
