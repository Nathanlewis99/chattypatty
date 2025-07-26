"use client";
import { useRef, useEffect } from "react";

export default function useAudioPlayer(rate = 1) {
  const audioRef = useRef(null);

  useEffect(() => {
    if (!audioRef.current) audioRef.current = new Audio();
    audioRef.current.playbackRate = rate;
  }, [rate]);

  const playBlob = (blob) => {
    const url = URL.createObjectURL(blob);
    audioRef.current.src = url;
    audioRef.current.play();
  };

  const playUrl = (url) => {
    audioRef.current.src = url;
    audioRef.current.play();
  };

  return { playBlob, playUrl, audio: audioRef.current };
}
