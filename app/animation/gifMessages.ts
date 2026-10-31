import type { AnalyzedAudioData } from "../renderer/AudioAnalyzer";
import type { PosterState, PosterStyle } from "../welcome/welcome.types";

export type GifSnapshot = {
    analysis: AnalyzedAudioData;
    parameters: PosterState;
    drawingStyle: PosterStyle;
    width: number;
    height: number;
};

export type GifRequest =
    | { type: "initialize"; snapshot: GifSnapshot; databaseName: string }
    | { type: "prepare"; time: number }
    | { type: "export"; id: number }
    | { type: "cancel"; id: number }
    | { type: "dispose" };

export type GifResponse =
    | { type: "progress"; id: number; progress: number }
    | { type: "complete"; id: number; blob: Blob }
    | { type: "error"; message: string }
    | { type: "disposed" };
