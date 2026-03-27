import { z } from 'zod';
import { zod, zodClient } from 'sveltekit-superforms/adapters';

import {
	INVITE_CODE_LEN,
	isValidCrockfordInviteCode,
	normalizeInviteCode
} from '$lib/utils/inviteCode';

export const inviteCodeFormSchema = z.object({
	code: z
		.string()
		.transform((s) => normalizeInviteCode(s))
		.pipe(
			z
				.string()
				.length(INVITE_CODE_LEN, `Enter an ${INVITE_CODE_LEN}-character code.`)
				.refine(
					(s) => isValidCrockfordInviteCode(s),
					'Use Crockford Base32 only (no I, L, O, U).'
				)
		)
});

// @ts-expect-error Zod 3.25 schema is assignable at runtime; superforms types expect a looser `ZodObjectType`
export const inviteCodeFormZodAdapter = zod(inviteCodeFormSchema);
// @ts-expect-error same as inviteCodeFormZodAdapter
export const inviteCodeFormZodClient = zodClient(inviteCodeFormSchema);

export type InviteCodeFormData = z.infer<typeof inviteCodeFormSchema>;

export function defaultInviteCodeFormValues(): InviteCodeFormData {
	return {
		code: ''
	};
}
