/**
 * Crockford's Base32 alphabet (no I, L, O, U) — see https://www.crockford.com/base32.html
 */
export const CROCKFORD_BASE32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/** Crockford letters that are vowels in this alphabet (I, L, O, U already omitted from Crockford). */
const CROCKFORD_VOWELS = 'AE';

/**
 * For **generating** new codes only: digits + consonants (omit A, E) to reduce word-like strings.
 * Join / normalize accept full {@link CROCKFORD_BASE32} so existing codes stay valid.
 */
export const INVITE_CODE_ALPHABET = [...CROCKFORD_BASE32]
	.filter((c) => !CROCKFORD_VOWELS.includes(c))
	.join('');

export const INVITE_CODE_LEN = 8;

const CROCKFORD_CHAR_SET = new Set(CROCKFORD_BASE32);

/**
 * Normalize user input to canonical Crockford invite (uppercase, strip invalid chars).
 */
export function normalizeInviteCode(raw: string): string {
	return raw
		.trim()
		.toUpperCase()
		.split('')
		.filter((c) => CROCKFORD_CHAR_SET.has(c))
		.join('');
}

/** True if 8 chars and each is in Crockford Base32. */
export function isValidCrockfordInviteCode(s: string): boolean {
	if (s.length !== INVITE_CODE_LEN) return false;
	for (let i = 0; i < s.length; i++) {
		if (!CROCKFORD_CHAR_SET.has(s[i]!)) return false;
	}
	return true;
}

/**
 * Substrings we reject when **generating** codes (case-insensitive).
 * Join still accepts any valid Crockford string (including legacy codes).
 */
const BLOCKED_SUBSTRINGS = [
	'FCK',
	'CNT',
	'DCK',
	'KKK',
	'XXX',
	'NGR',
	'NGG',
	'JNK',
	'PNS',
	'PRN',
	'SHT',
	'WTF',
	'666',
	'1488',
	'420'
];

function isBlockedInviteCode(code: string): boolean {
	const u = code.toUpperCase();
	for (const bad of BLOCKED_SUBSTRINGS) {
		if (u.includes(bad)) return true;
	}
	return false;
}

/**
 * Random 8-character invite using Crockford **consonant-only** alphabet (see {@link INVITE_CODE_ALPHABET}).
 * Regenerates if a blocklisted substring appears.
 */
export function generateListInviteCode(): string {
	const alphabet = INVITE_CODE_ALPHABET;
	const n = alphabet.length;

	for (let attempt = 0; attempt < 48; attempt++) {
		const bytes = new Uint8Array(INVITE_CODE_LEN);
		crypto.getRandomValues(bytes);
		let out = '';
		for (let i = 0; i < INVITE_CODE_LEN; i++) {
			out += alphabet[bytes[i]! % n]!;
		}
		if (!isBlockedInviteCode(out)) {
			return out;
		}
	}

	throw new Error('Could not generate a suitable invite code. Try again.');
}
