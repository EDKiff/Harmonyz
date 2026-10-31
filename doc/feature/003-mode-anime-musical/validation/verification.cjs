const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

const baseURL = process.env.HARMONYZ_URL || "http://127.0.0.1:3180";
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "harmonyz-animation-"));

function wave(duration, frequency = 2000) {
    const sampleRate = 44100;
    const sampleCount = Math.round(sampleRate * duration);
    const buffer = Buffer.alloc(44 + sampleCount * 2);
    buffer.write("RIFF");
    buffer.writeUInt32LE(buffer.length - 8, 4);
    buffer.write("WAVEfmt ", 8);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20);
    buffer.writeUInt16LE(1, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(sampleRate * 2, 28);
    buffer.writeUInt16LE(2, 32);
    buffer.writeUInt16LE(16, 34);
    buffer.write("data", 36);
    buffer.writeUInt32LE(sampleCount * 2, 40);
    for (let index = 0; index < sampleCount; index++) {
        const time = index / sampleRate;
        const envelope = 0.2 + 0.7 * Math.sin(time * 7) ** 2;
        buffer.writeInt16LE(
            Math.round(Math.sin(time * frequency * 2 * Math.PI) * envelope * 18000),
            44 + index * 2,
        );
    }
    return buffer;
}

// Parse GIF containers independently of the encoder: dimensions, every frame's delay and palettes,
// and the NETSCAPE loop extension. Compressed pixels are additionally decoded by the browser below.
function inspectGif(buffer) {
    assert.equal(buffer.subarray(0, 6).toString(), "GIF89a");
    const width = buffer.readUInt16LE(6);
    const height = buffer.readUInt16LE(8);
    let position = 13;
    const palettes = [];
    const palette = (packed) => {
        if (!(packed & 128)) return;
        const length = 3 * 2 ** ((packed & 7) + 1);
        palettes.push(buffer.subarray(position, position + length));
        position += length;
    };
    palette(buffer[10]);
    const blocks = () => {
        const parts = [];
        while (buffer[position]) {
            const length = buffer[position++];
            parts.push(buffer.subarray(position, position + length));
            position += length;
        }
        position++;
        return Buffer.concat(parts);
    };
    const delays = [];
    let delay = 0;
    let repeat = null;
    while (position < buffer.length) {
        const marker = buffer[position++];
        if (marker === 0x3b) break;
        if (marker === 0x21) {
            const extension = buffer[position++];
            const data = blocks();
            if (extension === 0xf9) delay = data.readUInt16LE(1);
            if (extension === 0xff && data.subarray(0, 11).toString() === "NETSCAPE2.0") {
                repeat = data.readUInt16LE(12);
            }
        } else if (marker === 0x2c) {
            const packed = buffer[position + 8];
            position += 9;
            palette(packed);
            position++; // LZW minimum code size.
            blocks();
            delays.push(delay);
        } else {
            throw new Error(`Unexpected GIF marker ${marker} at ${position - 1}`);
        }
    }
    return { width, height, delays, repeat, palettes };
}

