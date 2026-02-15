import type { PosterComponentParameters } from "~/renderer/PosterComponent";

interface RendererParametersProps {
    parameters: PosterComponentParameters;
    onParametersChange: (params: PosterComponentParameters) => void;
}

export function RendererParameters({ parameters, onParametersChange }: RendererParametersProps) {
    const { lineCount, minFrequency, maxFrequency } = parameters;

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
                            Min Frequency:
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {minFrequency} Hz
                        </span>
                    </label>
                    <input
                        type="range"
                        min="20"
                        max="5000"
                        step="10"
                        value={minFrequency}
                        onChange={(e) => handleChange("minFrequency", Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            Max Frequency:
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {maxFrequency} Hz
                        </span>
                    </label>
                    <input
                        type="range"
                        min="1000"
                        max="20000"
                        step="100"
                        value={maxFrequency}
                        onChange={(e) => handleChange("maxFrequency", Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                </div>
            </div>
        </div>
    );
}
