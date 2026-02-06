class AudioAnalyzer {
  private audioContext: AudioContext;
  private fftSize: number;
  private smoothingTimeConstant: number;
  private minDecibels: number;
  private maxDecibels: number;

  constructor(
    fftSize: number = 2048,
    smoothingTimeConstant: number = 0,
    minDecibels: number = -90,
    maxDecibels: number = -10,
  ) {
    this.audioContext = new (
      window.AudioContext || (window as any).webkitAudioContext
    )();
    this.fftSize = fftSize;
    this.smoothingTimeConstant = smoothingTimeConstant;
    this.minDecibels = minDecibels;
    this.maxDecibels = maxDecibels;
  }

  // Analyse seconde par seconde le spectrum de l"audio
  // OfflineAudioContext sert a lire l"audio sans le jouer
  async analyzeFullAudio(arrayBuffer: ArrayBuffer): Promise<Uint8Array[]> {
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      const offlineCtx = new OfflineAudioContext(1, audioBuffer.length, audioBuffer.sampleRate);

      const source = offlineCtx.createBufferSource();
      // Permet de ne prendre qu'un seul canal (mono) pour l"analyse. Peut-etre plus tard combiner les canaux
      const oneChannelBuffer = offlineCtx.createBuffer(
          1,
          audioBuffer.length,
          audioBuffer.sampleRate,
      );
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
      const intervalInSeconds = 0.5;
      const byteFrequencyDataForInterval = new Array<Uint8Array>();

      //Premiere enregistrement sont les valeurs de l'axe x
      const xAxis = new Uint8Array(analyzer.frequencyBinCount);
      for (let i = 0; i < analyzer.frequencyBinCount; i++) {
          const freqValue = (i * audioBuffer.sampleRate) / analyzer.frequencyBinCount;
          xAxis[i] = freqValue;
      }
      byteFrequencyDataForInterval.push(xAxis);

      for (let time = 0; time < durationInSeconds; time += intervalInSeconds) {
          offlineCtx.suspend(time).then(() => {
              const dataArray = new Uint8Array(analyzer.frequencyBinCount);
              analyzer.getByteFrequencyData(dataArray);
              byteFrequencyDataForInterval.push(dataArray);
              offlineCtx.resume();
          });
      }

      await offlineCtx.startRendering();
      console.log(byteFrequencyDataForInterval);
      return byteFrequencyDataForInterval;
  }
}

export default AudioAnalyzer;
