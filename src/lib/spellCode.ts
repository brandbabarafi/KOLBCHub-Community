// Ejaan kode voucher ke bahasa Indonesia, per karakter.
// Contoh: "bRf?2" -> "be kecil - er besar - ef kecil - tanda tanya - dua"

const HURUF: Record<string, string> = {
  a: 'a', b: 'be', c: 'ce', d: 'de', e: 'e', f: 'ef', g: 'ge', h: 'ha',
  i: 'i', j: 'je', k: 'ka', l: 'el', m: 'em', n: 'en', o: 'o', p: 'pe',
  q: 'ki', r: 'er', s: 'es', t: 'te', u: 'u', v: 've', w: 'we', x: 'eks',
  y: 'ye', z: 'zet',
};

const ANGKA: Record<string, string> = {
  '0': 'nol', '1': 'satu', '2': 'dua', '3': 'tiga', '4': 'empat',
  '5': 'lima', '6': 'enam', '7': 'tujuh', '8': 'delapan', '9': 'sembilan',
};

const SPESIAL: Record<string, string> = {
  '?': 'tanda tanya', '!': 'tanda seru', '@': 'at', '#': 'pagar', '$': 'dolar',
  '%': 'persen', '&': 'ampersand', '*': 'bintang', '-': 'strip', '_': 'garis bawah',
  '+': 'plus', '=': 'sama dengan', '/': 'garis miring', '\\': 'garis miring terbalik',
  '.': 'titik', ',': 'koma', ':': 'titik dua', ';': 'titik koma',
  '(': 'kurung buka', ')': 'kurung tutup', '[': 'kurung siku buka', ']': 'kurung siku tutup',
  '{': 'kurung kurawal buka', '}': 'kurung kurawal tutup', ' ': 'spasi',
  "'": 'petik satu', '"': 'petik dua', '<': 'kurang dari', '>': 'lebih dari',
  '|': 'garis tegak', '~': 'gelombang', '`': 'aksen', '^': 'sirkumfleks',
};

/** Eja satu karakter jadi bahasa Indonesia. */
function spellChar(ch: string): string {
  if (/[a-z]/.test(ch)) return `${HURUF[ch]} kecil`;
  if (/[A-Z]/.test(ch)) return `${HURUF[ch.toLowerCase()]} besar`;
  if (/[0-9]/.test(ch)) return ANGKA[ch];
  if (SPESIAL[ch]) return SPESIAL[ch];
  return ch; // fallback: karakter tak dikenal tampil apa adanya
}

/** Eja seluruh kode, dipisah " - ". */
export function spellCode(code: string | null | undefined): string {
  if (!code) return '';
  return code.split('').map(spellChar).join(' - ');
}
