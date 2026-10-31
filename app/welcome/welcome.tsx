import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, Pause, Play, Ruler, Settings, Upload, X } from "lucide-react";
import logo from "./logo.png";
import { PosterGenerator } from "../renderer/PosterGenerator";
import type { AnalyzedAudioData } from "../renderer/AudioAnalyzer";
import { animationFrame, globalAnalysisScale } from "../renderer/animation";
import { drawPoster } from "../renderer/PosterRenderer";
import { GifPreparation } from "../animation/GifPreparation";
import { validateGifDimensions } from "../animation/gifTimeline";
import { NOTES } from "~/notes/Notes";
import PosterComponent from "~/renderer/PosterComponent";
import { FormatPanel } from "./FormatPanel";
import { PersonalizationPanel } from "./PersonalizationPanel";
import {
    MILLIMETER_TO_PIXEL_RATIO,
    MILLIMETERS_PER_INCH,
    PANEL_CHANGE_THROTTLE_MS,
    PAPER_FORMAT_SIZES_MM,
    POSTER_DPI_LIMITS,
    POSTER_PRESETS,
    POSTER_SIZE_LIMITS_MM,
} from "./welcome.constants";
import { createPosterEditorState, patchPosterEditor } from "./posterEditorState";
import type { PosterState, PosterStyle } from "./welcome.types";
import { useSongPlayback } from "./useSongPlayback";
import { downloadBlob } from "./downloadBlob";

type IconButtonProps = {
    active?: boolean;
    disabled?: boolean;
    title: string;
    onClick: () => void;
    children: ReactNode;
};
const TOOLBAR_ICON_CLASS = "h-5 w-5";
const IconButton = ({
    active = false,
    disabled = false,
    title,
    onClick,
    children,
}: IconButtonProps) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-50 ${active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"}`}
        title={title}
        aria-label={title}
    >
        {children}
    </button>
);
const clampNumber = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value));
const millimetersToPixels = (mm: number, dpi: number) =>
    Math.round((mm / MILLIMETERS_PER_INCH) * dpi);
