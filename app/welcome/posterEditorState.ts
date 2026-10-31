import { DEFAULT_POSTER_STATE } from "./welcome.constants";
import type {
    PosterFormatState,
    PosterState,
    PosterStyle,
    PosterStyleState,
} from "./welcome.types";

export type PosterEditorState = {
    selectedStyle: PosterStyle;
    format: PosterFormatState;
    styles: Record<PosterStyle, PosterStyleState>;
};

export function splitPosterState(state: Partial<PosterState>) {
    const {
        paperFormat,
        posterOrientation,
        customPosterWidthMm,
        customPosterHeightMm,
        customPosterDpi,
        customSizeUnit,
        ...style
    } = state;
    const format = Object.fromEntries(
        Object.entries({
            paperFormat,
            posterOrientation,
            customPosterWidthMm,
            customPosterHeightMm,
            customPosterDpi,
            customSizeUnit,
        }).filter(([, value]) => value !== undefined),
    ) as Partial<PosterFormatState>;
    return { format, style };
}

export function createPosterEditorState(): PosterEditorState {
    const { format, style } = splitPosterState(DEFAULT_POSTER_STATE);
    return {
        selectedStyle: "spectrum",
        format: format as PosterFormatState,
        styles: {
            spectrum: { ...style } as PosterStyleState,
            "joy-division": {
                ...style,
                lineCount: 80,
                fftSize: 4096,
                backgroundColor: "#000000",
                strokeColor: "#ffffff",
                strokeAccentColor: "#ffffff",
                dataLinesWidth: 3,
            } as PosterStyleState,
        },
    };
}

export function patchPosterEditor(
    state: PosterEditorState,
    patch: Partial<PosterState>,
): PosterEditorState {
    const { format, style } = splitPosterState(patch);
    return {
        ...state,
        format: { ...state.format, ...format },
        styles: {
            ...state.styles,
            [state.selectedStyle]: { ...state.styles[state.selectedStyle], ...style },
        },
    };
}
