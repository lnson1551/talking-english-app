'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react'

interface AudioControlsProps {
  userId: string;
  isMuted: boolean;
  audioElement: HTMLAudioElement | null;
}

export default function AudioControls({
  userId,
  isMuted,
  audioElement,
}: AudioControlsProps) {
  const [audioLevel, setAudioLevel] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    if (!audioElement) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    if (!analyserRef.current) {
      const source = audioContextRef.current.createMediaElementSource(audioElement);
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyser.connect(audioContextRef.current.destination);
      analyserRef.current = analyser;
    }

    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const updateLevel = () => {
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setAudioLevel(average);
      animationFrameId.current = requestAnimationFrame(updateLevel);
    };

    updateLevel();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if (analyserRef.current) {
        analyserRef.current.disconnect();
        analyserRef.current = null;
      }
    };
  }, [userId, audioElement]);

  const getVolumeIcon = () => {
    if (isMuted) {
      return <VolumeX className="h-4 w-4 text-destructive" />;
    }

    if (audioLevel > 50) {
      return <Volume2 className="h-4 w-4 text-primary" />;
    }

    return <Volume2 className="h-4 w-4 text-muted-foreground" />;
  };

  const getVolumeBar = () => {
    const width = Math.min((audioLevel / 100) * 100, 100);

    return (
      <div className="w-full bg-muted rounded-full h-1">
        <div
          className="bg-primary h-1 rounded-full transition-all duration-100"
          style={{ width: `${width}%` }}
        />
      </div>
    );
  };

  return (
    <div className="flex items-center gap-2">
      {getVolumeIcon()}
      <div className="w-16">
        {getVolumeBar()}
      </div>
    </div>
  );
} 