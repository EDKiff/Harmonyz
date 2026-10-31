const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

const root = path.resolve(__dirname, "../../../..");
const baseURL = process.env.HARMONYZ_URL || "http://127.0.0.1:3181";
const output =
    process.env.HARMONYZ_CAPTURE_DIR || fs.mkdtempSync(path.join(os.tmpdir(), "harmonyz-stop-"));
fs.mkdirSync(output, { recursive: true });

(async () => {
    const browser = await chromium.launch({ headless: true });
    const results = [];
    try {
        for (const style of ["spectrum", "joy-division"]) {
            const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
            const errors = [];
            page.on("pageerror", (error) => errors.push(error.message));
            // Observe actual Canvas drawing commands, rather than renderer internals.
            await page.addInitScript(() => {
                const prototype = CanvasRenderingContext2D.prototype;
                const capture = (ctx) => ctx.canvas.id === "poster-preview-canvas";
                const originalFill = prototype.fillRect;
                prototype.fillRect = function (...args) {
                    if (capture(this)) window.__posterFrame = { rows: [], labels: [] };
                    return originalFill.apply(this, args);
                };
                const originalBegin = prototype.beginPath;
                prototype.beginPath = function (...args) {
                    if (capture(this)) this.__posterPath = [];
                    return originalBegin.apply(this, args);
                };
                for (const method of ["moveTo", "lineTo", "bezierCurveTo"]) {
                    const original = prototype[method];
                    prototype[method] = function (...args) {
                        if (capture(this)) this.__posterPath?.push([method, ...args]);
                        return original.apply(this, args);
                    };
                }
                const originalStroke = prototype.stroke;
                prototype.stroke = function (...args) {
                    if (capture(this) && this.lineWidth > 1 && this.__posterPath?.length) {
                        const first = this.__posterPath[0];
                        window.__posterFrame.rows.push({
                            x: first[1],
                            baseline: first[2],
                            lineWidth: this.lineWidth,
                            firstPointX: this.__posterPath[1]?.at(-2),
                            lastPointX: this.__posterPath.at(-1)?.at(-2),
                            minY: Math.min(
                                ...this.__posterPath.flatMap((command) =>
                                    command.slice(2).filter((_, index) => index % 2 === 0),
                                ),
                            ),
                        });
                    }
                    return originalStroke.apply(this, args);
                };
                const originalText = prototype.fillText;
                prototype.fillText = function (text, x, y, ...rest) {
                    if (capture(this)) window.__posterFrame?.labels.push({ text, x, y });
                    return originalText.call(this, text, x, y, ...rest);
                };
            });
            await page.goto(baseURL);
            await page.getByLabel("Drawing style").selectOption(style);
            await page.locator('input[type="file"]').setInputFiles(path.join(root, "song.mp3"));
            await page.waitForFunction(
                () => !document.querySelector('button[aria-label="Save"]').disabled,
                {},
                { timeout: 180000 },
            );
            await page.getByRole("button", { name: "Play", exact: true }).click();
            await page.getByLabel("Song position", { exact: true }).evaluate((element) => {
                Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(
                    element,
                    "12",
                );
                element.dispatchEvent(new Event("input", { bubbles: true }));
                element.dispatchEvent(new Event("change", { bubbles: true }));
            });
            await page.waitForTimeout(250);
            await page.screenshot({ path: path.join(output, `${style}-playing-ui.png`) });
            const before = await page.evaluate(() => {
                const canvas = document.getElementById("poster-preview-canvas");
                const bounds = canvas.getBoundingClientRect();
                const result = {
                    image: canvas.toDataURL().split(",")[1],
                    trace: window.__posterFrame,
                    width: canvas.width,
                    height: canvas.height,
                    position: document.querySelector("audio").currentTime,
                    bounds: {
                        x: bounds.x,
                        y: bounds.y,
                        width: bounds.width,
                        height: bounds.height,
                    },
                };
                [...document.querySelectorAll("button")]
                    .find((button) => button.textContent.trim() === "Stop")
                    .click();
                return result;
            });
            await page.getByRole("button", { name: "Play", exact: true }).waitFor();
            await page.evaluate(
                () =>
                    new Promise((resolve) =>
                        requestAnimationFrame(() => requestAnimationFrame(resolve)),
                    ),
            );
            const after = await page.evaluate(() => {
                const canvas = document.getElementById("poster-preview-canvas");
                const bounds = canvas.getBoundingClientRect();
                return {
                    image: canvas.toDataURL().split(",")[1],
                    trace: window.__posterFrame,
                    width: canvas.width,
                    height: canvas.height,
                    position: document.querySelector("audio").currentTime,
                    paused: document.querySelector("audio").paused,
                    bounds: {
                        x: bounds.x,
                        y: bounds.y,
                        width: bounds.width,
                        height: bounds.height,
                    },
                };
            });
            fs.writeFileSync(
                path.join(output, `${style}-playing.png`),
                Buffer.from(before.image, "base64"),
            );
            fs.writeFileSync(
                path.join(output, `${style}-stopped.png`),
                Buffer.from(after.image, "base64"),
            );
            await page.screenshot({ path: path.join(output, `${style}-stopped-ui.png`) });
            const downloadPromise = page.waitForEvent("download");
            await page.getByRole("button", { name: "Save", exact: true }).click();
            await page.getByRole("button", { name: "Download PNG", exact: true }).click();
            const download = await downloadPromise;
            const exportedPng = path.join(output, `${style}-stopped-export.png`);
            await download.saveAs(exportedPng);
            const pngMatchesFixedPreview = fs
                .readFileSync(exportedPng)
                .equals(Buffer.from(after.image, "base64"));
            const comparison = await page.evaluate(
                async ({ before, after, style }) => {
                    const first = new Image();
                    const second = new Image();
                    first.src = "data:image/png;base64," + before;
                    second.src = "data:image/png;base64," + after;
                    await Promise.all([first.decode(), second.decode()]);
                    const canvas = document.createElement("canvas");
                    canvas.width = 1060;
                    canvas.height = 780;
                    const context = canvas.getContext("2d");
                    context.fillStyle = "#edf1f5";
                    context.fillRect(0, 0, canvas.width, canvas.height);
                    context.fillStyle = "#0f172a";
                    context.font = "20px sans-serif";
                    context.fillText(`${style} · juste avant Stop`, 20, 32);
                    context.fillText(`${style} · après Stop`, 550, 32);
                    context.drawImage(first, 20, 50, 490, 693);
                    context.drawImage(second, 550, 50, 490, 693);
                    return canvas.toDataURL().split(",")[1];
                },
                { before: before.image, after: after.image, style },
            );
            fs.writeFileSync(
                path.join(output, `${style}-comparison.png`),
                Buffer.from(comparison, "base64"),
            );
            const differences = before.trace.rows.map((row, index) =>
                Math.abs(row.baseline - after.trace.rows[index].baseline),
            );
            const maxBaselineShift = Math.max(...differences);
            const notes = (frame) =>
                frame.trace.labels.filter(({ text }) => /^[A-G][#b]?\d+$/.test(text));
            const summary = {
                style,
                rows: before.trace.rows.length,
                playing: {
                    first: before.trace.rows[0].baseline,
                    last: before.trace.rows.at(-1).baseline,
                    position: before.position,
                },
                stopped: {
                    first: after.trace.rows[0].baseline,
                    last: after.trace.rows.at(-1).baseline,
                    position: after.position,
                },
                maxBaselineShift,
                pngMatchesFixedPreview,
                canvasBoundsStable: JSON.stringify(before.bounds) === JSON.stringify(after.bounds),
                canvasSize: [before.width, before.height],
                notePositionsStable: JSON.stringify(notes(before)) === JSON.stringify(notes(after)),
                curveXRange: [before.trace.rows[0].firstPointX, before.trace.rows[0].lastPointX],
                notes: notes(before),
                errors,
            };
            results.push(summary);
            console.log(JSON.stringify(summary));
            fs.writeFileSync(
                path.join(output, `${style}-traces.json`),
                JSON.stringify(
                    {
                        before: { ...before, image: undefined },
                        after: { ...after, image: undefined },
                        summary,
                    },
                    null,
                    2,
                ),
            );
            assert.ok(
                pngMatchesFixedPreview,
                "the exported PNG matches the fixed preview exactly for this style",
            );
            assert.equal(after.paused, true, "Stop pauses the song");
            assert.ok(
                Math.abs(after.position - before.position) < 0.1,
                "Stop preserves the playback position",
            );
            assert.deepEqual(errors, []);
            await page.close();
        }
        fs.writeFileSync(path.join(output, "results.json"), JSON.stringify(results, null, 2));
        console.log("CAPTURES", output);
        assert.ok(
            results.every((result) => result.canvasBoundsStable),
            "the displayed canvas does not move when stopping",
        );
        assert.ok(
            results.every((result) => result.notePositionsStable),
            "note labels retain their positions between playback and Stop",
        );
        assert.ok(
            results.every((result) => result.maxBaselineShift < 0.01),
            "row baselines must remain at the same height between playback and Stop",
        );
    } finally {
        await browser.close();
    }
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
