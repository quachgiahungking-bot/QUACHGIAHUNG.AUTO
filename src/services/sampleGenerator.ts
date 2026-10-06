import { MediaClip } from '../types/video';

interface SampleClipSpec {
  name: string;
  sourceLabel: string;
  title: string;
  subtitle: string;
  accentColor: string;
  drawScene: (ctx: CanvasRenderingContext2D, width: number, height: number, progress: number) => void;
}

const SAMPLE_SPECS: SampleClipSpec[] = [
  {
    name: '01_Gemini_Bugatti_Exterior.mp4',
    sourceLabel: 'Gemini AI',
    title: 'BUGATTI TYPE 46',
    subtitle: 'La Petite Royale · Exterior Reveal',
    accentColor: '#d97706',
    drawScene: (ctx, width, height, progress) => {
      // Cinematic dark showroom with golden spotlight sweep
      const grad = ctx.createRadialGradient(
        width * 0.5 + Math.sin(progress * Math.PI * 2) * 120,
        height * 0.45,
        50,
        width * 0.5,
        height * 0.5,
        width * 0.7
      );
      grad.addColorStop(0, '#241a0e');
      grad.addColorStop(0.5, '#12141a');
      grad.addColorStop(1, '#07080b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Floor reflection line
      const floorY = height * 0.72;
      ctx.strokeStyle = 'rgba(217, 119, 6, 0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, floorY);
      ctx.lineTo(width, floorY);
      ctx.stroke();

      // Stylized vintage car silhouette
      const carX = width * 0.5 - 280 + Math.sin(progress * 3) * 10;
      const carY = floorY - 140;

      ctx.save();
      ctx.translate(carX, carY);

      // Chrome highlight sweep
      ctx.strokeStyle = `rgba(255, 230, 180, ${0.4 + Math.sin(progress * 6) * 0.4})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      // Long hood curve
      ctx.moveTo(40, 90);
      ctx.bezierCurveTo(80, 50, 160, 45, 260, 45); // long vintage hood
      ctx.bezierCurveTo(320, 45, 340, 10, 400, 10); // windshield
      ctx.bezierCurveTo(460, 10, 500, 30, 540, 80); // rear fastback
      ctx.lineTo(550, 110);
      ctx.lineTo(20, 110);
      ctx.closePath();
      ctx.stroke();

      // Vintage Wire Wheels
      const drawWheel = (wx: number, wy: number) => {
        ctx.fillStyle = '#0f1115';
        ctx.beginPath();
        ctx.arc(wx, wy, 34, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#e5a93c';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Spokes rotation
        const spokeAngle = progress * Math.PI * 6;
        for (let i = 0; i < 8; i++) {
          const a = spokeAngle + (i * Math.PI) / 4;
          ctx.beginPath();
          ctx.moveTo(wx, wy);
          ctx.lineTo(wx + Math.cos(a) * 30, wy + Math.sin(a) * 30);
          ctx.stroke();
        }
      };

      drawWheel(110, 115);
      drawWheel(460, 115);

      // Vintage Headlamp beam
      const beamGrad = ctx.createLinearGradient(0, 75, -200, 85);
      beamGrad.addColorStop(0, 'rgba(255, 240, 200, 0.4)');
      beamGrad.addColorStop(1, 'rgba(255, 240, 200, 0)');
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(35, 75);
      ctx.lineTo(-180, 40);
      ctx.lineTo(-180, 120);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    },
  },
  {
    name: '02_Gemini_Engine_Detail.mp4',
    sourceLabel: 'Gemini AI',
    title: '5.4L STRAIGHT-8',
    subtitle: 'Twin Ignition · Mechanical Precision',
    accentColor: '#38bdf8',
    drawScene: (ctx, width, height, progress) => {
      // Metallic mechanical studio
      ctx.fillStyle = '#0a0d14';
      ctx.fillRect(0, 0, width, height);

      // Technical grid lines
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 8 Cylinders pulsating
      const startX = width * 0.5 - 260;
      const cy = height * 0.52;
      for (let i = 0; i < 8; i++) {
        const offset = Math.sin(progress * Math.PI * 4 + i * 0.8) * 25;
        const cx = startX + i * 72;

        // Cylinder block
        ctx.fillStyle = '#1e2433';
        ctx.fillRect(cx - 24, cy - 80, 48, 160);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(cx - 24, cy - 80, 48, 160);

        // Piston
        ctx.fillStyle = '#60a5fa';
        ctx.fillRect(cx - 20, cy - 60 + offset, 40, 40);

        // Spark effect
        if (Math.abs(offset) > 20) {
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(cx, cy - 75, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    },
  },
  {
    name: '03_Gemini_Cockpit_Interior.mp4',
    sourceLabel: 'Gemini AI',
    title: 'LUXURY COCKPIT',
    subtitle: 'Polished Walnut & Connolly Leather',
    accentColor: '#f97316',
    drawScene: (ctx, width, height, progress) => {
      ctx.fillStyle = '#0d0907';
      ctx.fillRect(0, 0, width, height);

      // Wooden dashboard glow
      const woodGrad = ctx.createLinearGradient(0, height * 0.3, width, height * 0.8);
      woodGrad.addColorStop(0, '#361b10');
      woodGrad.addColorStop(0.5, '#5c2d1b');
      woodGrad.addColorStop(1, '#241108');
      ctx.fillStyle = woodGrad;
      ctx.fillRect(width * 0.1, height * 0.35, width * 0.8, height * 0.45);

      // Brass Gauges
      const gaugeCenters = [width * 0.35, width * 0.5, width * 0.65];
      gaugeCenters.forEach((gx, idx) => {
        const gy = height * 0.55;
        ctx.fillStyle = '#1a1410';
        ctx.beginPath();
        ctx.arc(gx, gy, 55, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Needle needle animation
        const angle = -Math.PI * 0.75 + ((progress * 1.5 + idx * 0.3) % 1) * Math.PI * 1.5;
        ctx.strokeStyle = '#f87171';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(gx, gy);
        ctx.lineTo(gx + Math.cos(angle) * 42, gy + Math.sin(angle) * 42);
        ctx.stroke();
      });

      // Wooden Steering wheel arch
      ctx.strokeStyle = '#8b4513';
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.arc(width * 0.5, height * 0.95, 240, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
    },
  },
  {
    name: '04_Flow_Aerodynamics.mp4',
    sourceLabel: 'Google Flow',
    title: 'AERODYNAMIC FLOW',
    subtitle: 'Virtual Wind Tunnel · Streamline Simulation',
    accentColor: '#10b981',
    drawScene: (ctx, width, height, progress) => {
      ctx.fillStyle = '#06100d';
      ctx.fillRect(0, 0, width, height);

      // Animated wind stream vectors
      const numLines = 24;
      for (let i = 0; i < numLines; i++) {
        const yBase = (height / (numLines + 1)) * (i + 1);
        ctx.beginPath();
        ctx.strokeStyle = `rgba(16, 185, 129, ${0.15 + (i % 3) * 0.25})`;
        ctx.lineWidth = 2;

        const waveSpeed = progress * Math.PI * 4;
        for (let x = 0; x <= width; x += 30) {
          // Deflection around virtual car silhouette
          const distToCenter = Math.abs(x - width * 0.5);
          let deflection = 0;
          if (distToCenter < 240) {
            deflection = Math.sin((distToCenter / 240) * Math.PI) * (yBase < height * 0.55 ? -40 : 25);
          }
          const y = yBase + deflection + Math.sin(x * 0.02 + waveSpeed + i) * 6;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Stream particles
      for (let p = 0; p < 35; p++) {
        const px = ((p * 55 + progress * 800) % (width + 60)) - 30;
        const py = height * 0.25 + ((p * 37) % (height * 0.55));
        ctx.fillStyle = '#34d399';
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  },
  {
    name: '05_Flow_Speed_Run.mp4',
    sourceLabel: 'Google Flow',
    title: 'THE RECORD RUN',
    subtitle: '1930 Montlhéry Circuit · Reborn 2026',
    accentColor: '#8b5cf6',
    drawScene: (ctx, width, height, progress) => {
      ctx.fillStyle = '#090814';
      ctx.fillRect(0, 0, width, height);

      // Speed blur streaks
      const numStreaks = 40;
      for (let s = 0; s < numStreaks; s++) {
        const sx = ((s * 48 - progress * 1200) % width + width) % width;
        const sy = (s * 33) % height;
        const sLen = 80 + (s % 5) * 40;

        const grad = ctx.createLinearGradient(sx, sy, sx + sLen, sy);
        grad.addColorStop(0, 'rgba(139, 92, 246, 0)');
        grad.addColorStop(0.5, 'rgba(192, 132, 252, 0.4)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0.8)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + sLen, sy);
        ctx.stroke();
      }

      // Speedometer telemetry HUD in corner
      const speed = Math.round(145 + Math.sin(progress * Math.PI * 2) * 15);
      ctx.fillStyle = '#a855f7';
      ctx.font = 'bold 36px "JetBrains Mono", monospace';
      ctx.fillText(`${speed} KM/H`, width - 240, height - 70);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.fillText('HISTORIC SPEED RUN · TRACK 04', width - 240, height - 45);
    },
  },
];

/**
 * Creates a real playable video blob for a sample documentary clip
 */
async function generateSampleVideoBlob(
  spec: SampleClipSpec,
  clipIndex: number,
  durationSeconds: number = 3.5
): Promise<{ blob: Blob; blobUrl: string; thumbnailUrl: string }> {
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext('2d')!;

  // Prepare Audio Synthesizer to give the sample clips real audio tracks
  const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  const dest = audioCtx.createMediaStreamDestination();

  // Create ambient cinematic chord
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const chordFreqs = [110, 138.59, 164.81, 220, 277.18]; // A Major cinematic chords
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(chordFreqs[clipIndex % chordFreqs.length], audioCtx.currentTime);

  // Soft low-pass filter
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(320 + clipIndex * 60, audioCtx.currentTime);

  gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + durationSeconds);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(dest);
  osc.start();

  // Combine canvas stream + synthesized audio stream
  const canvasStream = canvas.captureStream(30);
  const combinedStream = new MediaStream([
    ...canvasStream.getVideoTracks(),
    ...dest.stream.getAudioTracks(),
  ]);

  // Determine supported mime type
  const mimeTypes = [
    'video/mp4;codecs=avc1,mp4a.40.2',
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm',
  ];
  let chosenMime = mimeTypes.find((m) => MediaRecorder.isTypeSupported(m)) || 'video/webm';

  const recorder = new MediaRecorder(combinedStream, {
    mimeType: chosenMime,
    videoBitsPerSecond: 3_500_000,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  return new Promise((resolve) => {
    recorder.onstop = () => {
      audioCtx.close().catch(() => {});
      const videoBlob = new Blob(chunks, { type: chosenMime });
      const blobUrl = URL.createObjectURL(videoBlob);
      // Capture thumbnail
      const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.85);
      resolve({ blob: videoBlob, blobUrl, thumbnailUrl });
    };

    recorder.start(100);

    const startTime = performance.now();
    const totalMs = durationSeconds * 1000;

    const renderFrame = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1.0, elapsed / totalMs);

      // Draw domain visual scene
      spec.drawScene(ctx, canvas.width, canvas.height, progress);

      // Draw cinematic letterbox bars
      ctx.fillStyle = '#050608';
      ctx.fillRect(0, 0, canvas.width, 36);
      ctx.fillRect(0, canvas.height - 36, canvas.width, 36);

      // Cinematic corner watermark
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.font = '600 12px "JetBrains Mono", monospace';
      ctx.fillText(`THEKINGGEMS · ${spec.sourceLabel.toUpperCase()}`, 40, 24);

      // Clip title overlay
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.font = '700 24px "Cinzel", Georgia, serif';
      ctx.fillText(spec.title, 40, canvas.height - 70);

      ctx.fillStyle = spec.accentColor;
      ctx.font = '500 13px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(spec.subtitle, 40, canvas.height - 48);

      // Sequence indicator
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '600 14px "JetBrains Mono", monospace';
      ctx.fillText(`CLIP 0${clipIndex + 1}/05`, canvas.width - 150, 24);

      if (elapsed < totalMs) {
        requestAnimationFrame(renderFrame);
      } else {
        recorder.stop();
      }
    };

    requestAnimationFrame(renderFrame);
  });
}

/**
 * Generates the full set of 5 sample documentary clips
 */
export async function generateFiveSampleClips(
  onProgress?: (index: number, total: number) => void
): Promise<MediaClip[]> {
  const clips: MediaClip[] = [];

  for (let i = 0; i < SAMPLE_SPECS.length; i++) {
    onProgress?.(i + 1, SAMPLE_SPECS.length);
    const spec = SAMPLE_SPECS[i];
    const { blob, blobUrl, thumbnailUrl } = await generateSampleVideoBlob(spec, i, 3.5);

    const file = new File([blob], spec.name, { type: blob.type });

    clips.push({
      id: `sample-${Date.now()}-${i}`,
      name: spec.name,
      file,
      blobUrl,
      type: 'video',
      duration: 3.5,
      originalWidth: 1280,
      originalHeight: 720,
      thumbnailUrl,
      imageDuration: 5,
      volume: 1,
      muted: false,
      sourceLabel: spec.sourceLabel,
      fileSizeFormatted: `${(blob.size / 1024 / 1024).toFixed(1)} MB`,
    });
  }

  return clips;
}
