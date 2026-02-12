import React, { useEffect, useRef } from "react";
import type { Notes } from "~/notes/Notes";

type YAxisData = {
    timestamp: number;
    frequencyData: number[];
};

type XAxisData = {
    frequency: number;
    note: Notes;
};

interface PosterComponentProps {
    xAxisData: Array<XAxisData>;
    yAxisData: Array<YAxisData> | null;
}

const PosterComponent: React.FC<PosterComponentProps> = ({ xAxisData, yAxisData }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || xAxisData.length === 0) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Set up drawing parameters
        const width = canvas.width;
        const height = canvas.height;
        const padding = 40;
        const barWidth = (width - 2 * padding) / xAxisData.length;

        // Draw bars for each frequency
        xAxisData.forEach((data, index) => {
            const x = padding + index * barWidth;
            if (!data.note.isSharp()) {
                // Draw note label
                ctx.fillStyle = "#000";
                ctx.font = "8px Arial";
                ctx.textAlign = "center";
                ctx.fillText(data.note.solmization, x + barWidth / 2, height - padding + 20);
            }
        });

        // Draw axes
        ctx.strokeStyle = "#000";
        ctx.beginPath();
        ctx.moveTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.stroke();
    }, [xAxisData]);

    return (
        <div className="poster-container">
            <canvas ref={canvasRef} width={1080} height={1920} />
        </div>
    );
};

export default PosterComponent;
