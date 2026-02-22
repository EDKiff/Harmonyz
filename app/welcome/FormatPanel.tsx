import {
    CUSTOM_SIZE_UNIT_LABELS,
    CUSTOM_SIZE_UNIT_OPTIONS,
    MILLIMETERS_PER_INCH,
    POSTER_ORIENTATION_OPTIONS,
    POSTER_ORIENTATION_LABELS,
    POSTER_PAPER_FORMAT_OPTIONS,
    POSTER_PAPER_FORMAT_LABELS,
} from "./welcome.constants";
import type {
    CustomSizeUnit,
    PosterState,
    PosterOrientation,
    PosterPaperFormat,
} from "./welcome.types";

const PANEL_BASE_CLASS =
    "rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-4 shadow-2xl backdrop-blur-sm";
const INPUT_BASE_CLASS =
    "w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white";

interface FormatPanelProps {
    paperFormat: PosterPaperFormat;
    posterOrientation: PosterOrientation;
    customPosterWidthMm: number;
    customPosterHeightMm: number;
    customPosterDpi: number;
    customSizeUnit: CustomSizeUnit;
    minPosterSizeMm: number;
    maxPosterSizeMm: number;
    minPosterDpi: number;
    maxPosterDpi: number;
    finalWidthMm: number;
    finalHeightMm: number;
    finalWidthPx: number;
    finalHeightPx: number;
    onChange: (patch: Partial<PosterState>) => void;
    className?: string;
}

