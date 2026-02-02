'use client';

import React, { useEffect, useRef } from 'react';

interface AudioWaveformProps {
  audioLevel: number;
  frequencyData?: Uint8Array;
  state: 'idle' | 'connecting' | 'listening' | 'processing' | 'speaking' | 'error';
  className?: string;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({ audioLevel, frequencyData, state, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerY = height / 2;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Base gradient - Black background with white waves
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      
      // Get colors from CSS variables
      const getColor = (cssVar: string) => {
        return getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
      };
      
      if (state === 'error') {
        gradient.addColorStop(0, getColor('--audio-error-start'));
        gradient.addColorStop(1, getColor('--audio-error-end'));
      } else if (state === 'listening') {
        gradient.addColorStop(0, getColor('--audio-listening-start'));
        gradient.addColorStop(1, getColor('--audio-listening-end'));
      } else if (state === 'speaking') {
        gradient.addColorStop(0, getColor('--audio-speaking-start'));
        gradient.addColorStop(1, getColor('--audio-speaking-end'));
      } else if (state === 'processing') {
        gradient.addColorStop(0, getColor('--audio-processing-start'));
        gradient.addColorStop(1, getColor('--audio-processing-end'));
      } else {
        gradient.addColorStop(0, getColor('--audio-idle-start'));
        gradient.addColorStop(1, getColor('--audio-idle-end'));
      }

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';

      // Number of bars
      const barCount = 50;
      const barWidth = width / barCount;
      const spacing = barWidth * 0.15;

      // Use frequency data if available for accurate visualization
      if (frequencyData && frequencyData.length > 0 && (state === 'listening' || state === 'speaking')) {
        // Map frequency bins to bars (use first barCount frequency bins)
        const binsToUse = Math.min(barCount, frequencyData.length);
        const binStep = Math.floor(frequencyData.length / binsToUse);
        
        for (let i = 0; i < barCount; i++) {
          const x = i * barWidth + spacing;
          const binIndex = Math.min(Math.floor(i * binStep), frequencyData.length - 1);
          const frequencyValue = frequencyData[binIndex] / 255;
          
          // Apply smoothing and scaling
          const smoothed = frequencyValue * 0.7 + (i > 0 ? (frequencyData[Math.min(binIndex - binStep, frequencyData.length - 1)] / 255) * 0.3 : 0);
          const scaled = Math.pow(smoothed, 0.6); // Square root for better visual response
          
          const maxHeight = state === 'speaking' ? height * 0.6 : height * 0.5;
          const barHeight = maxHeight * scaled * (0.3 + audioLevel * 0.7);
          const y = centerY - barHeight / 2;
          
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + barHeight);
          ctx.stroke();
        }
      } else {
        // Fallback to state-based visualization when no frequency data
        if (state === 'idle' || state === 'connecting') {
          const pulse = Math.sin(Date.now() / 1000) * 0.3 + 0.7;
          for (let i = 0; i < barCount; i++) {
            const x = i * barWidth + spacing;
            const barHeight = (height * 0.08) * pulse;
            const y = centerY - barHeight / 2;
            
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, y + barHeight);
            ctx.stroke();
          }
        } else if (state === 'listening') {
          const intensity = audioLevel * 0.8 + 0.2;
          for (let i = 0; i < barCount; i++) {
            const x = i * barWidth + spacing;
            const progress = i / barCount;
            const centerDistance = Math.abs(progress - 0.5) * 2;
            const barHeight = (height * 0.4) * intensity * (1 - centerDistance * 0.5);
            const y = centerY - barHeight / 2;
            
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, y + barHeight);
            ctx.stroke();
          }
        } else if (state === 'processing') {
          const time = Date.now() / 500;
          for (let i = 0; i < barCount; i++) {
            const x = i * barWidth + spacing;
            const wave = Math.sin(time + i * 0.2) * 0.5 + 0.5;
            const barHeight = (height * 0.3) * wave;
            const y = centerY - barHeight / 2;
            
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, y + barHeight);
            ctx.stroke();
          }
        } else if (state === 'speaking') {
          const intensity = audioLevel * 0.9 + 0.1;
          for (let i = 0; i < barCount; i++) {
            const x = i * barWidth + spacing;
            const progress = i / barCount;
            const centerDistance = Math.abs(progress - 0.5) * 2;
            const variation = Math.sin(Date.now() / 100 + i * 0.3) * 0.3 + 0.7;
            const barHeight = (height * 0.5) * intensity * variation * (1 - centerDistance * 0.3);
            const y = centerY - barHeight / 2;
            
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, y + barHeight);
            ctx.stroke();
          }
        } else if (state === 'error') {
          const pulse = Math.sin(Date.now() / 200) * 0.5 + 0.5;
          for (let i = 0; i < barCount; i++) {
            const x = i * barWidth + spacing;
            const barHeight = (height * 0.2) * pulse;
            const y = centerY - barHeight / 2;
            
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, y + barHeight);
            ctx.stroke();
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [audioLevel, frequencyData, state]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={400}
      className={className}
      style={{
        width: '100%',
        height: '100%',
      }}
    />
  );
};
