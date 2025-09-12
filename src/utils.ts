import { subtle } from 'crypto';
import { IMousePoint, IMouseTraceParams } from './types';

export const getRandomNumber = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const generateMouseTrace = (params: IMouseTraceParams = {}): IMousePoint[] => {
  const points: IMousePoint[] = [];
  let { from, to, intervalMs = 500, durationMs = getRandomNumber(2000, 15_000) } = params;

  from ??= {
    x: getRandomNumber(1080 / 2, 1080),
    y: getRandomNumber(720 / 2, 720),
  };
  to ??= {
    x: getRandomNumber(from.x - 300, from.x + 300),
    y: getRandomNumber(from.y - 300, from.y + 300),
  };

  const totalSteps = Math.floor(durationMs / intervalMs);
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  for (let step = 0; step < totalSteps; step++) {
    const t = Math.min(1, step / totalSteps);

    const easedT = t * (2 - t);

    const noiseX = (Math.random() - 0.5) * 6;
    const noiseY = (Math.random() - 0.5) * 6;

    const x = Math.round(from.x + dx * easedT + noiseX);
    const y = Math.round(from.y + dy * easedT + noiseY);

    points.push({ x, y });
  }

  return points;
};

export const getSerializedObjectSizeInKB = (object: Record<string, unknown>) => {
  let totalKB = 0;
  Object.keys(object).forEach(key => {
    const value = object[key];
    if (value) {
      const bytes = JSON.stringify(value).length;
      totalKB += bytes;
    }
  });
  return totalKB / 1024;
};

export const removeFirstElementFromAllArrays = (object: Record<string, unknown[]>) => {
  Object.keys(object).forEach(t => {
    const array = object[t];
    if (array) array.shift();
  });
};

export const computeHashWithNonce = async (input: string, nonce: number) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(input + nonce);
  const hashBuffer = await subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

export const generatePoW = async (input: string, difficulty: number) => {
  let nonce = 0;
  let hash = '';

  while (!hash.startsWith('0'.repeat(difficulty))) {
    nonce++;
    hash = await computeHashWithNonce(input, nonce);
  }

  return hash;
};