export function FormatPanel({
    paperFormat,
    posterOrientation,
    customPosterWidthMm,
    customPosterHeightMm,
    customPosterDpi,
    customSizeUnit,
    minPosterSizeMm,
    maxPosterSizeMm,
    minPosterDpi,
    maxPosterDpi,
    finalWidthMm,
    finalHeightMm,
    finalWidthPx,
    finalHeightPx,
    onChange,
    className,
}: FormatPanelProps) {
    const clampPosterMillimeterValue = (value: number) => {
        return Math.min(maxPosterSizeMm, Math.max(minPosterSizeMm, value));
    };

    const clampPosterDpiValue = (value: number) => {
        return Math.min(maxPosterDpi, Math.max(minPosterDpi, value));
    };

    const millimetersToPixels = (valueMm: number, dpi: number) => {
        return Math.round((valueMm / MILLIMETERS_PER_INCH) * dpi);
    };

    const pixelsToMillimeters = (valuePx: number, dpi: number) => {
        return (valuePx * MILLIMETERS_PER_INCH) / dpi;
    };

    const millimetersToCentimeters = (valueMm: number) => {
        return valueMm / 10;
    };

    const centimetersToMillimeters = (valueCm: number) => {
        return valueCm * 10;
    };

    const toDisplayedCustomDimension = (valueMm: number) => {
        if (customSizeUnit === "px") {
            return millimetersToPixels(valueMm, customPosterDpi);
        }

        return Number(millimetersToCentimeters(valueMm).toFixed(2));
    };

    const toDisplayedDimensionLabel = (sizeUnit: CustomSizeUnit) => {
        return sizeUnit === "px" ? "px" : "cm";
    };

    const displayedDimensionUnit = toDisplayedDimensionLabel(customSizeUnit);

    const displayedMinCustomValue =
        customSizeUnit === "px"
            ? millimetersToPixels(minPosterSizeMm, customPosterDpi)
            : Number(millimetersToCentimeters(minPosterSizeMm).toFixed(2));
    const displayedMaxCustomValue =
        customSizeUnit === "px"
            ? millimetersToPixels(maxPosterSizeMm, customPosterDpi)
            : Number(millimetersToCentimeters(maxPosterSizeMm).toFixed(2));

    const handleCustomPosterDimensionChange = (
        key: "customPosterWidthMm" | "customPosterHeightMm",
        value: string,
    ) => {
        if (value === "") return;
        const parsedValue = Number(value);
        if (!Number.isFinite(parsedValue) || parsedValue <= 0) return;

        const convertedValueMm =
            customSizeUnit === "px"
                ? pixelsToMillimeters(parsedValue, customPosterDpi)
                : centimetersToMillimeters(parsedValue);

        if (key === "customPosterWidthMm") {
            onChange({ customPosterWidthMm: convertedValueMm });
            return;
        }

        onChange({ customPosterHeightMm: convertedValueMm });
    };

    const normalizeCustomPosterDimensions = () => {
        onChange({
            customPosterWidthMm: clampPosterMillimeterValue(customPosterWidthMm),
            customPosterHeightMm: clampPosterMillimeterValue(customPosterHeightMm),
        });
    };

    const handleCustomPosterDpiChange = (value: string) => {
        if (value === "") return;
        const parsedValue = Number(value);
        if (!Number.isFinite(parsedValue) || parsedValue <= 0) return;
        onChange({ customPosterDpi: parsedValue });
    };

    const normalizeCustomPosterDpi = () => {
        onChange({ customPosterDpi: clampPosterDpiValue(customPosterDpi) });
    };

    const formatFinalMillimeterValue = (value: number) => {
        return Number.isInteger(value) ? value : Number(value.toFixed(1));
    };

    return (
        <aside className={`${PANEL_BASE_CLASS} ${className ?? ""}`.trim()}>
            <h2 className="text-sm font-semibold text-slate-900">Poster Format</h2>
            <p className="mt-1 text-xs text-slate-500">
                Choose a standard format or a custom size in cm/px with DPI.
            </p>

            <div className="mt-3 grid grid-cols-3 gap-2">
                {POSTER_PAPER_FORMAT_OPTIONS.map((format) => (
                    <button
                        key={format}
                        type="button"
                        onClick={() => onChange({ paperFormat: format })}
                        className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                            paperFormat === format
                                ? "bg-slate-900 text-white"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                    >
                        {POSTER_PAPER_FORMAT_LABELS[format]}
                    </button>
                ))}
            </div>

            {paperFormat === "CUSTOM" && (
                <>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                        {CUSTOM_SIZE_UNIT_OPTIONS.map((unit) => (
                            <button
                                key={unit}
                                type="button"
                                onClick={() => onChange({ customSizeUnit: unit })}
                                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                                    customSizeUnit === unit
                                        ? "bg-slate-900 text-white"
                                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                }`}
                            >
                                {CUSTOM_SIZE_UNIT_LABELS[unit]}
                            </button>
                        ))}
                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-2">
                        <label className="space-y-1">
                            <span className="block text-xs text-slate-600">
                                Width ({displayedDimensionUnit})
                            </span>
                            <input
                                type="number"
                                min={displayedMinCustomValue}
                                max={displayedMaxCustomValue}
                                step={customSizeUnit === "px" ? "1" : "0.1"}
                                value={toDisplayedCustomDimension(customPosterWidthMm)}
                                onChange={(e) =>
                                    handleCustomPosterDimensionChange(
                                        "customPosterWidthMm",
                                        e.target.value,
                                    )
                                }
                                onBlur={normalizeCustomPosterDimensions}
                                className={INPUT_BASE_CLASS}
                            />
                        </label>
                        <label className="space-y-1">
                            <span className="block text-xs text-slate-600">
                                Height ({displayedDimensionUnit})
                            </span>
                            <input
                                type="number"
                                min={displayedMinCustomValue}
                                max={displayedMaxCustomValue}
                                step={customSizeUnit === "px" ? "1" : "0.1"}
                                value={toDisplayedCustomDimension(customPosterHeightMm)}
                                onChange={(e) =>
                                    handleCustomPosterDimensionChange(
                                        "customPosterHeightMm",
                                        e.target.value,
                                    )
                                }
                                onBlur={normalizeCustomPosterDimensions}
                                className={INPUT_BASE_CLASS}
                            />
                        </label>
                    </div>

                    <label className="mt-2 block space-y-1">
                        <span className="block text-xs text-slate-600">DPI</span>
                        <input
                            type="number"
                            min={minPosterDpi}
                            max={maxPosterDpi}
                            step="1"
                            value={customPosterDpi}
                            onChange={(e) => handleCustomPosterDpiChange(e.target.value)}
                            onBlur={normalizeCustomPosterDpi}
                            className={INPUT_BASE_CLASS}
                        />
                    </label>
                </>
            )}

            <div className="mt-3 grid grid-cols-2 gap-2">
                {POSTER_ORIENTATION_OPTIONS.map((orientation) => (
                    <button
                        key={orientation}
                        type="button"
                        onClick={() => onChange({ posterOrientation: orientation })}
                        className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                            posterOrientation === orientation
                                ? "bg-slate-900 text-white"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                    >
                        {POSTER_ORIENTATION_LABELS[orientation]}
                    </button>
                ))}
            </div>

            <p className="mt-2 text-xs text-slate-500">
                Final size: {finalWidthPx} x {finalHeightPx} px (
                {formatFinalMillimeterValue(finalWidthMm)} x{" "}
                {formatFinalMillimeterValue(finalHeightMm)} mm)
                {paperFormat === "CUSTOM" ? ` at ${customPosterDpi} DPI` : ""}
            </p>
        </aside>
    );
}
