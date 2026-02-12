import AudioAnalyzer, { type AudioAnalyzerParameters } from "~/renderer/AudioAnalyzer";

export type GeneratedPosterInfos = {
    xAxis: Array<number>;
    series: Array<Array<number>>;
};

export class PosterGenerator {
    async generate(
        file: File,
        requestedMaxLines: number,
        audioAnalyzerParams: AudioAnalyzerParameters,
    ): Promise<GeneratedPosterInfos> {
        const arrayBuffer = await file.arrayBuffer();
        const analyzer = new AudioAnalyzer(audioAnalyzerParams);
        const audioData = await analyzer.analyzeFullAudio(arrayBuffer);
        return new Promise((resolve) => {
            const xAxis = audioData.xAxis;
            const maxLines = Math.min(requestedMaxLines, audioData.frequencyData.length);
            const series = audioData.frequencyData.slice(0, maxLines);
            resolve({ xAxis, series });
        });
    }
}
