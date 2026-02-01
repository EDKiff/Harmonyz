import AudioAnalyzer from "~/renderer/AudioAnalyzer";
import HarmonyRenderer from "~/renderer/HarmonyRenderer";

export class PosterGenerator {
  private static readonly SAMPLE_IMAGES = [
    "https://picsum.photos/seed/poster1/800/800",
    "https://picsum.photos/seed/poster2/800/800",
    "https://picsum.photos/seed/poster3/800/800",
    "https://picsum.photos/seed/poster4/800/800",
    "https://picsum.photos/seed/poster5/800/800",
  ];

  async generate(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const analyzer = new AudioAnalyzer(2048, 0.5, -100, -30);
    const frames = await analyzer.analyzeFullAudio(arrayBuffer);
    const renderer = new HarmonyRenderer();
    return renderer.setFrequencyData(frames);
  }
}
