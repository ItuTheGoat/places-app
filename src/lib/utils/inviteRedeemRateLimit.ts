const STORAGE_KEY = 'placesInviteRedeemRate';

const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

type RateState = {
	strikes: number;
	lockedUntil: number | null;
	hadFirstLockout: boolean;
	hadSecondLockout: boolean;
};

function loadState(): RateState {
	if (typeof localStorage === 'undefined') {
		return {
			strikes: 0,
			lockedUntil: null,
			hadFirstLockout: false,
			hadSecondLockout: false
		};
	}
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) {
			return {
				strikes: 0,
				lockedUntil: null,
				hadFirstLockout: false,
				hadSecondLockout: false
			};
		}
		const parsed = JSON.parse(raw) as Partial<RateState>;
		return {
			strikes: typeof parsed.strikes === 'number' ? parsed.strikes : 0,
			lockedUntil: typeof parsed.lockedUntil === 'number' ? parsed.lockedUntil : null,
			hadFirstLockout: Boolean(parsed.hadFirstLockout),
			hadSecondLockout: Boolean(parsed.hadSecondLockout)
		};
	} catch {
		return {
			strikes: 0,
			lockedUntil: null,
			hadFirstLockout: false,
			hadSecondLockout: false
		};
	}
}

function saveState(state: RateState): void {
	if (typeof localStorage === 'undefined') return;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function canAttemptInviteRedeem(): boolean {
	const state = loadState();
	const now = Date.now();
	if (state.lockedUntil !== null && now < state.lockedUntil) {
		return false;
	}
	return true;
}

export function remainingLockoutMs(): number {
	const state = loadState();
	const now = Date.now();
	if (state.lockedUntil === null || now >= state.lockedUntil) {
		return 0;
	}
	return state.lockedUntil - now;
}

/** Call after an invalid code or failed redeem (not for network errors if you want to be lenient). */
export function recordInviteRedeemFailure(): void {
	const state = loadState();
	const now = Date.now();

	if (state.lockedUntil !== null && now < state.lockedUntil) {
		return;
	}

	if (state.hadSecondLockout) {
		state.lockedUntil = now + ONE_DAY_MS;
		saveState(state);
		return;
	}

	if (state.hadFirstLockout) {
		state.lockedUntil = now + ONE_DAY_MS;
		state.hadSecondLockout = true;
		state.strikes = 0;
		saveState(state);
		return;
	}

	state.strikes += 1;
	if (state.strikes >= 3) {
		state.lockedUntil = now + ONE_HOUR_MS;
		state.hadFirstLockout = true;
		state.strikes = 0;
	}
	saveState(state);
}

/** Call after a successful redeem. */
export function recordInviteRedeemSuccess(): void {
	saveState({
		strikes: 0,
		lockedUntil: null,
		hadFirstLockout: false,
		hadSecondLockout: false
	});
}
