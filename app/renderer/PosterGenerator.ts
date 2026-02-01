import AudioAnalyzer from "~/renderer/AudioAnalyzer";
import HarmonyRenderer from "~/renderer/HarmonyRenderer";

export class PosterGenerator {
    async generate(file: File): Promise<string> {
        const arrayBuffer = await file.arrayBuffer();
        const analyzer = new AudioAnalyzer(2048, 0.5, -100, -30);
        const frames = await analyzer.analyzeFullAudio(arrayBuffer);
        const renderer = new HarmonyRenderer();
        return renderer.setFrequencyData(frames);
    }
}
