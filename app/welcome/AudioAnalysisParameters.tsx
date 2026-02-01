interface AudioAnalysisParametersProps {
    fftSize: number;
    smoothingTimeConstant: number;
    minDecibels: number;
    maxDecibels: number;
    onParametersChange: (params: {
        fftSize: number;
        smoothingTimeConstant: number;
        minDecibels: number;
        maxDecibels: number;
    }) => void;
}

export function AudioAnalysisParameters({
    fftSize,
    smoothingTimeConstant,
    minDecibels,
    maxDecibels,
    onParametersChange,
}: AudioAnalysisParametersProps) {
    const handleChange = (field: string, value: number) => {
        onParametersChange({
            fftSize,
            smoothingTimeConstant,
            minDecibels,
            maxDecibels,
            [field]: value,
        });
    };

    return (
        <div className="w-full p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">
                Audio Analysis Parameters
            </h3>
            <div className="space-y-4">
                <div className="flex flex-col gap-2">
                    <label className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">FFT Size:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {fftSize}
                        </span>
                    </label>
                    <input
                        type="range"
                        min="512"
                        max="8192"
                        step="512"
                        value={fftSize}
                        onChange={(e) => handleChange("fftSize", Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Smoothing:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {smoothingTimeConstant.toFixed(2)}
                        </span>
                    </label>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={smoothingTimeConstant}
                        onChange={(e) =>
                            handleChange("smoothingTimeConstant", Number(e.target.value))
                        }
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            Min Decibels:
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {minDecibels} dB
                        </span>
                    </label>
                    <input
                        type="range"
                        min="-120"
                        max="-50"
                        step="5"
                        value={minDecibels}
                        onChange={(e) => handleChange("minDecibels", Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            Max Decibels:
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {maxDecibels} dB
                        </span>
                    </label>
                    <input
                        type="range"
                        min="-50"
                        max="0"
                        step="5"
                        value={maxDecibels}
                        onChange={(e) => handleChange("maxDecibels", Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                </div>
            </div>
        </div>
    );
}
