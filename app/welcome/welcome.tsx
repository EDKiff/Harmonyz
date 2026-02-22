import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, Ruler, Settings, Upload, X } from "lucide-react";
import logo from "./logo.png";
import { PosterGenerator } from "../renderer/PosterGenerator";
import { NOTES } from "~/notes/Notes";
import PosterComponent from "~/renderer/PosterComponent";
import { FormatPanel } from "./FormatPanel";
import { PersonalizationPanel } from "./PersonalizationPanel";
import {
    DEFAULT_POSTER_STATE,
    MILLIMETER_TO_PIXEL_RATIO,
    MILLIMETERS_PER_INCH,
    PANEL_CHANGE_THROTTLE_MS,
    PAPER_FORMAT_SIZES_MM,
    POSTER_DPI_LIMITS,
    POSTER_PRESETS,
    POSTER_SIZE_LIMITS_MM,
} from "./welcome.constants";
import type { PosterState } from "./welcome.types";

type IconButtonProps = {
    active?: boolean;
    disabled?: boolean;
    title: string;
    onClick: () => void;
    children: ReactNode;
};

const ICON_BUTTON_BASE_CLASS =
    "inline-flex h-10 w-10 items-center justify-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-50";
const ICON_BUTTON_ACTIVE_CLASS = "border-slate-900 bg-slate-900 text-white";
const ICON_BUTTON_IDLE_CLASS = "border-slate-300 bg-white text-slate-700 hover:bg-slate-100";
const TOOLBAR_ICON_CLASS = "h-5 w-5";

const IconButton = ({
    active = false,
    disabled = false,
    title,
    onClick,
    children,
}: IconButtonProps) => {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`${ICON_BUTTON_BASE_CLASS} ${
                active ? ICON_BUTTON_ACTIVE_CLASS : ICON_BUTTON_IDLE_CLASS
            }`}
            title={title}
            aria-label={title}
        >
            {children}
        </button>
    );
};

const clampNumber = (value: number, minValue: number, maxValue: number) => {
    return Math.min(maxValue, Math.max(minValue, value));
};

const millimetersToPixels = (valueMm: number, dpi: number) => {
    return Math.round((valueMm / MILLIMETERS_PER_INCH) * dpi);
};

