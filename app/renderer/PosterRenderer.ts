import { drawJoyDivision } from "./JoyDivisionRenderer";
import type { PosterStyle } from "../welcome/welcome.types";
import type { Notes } from "../notes/Notes";

export type PosterCanvasContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

export type YAxisData = {
    // Row index for a static poster, relative seconds for an animated poster.
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

export type PosterDrawing = {
    drawingStyle?: PosterStyle;
    xAxisData: number[];
    yAxisData: YAxisData[];
    displayableNotes?: Pick<Notes, "alphabetic" | "octave" | "frequency">[];
    parameters: PosterComponentParameters;
    width: number;
    height: number;
    yAxisDataStepInSeconds?: number;
    animated?: boolean;
    amplitudePeak?: number;
    maxReliefRatio?: number;
};

/** The same drawing operation is used for preview, PNG and GIF frames. */
export function drawPoster(ctx: PosterCanvasContext, drawing: PosterDrawing) {
    const {
        drawingStyle = "spectrum",
        xAxisData,
        yAxisData,
        displayableNotes = [],
        parameters,
        width,
        height,
        yAxisDataStepInSeconds = 0.5,
        animated = false,
        amplitudePeak,
        maxReliefRatio,
    } = drawing;
    ctx.save();
    try {
        ctx.fillStyle = parameters.backgroundColor;
        ctx.fillRect(0, 0, width, height);
        const selectedBins: number[] = [];
        for (let index = 0; index < xAxisData.length; index++) {
            const frequency = xAxisData[index];
            if (frequency >= parameters.minFrequency && frequency <= parameters.maxFrequency) {
                selectedBins.push(index);
            }
        }
        const frequencies = selectedBins.map((index) => xAxisData[index]);
        const rows = yAxisData.map(({ timestamp, frequencyData }) => ({
            timestamp,
            frequencyData: selectedBins.map((index) => {
                const value = frequencyData[index];
                return Number.isFinite(value) ? Math.max(0, value) : 0;
            }),
        }));
        if (drawingStyle === "joy-division") {
            drawJoyDivision(
                ctx,
                rows.map((row) => row.frequencyData),
                width,
                height,
                parameters,
                amplitudePeak,
                maxReliefRatio,
            );
            return;
        }
        if (frequencies.length < 2 || rows.length === 0) return;
        const padding = Math.min(50, width * 0.15, height * 0.15);
        const pointSpacing = (width - 2 * padding) / (frequencies.length - 1);
        const rowCount = Math.max(1, parameters.lineCount, rows.length);
        const lineHeight = Math.min(50, height * 0.12);
        const rowSpacing =
            Math.max(0, height - 2 * padding - lineHeight) / Math.max(1, rowCount - 1);
        ctx.strokeStyle = parameters.axisColor;
        ctx.fillStyle = parameters.axisColor;
        ctx.font = `${Math.min(15, width / 18)}px ${parameters.axisFont}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const minFrequency = frequencies[0];
        const frequencyRange = frequencies[frequencies.length - 1] - minFrequency;
        for (const note of displayableNotes) {
            if (note.alphabetic.includes("#") || note.alphabetic.includes("b")) continue;
            const x =
                padding +
                ((note.frequency - minFrequency) * (width - 2 * padding)) / frequencyRange;
            if (x < padding || x > width - padding) continue;
            ctx.fillText(
                note.alphabetic + note.octave,
                x,
                height - padding + Math.min(25, padding / 2),
            );
        }
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.stroke();
        rows.forEach(({ timestamp, frequencyData }, index) => {
            // Mode and current amplitudes change the curves, never their row positions.
            const y = padding + lineHeight + index * rowSpacing;
            ctx.fillStyle = parameters.axisColor;
            const label = animated
                ? `${timestamp === 0 ? "0" : "−" + Number(Math.abs(timestamp).toFixed(2))} s`
                : (timestamp * yAxisDataStepInSeconds).toFixed(1);
            ctx.fillText(label, padding / 2, y);
            drawLine(ctx, frequencyData, y, padding, pointSpacing, parameters, lineHeight);
        });
    } finally {
        ctx.restore();
    }
}

function drawLine(
    ctx: PosterCanvasContext,
    data: number[],
    baselineY: number,
    baselineX: number,
    pointSpacing: number,
    parameters: PosterComponentParameters,
    lineHeight = 50,
) {
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = parameters.dataLinesWidth;

    const trace = () => {
        let previousY = baselineY - (data[0] / 255) * lineHeight;
        ctx.moveTo(baselineX, baselineY);
        ctx.lineTo(baselineX, previousY);
        data.slice(1).forEach((amplitude, index) => {
            const endX = baselineX + (index + 1) * pointSpacing;
            const endY = baselineY - (amplitude / 255) * lineHeight;
            const controlX = baselineX + (index + 0.5) * pointSpacing;
            const difference = endY - previousY;
            ctx.bezierCurveTo(
                controlX,
                previousY + difference * 0.01,
                controlX,
                endY - difference * 0.01,
                endX,
                endY,
            );
            previousY = endY;
        });
    };

    ctx.fillStyle = parameters.backgroundColor;
    ctx.beginPath();
    trace();
    ctx.lineTo(
        baselineX + (data.length - 1) * pointSpacing,
        baselineY + parameters.dataLinesWidth / 2,
    );
    ctx.lineTo(baselineX, baselineY + parameters.dataLinesWidth / 2);
    ctx.closePath();
    ctx.fill();

    // Build one gradient per row rather than one per frequency bin during animation.
    const ink = ctx.createLinearGradient(baselineX, baselineY, baselineX, baselineY - lineHeight);
    ink.addColorStop(0, parameters.strokeColor);
    ink.addColorStop(1, parameters.strokeAccentColor);
    ctx.strokeStyle = ink;
    ctx.beginPath();
    trace();
    ctx.stroke();
}
