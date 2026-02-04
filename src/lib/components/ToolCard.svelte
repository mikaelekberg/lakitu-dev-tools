<script lang="ts">
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	type IconComponent = any;

	interface Props {
		title: string;
		description: string;
		href: string;
		icon?: IconComponent;
	}

	let { title, description, href, icon: Icon }: Props = $props();
</script>

<a
	{href}
	class="card bg-base-200 hover:bg-base-300 transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
>
	<div class="card-body">
		<h2 class="card-title">
			{#if Icon}
				<Icon class="w-6 h-6" />
			{/if}
			{title}
		</h2>
		<p class="text-base-content/70">{description}</p>
		<div class="card-actions justify-end mt-2">
			<span class="text-primary text-sm font-medium"> Open tool &rarr; </span>
		</div>
	</div>
</a>
