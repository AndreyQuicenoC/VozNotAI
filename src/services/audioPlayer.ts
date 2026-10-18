import { useState, useEffect, useRef } from "react";
import { formatDuration } from "../utils/costCalculator.ts";

export interface AudioPlayerState {
  isPlaying: boolean;
  currentTime: number; // in seconds
  duration: number; // in seconds
  playbackRate: number;
  volume: number;
  formattedCurrentTime: string;
  formattedDuration: string;
}

export function useAudioPlayback(totalDurationSeconds: number = 2538) {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(872); // Starts at 14:32 as in screenshot
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [volume, setVolume] = useState<number>(0.85);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(Date.now());

  // Web Audio Synth setup for ambient acoustic feedback
  const startAudioFeedback = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioCtxRef.current && AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }
      if (audioCtxRef.current && !oscRef.current) {
        const osc = audioCtxRef.current.createOscillator();
        const gain = audioCtxRef.current.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(196, audioCtxRef.current.currentTime); // Gentle acoustic tone G3
        gain.gain.setValueAtTime(volume * 0.03, audioCtxRef.current.currentTime);
        osc.connect(gain);
        gain.connect(audioCtxRef.current.destination);
        osc.start();
        oscRef.current = osc;
        gainRef.current = gain;
      }
    } catch {
      // AudioContext not permitted or unsupported
    }
  };

  const stopAudioFeedback = () => {
    if (oscRef.current) {
      try {
        oscRef.current.stop();
        oscRef.current.disconnect();
      } catch {
        // ignore
      }
      oscRef.current = null;
    }
  };

  // Update volume
  useEffect(() => {
    if (gainRef.current && audioCtxRef.current) {
      gainRef.current.gain.setValueAtTime(volume * 0.03, audioCtxRef.current.currentTime);
    }
  }, [volume]);

  // Main playback timer loop
  useEffect(() => {
    if (isPlaying) {
      startAudioFeedback();
      lastTimeRef.current = Date.now();

      const tick = () => {
        const now = Date.now();
        const deltaSeconds = (now - lastTimeRef.current) / 1000;
        lastTimeRef.current = now;

        setCurrentTime((prev) => {
          const next = prev + deltaSeconds * playbackRate;
          if (next >= totalDurationSeconds) {
            setIsPlaying(false);
            return totalDurationSeconds;
          }
          return next;
        });

        animFrameRef.current = requestAnimationFrame(tick);
      };

      animFrameRef.current = requestAnimationFrame(tick);
    } else {
      stopAudioFeedback();
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    }

    return () => {
      stopAudioFeedback();
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying, playbackRate, totalDurationSeconds]);

  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  const seekTo = (seconds: number) => {
    const clamped = Math.max(0, Math.min(seconds, totalDurationSeconds));
    setCurrentTime(clamped);
  };

  const skipSeconds = (delta: number) => {
    seekTo(currentTime + delta);
  };

  return {
    isPlaying,
    currentTime,
    duration: totalDurationSeconds,
    playbackRate,
    volume,
    formattedCurrentTime: formatDuration(currentTime),
    formattedDuration: formatDuration(totalDurationSeconds),
    togglePlay,
    seekTo,
    skipSeconds,
    setPlaybackRate,
    setVolume,
  };
}
