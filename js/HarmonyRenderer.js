class HarmonyRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.frequencyDataFrames = null;
        this.dynamicMode = false;
        this.currentFrame = 0;
        this.settings = {};
    }

    setFrequencyData(frequencyDataFrames) {
        this.frequencyDataFrames = frequencyDataFrames;
        this.currentFrame = 0;
        this.render();
    }

    render() {
        requestAnimationFrame(() => {
            if (!this.frequencyDataFrames) return;
            Visualizer.joyDivision(this.ctx, this.canvas, this.frequencyDataFrames, this.currentFrame, this.settings);
            
            if(this.dynamicMode) {
                // Fait avancer le debut de la frma a partir de laquelle on dessine
                this.currentFrame = (this.currentFrame + 1) % this.frequencyDataFrames.length;
                this.render();
            }
            console.log(this.currentFrame);
        });
    }

    export(filename = "harmony.png") {
        const link = document.createElement("a");
        link.href = this.canvas.toDataURL("image/png");
        link.download = filename;
        link.click();
    }

    switchDynamicMode() {
        this.dynamicMode = !this.dynamicMode;
        this.render();
    }

    changeSettings(settings) {
        this.settings = { ...this.settings, ...settings };
        this.render();
    }
}