declare module "gifenc" {
    type Palette = number[][];
    export function quantize(data: Uint8Array | Uint8ClampedArray, colors: number): Palette;
    export function applyPalette(
        data: Uint8Array | Uint8ClampedArray,
        palette: Palette,
    ): Uint8Array;
    export function GIFEncoder(options?: { auto?: boolean }): {
        writeHeader(): void;
        writeFrame(
            data: Uint8Array,
            width: number,
            height: number,
            options: { palette: Palette; first?: boolean; delay: number; repeat: number },
        ): void;
        bytes(): Uint8Array<ArrayBuffer>;
    };
}
