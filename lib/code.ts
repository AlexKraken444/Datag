// Datag — room-code generator (6 chars, easy to read aloud, no ambiguous glyphs)
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateRoomCode(length = 6): string {
  let s = "";
  for (let i = 0; i < length; i++) {
    s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return s;
}

export function nicknameValid(n: string): boolean {
  return /^[\p{L}\p{N}_-]{2,16}$/u.test(n);
}
