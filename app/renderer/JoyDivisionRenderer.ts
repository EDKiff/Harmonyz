import type { PosterComponentParameters } from "./PosterComponent";

/** Audio-only ridgelines: one spectrum per row, one shared amplitude scale. */
export function drawJoyDivision(
    ctx: CanvasRenderingContext2D,
    spectra: number[][],
    width: number,
    height: number,
    parameters: PosterComponentParameters,
) {
    if (spectra.length === 0) return;

    const marginX = width * 0.055;
    const marginY = height * 0.065;
    const plotWidth = width - marginX * 2;
    const peakHeight = Math.min(plotWidth * 0.24, height * 0.18);
    const plotHeight = height - marginY * 2;
    const spacing = plotHeight / Math.max(1, spectra.length - 1);
    let peak = 0;
    for (const spectrum of spectra) {
        for (const value of spectrum) {
            if (Number.isFinite(value)) peak = Math.max(peak, value);
        }
    }

    ctx.save();
    // Scale the stroke with the support, including high-resolution exports.
    ctx.lineWidth = parameters.dataLinesWidth * (Math.min(width, height) / 840);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.fillStyle = parameters.backgroundColor;

    const rows = spectra.map((spectrum, row) => {
        const baseline = spectra.length === 1 ? plotHeight / 2 : row * spacing;
        const points = spectrum.map((value, index) => {
            const position = spectrum.length === 1 ? 0.5 : index / (spectrum.length - 1);
            const envelope =
                Math.exp(-0.5 * ((position - 0.5) / 0.16) ** 2) * Math.sin(Math.PI * position);
            const amplitude = peak > 0 && Number.isFinite(value) ? Math.max(0, value) / peak : 0;
            return {
                x: marginX + position * plotWidth,
                y: baseline - Math.pow(amplitude, 2.2) * envelope * peakHeight,
            };
        });

        return { baseline, points };
    });
    // Fit the actual contours, rather than reserving an empty peak-height above quiet opening rows.
    let top = 0;
    for (const row of rows) for (const point of row.points) top = Math.min(top, point.y);
    const scaleY = plotHeight / (plotHeight - top);
    rows.forEach(({ baseline: rawBaseline, points: rawPoints }) => {
        const baseline = marginY + (rawBaseline - top) * scaleY;
        const points = rawPoints.map((point) => ({
            x: point.x,
            y: marginY + (point.y - top) * scaleY,
        }));
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
