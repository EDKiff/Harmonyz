import { useState } from "react";
import type { PosterPreset, PosterState } from "./welcome.types";

export type PersonalizationTab = "advanced" | "presets";

const PANEL_BASE_CLASS =
    "overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100 shadow-2xl backdrop-blur-sm";

interface PersonalizationPanelProps {
    logoSrc: string;
    selectedFile: File | null;
    posterState: PosterState;
    presets: PosterPreset[];
    onChange: (patch: Partial<PosterState>) => void;
    className?: string;
}

export function PersonalizationPanel({
    logoSrc,
    selectedFile,
    posterState,
    presets,
    onChange,
    className,
}: PersonalizationPanelProps) {
    const [activeTab, setActiveTab] = useState<PersonalizationTab>("advanced");
    const toPresetTitle = (presetId: string) =>
        presetId
            .split("-")
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(" ");

    return (
        <aside className={`${PANEL_BASE_CLASS} ${className ?? ""}`.trim()}>
            <div className="flex h-full min-h-0 flex-col p-5">
                <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <img src={logoSrc} alt="Harmonyz" className="h-9 w-auto" />
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">
                                Personalization
                            </h2>
                            <p className="text-xs text-slate-500">
                                Floating controls over full-screen poster.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    <p className="font-medium text-slate-700">
                        {selectedFile ? selectedFile.name : "No song loaded"}
                    </p>
                    {selectedFile && <p>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>}
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                    <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
                        <button
                            type="button"
                            onClick={() => setActiveTab("advanced")}
                            className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                                activeTab === "advanced"
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-600 hover:text-slate-800"
                            }`}
                        >
                            Advanced
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("presets")}
                            className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                                activeTab === "presets"
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-600 hover:text-slate-800"
                            }`}
                        >
                            Presets
                        </button>
                    </div>

                    {activeTab === "advanced" && (
                        <div className="mt-5 space-y-5">
                            <div className="rounded-lg border border-slate-200 p-3">
                                <h3 className="mb-3 text-sm font-semibold text-slate-900">
                                    Poster Style
                                </h3>
                                <div className="space-y-3 text-sm">
                                    <div className="grid grid-cols-2 gap-2">
                                        <label className="space-y-1">
                                            <span className="block text-slate-600">
                                                Stroke color
                                            </span>
                                            <input
                                                type="color"
                                                value={posterState.strokeColor}
                                                onChange={(e) =>
                                                    onChange({ strokeColor: e.target.value })
                                                }
                                                className="h-9 w-full cursor-pointer rounded border border-slate-300 bg-white p-1"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="block text-slate-600">Accent</span>
                                            <input
                                                type="color"
                                                value={posterState.strokeAccentColor}
                                                onChange={(e) =>
                                                    onChange({ strokeAccentColor: e.target.value })
                                                }
                                                className="h-9 w-full cursor-pointer rounded border border-slate-300 bg-white p-1"
                                            />
                                        </label>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <label className="space-y-1">
                                            <span className="block text-slate-600">Axis color</span>
                                            <input
                                                type="color"
                                                value={posterState.axisColor}
                                                onChange={(e) =>
                                                    onChange({ axisColor: e.target.value })
                                                }
                                                className="h-9 w-full cursor-pointer rounded border border-slate-300 bg-white p-1"
                                            />
                                        </label>
                                        <label className="space-y-1">
                                            <span className="block text-slate-600">Background</span>
                                            <input
                                                type="color"
                                                value={posterState.backgroundColor}
                                                onChange={(e) =>
                                                    onChange({ backgroundColor: e.target.value })
                                                }
                                                className="h-9 w-full cursor-pointer rounded border border-slate-300 bg-white p-1"
                                            />
                                        </label>
                                    </div>

                                    <label className="block space-y-1">
                                        <span className="text-slate-600">Line width</span>
                                        <input
                                            type="range"
                                            min="1"
                                            max="8"
                                            step="1"
                                            value={posterState.dataLinesWidth}
                                            onChange={(e) =>
                                                onChange({ dataLinesWidth: Number(e.target.value) })
                                            }
                                            className="w-full"
                                        />
                                        <span className="text-xs text-slate-500">
                                            {posterState.dataLinesWidth}px
                                        </span>
                                    </label>

                                    <label className="block space-y-1">
                                        <span className="text-slate-600">Axis font</span>
                                        <select
                                            value={posterState.axisFont}
                                            onChange={(e) =>
                                                onChange({ axisFont: e.target.value })
                                            }
                                            className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900"
                                        >
                                            <option value="Arial">Arial</option>
                                            <option value="Georgia">Georgia</option>
                                            <option value="Courier New">Courier New</option>
                                            <option value="Trebuchet MS">Trebuchet MS</option>
                                            <option value="Verdana">Verdana</option>
                                        </select>
                                    </label>
                                </div>
                            </div>

                            <div className="rounded-lg border border-slate-200 p-3">
                                <h3 className="mb-3 text-sm font-semibold text-slate-900">
                                    Render Range
                                </h3>
                                <div className="space-y-3 text-sm">
                                    <label className="block space-y-1">
                                        <span className="text-slate-600">Line count</span>
                                        <input
                                            type="range"
                                            min="10"
                                            max="200"
                                            step="5"
                                            value={posterState.lineCount}
                                            onChange={(e) =>
                                                onChange({ lineCount: Number(e.target.value) })
                                            }
                                            className="w-full"
                                        />
                                        <span className="text-xs text-slate-500">
                                            {posterState.lineCount} lines
                                        </span>
                                    </label>

                                    <label className="block space-y-1">
                                        <span className="text-slate-600">Min frequency</span>
                                        <input
                                            type="range"
                                            min="20"
                                            max={Math.max(
                                                100,
                                                posterState.maxFrequency - 50,
                                            )}
                                            step="10"
                                            value={posterState.minFrequency}
                                            onChange={(e) =>
                                                onChange({
                                                    minFrequency: Math.min(
                                                        Number(e.target.value),
                                                        posterState.maxFrequency - 50,
                                                    ),
                                                })
                                            }
                                            className="w-full"
                                        />
                                        <span className="text-xs text-slate-500">
                                            {posterState.minFrequency} Hz
                                        </span>
                                    </label>

                                    <label className="block space-y-1">
                                        <span className="text-slate-600">Max frequency</span>
                                        <input
                                            type="range"
                                            min={posterState.minFrequency + 50}
                                            max="20000"
                                            step="10"
                                            value={posterState.maxFrequency}
                                            onChange={(e) =>
                                                onChange({
                                                    maxFrequency: Math.max(
                                                        Number(e.target.value),
                                                        posterState.minFrequency + 50,
                                                    ),
                                                })
                                            }
                                            className="w-full"
                                        />
                                        <span className="text-xs text-slate-500">
                                            {posterState.maxFrequency} Hz
                                        </span>
                                    </label>
                                </div>
                            </div>

                            <div className="rounded-lg border border-slate-200 p-3">
                                <h3 className="mb-3 text-sm font-semibold text-slate-900">
                                    Audio Analysis
                                </h3>
                                <div className="space-y-3 text-sm">
                                    <label className="block space-y-1">
                                        <span className="text-slate-600">FFT size</span>
                                        <select
                                            value={posterState.fftSize}
                                            onChange={(e) =>
                                                onChange({ fftSize: Number(e.target.value) })
                                            }
                                            className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900"
                                        >
                                            <option value={512}>512</option>
                                            <option value={1024}>1024</option>
                                            <option value={2048}>2048</option>
                                            <option value={4096}>4096</option>
                                            <option value={8192}>8192</option>
                                        </select>
                                    </label>

                                    <label className="block space-y-1">
                                        <span className="text-slate-600">Smoothing</span>
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.05"
                                            value={posterState.smoothingTimeConstant}
                                            onChange={(e) =>
                                                onChange({
                                                    smoothingTimeConstant: Number(e.target.value),
                                                })
                                            }
                                            className="w-full"
                                        />
                                        <span className="text-xs text-slate-500">
                                            {posterState.smoothingTimeConstant.toFixed(2)}
                                        </span>
                                    </label>

                                    <label className="block space-y-1">
                                        <span className="text-slate-600">Min decibels</span>
                                        <input
                                            type="range"
                                            min="-120"
                                            max={posterState.maxDecibels - 5}
                                            step="5"
                                            value={posterState.minDecibels}
                                            onChange={(e) =>
                                                onChange({
                                                    minDecibels: Math.min(
                                                        Number(e.target.value),
                                                        posterState.maxDecibels - 5,
                                                    ),
                                                })
                                            }
                                            className="w-full"
                                        />
                                        <span className="text-xs text-slate-500">
                                            {posterState.minDecibels} dB
                                        </span>
                                    </label>

                                    <label className="block space-y-1">
                                        <span className="text-slate-600">Max decibels</span>
                                        <input
                                            type="range"
                                            min={posterState.minDecibels + 5}
                                            max="0"
                                            step="5"
                                            value={posterState.maxDecibels}
                                            onChange={(e) =>
                                                onChange({
                                                    maxDecibels: Math.max(
                                                        Number(e.target.value),
                                                        posterState.minDecibels + 5,
                                                    ),
                                                })
                                            }
                                            className="w-full"
                                        />
                                        <span className="text-xs text-slate-500">
                                            {posterState.maxDecibels} dB
                                        </span>
                                    </label>

                                    <label className="block space-y-1">
                                        <span className="text-slate-600">
                                            Seconds between lines
                                        </span>
                                        <input
                                            type="range"
                                            min="0.1"
                                            max="2"
                                            step="0.1"
                                            value={posterState.durationBetweenLines}
                                            onChange={(e) =>
                                                onChange({
                                                    durationBetweenLines: Number(e.target.value),
                                                })
                                            }
                                            className="w-full"
                                        />
                                        <span className="text-xs text-slate-500">
                                            {posterState.durationBetweenLines.toFixed(1)}s
                                        </span>
                                    </label>
                                </div>
                            </div>

                            <p className="text-xs text-slate-500">
                                Line count and audio analysis are auto-rendered.
                            </p>
                        </div>
                    )}

                    {activeTab === "presets" && (
                        <div className="mt-5 space-y-3">
                            {presets.map((preset) => {
                                const { id, description, ...presetPatch } = preset;
                                const previewBackgroundColor =
                                    preset.backgroundColor ?? posterState.backgroundColor;
                                const previewStrokeColor = preset.strokeColor ?? posterState.strokeColor;
                                const previewStrokeAccentColor =
                                    preset.strokeAccentColor ?? posterState.strokeAccentColor;
                                const previewAxisColor = preset.axisColor ?? posterState.axisColor;

                                return (
                                    <button
                                        key={preset.id}
                                        type="button"
                                        onClick={() => onChange(presetPatch)}
                                        className="w-full rounded-lg border border-slate-200 p-3 text-left transition hover:border-slate-300 hover:bg-slate-50"
                                    >
                                        <div
                                            className="rounded-md border border-white/10 p-2"
                                            style={{ backgroundColor: previewBackgroundColor }}
                                        >
                                            <div className="space-y-2">
                                                <div
                                                    className="h-1 rounded-full"
                                                    style={{
                                                        background: `linear-gradient(to right, ${previewStrokeColor}, ${previewStrokeAccentColor})`,
                                                    }}
                                                />
                                                <div
                                                    className="h-1 rounded-full"
                                                    style={{
                                                        background: `linear-gradient(to right, ${previewStrokeAccentColor}, ${previewStrokeColor})`,
                                                    }}
                                                />
                                                <div
                                                    className="h-[2px] w-full rounded-full"
                                                    style={{
                                                        backgroundColor: previewAxisColor,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <p className="mt-3 text-sm font-semibold text-slate-900">
                                            {toPresetTitle(id)}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-600">
                                            {description}
                                        </p>
                                    </button>
                                );
                            })}

                            <p className="text-xs text-slate-500">
                                Presets update style instantly and auto-render if audio analysis
                                parameters change.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}
