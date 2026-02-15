import { useRef, useState } from "react";
import logo from "./logo.png";
import { PosterGenerator } from "../renderer/PosterGenerator";
import { FileDetails } from "./FileDetails";
import { AudioAnalysisParameters } from "./AudioAnalysisParameters";
import { RendererParameters } from "./RendererParameters";
import { LineChart, type LineSeries } from "@mui/x-charts";
import { NOTES, type Notes } from "~/notes/Notes";
import PosterComponent from "~/renderer/PosterComponent";

export function Welcome() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedPoster, setGeneratedPoster] = useState<boolean>(false);
    const posterGenerator = useRef(new PosterGenerator());
    const [parameters, setParameters] = useState({
        fftSize: 2048,
        smoothingTimeConstant: 0.5,
        minDecibels: -100,
        maxDecibels: -30,
    });
    const [rendererParameters, setRendererParameters] = useState({
        lineCount: 50,
        rangeStart: 0,
        rangeEnd: 1,
        amplify: 1,
        smoothing: 2,
        durationBetweenLines: 0.5,
        maxFrequency: 4000,
    });
    const [xAxis, setXAxis] = useState<number[]>([]);
    const [seriesData, setSeriesData] = useState<Array<Array<number>>>([]);

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const handleGeneratePoster = async () => {
        if (!selectedFile) return;

        setIsGenerating(true);
        try {
            const { xAxis, series } = await posterGenerator.current.generate(
                selectedFile,
                rendererParameters.lineCount,
                {
                    fftSize: parameters.fftSize,
                    smoothingTimeConstant: parameters.smoothingTimeConstant,
                    minDecibels: parameters.minDecibels,
                    maxDecibels: parameters.maxDecibels,
                    durationBetweenLines: rendererParameters.durationBetweenLines,
                    maxFrequency: rendererParameters.maxFrequency,
                },
            );
            setGeneratedPoster(true);
            // Update xAxis with new data based on poster generation
            setXAxis(xAxis);
            console.log("Series data for chart:", series);
            setSeriesData(series);
        } catch (error) {
            console.error("Failed to generate poster:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <main className="flex items-center justify-center pt-16 pb-4">
            <div
                className="flex-1 flex flex-col items-center gap-10
       min-h-0"
            >
                <header className="flex flex-col items-center gap-9">
                    <div className="max-w-[100vw] p-4">
                        <img src={logo} alt="React Router" className="block w-50 dark:hidden" />
                        <img src={logo} alt="React Router" className="hidden w-50 dark:block" />
                    </div>
                </header>
                <div className="max-w-7xl w-full space-y-6 px-4">
                    <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".mp3"
                    />
                    <div className="flex justify-center">
                        <button
                            onClick={handleButtonClick}
                            className="max-w-md px-6 py-3 bg-linear-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                        >
                            Select your song file
                        </button>
                    </div>

                    {selectedFile && (
                        <>
                            <div className="w-full flex flex-row gap-4 items-start justify-center">
                                <div className="flex-1">
                                    <FileDetails file={selectedFile} />
                                </div>
                                <div className="flex-1">
                                    <AudioAnalysisParameters
                                        fftSize={parameters.fftSize}
                                        smoothingTimeConstant={parameters.smoothingTimeConstant}
                                        minDecibels={parameters.minDecibels}
                                        maxDecibels={parameters.maxDecibels}
                                        onParametersChange={setParameters}
                                    />
                                </div>
                                <div className="flex-1">
                                    <RendererParameters
                                        parameters={rendererParameters}
                                        onParametersChange={setRendererParameters}
                                    />
                                </div>
                            </div>
                            <div className="w-full flex justify-center">
                                <button
                                    onClick={handleGeneratePoster}
                                    disabled={isGenerating}
                                    className="max-w-md px-6 py-3 bg-linear-to-r from-green-500 to-teal-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl hover:from-green-600 hover:to-teal-700 transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                >
                                    {isGenerating ? "Generating..." : "Generate Poster"}
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {generatedPoster && !isGenerating && (
                    <div
                        className="p-4 mx-4 dark:bg-gray-200 rounded-lg shadow-md border border-gray-200 dark:border-gray-700"
                        style={{ backgroundColor: "rgb(29, 29, 43)" }}
                    >
                        <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">
                            Generated Poster
                        </h3>
                        <PosterComponent
                            xAxisData={xAxis}
                            yAxisData={seriesData.map((series, index) => ({
                                timestamp: index,
                                frequencyData: series,
                            }))}
                            displayableNotes={NOTES}
                            minFrequency={1500}
                            maxFrequency={4500}
                        />
                    </div>
                )}

                {isGenerating && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-2xl flex flex-col items-center gap-4">
                            <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-lg font-semibold text-gray-800 dark:text-white">
                                Generating your poster...
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
