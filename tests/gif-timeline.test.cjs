const assert = require("node:assert/strict");
const { test } = require("node:test");
const loadTypeScript = require("./load-typescript.cjs");
const { GIF_FPS, gifTimeline, gifFrameDelay, validateGifDimensions } = loadTypeScript(
    "app/animation/gifTimeline.ts",
);

test("a normal second is represented by twenty frames at five centiseconds", () => {
    assert.equal(GIF_FPS, 20);
    assert.deepEqual(gifTimeline(1), { frameCount: 20, durationCentiseconds: 100 });
    assert.deepEqual(
        Array.from({ length: 20 }, (_, index) => gifFrameDelay(1, index)),
        Array(20).fill(50),
    );
});

test("the last frame preserves fractional duration at GIF's centisecond precision", () => {
    assert.deepEqual(gifTimeline(0.127), { frameCount: 3, durationCentiseconds: 13 });
    assert.deepEqual(
        [0, 1, 2].map((index) => gifFrameDelay(0.127, index)),
        [50, 50, 30],
    );
    assert.deepEqual(gifTimeline(1.024), { frameCount: 21, durationCentiseconds: 102 });
    assert.equal(gifFrameDelay(1.024, 20), 20);
});

test("rounding at a full-frame boundary does not add a spurious frame", () => {
    assert.deepEqual(gifTimeline(1.001), { frameCount: 20, durationCentiseconds: 100 });
    assert.equal(gifFrameDelay(1.001, 19), 50);
    assert.deepEqual(gifTimeline(0.001), { frameCount: 1, durationCentiseconds: 1 });
    assert.equal(gifFrameDelay(0.001, 0), 10);
});

test("standard poster dimensions are accepted and impossible canvas sizes fail before allocation", () => {
    assert.doesNotThrow(() => validateGifDimensions(840, 1188));
    assert.doesNotThrow(() => validateGifDimensions(1680, 1188));
    for (const dimensions of [
        [0, 10],
        [-1, 10],
        [Infinity, 10],
        [NaN, 10],
        [10.5, 10],
        [5000, 5000],
    ]) {
        assert.throws(() => validateGifDimensions(...dimensions));
    }
});
