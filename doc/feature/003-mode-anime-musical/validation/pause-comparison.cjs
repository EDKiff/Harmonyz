const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { createHash } = require("node:crypto");

const root = path.resolve(__dirname, "../../../..");
const baseURL = process.env.HARMONYZ_URL || "http://127.0.0.1:3181";
const output =
    process.env.HARMONYZ_CAPTURE_DIR || fs.mkdtempSync(path.join(os.tmpdir(), "harmonyz-pause-"));
fs.mkdirSync(output, { recursive: true });

(async () => {
    const browser = await chromium.launch({ headless: true });
    const results = [];
    try {
        for (const style of ["spectrum", "joy-division"]) {
            const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
            const errors = [];
            page.on("pageerror", (error) => errors.push(error.message));
            await page.addInitScript(() => {
                const requestFrame = window.requestAnimationFrame;
                window.__freezePosterFrames = false;
                window.requestAnimationFrame = (callback) =>
                    requestFrame((time) => {
                        if (!window.__freezePosterFrames) callback(time);
                    });
                const prototype = CanvasRenderingContext2D.prototype;
                const capture = (ctx) => ctx.canvas.id === "poster-preview-canvas";
                const originalFill = prototype.fillRect;
                prototype.fillRect = function (...args) {
                    if (capture(this)) window.__posterFrame = { rows: [], clip: null };
                    return originalFill.apply(this, args);
                };
                const originalBegin = prototype.beginPath;
                prototype.beginPath = function (...args) {
                    if (capture(this)) this.__posterPath = [];
                    return originalBegin.apply(this, args);
                };
                const originalRect = prototype.rect;
                prototype.rect = function (x, y, width, height) {
                    if (capture(this)) this.__posterRect = { x, y, width, height };
                    return originalRect.call(this, x, y, width, height);
                };
                const originalClip = prototype.clip;
                prototype.clip = function (...args) {
                    if (capture(this)) window.__posterFrame.clip = this.__posterRect;
                    return originalClip.apply(this, args);
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
                        const ys = this.__posterPath.flatMap((command) =>
                            command.slice(2).filter((_, index) => index % 2 === 0),
                        );
                        const clip = window.__posterFrame.clip;
                        window.__posterFrame.rows.push({
                            baseline: this.__posterPath[0][2],
                            minY: Math.min(...ys),
                            clippedPoints: clip ? ys.filter((y) => y < clip.y).length : 0,
                        });
                    }
                    return originalStroke.apply(this, args);
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
            const cycles = [];
            for (const time of [12, 60]) {
                await page.evaluate(() => {
                    window.__freezePosterFrames = false;
                });
                await page.getByRole("button", { name: "Play", exact: true }).click();
                await page
                    .getByLabel("Song position", { exact: true })
                    .evaluate((element, time) => {
                        Object.getOwnPropertyDescriptor(
                            HTMLInputElement.prototype,
                            "value",
                        ).set.call(element, String(time));
                        element.dispatchEvent(new Event("input", { bubbles: true }));
                        element.dispatchEvent(new Event("change", { bubbles: true }));
                    }, time);
                await page.waitForTimeout(200);
                const before = await page.evaluate(() => {
                    // The capture and click share one JS task; no extra animation frame may interleave.
                    window.__freezePosterFrames = true;
                    const canvas = document.getElementById("poster-preview-canvas");
                    const bounds = canvas.getBoundingClientRect();
                    const result = {
                        image: canvas.toDataURL().split(",")[1],
                        position: document.querySelector("audio").currentTime,
                        frame: window.__posterFrame,
                        bounds: {
                            x: bounds.x,
                            y: bounds.y,
                            width: bounds.width,
                            height: bounds.height,
                        },
                    };
                    [...document.querySelectorAll("button")]
                        .find((button) => /^(Stop|Pause)$/.test(button.textContent.trim()))
                        .click();
                    return result;
                });
                await page.getByRole("button", { name: "Play", exact: true }).waitFor();
                await page.waitForTimeout(50);
                const after = await page.evaluate(() => {
                    const canvas = document.getElementById("poster-preview-canvas");
                    const bounds = canvas.getBoundingClientRect();
                    return {
                        image: canvas.toDataURL().split(",")[1],
                        position: document.querySelector("audio").currentTime,
                        paused: document.querySelector("audio").paused,
                        frame: window.__posterFrame,
                        bounds: {
                            x: bounds.x,
                            y: bounds.y,
                            width: bounds.width,
                            height: bounds.height,
                        },
                    };
                });
                const changedPixels = await page.evaluate(
                    async ({ before, after }) => {
                        const images = [new Image(), new Image()];
                        images[0].src = "data:image/png;base64," + before;
                        images[1].src = "data:image/png;base64," + after;
                        await Promise.all(images.map((image) => image.decode()));
                        const canvas = document.createElement("canvas");
                        canvas.width = images[0].width;
                        canvas.height = images[0].height;
                        const context = canvas.getContext("2d", { willReadFrequently: true });
                        context.drawImage(images[0], 0, 0);
                        const first = context.getImageData(0, 0, canvas.width, canvas.height).data;
                        context.drawImage(images[1], 0, 0);
                        const second = context.getImageData(0, 0, canvas.width, canvas.height).data;
                        let changed = 0;
                        for (let index = 0; index < first.length; index += 4)
                            if (
                                first
                                    .subarray(index, index + 4)
                                    .some((value, part) => value !== second[index + part])
                            )
                                changed++;
                        return changed;
                    },
                    { before: before.image, after: after.image },
                );
                const summary = {
                    time,
                    imageIdentical: before.image === after.image,
                    changedPixels,
                    beforeHash: createHash("sha256")
                        .update(Buffer.from(before.image, "base64"))
                        .digest("hex"),
                    afterHash: createHash("sha256")
                        .update(Buffer.from(after.image, "base64"))
                        .digest("hex"),
                    beforePosition: before.position,
                    afterPosition: after.position,
                    paused: after.paused,
                    canvasBoundsStable:
                        JSON.stringify(before.bounds) === JSON.stringify(after.bounds),
                    beforeMinY: Math.min(...before.frame.rows.map((row) => row.minY)),
                    clippedPoints: before.frame.rows.reduce(
                        (total, row) => total + row.clippedPoints,
                        0,
                    ),
                    clippingBoundary: before.frame.clip?.y ?? null,
                };
                cycles.push(summary);
                fs.writeFileSync(
                    path.join(output, `${style}-${time}-playing.png`),
                    Buffer.from(before.image, "base64"),
                );
                fs.writeFileSync(
                    path.join(output, `${style}-${time}-paused.png`),
                    Buffer.from(after.image, "base64"),
                );
                if (time === 12) {
                    const comparison = await page.evaluate(
                        async ({ before, after, style }) => {
                            const images = [new Image(), new Image()];
                            images[0].src = "data:image/png;base64," + before;
                            images[1].src = "data:image/png;base64," + after;
                            await Promise.all(images.map((image) => image.decode()));
                            const canvas = document.createElement("canvas");
                            canvas.width = 1060;
                            canvas.height = 780;
                            const context = canvas.getContext("2d");
                            context.fillStyle = "#edf1f5";
                            context.fillRect(0, 0, canvas.width, canvas.height);
                            context.fillStyle = "#0f172a";
                            context.font = "20px sans-serif";
                            context.fillText(`${style} · juste avant pause`, 20, 32);
                            context.fillText(`${style} · en pause`, 550, 32);
                            context.drawImage(images[0], 20, 50, 490, 693);
                            context.drawImage(images[1], 550, 50, 490, 693);
                            return canvas.toDataURL().split(",")[1];
                        },
                        { before: before.image, after: after.image, style },
                    );
                    fs.writeFileSync(
                        path.join(output, `${style}-comparison.png`),
                        Buffer.from(comparison, "base64"),
                    );
                }
                console.log(style, JSON.stringify(summary));
                assert.equal(after.paused, true, "pause stops audible playback");
                assert.ok(
                    Math.abs(before.position - after.position) < 0.1,
                    "pause preserves audio position",
                );
                assert.deepEqual(errors, []);
            }
            results.push({ style, cycles, errors });
            await page.close();
        }
        fs.writeFileSync(path.join(output, "results.json"), JSON.stringify(results, null, 2));
        console.log("CAPTURES", output);
        assert.ok(
            results.every((result) =>
                result.cycles.every((cycle) => cycle.imageIdentical && cycle.changedPixels === 0),
            ),
            "pause must preserve the exact last displayed image in both styles",
        );
        assert.ok(
            results.every((result) =>
                result.cycles.every((cycle) => cycle.clippedPoints === 0 && cycle.beforeMinY >= 0),
            ),
            "curve peaks must not be cut at the top of the drawing area",
        );
    } finally {
        await browser.close();
    }
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
