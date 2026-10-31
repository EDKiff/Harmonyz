const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const fs = require("fs");
const assert = require("node:assert/strict");
const root = require("node:path").resolve(__dirname, "../../../..");
const baseURL = process.env.HARMONYZ_URL || "http://127.0.0.1:3180";
const { mkdtempSync } = require("node:fs");
const temporary = mkdtempSync(
    require("node:path").join(require("node:os").tmpdir(), "harmonyz-check-"),
);
(async () => {
    const browser = await chromium.launch({ headless: true });
    try {
        const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
        const errors = [];
        page.on("pageerror", (e) => errors.push(e.message));
        await page.addInitScript(() => {
            window.__audioContexts = 0;
            window.AudioContext = new Proxy(window.AudioContext, {
                construct(target, args) {
                    window.__audioContexts++;
                    return Reflect.construct(target, args);
                },
            });
        });
        await page.goto(baseURL);
        const style = page.getByLabel("Drawing style");
        await style.selectOption("joy-division");
        await page.waitForTimeout(300);
        await page.locator("input[type=file]").setInputFiles(root + "/song.mp3");
        const ready = async () => {
            await page.waitForFunction(
                () => !document.querySelector('button[aria-label="Save"]').disabled,
                {},
                { timeout: 180000 },
            );
            await page.evaluate(
                () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
            );
        };
        await ready();
        assert.equal(await page.getByLabel("Line count").inputValue(), "80");
        assert.equal(await page.getByLabel("FFT size").inputValue(), "4096");
        assert.equal(await page.getByLabel("Axis color").count(), 0);
        const saveCanvas = async (name) => {
            const data = await page.locator("canvas").evaluate((c) => c.toDataURL().split(",")[1]);
            fs.writeFileSync(
                root + "/doc/feature/002-style-joy-division/validation/" + name,
                Buffer.from(data, "base64"),
            );
        };
        await saveCanvas("song-portrait.png");
        const portrait = await page.locator("canvas").evaluate((c) => c.toDataURL());
        const stroke = page.getByLabel("Stroke color");
        const initialDecodes = await page.evaluate(() => window.__audioContexts);
        await stroke.fill("#ff8800");
        await ready();
        assert.equal(
            await page.evaluate(() => window.__audioContexts),
            initialDecodes,
            "visual change reuses audio",
        );
        await style.selectOption("spectrum");
        await ready();
        assert.equal(await page.getByLabel("Line count").inputValue(), "20");
        assert.equal(await stroke.inputValue(), "#bab2a9");
        assert.equal(await page.getByLabel("Axis color").count(), 1);
        await style.selectOption("joy-division");
        await ready();
        assert.equal(await stroke.inputValue(), "#ff8800");
        await page.getByRole("button", { name: "Presets", exact: true }).click();
        await page.getByRole("button", { name: /Glacier/ }).click();
        await ready();
        assert.equal(await style.inputValue(), "joy-division");
        await page.getByRole("button", { name: "Advanced", exact: true }).click();
        assert.equal(await page.getByLabel("Seconds between lines").inputValue(), "0.6");
        await style.selectOption("spectrum");
        await ready();
        assert.equal(await page.getByLabel("Seconds between lines").inputValue(), "0.5");
        assert.equal(await stroke.inputValue(), "#bab2a9");
        // Restore the reference defaults, switch through formats and export the actual canvas.
        await style.selectOption("joy-division");
        await ready();
        await stroke.fill("#ffffff");
        await page.getByLabel("Accent").fill("#ffffff");
        await page.getByLabel("Background").fill("#000000");
        await page.getByLabel("Line width").fill("3");
        await page.getByLabel("Smoothing").fill("0.5");
        await page.getByLabel("Seconds between lines").fill("0.5");
        await ready();
        assert.equal(
            await page.locator("canvas").evaluate((c) => c.toDataURL()),
            portrait,
            "deterministic after round-trip",
        );
        const downloadPromise = page.waitForEvent("download");
        await page.getByRole("button", { name: "Save", exact: true }).click();
        await page.getByRole("button", { name: "Download PNG", exact: true }).click();
        const download = await downloadPromise;
        await download.saveAs(temporary + "/download.png");
        assert.equal(
            fs.readFileSync(temporary + "/download.png").toString("base64"),
            portrait.split(",")[1],
        );
        console.log("PORTRAIT / SETTINGS / PRESETS / EXPORT OK");
        await page.getByRole("button", { name: "Landscape", exact: true }).click();
        await ready();
        assert.deepEqual(
            await page.locator("canvas").evaluate((c) => [c.width, c.height]),
            [1188, 840],
        );
        await saveCanvas("song-landscape.png");
        await style.selectOption("spectrum");
        await ready();
        assert.deepEqual(
            await page.locator("canvas").evaluate((c) => [c.width, c.height]),
            [1188, 840],
        );
        await style.selectOption("joy-division");
        await ready();
        await page.getByRole("button", { name: "Portrait", exact: true }).click();
        await ready();
        console.log("LANDSCAPE / SHARED FORMAT OK");

        const ts = require(root + "/node_modules/typescript");
        const renderer = ts.transpileModule(
            fs.readFileSync(root + "/app/renderer/JoyDivisionRenderer.ts", "utf8"),
            { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } },
        ).outputText;
        const checks = await page.evaluate(async (renderer) => {
            const { drawJoyDivision } = await import(
                "data:text/javascript;base64," + btoa(renderer)
            );
            const params = {
                dataLinesWidth: 2,
                strokeColor: "#fff",
                strokeAccentColor: "#fff",
                backgroundColor: "#000",
            };
            const rows = [];
            let contour = [];
            const ctx = {
                save() {},
                restore() {},
                beginPath() {
                    contour = [];
                },
                moveTo(x, y) {
                    contour.push([x, y]);
                },
                lineTo(x, y) {
                    if (!Number.isFinite(x + y)) throw Error("nonfinite");
                    contour.push([x, y]);
                },
                closePath() {},
                fill() {},
                stroke() {
                    rows.push(contour);
                },
                createLinearGradient() {
                    return { addColorStop() {} };
                },
            };
            drawJoyDivision(
                ctx,
                [
                    [0, 64, 128, 64, 0],
                    [0, 128, 255, 128, 0],
                ],
                840,
                1188,
                params,
            );
            const heights = rows.map((r) => r[0][1] - Math.min(...r.map((p) => p[1])));
            if (!(heights[0] < heights[1] && heights[0] > 0)) throw Error("dynamics");
            for (const input of [[[0, 0, 0]], [[0]], [[]], [], [[NaN, Infinity, 0]]])
                drawJoyDivision(ctx, input, 1188, 840, params);
            return { heights, edgeCases: "finite" };
        }, renderer);
        console.log("GEOMETRY", checks);
        const comparison = await page.evaluate(
            async (reference) => {
                const ref = new Image();
                ref.src = "data:image/webp;base64," + reference;
                await ref.decode();
                const source = document.querySelector("canvas");
                const c = document.createElement("canvas");
                c.width = 1040;
                c.height = 760;
                const x = c.getContext("2d");
                x.fillStyle = "#171717";
                x.fillRect(0, 0, c.width, c.height);
                x.fillStyle = "#fff";
                x.font = "18px sans-serif";
                x.fillText("Référence fournie", 24, 30);
                x.fillText("Harmonyz · song.mp3 · 80 lignes", 544, 30);
                x.drawImage(ref, 24, 50, 480, 680);
                x.drawImage(source, 544, 50, 480, 680);
                return c.toDataURL().split(",")[1];
            },
            fs
                .readFileSync(root + "/doc/feature/002-style-joy-division/s-l1600.webp")
                .toString("base64"),
        );
        fs.writeFileSync(
            root + "/doc/feature/002-style-joy-division/validation/comparaison.png",
            Buffer.from(comparison, "base64"),
        );
        await page.setViewportSize({ width: 390, height: 844 });
        assert.equal(await style.isVisible(), true);
        console.log("MOBILE SELECTOR OK");
        assert.deepEqual(errors, []);
        await page.screenshot({ path: temporary + "/ui-final.png" });
        fs.writeFileSync(temporary + "/result.json", JSON.stringify({ checks, errors }, null, 2));
    } finally {
        await browser.close();
        fs.rmSync(temporary, { recursive: true, force: true });
    }
})();
