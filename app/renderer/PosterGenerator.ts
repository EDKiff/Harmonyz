import AudioAnalyzer from "~/renderer/AudioAnalyzer";
import HarmonyRenderer from "~/renderer/HarmonyRenderer";
import type { JoyDivisionParameters } from "./Visualizer";

export class PosterGenerator {
    async generate(
        file: File,
        fftSize: number = 2048,
        smoothingTimeConstant: number = 0.5,
        minDecibels: number = -100,
        maxDecibels: number = -30,
        rendererSettings?: JoyDivisionParameters,
    ): Promise<string> {
        const arrayBuffer = await file.arrayBuffer();
        const analyzer = new AudioAnalyzer(
            fftSize,
            smoothingTimeConstant,
            minDecibels,
            maxDecibels,
        );
        const frames = await analyzer.analyzeFullAudio(arrayBuffer);
        const renderer = new HarmonyRenderer();
        return renderer.setFrequencyData(frames, rendererSettings);
    }
}
