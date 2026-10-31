const assert = require("node:assert/strict");
const { test } = require("node:test");
const loadTypeScript = require("./load-typescript.cjs");
const { drawPoster } = loadTypeScript("app/renderer/PosterRenderer.ts");

const parameters = {
    lineCount: 3,
    minFrequency: 1000,
    maxFrequency: 3000,
    axisColor: "#777777",
    dataLinesWidth: 3,
    axisFont: "Arial",
    strokeColor: "#ff0000",
    strokeAccentColor: "#ff0000",
    backgroundColor: "#000000",
};

function canvasCommands() {
    const labels = [];
    const strokes = [];
    const colors = [];
    let contour = [];
    const coordinate = (...values) =>
        values.forEach((value) =>
            assert.ok(Number.isFinite(value), "canvas coordinates remain finite"),
        );
    const ctx = {
        save() {},
        restore() {},
        closePath() {},
        fill() {},
        fillRect: coordinate,
        beginPath() {
            contour = [];
        },
        moveTo(x, y) {
            coordinate(x, y);
            contour.push([x, y]);
        },
        lineTo(x, y) {
            coordinate(x, y);
            contour.push([x, y]);
        },
        bezierCurveTo: coordinate,
        fillText(text, x, y) {
            coordinate(x, y);
            labels.push([text, x, y]);
        },
        stroke() {
            strokes.push(contour);
        },
        createLinearGradient(...points) {
            coordinate(...points);
            return {
                addColorStop(position, color) {
                    coordinate(position);
                    colors.push(color);
                },
            };
        },
    };
    return { ctx, labels, strokes, colors };
}

const drawing = (amplitude, style = "spectrum") => ({
    drawingStyle: style,
    xAxisData: [1000, 2000, 3000],
    yAxisData: [-1, -0.5, 0].map((timestamp) => ({ timestamp, frequencyData: [0, amplitude, 0] })),
    displayableNotes: [{ alphabetic: "C", octave: 6, frequency: 1000 }],
    parameters,
    width: 840,
    height: 1188,
    animated: true,
    amplitudePeak: 255,
});

test("animated Spectrum keeps relative time labels and their heights while curves deform", () => {
    const quiet = canvasCommands();
    const loud = canvasCommands();
    drawPoster(quiet.ctx, drawing(0));
    drawPoster(loud.ctx, drawing(255));
    assert.deepEqual(quiet.labels, loud.labels);
    assert.deepEqual(
        loud.labels.map(([text]) => text),
        ["C6", "−1 s", "−0.5 s", "0 s"],
    );
});

test("animated Joy Division keeps the same row baselines and has no axes", () => {
    const quiet = canvasCommands();
    const loud = canvasCommands();
    drawPoster(quiet.ctx, drawing(0, "joy-division"));
    drawPoster(loud.ctx, drawing(255, "joy-division"));
    assert.deepEqual(loud.labels, []);
    assert.equal(loud.strokes.length, 3);
    assert.deepEqual(
        quiet.strokes.map((points) => points[0]),
        loud.strokes.map((points) => points[0]),
    );
    assert.notDeepEqual(quiet.strokes, loud.strokes);
});

test("both renderers honor the selected colors on every curve", () => {
    for (const style of ["spectrum", "joy-division"]) {
        const commands = canvasCommands();
        drawPoster(commands.ctx, drawing(200, style));
        assert.ok(commands.colors.length > 0);
        assert.ok(commands.colors.every((color) => color === "#ff0000"));
    }
});
