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
    yAxisData: Array<YAxisData>;
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

        // Find min and max y values for scaling
        let minY = Infinity;
        let maxY = -Infinity;
        yAxisData.forEach(({ timestamp, frequencyData }) => {
            frequencyData.forEach((value) => {
                const yValue = timestamp + value;
                minY = Math.min(minY, yValue);
                maxY = Math.max(maxY, yValue);
            });
        });

        // Add some padding to the y-axis range
        const yRange = maxY - minY || 1;
        const yPadding = yRange * 0.1;
        minY -= yPadding;
        maxY += yPadding;

        // Function to map y value to canvas coordinates
        const mapY = (yValue: number) => {
            const normalizedY = (yValue - minY) / (maxY - minY);
            return height - padding - normalizedY * (height - 2 * padding);
        };

        // Function to map x index to canvas coordinates
        const mapX = (index: number, totalLength: number) => {
            return padding + (index / (totalLength - 1 || 1)) * (width - 2 * padding);
        };

        // Draw lines for each yAxisData
        yAxisData.forEach(({ timestamp, frequencyData }, dataIndex) => {
            ctx.strokeStyle = `hsl(${(dataIndex * 360) / yAxisData.length}, 70%, 50%)`;
            ctx.lineWidth = 2;
            ctx.beginPath();

            frequencyData.forEach((amplitude, frequency) => {
                const x = mapX(frequency, frequencyData.length);
                const y = mapY(timestamp + amplitude);

                // Draw Y axis tick and label for each data point
                if (frequency === 0) {
                    // Draw tick mark
                    ctx.beginPath();
                    ctx.moveTo(padding - 5, y);
                    ctx.lineTo(padding, y);
                    ctx.stroke();

                    // Draw label
                    ctx.fillText((timestamp + amplitude).toFixed(1), padding - 15, y);

                    ctx.strokeStyle = `hsl(${(dataIndex * 360) / yAxisData.length}, 70%, 50%)`;
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });

            ctx.stroke();
        });

        //Ticks context
        ctx.fillStyle = "#000";
        ctx.strokeStyle = "#000";
        ctx.font = "8px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        // Draw X axis ticks
        xAxisData.forEach((data, index) => {
            const x = padding + index * barWidth;
            if (!data.note.isSharp()) {
                // Draw note label
                ctx.fillText(data.note.solmization, x + barWidth / 2, height - padding + 20);
            }
        });

        // Draw axes
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.stroke();
    }, [xAxisData, yAxisData]);

    return (
        <div className="poster-container">
            <canvas ref={canvasRef} width={1080} height={1920} />
        </div>
    );
};

export default PosterComponent;
