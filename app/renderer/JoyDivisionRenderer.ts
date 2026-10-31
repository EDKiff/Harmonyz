import type { PosterCanvasContext, PosterComponentParameters } from "./PosterRenderer";

/** Shared by drawing and the full-track bound used to reserve space above the first row. */
export function joyDivisionEnvelope(position: number) {
    return Math.exp(-0.5 * ((position - 0.5) / 0.16) ** 2) * Math.sin(Math.PI * position);
}

/** Audio-only ridgelines: one spectrum per row, one shared amplitude scale. */
export function drawJoyDivision(
    ctx: PosterCanvasContext,
    spectra: number[][],
    width: number,
    height: number,
    parameters: PosterComponentParameters,
    amplitudePeak = 255,
    maxReliefRatio = 1,
) {
    if (spectra.length === 0) return;

    const marginX = width * 0.055;
    const marginY = height * 0.065;
    const plotWidth = width - marginX * 2;
    const peakHeight = Math.min(plotWidth * 0.24, height * 0.18);
    const rowCount = Math.max(1, parameters.lineCount ?? spectra.length, spectra.length);
    const lineWidth = parameters.dataLinesWidth * (Math.min(width, height) / 840);
    const halfStroke = lineWidth / 2;
    const reliefBound = Number.isFinite(maxReliefRatio)
        ? Math.min(1, Math.max(0, maxReliefRatio))
        : 1;
    // This bound comes from the entire song, never from the current animation frame.
    // Reserve the actual tallest relief and stroke, rather than clipping the upper curves.
    const firstBaseline = marginY + peakHeight * reliefBound + halfStroke;
    const lastBaseline = height - marginY - halfStroke;
    const baselineSpan = Math.max(0, lastBaseline - firstBaseline);
    const spacing = baselineSpan / Math.max(1, rowCount - 1);

    ctx.save();
    // Scale the stroke with the support, including high-resolution exports.
    ctx.lineWidth = lineWidth;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.fillStyle = parameters.backgroundColor;
    const rows = spectra.map((spectrum, row) => {
        const baseline =
            rowCount === 1 ? firstBaseline + baselineSpan / 2 : firstBaseline + row * spacing;
        const points = spectrum.map((value, index) => {
            const position = spectrum.length === 1 ? 0.5 : index / (spectrum.length - 1);
            const envelope = joyDivisionEnvelope(position);
            const amplitude =
                amplitudePeak > 0 && Number.isFinite(value)
                    ? Math.min(1, Math.max(0, value) / amplitudePeak)
                    : 0;
            return {
                x: marginX + position * plotWidth,
                y: baseline - Math.pow(amplitude, 2.2) * envelope * peakHeight,
            };
        });

        return { baseline, points };
    });
    rows.forEach(({ baseline, points }) => {
        // Include flat endpoints even for a single bin or an empty frequency range.
        const trace = () => {
            ctx.moveTo(marginX, baseline);
            for (const point of points) ctx.lineTo(point.x, point.y);
            ctx.lineTo(width - marginX, baseline);
        };
        ctx.beginPath();
        trace();
        ctx.lineTo(width - marginX, height);
        ctx.lineTo(marginX, height);
        ctx.closePath();
        ctx.fill();

        const ink = ctx.createLinearGradient(0, baseline, 0, baseline - peakHeight);
        ink.addColorStop(0, parameters.strokeColor);
        ink.addColorStop(1, parameters.strokeAccentColor);
        ctx.strokeStyle = ink;
        ctx.beginPath();
        trace();
        ctx.stroke();
    });
    ctx.restore();
}
