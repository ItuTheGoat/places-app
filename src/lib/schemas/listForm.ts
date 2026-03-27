import { z } from 'zod';
import { zod, zodClient } from 'sveltekit-superforms/adapters';

export const listFormSchema = z.object({
	name: z.string().trim().min(1, 'List name is required.').max(120)
});

// @ts-expect-error Zod 3.25 schema is assignable at runtime; superforms types expect a looser `ZodObjectType`
export const listFormZodAdapter = zod(listFormSchema);
// @ts-expect-error same as listFormZodAdapter
export const listFormZodClient = zodClient(listFormSchema);

export type ListFormData = z.infer<typeof listFormSchema>;

export function defaultListFormValues(): ListFormData {
	return {
		name: ''
	};
}

export function listFormToFirestoreFields(data: ListFormData): { name: string } {
	return {
		name: data.name.trim()
	};
}
