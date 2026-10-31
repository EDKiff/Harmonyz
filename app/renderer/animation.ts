import type { AnalyzedAudioData } from "./AudioAnalyzer";
import type { PosterComponentParameters, YAxisData } from "./PosterRenderer";

type AnimationParameters = Pick<PosterComponentParameters, "lineCount"> & {
    durationBetweenLines: number;
};

const wrap = (time: number, duration: number) => ((time % duration) + duration) % duration;

/** Evaluate the cyclic audio timeline, including the shorter final sampling interval. */
function spectrumAt(analysis: AnalyzedAudioData, interval: number, time: number): number[] {
    const { frequencyData, duration } = analysis;
    if (frequencyData.length === 0 || !(duration > 0)) return [];
    const position = wrap(time, duration);
    const index = Math.min(Math.floor(position / interval), frequencyData.length - 1);
    const next = (index + 1) % frequencyData.length;
    const start = index * interval;
    const end = next === 0 ? duration : (index + 1) * interval;
    const fraction = Math.min(1, Math.max(0, (position - start) / (end - start || interval)));
    return frequencyData[index].map((value, bin) => {
        const from = Number.isFinite(value) ? value : 0;
        const target = frequencyData[next][bin];
        const to = Number.isFinite(target) ? target : 0;
        return from + (to - from) * fraction;
    });
}

/** Rows are ordered top to bottom; their baselines and relative time labels never move. */
export function animationFrame(
    analysis: AnalyzedAudioData,
    parameters: AnimationParameters,
    timeSeconds: number,
): YAxisData[] {
    const interval = parameters.durationBetweenLines;
    if (!(interval > 0) || !Number.isFinite(interval) || !Number.isFinite(timeSeconds)) return [];
    const count = Math.max(1, Math.floor(parameters.lineCount));
    return Array.from({ length: count }, (_, row) => {
        const offset = (count - 1 - row) * interval;
        return {
            timestamp: offset === 0 ? 0 : -offset,
            frequencyData: spectrumAt(analysis, interval, timeSeconds - offset),
        };
    });
}

/** A stable audio scale prevents the animated rows from changing height at every frame. */
export function globalAnalysisPeak(
    analysis: AnalyzedAudioData,
    parameters: Pick<PosterComponentParameters, "minFrequency" | "maxFrequency">,
): number {
    const selectedBins: number[] = [];
    for (let bin = 0; bin < analysis.xAxis.length; bin++) {
        const frequency = analysis.xAxis[bin];
        if (frequency >= parameters.minFrequency && frequency <= parameters.maxFrequency) {
            selectedBins.push(bin);
        }
    }
    let peak = 0;
    for (const spectrum of analysis.frequencyData) {
        for (const bin of selectedBins) {
            const value = spectrum[bin];
            if (Number.isFinite(value)) peak = Math.max(peak, value);
        }
    }
    return peak;
}
