import Visualizer, { type JoyDivisionParameters } from "./Visualizer";

class HarmonyRenderer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private frequencyDataFrames: Uint8Array[] | null;
    private currentFrame: number;
    private settings: JoyDivisionParameters;

    constructor() {
        this.canvas = document.createElement("canvas");
        this.ctx = this.canvas.getContext("2d")!;
        this.frequencyDataFrames = null;
        this.currentFrame = 0;
        this.settings = {
            lineCount: 50,
            rangeStart: 0,
            rangeEnd: 1,
            amplify: 1,
            smoothing: 2,
        };
    }

    setFrequencyData(
        frequencyDataFrames: Uint8Array[],
        settings?: JoyDivisionParameters,
    ): Promise<string> {
        this.frequencyDataFrames = frequencyDataFrames;
        this.currentFrame = 0;
        if (settings) {
            this.settings = settings;
        }
        return this.render();
    }

    render(): Promise<string> {
        return new Promise((resolve) => {
            requestAnimationFrame(() => {
                if (!this.frequencyDataFrames) {
                    resolve("");
                    return;
                }
                Visualizer.joyDivision(
                    this.ctx,
                    this.canvas,
                    this.frequencyDataFrames,
                    this.currentFrame,
                    this.settings,
                );
                resolve(this.canvas.toDataURL("image/png"));
            });
        });
    }
}

export default HarmonyRenderer;
