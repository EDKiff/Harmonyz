import React, { useEffect, useRef } from "react";
import type { Notes } from "~/notes/Notes";

type YAxisData = {
    timestamp: number;
    frequencyData: number[];
};

export type PosterComponentParameters = {
    lineCount: number;
    minFrequency: number;
    maxFrequency: number;
    axisColor: string;
    dataLinesWidth: number;
    axisFont: string;
};

interface PosterComponentProps {
    yAxisDataStepInSeconds: number;
    xAxisData: Array<number>;
    yAxisData: Array<YAxisData>;
    displayableNotes: Array<Notes>;
    parameters: PosterComponentParameters;
}

const PosterComponent: React.FC<PosterComponentProps> = ({
    yAxisDataStepInSeconds,
    xAxisData,
    yAxisData,
    displayableNotes,
    parameters,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || xAxisData.length === 0) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = `grey`;

        //Set up axis data
        const filteredXAxisData = xAxisData.filter(
            (freq) => freq >= parameters.minFrequency && freq <= parameters.maxFrequency,
        );
        const filteredYAxisData = yAxisData.map(({ timestamp, frequencyData }) => ({
            timestamp,
            frequencyData: frequencyData.filter(
                (_, index) =>
                    xAxisData[index] >= parameters.minFrequency &&
                    xAxisData[index] <= parameters.maxFrequency,
            ),
        }));

        // Set up drawing parameters
        const width = canvas.width;
        const height = canvas.height;
        const padding = 50;
        const barWidth = (width - 2 * padding) / filteredXAxisData.length;

        // Find min and max y values for scaling
        let minY = Infinity;
        let maxY = -Infinity;
        filteredYAxisData.forEach(({ timestamp, frequencyData }) => {
            frequencyData.forEach((value) => {
                const normalizedAmplitude = value / 255;
                const yValue = timestamp + normalizedAmplitude;
                minY = Math.min(minY, yValue);
                maxY = Math.max(maxY, yValue);
            });
        });

        // Add some padding to the y-axis range
        minY -= 1.2;
        maxY += 0.5;

        // Function to map y value to canvas coordinates
        const mapY = (yValue: number) => {
            const normalizedY = (yValue - minY) / (maxY - minY);
            return normalizedY * height;
        };

        ctx.strokeStyle = parameters.axisColor;
        ctx.fillStyle = parameters.axisColor;
        ctx.font = `15px ${parameters.axisFont}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        // Draw X axis ticks
        filteredXAxisData.forEach((frequency, index) => {
            const x = padding + index * barWidth;
            if (frequency % 20 === 0) {
                // Draw frequency value
                //ctx.fillText(frequency.toString(), x + barWidth / 2, height - padding + 20);
            }
        });
        displayableNotes.forEach((note) => {
            if (note.isSharp()) return;
            const x =
                padding +
                ((note.frequency - filteredXAxisData[0]) * (width - 2 * padding)) /
                    (filteredXAxisData[filteredXAxisData.length - 1] - filteredXAxisData[0]);
            if (x < padding || x > width - padding) return;
            ctx.fillText(note.alphabetic + note.octave, x + barWidth / 2, height - padding + 25);
        });

        // Draw axes
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.stroke();

        // Draw lines for each yAxisData
        filteredYAxisData.forEach(({ timestamp, frequencyData }) => {
            ctx.lineWidth = parameters.dataLinesWidth;
            ctx.beginPath();

            const y = mapY(timestamp);

            // Draw label
            ctx.fillText((timestamp * yAxisDataStepInSeconds).toFixed(1), padding - 25, y);

            drawLine(ctx, frequencyData, mapY(timestamp), padding, barWidth);

            ctx.stroke();
        });
    }, [xAxisData, yAxisData]);

    return (
        <div className="poster-container">
            <canvas
                ref={canvasRef}
                width={600}
                height={900}
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

    const grad = ctx.createLinearGradient(baselineX, baselineY, baselineX, baselineY - lineHeight);
    grad.addColorStop(0.4, "#BAB2A9");
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
        ctx.stroke();
    });
};

const normalizeAmplitude = (amplitude: number): number => {
    return amplitude / 255;
};

export default PosterComponent;