(async () => {
    const browser = await chromium.launch({ headless: true });
    try {
        const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
        const errors = [];
        page.on("pageerror", (error) => {
            errors.push(error.message);
            console.error("PAGE ERROR", error.message);
        });
        await page.addInitScript(() => {
            window.__previewFrameTimes = [];
            const original = CanvasRenderingContext2D.prototype.fillRect;
            CanvasRenderingContext2D.prototype.fillRect = function (...args) {
                if (this.canvas.id === "poster-preview-canvas")
                    window.__previewFrameTimes.push(performance.now());
                return original.apply(this, args);
            };
        });
        await page.goto(baseURL);
        const play = () => page.getByRole("button", { name: "Play", exact: true });
        const stop = () => page.getByRole("button", { name: "Stop", exact: true });
        const save = page.getByRole("button", { name: "Save", exact: true });
        const audio = page.getByLabel("Song playback");
        const state = () =>
            audio.evaluate((element) => ({
                paused: element.paused,
                time: element.currentTime,
                duration: element.duration,
                volume: element.volume,
            }));
        const ready = async () => {
            await page.waitForFunction(
                () => {
                    const button = document.querySelector('button[aria-label="Save"]');
                    return button && !button.disabled;
                },
                {},
                { timeout: 180000 },
            );
            await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
        };
        const slider = async (label, value) =>
            page.getByLabel(label, { exact: true }).evaluate((element, value) => {
                Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(
                    element,
                    String(value),
                );
                element.dispatchEvent(new Event("input", { bubbles: true }));
                element.dispatchEvent(new Event("change", { bubbles: true }));
            }, value);
        const load = async (name, duration) => {
            console.log("LOAD", name, duration);
            await page
                .locator("input[type=file]")
                .setInputFiles({ name, mimeType: "audio/wav", buffer: wave(duration) });
            await ready();
            console.log("READY", name);
        };
        const startGif = async () => {
            await save.click();
            await page.getByRole("button", { name: "Download GIF", exact: true }).click();
        };
        const downloadedGif = async (downloadPromise, name) => {
            const download = await downloadPromise;
            const filename = path.join(temporary, name);
            await download.saveAs(filename);
            const bytes = fs.readFileSync(filename);
            const info = inspectGif(bytes);
            const decoded = await page.evaluate(async (base64) => {
                const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
                const decoder = new ImageDecoder({ data: bytes, type: "image/gif" });
                await decoder.tracks.ready;
                const count = decoder.tracks.selectedTrack.frameCount;
                const first = await decoder.decode({ frameIndex: 0 });
                const last = await decoder.decode({ frameIndex: count - 1 });
                const dimensions = [first.image.displayWidth, first.image.displayHeight];
                first.image.close();
                last.image.close();
                decoder.close();
                return { count, dimensions };
            }, bytes.toString("base64"));
            assert.equal(decoded.count, info.delays.length);
            assert.deepEqual(decoded.dimensions, [info.width, info.height]);
            assert.equal(info.repeat, 0, "the downloaded GIF repeats indefinitely");
            console.log(name, {
                bytes: bytes.length,
                width: info.width,
                height: info.height,
                frames: info.delays.length,
                durationCs: info.delays.reduce((sum, delay) => sum + delay, 0),
            });
            return { info, download };
        };

        assert.equal(await play().isDisabled(), true);
        assert.equal(await save.isDisabled(), true);
        await load("fractional.wav", 2.127);
        await page.getByRole("button", { name: "Custom", exact: true }).click();
        await page.getByRole("button", { name: "px", exact: true }).click();
        await page.getByLabel("Width (px)").fill("240");
        await page.getByLabel("Height (px)").fill("320");
        await page.getByLabel("Height (px)").blur();
        await page.waitForTimeout(350);
        await ready();
        assert.deepEqual(
            await page.locator("canvas").evaluate((canvas) => [canvas.width, canvas.height]),
            [240, 320],
        );
        const initialStaticPng = await page
            .locator("canvas")
            .evaluate((canvas) => canvas.toDataURL("image/png").split(",")[1]);

        const before = await state();
        const firstDownload = page.waitForEvent("download", { timeout: 180000 });
        const smallStarted = performance.now();
        await startGif();
        const { info: initialGif } = await downloadedGif(firstDownload, "before-play.gif");
        console.log("SMALL GIF GENERATION MS", Math.round(performance.now() - smallStarted));
        assert.deepEqual([initialGif.width, initialGif.height], [240, 320]);
        assert.equal(initialGif.delays.length, 43);
        assert.deepEqual(initialGif.delays.slice(0, -1), Array(42).fill(5));
        assert.equal(initialGif.delays.at(-1), 3);
        const after = await state();
        assert.equal(before.paused, true);
        assert.equal(after.paused, true);
        assert.equal(after.time, before.time);
        console.log("EXPORT BEFORE PLAY / COMPLETE FRACTIONAL DURATION OK");

        await play().click();
        await page.evaluate(() => {
            window.__previewFrameTimes.length = 0;
        });
        await page.waitForTimeout(1500);
        const cadence = await page.evaluate(() => {
            const times = window.__previewFrameTimes;
            return times.length > 1 ? ((times.length - 1) * 1000) / (times.at(-1) - times[0]) : 0;
        });
        console.log("PREVIEW OBSERVED FPS", Number(cadence.toFixed(1)));
        await slider("Song position", 0);
        await page.waitForTimeout(400);
        assert.equal((await state()).paused, false);
        const beforePng = await state();
        const pngDownload = page.waitForEvent("download");
        await save.click();
        await page.getByRole("button", { name: "Download PNG", exact: true }).click();
        const png = await pngDownload;
        const pngFilename = path.join(temporary, "static-during-play.png");
        await png.saveAs(pngFilename);
        assert.equal(
            fs.readFileSync(pngFilename).toString("base64"),
            initialStaticPng,
            "PNG during playback exports the fixed poster",
        );
        assert.equal((await state()).paused, false);
        assert.ok((await state()).time >= beforePng.time);
        console.log("PNG DURING PLAYBACK / STATIC POSTER / PLAYBACK PRESERVED OK");
        await stop().click();
        const paused = await state();
        assert.equal(paused.paused, true);
        assert.ok(paused.time > 0.2);
        await play().click();
        await page.waitForTimeout(100);
        assert.ok((await state()).time >= paused.time);
        await slider("Song position", 1.2);
        await slider("Volume", 0.3);
        await page.waitForTimeout(100);
        assert.equal((await state()).volume, 0.3);
        assert.ok((await state()).time >= 1.2);
        await page.getByLabel("Drawing style").selectOption("joy-division");
        await ready();
        assert.equal((await state()).paused, false);
        await page.getByLabel("Stroke color", { exact: true }).fill("#ff0000");
        await page.getByLabel("Accent", { exact: true }).fill("#ff0000");
        await page.waitForTimeout(350);
        await ready();
        assert.equal((await state()).paused, false);
        await slider("Song position", 2.02);
        await page.waitForTimeout(400);
        assert.ok((await state()).time < 0.8, "playback loops to the beginning");
        await stop().click();
        assert.equal(
            await page.getByLabel("Stroke color", { exact: true }).inputValue(),
            "#ff0000",
        );
        console.log("PLAY / STOP / RESUME / SEEK / VOLUME / STYLE / LIVE SETTINGS / LOOP OK");

        // .501 s used to suspend beyond the last Web Audio rendering quantum and hang analysis.
        await load("quantum-edge.wav", 0.501);
        await page.getByRole("button", { name: "A4", exact: true }).click();
        await page.waitForTimeout(350);
        await ready();
        const a4Download = page.waitForEvent("download", { timeout: 180000 });
        const a4Started = performance.now();
        await startGif();
        const { info: a4Gif } = await downloadedGif(a4Download, "a4-short.gif");
        console.log("A4 GIF GENERATION MS", Math.round(performance.now() - a4Started));
        assert.deepEqual([a4Gif.width, a4Gif.height], [840, 1188]);
        assert.equal(a4Gif.delays.length, 10);
        assert.equal(
            a4Gif.delays.reduce((sum, delay) => sum + delay, 0),
            50,
        );
        await page.getByRole("button", { name: "Custom", exact: true }).click();
        await page.waitForTimeout(350);
        await ready();
        console.log("SUBSECOND AUDIO / A4 DIMENSIONS AND DURATION OK");

        await load("old-track.wav", 8.127);
        await page.getByLabel("Background", { exact: true }).fill("#000000");
        await page.waitForTimeout(350);
        await ready();
        const oldDownload = page.waitForEvent("download", { timeout: 180000 });
        await startGif();
        await page.getByRole("button", { name: "Cancel export", exact: true }).waitFor();
        await page.getByLabel("Stroke color", { exact: true }).fill("#0000ff");
        await load("new-track.wav", 0.627);
        assert.equal((await state()).paused, true);
        assert.equal((await state()).time, 0);
        const { info: oldGif, download: oldFile } = await downloadedGif(
            oldDownload,
            "snapshot.gif",
        );
        assert.match(oldFile.suggestedFilename(), /old-track/);
        assert.equal(
            oldGif.delays.reduce((sum, delay) => sum + delay, 0),
            813,
        );
        for (const palette of oldGif.palettes) {
            for (let index = 0; index < palette.length; index += 3) {
                assert.ok(
                    palette[index] >= palette[index + 1] && palette[index] >= palette[index + 2],
                    "every frame keeps its red export snapshot",
                );
            }
        }
        console.log("EXPORT SNAPSHOT / NEW TRACK PAUSED / UNIFORM PERSONALIZATION OK");

        await load("cancel-track.wav", 30.127);
        await play().click();
        await startGif();
        await page.getByRole("button", { name: "Cancel export", exact: true }).click();
        assert.equal((await state()).paused, false);
        await stop().click();
        console.log("CANCEL PRESERVES PLAYBACK OK");

        await page.setViewportSize({ width: 390, height: 844 });
        const controls = [
            play(),
            save,
            page.getByLabel("Song position", { exact: true }),
            page.getByLabel("Volume", { exact: true }),
        ];
        for (const control of controls) {
            assert.equal(await control.isVisible(), true);
            const rectangle = await control.boundingBox();
            assert.ok(rectangle.x >= 0 && rectangle.x + rectangle.width <= 390);
            assert.ok(rectangle.y >= 0 && rectangle.y + rectangle.height <= 844);
        }
        await save.click();
        assert.equal(
            await page.getByRole("button", { name: "Download GIF", exact: true }).isVisible(),
            true,
        );
        await page.keyboard.press("Escape");
        await load("mobile-partial.wav", 0.627);
        await play().click();
        await page.waitForTimeout(150);
        await slider("Song position", 0.4);
        await stop().click();
        const mobilePosition = (await state()).time;
        const mobileDownload = page.waitForEvent("download", { timeout: 180000 });
        await startGif();
        const { info: mobileGif } = await downloadedGif(mobileDownload, "mobile-partial.gif");
        assert.equal(mobileGif.delays.length, 13);
        assert.equal(
            mobileGif.delays.reduce((sum, delay) => sum + delay, 0),
            63,
        );
        assert.equal((await state()).paused, true);
        assert.equal((await state()).time, mobilePosition);
        assert.deepEqual(errors, []);
        await page.screenshot({ path: path.join(temporary, "mobile.png") });
        console.log(
            "MOBILE CONTROLS / EXPORT AFTER PARTIAL LISTENING AND SEEK / NO PAGE ERRORS OK",
        );
        await page.setViewportSize({ width: 1440, height: 1000 });
        await page.getByRole("button", { name: "A4", exact: true }).click();
        await page
            .locator("input[type=file]")
            .setInputFiles(path.resolve(__dirname, "../../../../song.mp3"));
        await ready();
        await play().click();
        await page.waitForTimeout(500);
        await stop().click();
        assert.ok((await state()).duration > 1);
        assert.ok((await state()).time > 0);
        assert.deepEqual(errors, []);
        await page.screenshot({ path: path.join(temporary, "desktop.png") });
        console.log("REAL MP3 IMPORT / PLAYBACK / DESKTOP CAPTURE OK");
        if (process.env.HARMONYZ_KEEP_ARTIFACTS) console.log("ARTIFACTS", temporary);
    } finally {
        await browser.close();
        if (!process.env.HARMONYZ_KEEP_ARTIFACTS)
            fs.rmSync(temporary, { recursive: true, force: true });
    }
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
