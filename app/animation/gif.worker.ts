import { GIFEncoder, applyPalette, quantize } from "gifenc";
import { NOTES } from "../notes/Notes";
import { animationFrame, globalAnalysisScale } from "../renderer/animation";
import { drawPoster } from "../renderer/PosterRenderer";
import { GIF_FPS, gifFrameDelay, gifTimeline, validateGifDimensions } from "./gifTimeline";
import type { GifRequest, GifResponse, GifSnapshot } from "./gifMessages";

let snapshot: GifSnapshot;
let canvas: OffscreenCanvas;
let context: OffscreenCanvasRenderingContext2D;
let database: IDBDatabase | undefined;
let initialization: Promise<void> | undefined;
let frameCount = 0;
let amplitudePeak = 0;
let maxReliefRatio = 1;
const prepared = new Set<number>();
const requested = new Set<number>();
let exporting: { id: number; cursor: number } | undefined;
let running = false;
let disposed = false;

function respond(message: GifResponse) {
    self.postMessage(message);
}

function openDatabase(name: string): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(name, 1);
        request.onupgradeneeded = () => request.result.createObjectStore("frames");
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function initialize(configuration: GifSnapshot, databaseName: string) {
    snapshot = configuration;
    validateGifDimensions(snapshot.width, snapshot.height);
    frameCount = gifTimeline(snapshot.analysis.duration).frameCount;
    canvas = new OffscreenCanvas(snapshot.width, snapshot.height);
    const renderingContext = canvas.getContext("2d", { willReadFrequently: true });
    if (!renderingContext) throw new Error("The browser could not create the GIF canvas.");
    context = renderingContext;
    ({ amplitudePeak, maxReliefRatio } = globalAnalysisScale(
        snapshot.analysis,
        snapshot.parameters,
    ));
    database = await openDatabase(databaseName);
}

function saveFrame(index: number, blob: Blob): Promise<void> {
    return new Promise((resolve, reject) => {
        if (!database) return reject(new Error("The GIF frame storage is unavailable."));
        const transaction = database.transaction("frames", "readwrite");
        transaction.objectStore("frames").put(blob, index);
        transaction.oncomplete = () => resolve();
        transaction.onerror = transaction.onabort = () => reject(transaction.error);
    });
}

function readFrames(): Promise<Blob[]> {
    return new Promise((resolve, reject) => {
        if (!database) return reject(new Error("The GIF frame storage is unavailable."));
        const request = database.transaction("frames").objectStore("frames").getAll();
        request.onsuccess = () => resolve(request.result as Blob[]);
        request.onerror = () => reject(request.error);
    });
}

async function encodeFrame(index: number) {
    drawPoster(context, {
        drawingStyle: snapshot.drawingStyle,
        xAxisData: snapshot.analysis.xAxis,
        yAxisData: animationFrame(snapshot.analysis, snapshot.parameters, index / GIF_FPS),
        displayableNotes: NOTES,
        parameters: snapshot.parameters,
        width: snapshot.width,
        height: snapshot.height,
        animated: true,
        amplitudePeak,
        maxReliefRatio,
    });
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const palette = quantize(pixels, 256);
    const indices = applyPalette(pixels, palette);
    const encoder = GIFEncoder({ auto: false });
    if (index === 0) encoder.writeHeader();
    encoder.writeFrame(indices, canvas.width, canvas.height, {
        palette,
        first: index === 0,
        delay: gifFrameDelay(snapshot.analysis.duration, index),
        repeat: 0,
    });
    // Only the encoded chunk survives this call; raw pixels are released per frame.
    await saveFrame(index, new Blob([encoder.bytes()]));
    prepared.add(index);
}

async function pump() {
    if (running) return;
    running = true;
    try {
        await initialization;
        while (!disposed) {
            const activeExport = exporting;
            if (activeExport) {
                while (activeExport.cursor < frameCount && prepared.has(activeExport.cursor)) {
                    activeExport.cursor++;
                }
                if (activeExport.cursor === frameCount) {
                    const chunks = await readFrames();
                    if (exporting === activeExport && !disposed) {
                        exporting = undefined;
                        respond({
                            type: "complete",
                            id: activeExport.id,
                            blob: new Blob([...chunks, new Uint8Array([0x3b])], {
                                type: "image/gif",
                            }),
                        });
                    }
                    continue;
                }
                await encodeFrame(activeExport.cursor);
                if (exporting === activeExport) {
                    respond({
                        type: "progress",
                        id: activeExport.id,
                        progress: prepared.size / frameCount,
                    });
                }
            } else {
                const index = requested.values().next().value;
                if (index === undefined) break;
                requested.delete(index);
                if (!prepared.has(index)) await encodeFrame(index);
            }
            // Yield between frames so cancellation and new requests are processed promptly.
            await new Promise((resolve) => setTimeout(resolve, 0));
        }
    } catch (error) {
        disposed = true;
        respond({
            type: "error",
            message:
                error instanceof DOMException && error.name === "QuotaExceededError"
                    ? "Not enough browser storage for this GIF. Free space or choose a smaller poster."
                    : error instanceof Error
                      ? `GIF generation failed: ${error.message} Try a smaller poster or reload the song.`
                      : "GIF generation failed. Try a smaller poster or reload the song.",
        });
    } finally {
        running = false;
        if (disposed) {
            database?.close();
            canvas && (canvas.width = canvas.height = 1);
            respond({ type: "disposed" });
        }
    }
}

self.onmessage = (event: MessageEvent<GifRequest>) => {
    const message = event.data;
    if (message.type === "initialize") {
        initialization = initialize(message.snapshot, message.databaseName);
    } else if (message.type === "prepare") {
        if (frameCount > 0) {
            const index = Math.min(frameCount - 1, Math.max(0, Math.floor(message.time * GIF_FPS)));
            if (!prepared.has(index)) requested.add(index);
        }
    } else if (message.type === "export") {
        exporting = { id: message.id, cursor: 0 };
        respond({ type: "progress", id: message.id, progress: prepared.size / frameCount });
    } else if (message.type === "cancel") {
        if (exporting?.id === message.id) exporting = undefined;
    } else {
        disposed = true;
    }
    void pump();
};
