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
    const offlineCtx = new OfflineAudioContext(
      1,
      audioBuffer.length,
      audioBuffer.sampleRate,
    );

    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;

    const analyzer = offlineCtx.createAnalyser();
    analyzer.fftSize = this.fftSize;
    analyzer.minDecibels = this.minDecibels;
    analyzer.maxDecibels = this.maxDecibels;
    analyzer.smoothingTimeConstant = this.smoothingTimeConstant;

    source.connect(analyzer);
    analyzer.connect(offlineCtx.destination);
    source.start(0);

    const totalFrames = audioBuffer.duration | 0;
    const interval = audioBuffer.duration / totalFrames;
    const frames = new Array<Uint8Array>(totalFrames);

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

export default AudioAnalyzer;
