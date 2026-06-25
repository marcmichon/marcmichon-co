import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const articles = defineCollection({
	loader: glob({
		pattern: '**/*.md',
		base: './src/content/articles',
	}),
	schema: z.object({
		title: z.string(),
		description: z.string(),

		category: z.enum([
			'VM Fundamentals',
			'Exposure Management',
			'Threat Intelligence',
			'Security Operations',
			'Architecture',
			'Automation',
			'Cloud',
			'MSSP / RUN',
		]),

		difficulty: z.enum([
			'Fondamentaux',
			'Intermédiaire',
			'Avancé',
			'Expert',
		]),

		heroImage: z.string(),

		pubDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),

		technologies: z.array(z.string()).default([]),
		readingTime: z.string().optional(),
		featured: z.boolean().default(false),
		tags: z.array(z.string()).default([]),
	}),
});

export const collections = {
	articles,
};