const formatTime = (seconds: number) =>
    `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
type RenderedPoster = { analysis: AnalyzedAudioData; parameters: PosterState; style: PosterStyle };

export function Welcome() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const posterGenerator = useRef(new PosterGenerator());
    const generationCounterRef = useRef(0);
    const preparationRef = useRef<GifPreparation | null>(null);
    const activeExportRef = useRef<GifPreparation | null>(null);
    const mountedRef = useRef(true);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [rendered, setRendered] = useState<RenderedPoster | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [retry, setRetry] = useState(0);
    const [exportProgress, setExportProgress] = useState<number | null>(null);
    const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
    const [isAnimatedView, setIsAnimatedView] = useState(false);
    const [isPersonalizationPanelVisible, setIsPersonalizationPanelVisible] = useState(true);
    const [isFormatPanelVisible, setIsFormatPanelVisible] = useState(true);
    const [editor, setEditor] = useState(createPosterEditorState);
    const posterState = useMemo(
        () => ({ ...editor.format, ...editor.styles[editor.selectedStyle] }),
        [editor],
    );
    const [throttledPosterState, setThrottledPosterState] = useState<PosterState>(posterState);
    const [renderStyle, setRenderStyle] = useState(editor.selectedStyle);
    const player = useSongPlayback(selectedFile);
    const animated = isAnimatedView;

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            setThrottledPosterState(posterState);
            setRenderStyle(editor.selectedStyle);
        }, PANEL_CHANGE_THROTTLE_MS);
        return () => window.clearTimeout(timeout);
    }, [posterState, editor.selectedStyle]);
    const updatePosterState = useCallback((patch: Partial<PosterState>) => {
        setEditor((current) => patchPosterEditor(current, patch));
    }, []);
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
    let dimensionsError: string | null = null;
    try {
        validateGifDimensions(posterDimensions.widthPx, posterDimensions.heightPx);
    } catch (cause) {
        dimensionsError =
            cause instanceof Error ? cause.message : "Choose a smaller poster format.";
    }

    useEffect(() => {
        if (!selectedFile) return;
        const id = ++generationCounterRef.current;
        setIsGenerating(true);
        setError(null);
        void posterGenerator.current.analyze(selectedFile, throttledPosterState).then(
            (analysis) => {
                if (id !== generationCounterRef.current) return;
                setRendered({ analysis, parameters: throttledPosterState, style: renderStyle });
                setIsGenerating(false);
            },
            () => {
                if (id !== generationCounterRef.current) return;
                setRendered(null);
                setIsGenerating(false);
                setError("Unable to analyze this song. Try again or load another MP3.");
            },
        );
        return () => {
            generationCounterRef.current++;
        };
    }, [selectedFile, throttledPosterState, renderStyle, retry]);

    useEffect(() => {
        if (!rendered || dimensionsError) return;
        let preparation: GifPreparation;
        try {
            preparation = new GifPreparation({
                analysis: rendered.analysis,
                parameters: rendered.parameters,
                drawingStyle: rendered.style,
                width: posterDimensions.widthPx,
                height: posterDimensions.heightPx,
            });
            preparationRef.current = preparation;
        } catch {
            return;
        }
        return () => {
            preparationRef.current = null;
            preparation.dispose();
        };
    }, [rendered, posterDimensions, dimensionsError]);
    useEffect(() => {
        if (player.isPlaying) preparationRef.current?.prepare(player.position);
    }, [player.isPlaying, player.position, rendered]);
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            activeExportRef.current?.cancel();
        };
    }, []);
    const { amplitudePeak, maxReliefRatio } = useMemo(
        () =>
            rendered
                ? globalAnalysisScale(rendered.analysis, rendered.parameters)
                : { amplitudePeak: 0, maxReliefRatio: 0 },
        [rendered],
    );
    const staticRows = useMemo(
        () =>
            rendered?.analysis.frequencyData
                .slice(0, rendered.parameters.lineCount)
                .map((frequencyData, timestamp) => ({ frequencyData, timestamp })) ?? [],
        [rendered],
    );
    const rows = useMemo(
        () =>
            rendered && animated
                ? animationFrame(rendered.analysis, rendered.parameters, player.position)
                : staticRows,
        [rendered, animated, player.position, staticRows],
    );
    const ready =
        !!rendered &&
        rendered.parameters === throttledPosterState &&
        rendered.style === renderStyle &&
        !isGenerating &&
        posterState === throttledPosterState &&
        editor.selectedStyle === renderStyle &&
        !dimensionsError;
    const filename = () =>
        `${selectedFile?.name.replace(/\.[^/.]+$/, "") || "harmonyz-poster"}-${posterDimensions.widthMm}x${posterDimensions.heightMm}mm`;
    const savePng = async () => {
        setIsDownloadMenuOpen(false);
        if (!rendered || !ready) return;
        try {
            const canvas = document.createElement("canvas");
            canvas.width = posterDimensions.widthPx;
            canvas.height = posterDimensions.heightPx;
            const ctx = canvas.getContext("2d");
            if (!ctx) throw Error("Canvas unavailable");
            drawPoster(ctx, {
                drawingStyle: rendered.style,
                xAxisData: rendered.analysis.xAxis,
                yAxisData: staticRows,
                displayableNotes: NOTES,
                parameters: rendered.parameters,
                width: canvas.width,
                height: canvas.height,
                yAxisDataStepInSeconds: rendered.parameters.durationBetweenLines,
                amplitudePeak,
                maxReliefRatio,
            });
            const name = filename();
            const blob = await new Promise<Blob | null>((resolve) =>
                canvas.toBlob(resolve, "image/png"),
            );
            if (!blob) throw Error("PNG unavailable");
            downloadBlob(blob, `${name}.png`);
        } catch {
            setError("Unable to save the PNG. Choose a smaller poster format and try again.");
        }
    };
    const saveGif = async () => {
        setIsDownloadMenuOpen(false);
        if (!ready || activeExportRef.current) return;
        const preparation = preparationRef.current;
        if (!preparation) {
            setError(
                "GIF export is unavailable. Use a recent browser with workers, OffscreenCanvas and local storage enabled.",
            );
            return;
        }
        const name = filename();
        activeExportRef.current = preparation;
        setError(null);
        setExportProgress(0);
        try {
            const blob = await preparation.export((progress) => {
                if (mountedRef.current) setExportProgress(progress);
            });
            if (mountedRef.current) downloadBlob(blob, `${name}.gif`);
        } catch (cause) {
            if (
                mountedRef.current &&
                !(cause instanceof DOMException && cause.name === "AbortError")
            ) {
                setError(
                    cause instanceof Error
                        ? cause.message
                        : "GIF export failed. Choose a smaller poster format and try again.",
                );
            }
        } finally {
            activeExportRef.current = null;
            if (mountedRef.current) setExportProgress(null);
        }
    };
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        generationCounterRef.current++;
        setRendered(null);
        setIsAnimatedView(false);
        setError(null);
        setSelectedFile(file);
        event.target.value = "";
    };

    return (
        <main
            className="flex h-dvh w-full flex-col overflow-y-auto bg-white text-slate-900"
            style={{ colorScheme: "light" }}
        >
            <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                className="hidden"
                accept=".mp3,audio/mpeg"
            />
            <audio
                ref={player.audioRef}
                aria-label="Song playback"
                loop
                preload="metadata"
                onPlay={() => {
                    setIsAnimatedView(true);
                    player.onPlay();
                }}
                onPause={player.onPause}
                onLoadedMetadata={player.onLoadedMetadata}
                onSeeked={player.onSeeked}
                onError={player.onError}
            />
            <header className="sticky top-0 z-40 shrink-0 border-b border-slate-200 bg-white/95 p-3 backdrop-blur-sm">
                <div className="mx-auto flex max-w-screen-2xl flex-wrap items-center justify-end gap-3">
                    <span className="mr-auto hidden text-lg font-semibold sm:block">Harmonyz</span>
                    <button
                        type="button"
                        onClick={() => {
                            void player.toggle();
                        }}
                        disabled={!player.isPlaying && (!rendered || !!dimensionsError)}
                        className="inline-flex h-10 items-center gap-2 rounded-full bg-slate-900 px-4 text-sm font-medium text-white disabled:opacity-50"
                    >
                        {player.isPlaying ? (
                            <Pause className="h-4 w-4" />
                        ) : (
                            <Play className="h-4 w-4" />
                        )}
                        {player.isPlaying ? "Pause" : "Play"}
                    </button>
                    <IconButton
                        active={isPersonalizationPanelVisible}
                        onClick={() => setIsPersonalizationPanelVisible((v) => !v)}
                        title={
                            isPersonalizationPanelVisible
                                ? "Close personalization panel"
                                : "Open personalization panel"
                        }
                    >
                        {isPersonalizationPanelVisible ? (
                            <X className={TOOLBAR_ICON_CLASS} />
                        ) : (
                            <Settings className={TOOLBAR_ICON_CLASS} />
                        )}
                    </IconButton>
                    <IconButton
                        active={isFormatPanelVisible}
                        onClick={() => setIsFormatPanelVisible((v) => !v)}
                        title={isFormatPanelVisible ? "Close format panel" : "Open format panel"}
                    >
                        {isFormatPanelVisible ? (
                            <X className={TOOLBAR_ICON_CLASS} />
                        ) : (
                            <Ruler className={TOOLBAR_ICON_CLASS} />
                        )}
                    </IconButton>
                    <IconButton onClick={() => fileInputRef.current?.click()} title="Load">
                        <Upload className={TOOLBAR_ICON_CLASS} />
                    </IconButton>
                    <div
                        className="relative"
                        onBlur={(event) => {
                            if (!event.currentTarget.contains(event.relatedTarget))
                                setIsDownloadMenuOpen(false);
                        }}
                        onKeyDown={(event) => {
                            if (event.key === "Escape") {
                                setIsDownloadMenuOpen(false);
                                event.currentTarget.querySelector("button")?.focus();
                            }
                        }}
                    >
                        <button
                            type="button"
                            aria-label="Save"
                            aria-expanded={isDownloadMenuOpen}
                            aria-controls="download-options"
                            disabled={!ready}
                            onClick={() => setIsDownloadMenuOpen((v) => !v)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 disabled:opacity-50"
                        >
                            <Download className={TOOLBAR_ICON_CLASS} />
                        </button>
                        {isDownloadMenuOpen && (
                            <div
                                id="download-options"
                                className="absolute right-0 top-12 w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-xl"
                            >
                                <button
                                    type="button"
                                    onClick={() => void savePng()}
                                    className="w-full rounded-lg px-3 py-3 text-left text-sm hover:bg-slate-100"
                                >
                                    Download PNG
                                </button>
                                <button
                                    type="button"
                                    disabled={exportProgress !== null}
                                    onClick={() => void saveGif()}
                                    className="w-full rounded-lg px-3 py-3 text-left text-sm hover:bg-slate-100 disabled:opacity-50"
                                >
                                    Download GIF
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                {selectedFile && (
                    <div className="mx-auto mt-3 flex max-w-screen-2xl flex-wrap items-center gap-x-3 gap-y-2 text-xs">
                        <label className="flex min-w-40 flex-1 items-center gap-2">
                            <span className="sr-only">Song position</span>
                            <span className="tabular-nums">{formatTime(player.position)}</span>
                            <input
                                type="range"
                                min="0"
                                max={player.duration || 0}
                                step="0.01"
                                value={Math.min(player.position, player.duration)}
                                disabled={!player.duration}
                                onChange={(e) => {
                                    player.seek(Number(e.target.value));
                                    setIsAnimatedView(true);
                                }}
                                aria-label="Song position"
                                className="h-8 min-w-0 flex-1"
                            />
                            <span className="tabular-nums">{formatTime(player.duration)}</span>
                        </label>
                        <label className="flex items-center gap-2">
                            Volume
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={player.volume}
                                onChange={(e) => player.setVolume(Number(e.target.value))}
                                className="h-8 w-20"
                            />
                        </label>
                        <button
                            type="button"
                            disabled={!animated}
                            onClick={() => {
                                player.audioRef.current?.pause();
                                setIsAnimatedView(false);
                            }}
                            className="rounded-lg border border-slate-300 px-3 py-2 disabled:opacity-50"
                        >
                            Still poster
                        </button>
                    </div>
                )}
                {isGenerating && (
                    <p role="status" className="mt-2 text-center text-xs text-slate-600">
                        Updating poster… You can keep listening.
                    </p>
                )}
                {(error || player.error || dimensionsError) && (
                    <div
                        role="alert"
                        className="mx-auto mt-2 max-w-screen-2xl text-sm text-red-700"
                    >
                        {error || player.error || dimensionsError}
                        {error && (
                            <button
                                type="button"
                                onClick={() => setRetry((n) => n + 1)}
                                className="ml-3 underline"
                            >
                                Try again
                            </button>
                        )}
                    </div>
                )}
                {exportProgress !== null && (
                    <div className="mx-auto mt-2 flex max-w-screen-2xl items-center gap-3 text-xs">
                        <label className="flex flex-1 items-center gap-2">
                            GIF export
                            <progress
                                aria-label="GIF export progress"
                                max="1"
                                value={exportProgress}
                                className="h-2 min-w-0 flex-1"
                            />
                            {Math.round(exportProgress * 100)}%
                        </label>
                        <button
                            type="button"
                            onClick={() => activeExportRef.current?.cancel()}
                            className="rounded-lg border px-3 py-2"
                        >
                            Cancel export
                        </button>
                    </div>
                )}
            </header>
            <div
                className={`flex flex-1 flex-col gap-4 p-4 lg:min-h-0 lg:flex-row ${!isPersonalizationPanelVisible && !isFormatPanelVisible ? "min-h-0" : ""}`}
            >
                <section
                    aria-label="Poster preview"
                    className="flex h-[48dvh] min-h-64 shrink-0 items-center justify-center lg:h-full lg:min-h-0 lg:min-w-0 lg:flex-1"
                >
                    {rendered && !dimensionsError ? (
                        <PosterComponent
                            drawingStyle={rendered.style}
                            canvasId="poster-preview-canvas"
                            yAxisDataStepInSeconds={rendered.parameters.durationBetweenLines}
                            xAxisData={rendered.analysis.xAxis}
                            yAxisData={rows}
                            displayableNotes={NOTES}
                            parameters={rendered.parameters}
                            canvasWidth={posterDimensions.widthPx}
                            canvasHeight={posterDimensions.heightPx}
                            animated={animated}
                            amplitudePeak={amplitudePeak}
                            maxReliefRatio={maxReliefRatio}
                        />
                    ) : (
                        <div className="max-w-sm rounded-xl border border-slate-200 p-6 text-center shadow-lg">
                            <h2 className="text-xl font-semibold">No poster yet</h2>
                            <p className="mt-2 text-sm text-slate-600">
                                Load a song. The poster renders automatically.
                            </p>
                        </div>
                    )}
                </section>
                {(isFormatPanelVisible || isPersonalizationPanelVisible) && (
                    <div className="flex shrink-0 flex-col gap-3 lg:w-[390px] lg:overflow-y-auto">
                        {isFormatPanelVisible && (
                            <FormatPanel
                                className="shrink-0"
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
                                className="shrink-0"
                                logoSrc={logo}
                                selectedFile={selectedFile}
                                posterState={posterState}
                                drawingStyle={editor.selectedStyle}
                                onStyleChange={(selectedStyle) =>
                                    setEditor((current) => ({ ...current, selectedStyle }))
                                }
                                presets={POSTER_PRESETS}
                                onChange={updatePosterState}
                            />
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}
