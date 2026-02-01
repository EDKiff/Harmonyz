import type { JoyDivisionParameters } from "~/renderer/Visualizer";

interface RendererParametersProps {
    parameters: JoyDivisionParameters;
    onParametersChange: (params: JoyDivisionParameters) => void;
}

export function RendererParameters({ parameters, onParametersChange }: RendererParametersProps) {
    const { lineCount, rangeStart, rangeEnd, amplify, smoothing } = parameters;

    const handleChange = (field: string, value: number) => {
        onParametersChange({
            ...parameters,
            [field]: value,
        });
    };

    return (
        <div className="w-full p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">
                Renderer Parameters
            </h3>
            <div className="space-y-4">
                <div className="flex flex-col gap-2">
                    <label className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            Line Count:
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {lineCount}
                        </span>
                    </label>
                    <input
                        type="range"
                        min="10"
                        max="200"
                        step="5"
                        value={lineCount}
                        onChange={(e) => handleChange("lineCount", Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            Range Start:
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {rangeStart.toFixed(2)}
                        </span>
                    </label>
                    <input
                        type="range"
                        min="0"
                        max="0.5"
                        step="0.01"
                        value={rangeStart}
                        onChange={(e) => handleChange("rangeStart", Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Range End:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {rangeEnd.toFixed(2)}
                        </span>
                    </label>
                    <input
                        type="range"
                        min="0.5"
                        max="1"
                        step="0.01"
                        value={rangeEnd}
                        onChange={(e) => handleChange("rangeEnd", Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Amplify:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {amplify.toFixed(1)}
                        </span>
                    </label>
                    <input
                        type="range"
                        min="0.1"
                        max="5"
                        step="0.1"
                        value={amplify}
                        onChange={(e) => handleChange("amplify", Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Smoothing:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {smoothing}
                        </span>
                    </label>
                    <input
                        type="range"
                        min="0"
                        max="10"
                        step="1"
                        value={smoothing}
                        onChange={(e) => handleChange("smoothing", Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                </div>
            </div>
        </div>
    );
}
