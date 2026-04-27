type PrismLike = typeof import('prismjs');

const prismComponentLoaders = {
	json: () => import('prismjs/components/prism-json'),
	yaml: () => import('prismjs/components/prism-yaml')
} as const;

let prismPromise: Promise<PrismLike | null> | null = null;
const loadedLanguages = new Set<keyof typeof prismComponentLoaders>();

export async function loadPrism(
	languages: Array<keyof typeof prismComponentLoaders>
): Promise<PrismLike | null> {
	if (typeof window === 'undefined') {
		return null;
	}

	if (!prismPromise) {
		prismPromise = import('prismjs').then((module) => {
			const prism = (module.default ?? module) as PrismLike;
			(globalThis as typeof globalThis & { Prism?: typeof import('prismjs') }).Prism = prism;
			return prism;
		});
	}

	const prism = await prismPromise;

	await Promise.all(
		languages
			.filter((language) => !loadedLanguages.has(language))
			.map(async (language) => {
				await prismComponentLoaders[language]();
				loadedLanguages.add(language);
			})
	);

	return prism;
}

export function escapeHtml(value: string): string {
	return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}
