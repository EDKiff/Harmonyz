export type AnalyzedAudioData = {
    xAxis: Array<number>; // Fréquences correspondantes à chaque bin de l'analyse
    frequencyData: Array<Array<number>>; // Données de fréquence pour chaque intervalle de temps
};

export type AudioAnalyzerParameters = {
    fftSize: number;
    smoothingTimeConstant: number;
    minDecibels: number;
    maxDecibels: number;
    durationBetweenLines: number; // Durée entre chaque ligne du spectre en secondes
    maxFrequency: number; // Fréquence maximale à analyser en Hz
};

class AudioAnalyzer {
    private audioContext: AudioContext;
    private fftSize: number;
    private smoothingTimeConstant: number;
    private minDecibels: number;
    private maxDecibels: number;
    private durationBetweenLines: number; // Durée entre chaque ligne du spectre en secondes
    private maxFrequency: number; // Fréquence maximale à analyser en Hz

    constructor(
        params: AudioAnalyzerParameters = {
            fftSize: 2048,
            smoothingTimeConstant: 0,
            minDecibels: -90,
            maxDecibels: -10,
            durationBetweenLines: 0.5,
            maxFrequency: 4000,
        },
    ) {
        this.audioContext = new window.AudioContext();
        this.fftSize = params.fftSize;
        this.smoothingTimeConstant = params.smoothingTimeConstant;
        this.minDecibels = params.minDecibels;
        this.maxDecibels = params.maxDecibels;
        this.durationBetweenLines = params.durationBetweenLines;
        this.maxFrequency = params.maxFrequency;
    }

    // Analyse seconde par seconde le spectrum de l'audio
    // OfflineAudioContext sert a lire l'audio sans le jouer
    async analyzeFullAudio(arrayBuffer: ArrayBuffer): Promise<AnalyzedAudioData> {
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        //Debug info on decoded audio
        console.log("Decoded audio buffer:", {
            duration: audioBuffer.duration,
            sampleRate: audioBuffer.sampleRate,
            numberOfChannels: audioBuffer.numberOfChannels,
            length: audioBuffer.length,
        });

        const offlineCtx = new OfflineAudioContext(1, audioBuffer.length, audioBuffer.sampleRate);

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
        analyzer.minDecibels = this.minDecibels;
        analyzer.maxDecibels = this.maxDecibels;
        analyzer.smoothingTimeConstant = this.smoothingTimeConstant;

        source.connect(analyzer);
        analyzer.connect(offlineCtx.destination);
        source.start(0);

        const durationInSeconds = audioBuffer.duration | 0;
        const intervalInSeconds = this.durationBetweenLines;
        const byteFrequencyDataForInterval = new Array<Array<number>>();

        //Premiere enregistrement sont les valeurs de l'axe x
        console.log("Found audioBuffer.sampleRate:", audioBuffer.sampleRate);
        const xAxis = new Array<number>();
        for (let i = 0; i < analyzer.frequencyBinCount; i++) {
            const freqValue = i * (audioBuffer.sampleRate / analyzer.frequencyBinCount);
            xAxis.push(freqValue);
        }

        for (let time = 0; time < durationInSeconds; time += intervalInSeconds) {
            offlineCtx.suspend(time).then(() => {
                const dataArray = new Uint8Array(analyzer.frequencyBinCount);
                //We could use getFloatFrequencyData for more precision but it is more expensive to compute
                analyzer.getByteFrequencyData(dataArray);
                byteFrequencyDataForInterval.push(Array.from(dataArray));
                offlineCtx.resume();
            });
        }

        await offlineCtx.startRendering();
        return {
            xAxis,
            frequencyData: byteFrequencyDataForInterval,
        };
    }
}

export default AudioAnalyzer;
