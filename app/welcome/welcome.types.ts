export type PosterPaperFormat = "A4" | "A3" | "CUSTOM";
export type PosterOrientation = "portrait" | "landscape";
export type CustomSizeUnit = "cm" | "px";

export type PosterState = {
    id: string;
    description: string;
    paperFormat: PosterPaperFormat;
    posterOrientation: PosterOrientation;
    customPosterWidthMm: number;
    customPosterHeightMm: number;
    customPosterDpi: number;
    customSizeUnit: CustomSizeUnit;
    lineCount: number;
    minFrequency: number;
    maxFrequency: number;
    axisColor: string;
    dataLinesWidth: number;
    axisFont: string;
    strokeColor: string;
    strokeAccentColor: string;
    backgroundColor: string;
    fftSize: number;
    smoothingTimeConstant: number;
    minDecibels: number;
    maxDecibels: number;
    durationBetweenLines: number;
};

export type PosterPreset = Partial<PosterState> & {
  id: string;
  description: string;
};
