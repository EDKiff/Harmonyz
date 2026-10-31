import { useEffect, useRef, useState } from "react";

/** The media element is the clock; rendering never advances or restarts the song. */
export function useSongPlayback(file: File | null) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [position, setPosition] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        setPosition(0);
        setDuration(0);
        setIsPlaying(false);
        setError(null);
        if (!file) return;
        const url = URL.createObjectURL(file);
        audio.src = url;
        audio.load();
        return () => {
            audio.pause();
            audio.removeAttribute("src");
            audio.load();
            URL.revokeObjectURL(url);
        };
    }, [file]);

    useEffect(() => {
        if (audioRef.current) audioRef.current.volume = volume;
    }, [volume]);

    useEffect(() => {
        if (!isPlaying) return;
        let frame = 0;
        let nextUpdate = 0;
        const update = (now: number) => {
            if (!audioRef.current || audioRef.current.paused) return;
            if (now >= nextUpdate) {
                setPosition(audioRef.current?.currentTime ?? 0);
                nextUpdate += 50 * Math.max(1, Math.floor((now - nextUpdate) / 50) + 1);
            }
            frame = requestAnimationFrame(update);
        };
        frame = requestAnimationFrame(update);
        return () => cancelAnimationFrame(frame);
    }, [isPlaying]);

    const toggle = async () => {
        const audio = audioRef.current;
        if (!audio || !file) return;
        if (!audio.paused) {
            audio.pause();
        } else {
            try {
                setError(null);
                await audio.play();
            } catch (cause) {
                if (cause instanceof DOMException && cause.name === "AbortError") return;
                setError("Unable to play this song. Load a supported MP3 and try Play again.");
            }
        }
    };

    const seek = (seconds: number) => {
        const audio = audioRef.current;
        if (!audio || !Number.isFinite(seconds)) return;
        audio.currentTime = Math.max(0, Math.min(seconds, duration));
        setPosition(audio.currentTime);
    };

    return {
        audioRef,
        isPlaying,
        position,
        duration,
        volume,
        error,
        toggle,
        seek,
        setVolume,
        onPlay: () => setIsPlaying(true),
        onPause: () => setIsPlaying(false),
        onSeeked: () => setPosition(audioRef.current?.currentTime ?? 0),
        onLoadedMetadata: () => {
            const value = audioRef.current?.duration;
            setDuration(value && Number.isFinite(value) ? value : 0);
        },
        onError: () => setError("Unable to read this song. Try another MP3 file."),
    };
}
