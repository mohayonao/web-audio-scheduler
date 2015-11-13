import assert from "power-assert";
import index from "../src";
import WebAudioScheduler from "../src/WebAudioScheduler";

describe("index", () => {
  it("exports", () => {
    assert(index === WebAudioScheduler);
  });
});
