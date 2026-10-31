export const GIF_FPS = 20;

/** GIF delays are integer centiseconds, including the last partial frame. */
export function gifTimeline(durationSeconds: number) {
    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
        throw new Error("The song must have a finite, positive duration.");
    }
    const durationCentiseconds = Math.max(1, Math.round(durationSeconds * 100));
    return {
        frameCount: Math.ceil(durationCentiseconds / 5),
        durationCentiseconds,
    };
}

export function gifFrameDelay(durationSeconds: number, frameIndex: number) {
    const { frameCount, durationCentiseconds } = gifTimeline(durationSeconds);
    if (!Number.isInteger(frameIndex) || frameIndex < 0 || frameIndex >= frameCount) {
        throw new Error("The GIF frame is outside the song.");
    }
    return Math.min(5, durationCentiseconds - frameIndex * 5) * 10;
}

/** Bound each allocation before asking the browser for a full-resolution canvas. */
export function validateGifDimensions(width: number, height: number) {
    if (
        !Number.isInteger(width) ||
        !Number.isInteger(height) ||
        width <= 0 ||
        height <= 0 ||
        width > 4096 ||
        height > 4096 ||
        width * height > 16_000_000
    ) {
        throw new Error("Choose a poster no larger than 4096 px per side and 16 megapixels.");
    }
}
