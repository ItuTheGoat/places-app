import { z } from 'zod';

export const placeRatingReviewSchema = z.object({
	rating: z.union([z.number().int().min(1).max(5), z.null()]),
	review: z.string().max(5000),
	wouldReturn: z.union([z.boolean(), z.null()])
});

export type PlaceRatingReviewFormData = z.infer<typeof placeRatingReviewSchema>;
