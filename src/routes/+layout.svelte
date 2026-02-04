<script lang="ts">
	import '../app.css';
	import Navigation from '$lib/components/Navigation.svelte';

	interface Props {
		children: import('svelte').Snippet;
	}

	let { children }: Props = $props();
</script>

<div class="min-h-screen bg-base-100 flex flex-col">
	<Navigation />
	<main class="container mx-auto px-4 py-8 flex-1">
		{@render children()}
	</main>
	<footer class="footer footer-center p-4 bg-base-200 text-base-content">
		<aside>
			<p>Lakitu.dev - Developer Tools</p>
		</aside>
	</footer>
</div>
