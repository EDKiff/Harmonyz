const assert = require("node:assert/strict");
const { test } = require("node:test");
const loadTypeScript = require("./load-typescript.cjs");
const { animationFrame } = loadTypeScript("app/renderer/animation.ts");

const parameters = { lineCount: 3, durationBetweenLines: 0.5 };
const song = {
    duration: 2,
    xAxis: [1000],
    frequencyData: [[0], [100], [200], [100]],
};
const amplitudes = (rows) => rows.map((row) => row.frequencyData[0]);

test("starts with a complete stack containing the song's end above its beginning", () => {
    const rows = animationFrame(song, parameters, 0);
    assert.deepEqual(amplitudes(rows), [200, 100, 0]);
    assert.deepEqual(
        rows.map((row) => row.timestamp),
        [-1, -0.5, 0],
    );
});

test("each fixed row morphs into the next row over one sampling interval", () => {
    const start = animationFrame(song, parameters, 0);
    const midway = animationFrame(song, parameters, 0.25);
    const next = animationFrame(song, parameters, 0.5);
    assert.deepEqual(amplitudes(midway), [150, 50, 50]);
    assert.deepEqual(amplitudes(next), [100, 0, 100]);
    assert.deepEqual(
        midway.map((row) => row.timestamp),
        start.map((row) => row.timestamp),
    );
    assert.deepEqual(
        next.map((row) => row.timestamp),
        start.map((row) => row.timestamp),
    );
});

test("loops continuously and seeking directly produces the same passage", () => {
    assert.deepEqual(animationFrame(song, parameters, 2), animationFrame(song, parameters, 0));
    assert.deepEqual(
        animationFrame(song, parameters, 4.25),
        animationFrame(song, parameters, 0.25),
    );
    const before = amplitudes(animationFrame(song, parameters, 2 - 1e-7));
    const start = amplitudes(animationFrame(song, parameters, 0));
    before.forEach((value, index) => assert.ok(Math.abs(value - start[index]) < 0.001));
});

test("the final fractional sampling interval joins the beginning without stretching the song", () => {
    const fractionalSong = { duration: 1.2, xAxis: [1000], frequencyData: [[0], [100], [200]] };
    const bottom = (time) =>
        animationFrame(fractionalSong, parameters, time).at(-1).frequencyData[0];
    assert.ok(Math.abs(bottom(1) - 200) < 1e-10);
    assert.ok(Math.abs(bottom(1.1) - 100) < 1e-10);
    assert.equal(bottom(1.2), 0);
    assert.ok(bottom(1.2 - 1e-7) < 0.001);
});

test("a short silent song still fills every row and stays finite through repeated loops", () => {
    const shortSong = { duration: 0.08, xAxis: [0, 1000], frequencyData: [[0, 0]] };
    for (const time of [0, 0.04, 0.08, 12.5]) {
        const rows = animationFrame(shortSong, parameters, time);
        assert.equal(rows.length, 3);
        assert.deepEqual(
            rows.map((row) => row.frequencyData),
            [
                [0, 0],
                [0, 0],
                [0, 0],
            ],
        );
        assert.ok(rows.every((row) => Number.isFinite(row.timestamp)));
    }
});
