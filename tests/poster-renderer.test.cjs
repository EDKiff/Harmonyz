const assert = require("node:assert/strict");
const { test } = require("node:test");
const loadTypeScript = require("./load-typescript.cjs");
const { drawPoster } = loadTypeScript("app/renderer/PosterRenderer.ts");
const { animationFrame, globalAnalysisScale } = loadTypeScript("app/renderer/animation.ts");

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
    const clippingAreas = [];
    let contour = [];
    const coordinate = (...values) =>
        values.forEach((value) =>
            assert.ok(Number.isFinite(value), "canvas coordinates remain finite"),
        );
    const ctx = {
        save() {},
        restore() {},
        rect(...bounds) {
            coordinate(...bounds);
            clippingAreas.push(bounds);
        },
        clip() {},
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
        bezierCurveTo(...points) {
            coordinate(...points);
            contour.push(points);
        },
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
    return { ctx, labels, strokes, colors, clippingAreas };
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

for (const style of ["spectrum", "joy-division"]) {
    test(`${style} keeps curve placement and scale when switching between playback and a fixed poster`, () => {
        const fixed = canvasCommands();
        const playing = canvasCommands();
        const frame = drawing(128, style);
        drawPoster(playing.ctx, frame);
        drawPoster(fixed.ctx, {
            ...frame,
            animated: false,
            yAxisData: frame.yAxisData.map((row, timestamp) => ({ ...row, timestamp })),
        });
        assert.deepEqual(
            fixed.strokes,
            playing.strokes,
            "changing mode must not move or rescale the same curves",
        );
    });

    test(`${style} keeps the configured row positions for a short fixed poster`, () => {
        const fixed = canvasCommands();
        const playing = canvasCommands();
        const frame = { ...drawing(128, style), parameters: { ...parameters, lineCount: 20 } };
        drawPoster(playing.ctx, {
            ...frame,
            yAxisData: Array.from({ length: 20 }, () => frame.yAxisData[0]),
        });
        drawPoster(fixed.ctx, {
            ...frame,
            animated: false,
            yAxisData: frame.yAxisData.slice(0, 2).map((row, timestamp) => ({ ...row, timestamp })),
        });
        const axisPaths = style === "spectrum" ? 1 : 0;
        assert.deepEqual(
            fixed.strokes.slice(axisPaths).map((points) => points[0]),
            playing.strokes.slice(axisPaths, axisPaths + 2).map((points) => points[0]),
            "having fewer available spectra must not stretch their row positions",
        );
    });
}

test("Joy Division reserves only the full-song relief and contains interpolated peaks", () => {
    const analysis = {
        duration: 1.2,
        xAxis: [1000, 2000, 3000],
        frequencyData: [
            [255, 0, 255],
            [255, 128, 255],
            [255, 64, 255],
        ],
    };
    const scale = globalAnalysisScale(analysis, parameters);
    assert.equal(scale.amplitudePeak, 255);
    assert.ok(
        scale.maxReliefRatio > 0.2 && scale.maxReliefRatio < 0.25,
        "an off-centre maximum must not reserve a full-height central peak",
    );
    let baselines;
    for (const time of [0, 0.25, 0.5, 0.75, 1, 1.1, 1.2]) {
        const commands = canvasCommands();
        const settings = { ...parameters, lineCount: 80, durationBetweenLines: 0.5 };
        drawPoster(commands.ctx, {
            ...drawing(128, "joy-division"),
            ...scale,
            parameters: settings,
            yAxisData: animationFrame(analysis, settings, time),
        });
        const ys = commands.strokes.flatMap((path) =>
            path.flatMap((point) => point.filter((_, index) => index % 2 === 1)),
        );
        assert.ok(
            Math.min(...ys) - commands.ctx.lineWidth / 2 >= 1188 * 0.065 - 1e-9,
            "every interpolated upper peak fits above the reserved baseline",
        );
        const currentBaselines = commands.strokes.map((path) => path[0][1]);
        if (baselines)
            assert.deepEqual(currentBaselines, baselines, "headroom never pumps with time");
        baselines = currentBaselines;
    }
});

test("Spectrum note labels align with the frequency samples across the entire plot", () => {
    const commands = canvasCommands();
    drawPoster(commands.ctx, {
        ...drawing(128),
        displayableNotes: [
            { alphabetic: "C", octave: 6, frequency: 1000 },
            { alphabetic: "D", octave: 6, frequency: 2000 },
            { alphabetic: "E", octave: 6, frequency: 3000 },
        ],
    });
    const sampleXs = commands.strokes[1].slice(1).map((point) => point.at(-2));
    const noteXs = commands.labels.slice(0, 3).map(([, x]) => x);
    assert.deepEqual(noteXs, [50, 420, 790], "frequency labels span the plot without overshooting");
    assert.deepEqual(sampleXs, noteXs, "each note sits under its frequency sample");
});

for (const style of ["spectrum", "joy-division"]) {
    test(`${style} keeps the loudest upper curves entirely inside the canvas`, () => {
        for (const [width, height] of [
            [840, 1188],
            [1188, 840],
            [240, 320],
        ]) {
            const commands = canvasCommands();
            const frame = drawing(255, style);
            drawPoster(commands.ctx, {
                ...frame,
                width,
                height,
                parameters: { ...parameters, lineCount: 80 },
                yAxisData: Array.from({ length: 80 }, () => frame.yAxisData[0]),
            });
            const curveStrokes = commands.strokes.slice(style === "spectrum" ? 1 : 0);
            const peakY = Math.min(
                ...curveStrokes.flatMap((path) =>
                    path.flatMap((point) => point.filter((_, index) => index % 2 === 1)),
                ),
            );
            const halfStroke = commands.ctx.lineWidth / 2;
            assert.ok(
                peakY >= halfStroke,
                `the upper peak at ${peakY} must not leave ${width}×${height}`,
            );
            for (const [, top] of commands.clippingAreas) {
                assert.ok(
                    peakY - halfStroke >= top,
                    "the upper peak must not be cut by a clipping area",
                );
            }
        }
    });
}
