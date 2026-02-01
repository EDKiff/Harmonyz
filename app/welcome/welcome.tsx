import { useRef, useState } from "react";
import logo from "./logo.png";
import { PosterGenerator } from "../renderer/PosterGenerator";

export function Welcome() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedPoster, setGeneratedPoster] = useState<string | null>(null);
    const posterGenerator = useRef(new PosterGenerator());

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
            const posterUrl = await posterGenerator.current.generate(selectedFile);
            setGeneratedPoster(posterUrl);
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
                <div className="max-w-75 w-full space-y-6 px-4">
                    <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".mp3"
                    />
                    <button
                        onClick={handleButtonClick}
                        className="w-full px-6 py-3 bg-linear-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                    >
                        Select your song file
                    </button>

                    {selectedFile && (
                        <>
                            <div className="w-full p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                                <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">
                                    File Details
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">
                                            Name:
                                        </span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {selectedFile.name}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">
                                            Size:
                                        </span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">
                                            Type:
                                        </span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {selectedFile.type}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">
                                            Last Modified:
                                        </span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {new Date(
                                                selectedFile.lastModified,
                                            ).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="w-full">
                                <button
                                    onClick={handleGeneratePoster}
                                    disabled={isGenerating}
                                    className="w-full px-6 py-3 bg-linear-to-r from-green-500 to-teal-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl hover:from-green-600 hover:to-teal-700 transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                >
                                    {isGenerating ? "Generating..." : "Generate Poster"}
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {generatedPoster && !isGenerating && (
                    <div className="w-11/12 max-w-250 p-4 mx-4 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">
                            Generated Poster
                        </h3>
                        <img
                            src={generatedPoster}
                            alt="Generated Poster"
                            className="w-full rounded-lg"
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