export function Welcome() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const posterGenerator = useRef(new PosterGenerator());
    const generationCounterRef = useRef(0);

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedPoster, setGeneratedPoster] = useState(false);

    const [isPersonalizationPanelVisible, setIsPersonalizationPanelVisible] = useState(true);
    const [isFormatPanelVisible, setIsFormatPanelVisible] = useState(true);

    const [posterState, setPosterState] = useState<PosterState>(DEFAULT_POSTER_STATE);
    const [throttledPosterState, setThrottledPosterState] = useState<PosterState>(
        DEFAULT_POSTER_STATE,
    );

    const [xAxis, setXAxis] = useState<number[]>([]);
    const [seriesData, setSeriesData] = useState<Array<Array<number>>>([]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            setThrottledPosterState(posterState);
        }, PANEL_CHANGE_THROTTLE_MS);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [posterState]);

    const updatePosterState = useCallback((patch: Partial<PosterState>) => {
        setPosterState((current) => ({
            ...current,
            ...patch,
        }));
    }, []);

    const yAxisData = useMemo(
        () =>
            seriesData.map((series, index) => ({
                timestamp: index,
                frequencyData: series,
            })),
        [seriesData],
    );
    const posterDimensions = useMemo(() => {
        const normalizedCustomWidthMm = clampNumber(
            throttledPosterState.customPosterWidthMm,
            POSTER_SIZE_LIMITS_MM.min,
            POSTER_SIZE_LIMITS_MM.max,
        );
        const normalizedCustomHeightMm = clampNumber(
            throttledPosterState.customPosterHeightMm,
            POSTER_SIZE_LIMITS_MM.min,
            POSTER_SIZE_LIMITS_MM.max,
        );
        const normalizedCustomDpi = clampNumber(
            throttledPosterState.customPosterDpi,
            POSTER_DPI_LIMITS.min,
            POSTER_DPI_LIMITS.max,
        );

        const selectedFormat =
            throttledPosterState.paperFormat === "CUSTOM"
                ? { width: normalizedCustomWidthMm, height: normalizedCustomHeightMm }
                : PAPER_FORMAT_SIZES_MM[throttledPosterState.paperFormat];

        const widthMm =
            throttledPosterState.posterOrientation === "portrait"
                ? selectedFormat.width
                : selectedFormat.height;
        const heightMm =
            throttledPosterState.posterOrientation === "portrait"
                ? selectedFormat.height
                : selectedFormat.width;
        const isCustomFormat = throttledPosterState.paperFormat === "CUSTOM";

        return {
            widthMm,
            heightMm,
            widthPx: isCustomFormat
                ? millimetersToPixels(widthMm, normalizedCustomDpi)
                : Math.round(widthMm * MILLIMETER_TO_PIXEL_RATIO),
            heightPx: isCustomFormat
                ? millimetersToPixels(heightMm, normalizedCustomDpi)
                : Math.round(heightMm * MILLIMETER_TO_PIXEL_RATIO),
        };
    }, [
        throttledPosterState.customPosterDpi,
        throttledPosterState.customPosterHeightMm,
        throttledPosterState.customPosterWidthMm,
        throttledPosterState.paperFormat,
        throttledPosterState.posterOrientation,
    ]);

    const handleLoadFile = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setSelectedFile(file);
        setGeneratedPoster(false);
        setXAxis([]);
        setSeriesData([]);
    };

    const generatePoster = async (file: File, requestedState: PosterState) => {
        const generationId = ++generationCounterRef.current;
        setIsGenerating(true);

        try {
            const { xAxis, series } = await posterGenerator.current.generate(
                file,
                requestedState.lineCount,
                requestedState,
            );
            if (generationId !== generationCounterRef.current) return;

            setGeneratedPoster(true);
            setXAxis(xAxis);
            setSeriesData(series);
        } catch (error) {
            console.error("Failed to generate poster:", error);
        } finally {
            if (generationId === generationCounterRef.current) {
                setIsGenerating(false);
            }
        }
    };

    useEffect(() => {
        if (!selectedFile) return;
        void generatePoster(selectedFile, throttledPosterState);
    }, [selectedFile, throttledPosterState]);

    const handleSavePoster = () => {
        const canvas = document.getElementById("poster-preview-canvas") as HTMLCanvasElement | null;
        if (!canvas) return;

        const fileNameBase = selectedFile?.name
            ? selectedFile.name.replace(/\.[^/.]+$/, "")
            : "harmonyz-poster";

        const downloadLink = document.createElement("a");
        downloadLink.href = canvas.toDataURL("image/png");
        downloadLink.download = `${fileNameBase}-${posterDimensions.widthMm}x${posterDimensions.heightMm}mm.png`;
        downloadLink.click();
    };

    return (
        <main className="relative h-screen w-screen overflow-hidden bg-white" style={{ colorScheme: "light" }}>
            <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                className="hidden"
                accept=".mp3,audio/mpeg"
            />

            <section className="absolute inset-0 flex items-center justify-center overflow-hidden bg-white p-4">
                {generatedPoster ? (
                    <div className="h-full w-full p-2">
                        <PosterComponent
                            canvasId="poster-preview-canvas"
                            yAxisDataStepInSeconds={throttledPosterState.durationBetweenLines}
                            xAxisData={xAxis}
                            yAxisData={yAxisData}
                            displayableNotes={NOTES}
                            parameters={throttledPosterState}
                            canvasWidth={posterDimensions.widthPx}
                            canvasHeight={posterDimensions.heightPx}
                        />
                    </div>
                ) : (
                    <div className="max-w-sm rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-700 shadow-lg">
                        <h2 className="text-xl font-semibold text-slate-900">No poster yet</h2>
                        <p className="mt-2 text-sm text-slate-600">
                            Load a song. The poster renders automatically.
                        </p>
                    </div>
                )}
            </section>

            <div className="pointer-events-none absolute inset-0 z-40">
                <div className="pointer-events-auto absolute right-4 top-4 flex items-center gap-2">
                    <IconButton
                        active={isPersonalizationPanelVisible}
                        onClick={() => setIsPersonalizationPanelVisible((current) => !current)}
                        title={
                            isPersonalizationPanelVisible
                                ? "Close personalization panel"
                                : "Open personalization panel"
                        }
                    >
                        {isPersonalizationPanelVisible ? (
                            <X className={TOOLBAR_ICON_CLASS} strokeWidth={1.8} />
                        ) : (
                            <Settings className={TOOLBAR_ICON_CLASS} strokeWidth={1.8} />
                        )}
                    </IconButton>
                    <IconButton
                        active={isFormatPanelVisible}
                        onClick={() => setIsFormatPanelVisible((current) => !current)}
                        title={
                            isFormatPanelVisible ? "Close format panel" : "Open format panel"
                        }
                    >
                        {isFormatPanelVisible ? (
                            <X className={TOOLBAR_ICON_CLASS} strokeWidth={1.8} />
                        ) : (
                            <Ruler className={TOOLBAR_ICON_CLASS} strokeWidth={1.8} />
                        )}
                    </IconButton>
                    <IconButton onClick={handleLoadFile} title="Load">
                        <Upload className={TOOLBAR_ICON_CLASS} strokeWidth={1.8} />
                    </IconButton>
                    <IconButton
                        onClick={handleSavePoster}
                        disabled={!generatedPoster || isGenerating}
                        title="Save"
                    >
                        <Download className={TOOLBAR_ICON_CLASS} strokeWidth={1.8} />
                    </IconButton>
                </div>

                <div className="absolute bottom-4 right-4 top-16 flex w-[min(92vw,390px)] flex-col gap-3">
                    {isFormatPanelVisible && (
                        <FormatPanel
                            className="pointer-events-auto shrink-0"
                            paperFormat={posterState.paperFormat}
                            posterOrientation={posterState.posterOrientation}
                            customPosterWidthMm={posterState.customPosterWidthMm}
                            customPosterHeightMm={posterState.customPosterHeightMm}
                            customPosterDpi={posterState.customPosterDpi}
                            customSizeUnit={posterState.customSizeUnit}
                            minPosterSizeMm={POSTER_SIZE_LIMITS_MM.min}
                            maxPosterSizeMm={POSTER_SIZE_LIMITS_MM.max}
                            minPosterDpi={POSTER_DPI_LIMITS.min}
                            maxPosterDpi={POSTER_DPI_LIMITS.max}
                            finalWidthMm={posterDimensions.widthMm}
                            finalHeightMm={posterDimensions.heightMm}
                            finalWidthPx={posterDimensions.widthPx}
                            finalHeightPx={posterDimensions.heightPx}
                            onChange={updatePosterState}
                        />
                    )}

                    {isPersonalizationPanelVisible && (
                        <PersonalizationPanel
                            className="pointer-events-auto min-h-0 flex-1"
                            logoSrc={logo}
                            selectedFile={selectedFile}
                            posterState={posterState}
                            presets={POSTER_PRESETS}
                            onChange={updatePosterState}
                        />
                    )}
                </div>
            </div>

            {isGenerating && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="rounded-lg bg-white p-8 shadow-2xl">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
                            <p className="text-sm font-medium text-slate-700">
                                Rendering your poster...
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
