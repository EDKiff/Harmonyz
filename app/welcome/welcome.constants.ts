import type {
    CustomSizeUnit,
    PosterOrientation,
    PosterPaperFormat,
    PosterPreset,
    PosterState,
} from "./welcome.types";

export const PAPER_FORMAT_SIZES_MM = {
    A4: { width: 210, height: 297 },
    A3: { width: 297, height: 420 },
};

export const POSTER_SIZE_LIMITS_MM = {
    min: 10,
    max: 5000,
} as const;

export const POSTER_DPI_LIMITS = {
    min: 30,
    max: 1200,
} as const;

export const MILLIMETER_TO_PIXEL_RATIO = 4;
export const MILLIMETERS_PER_INCH = 25.4;
export const PANEL_CHANGE_THROTTLE_MS = 250;

export const CUSTOM_SIZE_UNIT_OPTIONS: CustomSizeUnit[] = ["cm", "px"];

export const CUSTOM_SIZE_UNIT_LABELS: Record<CustomSizeUnit, string> = {
    cm: "cm",
    px: "px",
};

export const POSTER_PAPER_FORMAT_OPTIONS: PosterPaperFormat[] = ["A4", "A3", "CUSTOM"];
export const POSTER_ORIENTATION_OPTIONS: PosterOrientation[] = ["portrait", "landscape"];

export const POSTER_PAPER_FORMAT_LABELS: Record<PosterPaperFormat, string> = {
    A4: "A4",
    A3: "A3",
    CUSTOM: "Custom",
};

export const POSTER_ORIENTATION_LABELS: Record<PosterOrientation, string> = {
    portrait: "Portrait",
    landscape: "Landscape",
};

export const DEFAULT_POSTER_STATE: PosterState = {
    id: "custom",
    description: "Custom poster.",
    paperFormat: "A4",
    posterOrientation: "portrait",
    customPosterWidthMm: 210,
    customPosterHeightMm: 297,
    customPosterDpi: 300,
    customSizeUnit: "cm",
    lineCount: 20,
    minFrequency: 1500,
    maxFrequency: 4500,
    axisColor: "#9ca3af",
    dataLinesWidth: 3,
    axisFont: "Arial",
    strokeColor: "#BAB2A9",
    strokeAccentColor: "#FFBD33",
    backgroundColor: "#1d1d2b",
    fftSize: 2048,
    smoothingTimeConstant: 0.5,
    minDecibels: -100,
    maxDecibels: -30,
    durationBetweenLines: 0.5,
};

export const POSTER_PRESETS: PosterPreset[] = [
    {
        id: "midnight-gold",
        description: "High contrast, warm strokes, deep canvas.",
        backgroundColor: "#0f172a",
        strokeColor: "#f8fafc",
        strokeAccentColor: "#f59e0b",
        axisColor: "#cbd5e1",
        dataLinesWidth: 3,
        smoothingTimeConstant: 0.6,
    },
    {
        id: "sunset-wave",
        description: "Orange-to-pink lines for a softer poster.",
        backgroundColor: "#1f2937",
        strokeColor: "#fb7185",
        strokeAccentColor: "#f97316",
        axisColor: "#fed7aa",
        dataLinesWidth: 4,
        smoothingTimeConstant: 0.4,
    },
    {
        id: "glacier",
        description: "Cold blue strokes and smooth spectrum.",
        backgroundColor: "#111827",
        strokeColor: "#60a5fa",
        strokeAccentColor: "#a5f3fc",
        axisColor: "#dbeafe",
        dataLinesWidth: 2,
        smoothingTimeConstant: 0.75,
        durationBetweenLines: 0.6,
    },
    {
        id: "neon-graphite",
        description: "Sharper lines with bright green accent.",
        backgroundColor: "#18181b",
        strokeColor: "#22c55e",
        strokeAccentColor: "#84cc16",
        axisColor: "#e4e4e7",
        dataLinesWidth: 3,
        smoothingTimeConstant: 0.2,
        durationBetweenLines: 0.35,
    },
];
