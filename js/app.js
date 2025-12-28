class Harmonyzzz {
    constructor() {
        this.canvas = document.getElementById("harmonyCanvas");
        this.audioInput = document.getElementById("audioInput");
        this.uploadBtn = document.getElementById("uploadBtn");
        this.playBtn = document.getElementById("playBtn");
        this.exportBtn = document.getElementById("exportBtn");
        this.pLineCount = document.getElementById("pLineCount");
        this.pRangeStart = document.getElementById("pRangeStart");
        this.pRangeEnd = document.getElementById("pRangeEnd");
        this.pAmplify = document.getElementById("pAmplify");
        this.pSmoothing = document.getElementById("pSmoothing");
        this.fftSize = document.getElementById("fftSize");
        this.minDecibels = document.getElementById("minDecibels");
        this.maxDecibels = document.getElementById("maxDecibels");
        this.smoothingTimeConstant = document.getElementById("smoothingTimeConstant");

        this.renderer = new HarmonyRenderer(this.canvas);
        this.renderer.changeSettings({
            lineCount: parseInt(this.pLineCount.value),
            rangeStart: parseFloat(this.pRangeStart.value),
            rangeEnd: parseFloat(this.pRangeEnd.value),
            amplify: parseFloat(this.pAmplify.value),
            smoothing: parseInt(this.pSmoothing.value),
        });

        this.setupCanvas();
        this.setupEventListeners();
        this.loadDefaultAudio();
    }

    setupCanvas() {
        const resize = () => {
            const parent = this.canvas.parentElement;
            this.canvas.width = parent.clientWidth;
            this.canvas.height = parent.clientHeight;
            if (this.renderer.frequencyDataFrames) {
                this.renderer.render();
            }
        };
        window.addEventListener("resize", resize);
        resize();
    }

    setupEventListeners() {
        this.audioInput.addEventListener("input", async (e) => {
            await this.loadAudioAndRender(e);
        });
        this.fftSize.addEventListener("input", async (e) => {
            await this.loadAudioAndRender(e);
        });
        this.smoothingTimeConstant.addEventListener("input", async (e) => {
            await this.loadAudioAndRender(e);
        });
        this.minDecibels.addEventListener("input", async (e) => {
            await this.loadAudioAndRender(e);
        });
        this.maxDecibels.addEventListener("input", async (e) => {
            await this.loadAudioAndRender(e);
        });

        this.playBtn.addEventListener("click", () => {
            this.renderer.switchDynamicMode();
        });

        this.exportBtn.addEventListener("click", () => {
            this.renderer.export(`harmony-${Date.now()}.png`);
        });

        this.pLineCount.addEventListener("input", (e) => {
            this.renderer.changeSettings({
                lineCount: parseInt(e.target.value),
            });
        });

        this.pRangeStart.addEventListener("input", (e) => {
            this.renderer.changeSettings({
                rangeStart: parseFloat(e.target.value),
            });
        });

        this.pRangeEnd.addEventListener("input", (e) => {
            this.renderer.changeSettings({
                rangeEnd: parseFloat(e.target.value),
            });
        });

        this.pAmplify.addEventListener("input", (e) => {
            this.renderer.changeSettings({
                amplify: parseFloat(e.target.value),
            });
        });

        this.pSmoothing.addEventListener("input", (e) => {
            this.renderer.changeSettings({
                smoothing: parseInt(e.target.value),
            });
        });
    }

    async loadAudioAndRender(e) {
        if (this.audioInput.files.length > 0) {
            const file = this.audioInput.files[0];
            const arrayBuffer = await file.arrayBuffer();
            this.processAudio(arrayBuffer);
            this.renderer.render();
        }
    }

    async loadDefaultAudio() {
        try {
            const res = await fetch("song.mp3");
            if (!res.ok) throw new Error("Not found");
            const buffer = await res.arrayBuffer();
            this.processAudio(buffer);
        } catch (e) {
            console.log("No default song found.");
        }
    }

    async processAudio(arrayBuffer) {
        this.uploadBtn.disabled = true;
        this.uploadBtn.textContent = "🔃";

        try {
            console.log(
                "Analyzing audio using parameters: ",
                this.fftSize.value,
                this.smoothingTimeConstant.value,
                this.minDecibels.value,
                this.maxDecibels.value
            );
            this.analyzer = new AudioAnalyzer(
                this.fftSize.value,
                this.smoothingTimeConstant.value,
                this.minDecibels.value,
                this.maxDecibels.value
            );
            const frames = await this.analyzer.analyzeFullAudio(arrayBuffer);
            this.renderer.setFrequencyData(frames);

            this.uploadBtn.disabled = false;
            this.playBtn.disabled = false;
            this.exportBtn.disabled = false;
            this.uploadBtn.textContent = "📁";
        } catch (err) {
            console.error(err);
            this.uploadBtn.disabled = false;
            this.uploadBtn.textContent = "❌";
        }
    }
}

window.addEventListener("DOMContentLoaded", () => new Harmonyzzz());
