import AudioAnalyzer, {
    type AudioAnalyzerParameters,
    type AnalyzedAudioData,
} from "~/renderer/AudioAnalyzer";

export type GeneratedPosterInfos = {
    xAxis: Array<number>;
    series: Array<Array<number>>;
};

export class PosterGenerator {
    private cache = new WeakMap<File, Map<string, Promise<AnalyzedAudioData>>>();

    async generate(
        file: File,
        requestedMaxLines: number,
        params: AudioAnalyzerParameters,
    ): Promise<GeneratedPosterInfos> {
        const key = JSON.stringify([
            params.fftSize,
            params.smoothingTimeConstant,
            params.minDecibels,
            params.maxDecibels,
            params.durationBetweenLines,
        ]);
        let analyses = this.cache.get(file);
        if (!analyses) {
            analyses = new Map();
            this.cache.set(file, analyses);
        }
        let analysis = analyses.get(key);
        if (!analysis) {
            analysis = file
                .arrayBuffer()
                .then((buffer) => new AudioAnalyzer(params).analyzeFullAudio(buffer));
            analyses.set(key, analysis);
            // Bound the spectra kept while experimenting with analysis settings.
            if (analyses.size > 4) analyses.delete(analyses.keys().next().value!);
            const currentCache = analyses;
            void analysis.catch(() => {
                if (currentCache.get(key) === analysis) currentCache.delete(key);
            });
        }
        const audioData = await analysis;
        return {
            xAxis: audioData.xAxis,
            series: audioData.frequencyData.slice(0, requestedMaxLines),
        };
    }
}
