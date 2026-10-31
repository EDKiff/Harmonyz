import { useLayoutEffect, useRef } from "react";
import { drawPoster, type PosterComponentParameters, type YAxisData } from "./PosterRenderer";
import type { PosterStyle } from "../welcome/welcome.types";
import type { Notes } from "../notes/Notes";

export type { PosterComponentParameters } from "./PosterRenderer";

interface PosterComponentProps {
    drawingStyle?: PosterStyle;
    yAxisDataStepInSeconds: number;
    xAxisData: number[];
    yAxisData: YAxisData[];
    displayableNotes: Notes[];
    parameters: PosterComponentParameters;
    canvasId: string;
    canvasWidth: number;
    canvasHeight: number;
    animated?: boolean;
    amplitudePeak?: number;
}

const PosterComponent = ({
    drawingStyle = "spectrum",
    yAxisDataStepInSeconds,
    xAxisData,
    yAxisData,
    displayableNotes,
    parameters,
    canvasId,
    canvasWidth,
    canvasHeight,
    animated = false,
    amplitudePeak,
}: PosterComponentProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useLayoutEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;
        drawPoster(ctx, {
            drawingStyle,
            yAxisDataStepInSeconds,
            xAxisData,
            yAxisData,
            displayableNotes,
            parameters,
            width: canvas.width,
            height: canvas.height,
            animated,
            amplitudePeak,
        });
    }, [
        drawingStyle,
        yAxisDataStepInSeconds,
        xAxisData,
        yAxisData,
        displayableNotes,
        parameters,
        canvasWidth,
        canvasHeight,
        animated,
        amplitudePeak,
    ]);
    return (
        <div className="poster-container flex h-full w-full items-center justify-center">
            <canvas
                id={canvasId}
                ref={canvasRef}
                width={canvasWidth}
                height={canvasHeight}
                className="max-h-full max-w-full rounded-[2px] object-contain shadow-[0_24px_56px_rgba(15,23,42,0.35)]"
                style={{
                    backgroundColor: parameters.backgroundColor,
                    aspectRatio: `${canvasWidth} / ${canvasHeight}`,
                }}
            />
        </div>
    );
};

export default PosterComponent;
