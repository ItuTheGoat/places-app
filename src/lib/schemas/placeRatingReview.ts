import { z } from 'zod';

export const placeRatingReviewSchema = z.object({
	rating: z.union([
		z
			.number()
			.int('Choose a whole-number star rating.')
			.min(1, 'Choose a rating from 1 to 5 stars.')
			.max(5, 'Choose a rating from 1 to 5 stars.'),
		z.null()
	]),
	review: z.string().max(5000, 'Shorten your review.'),
	wouldReturn: z.union([z.boolean(), z.null()])
});

export type PlaceRatingReviewFormData = z.infer<typeof placeRatingReviewSchema>;
