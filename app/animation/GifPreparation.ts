import { validateGifDimensions } from "./gifTimeline";
import type { GifRequest, GifResponse, GifSnapshot } from "./gifMessages";

export type { GifSnapshot } from "./gifMessages";

type PendingExport = {
    id: number;
    resolve: (blob: Blob) => void;
    reject: (error: Error) => void;
    onProgress: (fraction: number) => void;
};

/** One immutable visual configuration, shared by listening preparation and export. */
export class GifPreparation {
    private worker: Worker;
    private databaseName = `harmonyz-gif-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    private pendingExport?: PendingExport;
    private exportCounter = 0;
    private disposeRequested = false;
    private stopped = false;
    private failure?: Error;

    constructor(snapshot: GifSnapshot) {
        validateGifDimensions(snapshot.width, snapshot.height);
        if (typeof OffscreenCanvas === "undefined" || typeof Worker === "undefined") {
            throw new Error("GIF export needs a browser with OffscreenCanvas and Web Workers.");
        }
        this.worker = new Worker(new URL("./gif.worker.ts", import.meta.url), { type: "module" });
        this.worker.onmessage = (event: MessageEvent<GifResponse>) => {
            const message = event.data;
            if (message.type === "disposed") {
                this.stop();
            } else if (message.type === "error") {
                this.fail(new Error(message.message));
            } else if (message.id === this.pendingExport?.id) {
                if (message.type === "progress") {
                    this.pendingExport.onProgress(message.progress);
                } else {
                    const pending = this.pendingExport;
                    this.pendingExport = undefined;
                    pending.resolve(message.blob);
                    if (this.disposeRequested) this.send({ type: "dispose" });
                }
            }
        };
        this.worker.onerror = (event) => {
            event.preventDefault();
            this.fail(
                new Error("GIF preparation failed. Reload the song or use a smaller poster."),
            );
        };
        window.addEventListener("pagehide", this.handlePageHide);
        this.send({ type: "initialize", snapshot, databaseName: this.databaseName });
    }

    prepare(timeSeconds: number) {
        if (!this.disposeRequested && !this.failure && Number.isFinite(timeSeconds)) {
            this.send({ type: "prepare", time: timeSeconds });
        }
    }

    export(onProgress: (fraction: number) => void): Promise<Blob> {
        if (this.failure) return Promise.reject(this.failure);
        if (this.stopped || this.disposeRequested) {
            return Promise.reject(new Error("This GIF preparation is no longer available."));
        }
        if (this.pendingExport) {
            return Promise.reject(new Error("A GIF export is already running."));
        }
        return new Promise((resolve, reject) => {
            const id = ++this.exportCounter;
            this.pendingExport = { id, resolve, reject, onProgress };
            onProgress(0);
            this.send({ type: "export", id });
        });
    }

    cancel() {
        const pending = this.pendingExport;
        if (!pending) return;
        this.pendingExport = undefined;
        this.send({ type: "cancel", id: pending.id });
        pending.reject(new DOMException("GIF export cancelled.", "AbortError"));
        if (this.disposeRequested) this.send({ type: "dispose" });
    }

    /** An in-flight export keeps its original snapshot alive until it settles. */
    dispose() {
        this.disposeRequested = true;
        if (!this.pendingExport) this.send({ type: "dispose" });
    }

    private send(message: GifRequest) {
        if (!this.stopped) this.worker.postMessage(message);
    }

    private fail(error: Error) {
        this.failure = error;
        this.pendingExport?.reject(error);
        this.pendingExport = undefined;
        this.stop();
    }

    private handlePageHide = () => {
        this.cancel();
        this.stop();
    };

    private stop() {
        if (this.stopped) return;
        this.stopped = true;
        this.worker.terminate();
        window.removeEventListener("pagehide", this.handlePageHide);
        // Terminating the worker closes its connection before this deletion proceeds.
        try {
            indexedDB.deleteDatabase(this.databaseName);
        } catch {
            // Storage may itself be unavailable after an initialization failure.
        }
    }
}
