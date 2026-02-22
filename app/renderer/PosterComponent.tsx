import { useEffect, useRef } from "react";
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
    strokeColor: string;
    strokeAccentColor: string;
    backgroundColor: string;
};

interface PosterComponentProps {
    yAxisDataStepInSeconds: number;
    xAxisData: Array<number>;
    yAxisData: Array<YAxisData>;
    displayableNotes: Array<Notes>;
    parameters: PosterComponentParameters;
    canvasId: string;
    canvasWidth: number;
    canvasHeight: number;
}

const PosterComponent = ({
    yAxisDataStepInSeconds,
    xAxisData,
    yAxisData,
    displayableNotes,
    parameters,
    canvasId,
    canvasWidth,
    canvasHeight,
}: PosterComponentProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        if (xAxisData.length === 0 || yAxisData.length === 0) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Set up drawing parameters
        const width = canvas.width;
        const height = canvas.height;

        // Redraw canvas
        ctx.fillStyle = parameters.backgroundColor;
        ctx.fillRect(0, 0, width, height);
       
        // Set up axis data
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
        

        // Function to map y value to canvas coordinates
        const mapY = (yValue: number) => {
            const normalizedY = (yValue - minY) / (maxY - minY);
            return normalizedY * (height - 2 * padding) + padding + barWidth;
        };

        ctx.strokeStyle = parameters.axisColor;
        ctx.fillStyle = parameters.axisColor;
        ctx.font = `15px ${parameters.axisFont}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const minFilteredFrequency = filteredXAxisData[0];
        const maxFilteredFrequency = filteredXAxisData[filteredXAxisData.length - 1];
        const frequencyRange = maxFilteredFrequency - minFilteredFrequency;
        displayableNotes.forEach((note) => {
            if (note.isSharp()) return;
            const x =
                padding +
                ((note.frequency - minFilteredFrequency) * (width - 2 * padding)) / frequencyRange;
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

            const y = mapY(timestamp);

            // Draw label
            ctx.fillStyle = parameters.axisColor;
            ctx.fillText((timestamp * yAxisDataStepInSeconds).toFixed(1), padding - 25, y);

            drawLine(
                ctx,
                frequencyData,
                y,
                padding,
                barWidth,
                parameters,
            );
        });
    }, [
        displayableNotes,
        parameters,
        canvasHeight,
        canvasWidth,
        xAxisData,
        yAxisData,
        yAxisDataStepInSeconds,
    ]);

    return (
        <div className="poster-container flex h-full w-full items-center justify-center">
            <canvas
                id={canvasId}
                ref={canvasRef}
                width={canvasWidth}
                height={canvasHeight}
                className="h-full max-h-full w-auto max-w-full  rounded-[2px] shadow-[0_24px_56px_rgba(15,23,42,0.35)]"
                style={{ backgroundColor: parameters.backgroundColor }}
            />
        </div>
    );
};

const drawLine = (
ctx: CanvasRenderingContext2D, data: number[], baselineY: number, baselineX: number, spaceBetweenEachPoints: number, parameters: PosterComponentParameters,
) => {
    const lineHeight = 50;

    const xAxisbezierControlPointOffset = 0.5;
    const yAxisbezierControlPointOffset = 0.01;

    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = parameters.dataLinesWidth;

    ctx.strokeStyle = parameters.backgroundColor;
    ctx.fillStyle = parameters.backgroundColor;

    let previousPointX = baselineX;
    let previousPointY = baselineY;
    let previousAmplitude = 0;

    ctx.moveTo(previousPointX, previousPointY);
    ctx.beginPath();
    data.forEach((amplitude, index) => {
        ctx.moveTo(previousPointX, previousPointY);
        var { endX, endY } = generateBezierCurvePoints(
            previousAmplitude,
            amplitude,
            lineHeight,
            baselineX,
            index,
            spaceBetweenEachPoints,
            xAxisbezierControlPointOffset,
            previousPointY,
            yAxisbezierControlPointOffset,
            ctx,
        );
        ctx.lineTo(baselineX + (index + 1) * spaceBetweenEachPoints, baselineY + parameters.dataLinesWidth / 2);
        ctx.lineTo(baselineX + index * spaceBetweenEachPoints, baselineY + parameters.dataLinesWidth / 2);
        previousPointX = endX;
        previousPointY = endY;
        previousAmplitude = normalizeAmplitude(amplitude);
    });
    ctx.fill();
    ctx.stroke();

    //Draw line
    let previousGradientFirstColor = parameters.strokeColor;
    let previousGradientSecondColor = parameters.strokeAccentColor;
    ctx.lineWidth = parameters.dataLinesWidth;

    //Reset data
    previousPointX = baselineX;
    previousPointY = baselineY;
    previousAmplitude = 0;

    data.forEach((amplitude, index) => {
        ctx.beginPath();
        const grad = ctx.createLinearGradient(
            baselineX,
            baselineY,
            baselineX,
            baselineY - lineHeight,
        );
        grad.addColorStop(0, previousGradientFirstColor);
        grad.addColorStop(1, previousGradientSecondColor);
        ctx.strokeStyle = grad;
        ctx.moveTo(previousPointX, previousPointY);
        var { endX, endY } = generateBezierCurvePoints(
            previousAmplitude,
            amplitude,
            lineHeight,
            baselineX,
            index,
            spaceBetweenEachPoints,
            xAxisbezierControlPointOffset,
            previousPointY,
            yAxisbezierControlPointOffset,
            ctx,
        );
        previousPointX = endX;
        previousPointY = endY;
        previousAmplitude = normalizeAmplitude(amplitude);
        previousGradientFirstColor = `hsl(${index * 4}, 10%, 80%)`;
        previousGradientSecondColor = `hsl(${index * 4}, 100%, 20%)`;
        ctx.stroke();
    });
};

function generateBezierCurvePoints(
    previousAmplitude: number,
    amplitude: number,
    lineHeight: number,
    baselineX: number,
    index: number,
    spaceBetweenEachPoints: number,
    xAxisbezierControlPointOffset: number,
    previousPointY: number,
    yAxisbezierControlPointOffset: number,
    ctx: CanvasRenderingContext2D,
): { endX: number; endY: number } {
    const amplitudeDifference = (previousAmplitude - normalizeAmplitude(amplitude)) * lineHeight;

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
        previousPointY + amplitudeDifference - amplitudeDifference * yAxisbezierControlPointOffset;
    //ctx.lineTo(secondPointX, secondPointY);
    let endY = 0;
    endY = previousPointY + amplitudeDifference;
    const endX = baselineX + (index + 1) * spaceBetweenEachPoints;
    //ctx.lineTo(endX, endY);
    ctx.bezierCurveTo(firstPointX, firstPointY, secondPointX, secondPointY, endX, endY);
    return { endX, endY };
}

const normalizeAmplitude = (amplitude: number): number => {
    return amplitude / 255;
};

export default PosterComponent;
