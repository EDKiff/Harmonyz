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
        ctx.strokeStyle = `grey`;
        ctx.fillStyle = `grey`;

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
                const normalizedAmplitude = value / 255;
                const yValue = timestamp + normalizedAmplitude;
                minY = Math.min(minY, yValue);
                maxY = Math.max(maxY, yValue);
            });
        });

        // Add some padding to the y-axis range
        const yPadding = 2;
        minY -= yPadding;
        maxY += yPadding;

        // Function to map y value to canvas coordinates
        const mapY = (yValue: number) => {
            const normalizedY = (yValue - minY) / (maxY - minY);
            return normalizedY * height;
        };

        // Function to map x index to canvas coordinates
        const mapX = (index: number, totalLength: number) => {
            return padding + (index / (totalLength - 1 || 1)) * (width - 2 * padding);
        };

        //Ticks context
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

        // Draw lines for each yAxisData
        yAxisData.forEach(({ timestamp, frequencyData }, dataIndex) => {
            ctx.lineWidth = 2;
            ctx.beginPath();

            frequencyData.forEach((amplitude, frequency) => {
                const normalizedAmplitude = amplitude / 255;
                const x = mapX(frequency, frequencyData.length);
                const y = mapY(timestamp);

                // Draw Y axis tick and label for each data point
                if (frequency === 0) {
                    // Draw tick mark
                    ctx.beginPath();
                    ctx.moveTo(padding - 5, y);
                    ctx.lineTo(padding, y);
                    ctx.stroke();

                    // Draw label
                    ctx.fillText(timestamp.toFixed(1), padding - 15, y);
                }
            });
            drawLine(ctx, frequencyData, mapY(timestamp), padding, barWidth);

            ctx.stroke();
        });
    }, [xAxisData, yAxisData]);

    return (
        <div className="poster-container">
            <canvas
                ref={canvasRef}
                width={1080}
                height={1920}
                style={{ backgroundColor: "rgb(29, 29, 43)" }}
            />
        </div>
    );
};

const drawLine = (
    ctx: CanvasRenderingContext2D,
    data: number[],
    baselineY: number,
    baselineX: number,
    spaceBetweenEachPoints: number,
) => {
    const lineHeight = 50;

    const xAxisbezierControlPointOffset = 0.5;
    const yAxisbezierControlPointOffset = 0.01;

    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = 2;

    const grad = ctx.createLinearGradient(baselineX, baselineY, baselineX, baselineY - lineHeight);
    grad.addColorStop(0.6, "#BAB2A9");
    grad.addColorStop(1, "#FFBD33");
    ctx.strokeStyle = grad;

    let previousPointX = baselineX;
    let previousPointY = baselineY;
    let previousAmplitude = 0;

    data.forEach((amplitude, index) => {
        ctx.beginPath();
        ctx.moveTo(previousPointX, previousPointY);
        const amplitudeDifference =
            (previousAmplitude - normalizeAmplitude(amplitude)) * lineHeight;

        const firstPointX =
            baselineX +
            index * spaceBetweenEachPoints +
            spaceBetweenEachPoints * xAxisbezierControlPointOffset;
        let firstPointY = 0;
        firstPointY = previousPointY + amplitudeDifference * yAxisbezierControlPointOffset;
        //ctx.lineTo(firstPointX, firstPointY);

        const secondPointX =
            baselineX +
            (index + 1) * spaceBetweenEachPoints -
            spaceBetweenEachPoints * xAxisbezierControlPointOffset;
        let secondPointY = 0;
        secondPointY =
            previousPointY +
            amplitudeDifference -
            amplitudeDifference * yAxisbezierControlPointOffset;
        //ctx.lineTo(secondPointX, secondPointY);

        let endY = 0;
        endY = previousPointY + amplitudeDifference;
        const endX = baselineX + (index + 1) * spaceBetweenEachPoints;
        //ctx.lineTo(endX, endY);

        ctx.bezierCurveTo(firstPointX, firstPointY, secondPointX, secondPointY, endX, endY);
        previousPointX = endX;
        previousPointY = endY;
        previousAmplitude = normalizeAmplitude(amplitude);
        console.log("debug", {
            firstPointX,
            firstPointY,
            secondPointX,
            secondPointY,
            endX,
            endY,
            amplitudeDifference,
        });
        ctx.stroke();
    });
};

const normalizeAmplitude = (amplitude: number): number => {
    return amplitude / 255;
};

export default PosterComponent;
