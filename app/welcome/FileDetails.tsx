interface FileDetailsProps {
    file: File;
}

export function FileDetails({ file }: FileDetailsProps) {
    return (
        <div className="w-full p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">
                File Details
            </h3>
            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Name:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{file.name}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Size:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Type:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{file.type}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Last Modified:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                        {new Date(file.lastModified).toLocaleDateString()}
                    </span>
                </div>
            </div>
        </div>
    );
}
