import { useEffect, useRef, useState } from "react";
import { formatDuration } from "../utils/costCalculator.ts";

export interface AudioPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  volume: number;
  formattedCurrentTime: string;
  formattedDuration: string;
}

export function useAudioPlayback(totalDurationSeconds: number = 0, audioUrl?: string) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [mediaDuration, setMediaDuration] = useState(totalDurationSeconds);
  const [playbackRate, setPlaybackRateState] = useState(1);
  const [volume, setVolumeState] = useState(0.85);

  useEffect(() => {
    setMediaDuration(totalDurationSeconds);
  }, [totalDurationSeconds]);

  useEffect(() => {
    if (!audioUrl) {
      audioRef.current = null;
      setIsPlaying(false);
      setCurrentTime(0);
      return;
    }

    const audio = new Audio(audioUrl);
    audio.preload = "metadata";
    audio.volume = volume;
    audioRef.current = audio;

    const onTime = () => setCurrentTime(audio.currentTime || 0);
    const onMeta = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setMediaDuration(audio.duration);
      }
    };
    const onEnd = () => setIsPlaying(false);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnd);

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnd);
      audioRef.current = null;
    };
  }, [audioUrl]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      void audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const seekTo = (seconds: number) => {
    const limit = mediaDuration || totalDurationSeconds;
    const clamped = Math.max(0, Math.min(seconds, limit || seconds));
    setCurrentTime(clamped);
    if (audioRef.current) audioRef.current.currentTime = clamped;
  };

  const skipSeconds = (delta: number) => {
    seekTo((audioRef.current?.currentTime ?? currentTime) + delta);
  };

  const setPlaybackRate = (rate: number) => {
    setPlaybackRateState(rate);
    if (audioRef.current) audioRef.current.playbackRate = rate;
  };

  const setVolume = (next: number) => {
    const clamped = Math.max(0, Math.min(1, next));
    setVolumeState(clamped);
    if (audioRef.current) audioRef.current.volume = clamped;
  };

  const duration = mediaDuration || totalDurationSeconds;

  return {
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    volume,
    formattedCurrentTime: formatDuration(currentTime),
    formattedDuration: formatDuration(duration),
    togglePlay,
    seekTo,
    skipSeconds,
    setPlaybackRate,
    setVolume,
  };
}
