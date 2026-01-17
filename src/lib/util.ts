export function randomCode(len = 6) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  crypto.getRandomValues(new Uint32Array(len)).forEach((n) => {
    out += alphabet[n % alphabet.length];
  });
  return out;
}

export function randomSecret(len = 32) {
  const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_";
  let out = "";
  crypto.getRandomValues(new Uint32Array(len)).forEach((n) => {
    out += alphabet[n % alphabet.length];
  });
  return out;
}

export function randomId(len = 20) {
  const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "";
  crypto.getRandomValues(new Uint32Array(len)).forEach((n) => {
    out += alphabet[n % alphabet.length];
  });
  return out;
}

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function formatMMSS(totalSec: number) {
  const s = Math.max(0, Math.floor(totalSec));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}
