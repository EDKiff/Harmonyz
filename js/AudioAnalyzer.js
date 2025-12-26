class AudioAnalyzer {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    // Analyse seconde par seconde le spectrum de l"audio
    // OfflineAudioContext sert a lire l"audio sans le jouer
    async analyzeFullAudio(arrayBuffer) {
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        const offlineCtx = new OfflineAudioContext(
            1,
            audioBuffer.length,
            audioBuffer.sampleRate
        );

        const source = offlineCtx.createBufferSource();
        source.buffer = audioBuffer;

        const analyzer = offlineCtx.createAnalyser();
        analyzer.fftSize = 2048;
        analyzer.smoothingTimeConstant = 0;

        source.connect(analyzer);
        analyzer.connect(offlineCtx.destination);
        source.start(0);

        const totalFrames = audioBuffer.duration | 0;
        const interval = audioBuffer.duration / totalFrames;
        const frames = new Array(totalFrames);

        for (let i = 0; i < totalFrames; i++) {
            const time = i * interval;
            offlineCtx.suspend(time).then(() => {
                const dataArray = new Uint8Array(analyzer.frequencyBinCount);
                analyzer.getByteFrequencyData(dataArray);
                frames[i] = dataArray;
                offlineCtx.resume();
            });
        }

        await offlineCtx.startRendering();
        return frames;
    }
}