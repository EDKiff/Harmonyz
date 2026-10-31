export type AnalyzedAudioData = {
    xAxis: Array<number>; // Fréquences correspondantes à chaque bin de l'analyse
    duration: number; // Durée décodée exacte, fraction finale comprise
    frequencyData: Array<Array<number>>; // Données de fréquence pour chaque intervalle de temps
};

export type AudioAnalyzerParameters = {
    fftSize: number;
    smoothingTimeConstant: number;
    minDecibels: number;
    maxDecibels: number;
    durationBetweenLines: number; // Durée entre chaque ligne du spectre en secondes
};

class AudioAnalyzer {
    private audioContext: AudioContext;
    private fftSize: number;
    private smoothingTimeConstant: number;
    private minDecibels: number;
    private maxDecibels: number;
    private durationBetweenLines: number; // Durée entre chaque ligne du spectre en secondes

    constructor(
        params: AudioAnalyzerParameters = {
            fftSize: 2048,
            smoothingTimeConstant: 0,
            minDecibels: -90,
            maxDecibels: -10,
            durationBetweenLines: 0.5,
        },
    ) {
        if (!(params.durationBetweenLines > 0) || !Number.isFinite(params.durationBetweenLines)) {
            throw new Error("Seconds between lines must be greater than zero.");
        }
        this.audioContext = new window.AudioContext();
        this.fftSize = params.fftSize;
        this.smoothingTimeConstant = params.smoothingTimeConstant;
        this.minDecibels = params.minDecibels;
        this.maxDecibels = params.maxDecibels;
        this.durationBetweenLines = params.durationBetweenLines;
    }

    // Analyse seconde par seconde le spectrum de l'audio
    // OfflineAudioContext sert a lire l'audio sans le jouer
    async analyzeFullAudio(arrayBuffer: ArrayBuffer): Promise<AnalyzedAudioData> {
        try {
            return await this.analyzeBuffer(arrayBuffer);
        } finally {
            await this.audioContext.close();
        }
    }

    private async analyzeBuffer(arrayBuffer: ArrayBuffer): Promise<AnalyzedAudioData> {
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        // suspend() rounds up to a 128-frame render quantum. A final suspension must
        // still occur before rendering ends, even when the audio ends within that quantum.
        const offlineCtx = new OfflineAudioContext(
            1,
            audioBuffer.length + 128,
            audioBuffer.sampleRate,
        );

        const source = offlineCtx.createBufferSource();
        const oneChannelBuffer = offlineCtx.createBuffer(
            1,
            audioBuffer.length,
            audioBuffer.sampleRate,
        );
        // Permet de ne prendre qu'un seul canal (mono) pour l'analyse. TODO Peut-etre plus tard combiner les canaux
        oneChannelBuffer.copyToChannel(audioBuffer.getChannelData(0), 0);
        source.buffer = oneChannelBuffer;

        const analyzer = offlineCtx.createAnalyser();
        analyzer.fftSize = this.fftSize;
        // Apply both bounds without crossing the analyser's default range in between.
        analyzer.minDecibels = Math.min(analyzer.minDecibels, this.minDecibels);
        analyzer.maxDecibels = this.maxDecibels;
        analyzer.minDecibels = this.minDecibels;
        analyzer.smoothingTimeConstant = this.smoothingTimeConstant;

        source.connect(analyzer);
        analyzer.connect(offlineCtx.destination);
        source.start(0);

        const durationInSeconds = audioBuffer.duration;
        const intervalInSeconds = this.durationBetweenLines;
        const byteFrequencyDataForInterval = new Array<Array<number>>();

        // Les bins FFT couvrent 0 à la fréquence de Nyquist.
        const xAxis = new Array<number>();
        for (let i = 0; i < analyzer.frequencyBinCount; i++) {
            const freqValue = i * (audioBuffer.sampleRate / this.fftSize);
            xAxis.push(freqValue);
        }

        const suspensions: Promise<void>[] = [];
        for (let sample = 0; sample * intervalInSeconds < durationInSeconds; sample++) {
            const time = sample * intervalInSeconds;
            suspensions.push(
                offlineCtx.suspend(time).then(async () => {
                    const dataArray = new Uint8Array(analyzer.frequencyBinCount);
                    //We could use getFloatFrequencyData for more precision but it is more expensive to compute
                    analyzer.getByteFrequencyData(dataArray);
                    byteFrequencyDataForInterval.push(Array.from(dataArray));
                    await offlineCtx.resume();
                }),
            );
        }

        await Promise.all([offlineCtx.startRendering(), ...suspensions]);
        return {
            xAxis,
            duration: durationInSeconds,
            frequencyData: byteFrequencyDataForInterval,
        };
    }
}

export default AudioAnalyzer;
