<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { Hammer, ChevronDown } from 'lucide-svelte';
	import { tools, getToolHref } from '$lib/config/tools';

	let theme = $state('light');
	let mobileMenuOpen = $state(false);
	let dropdownOpen = $state(false);

	onMount(() => {
		// Load theme from localStorage or use system preference
		const stored = localStorage.getItem('theme');
		if (stored) {
			theme = stored;
		} else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
			theme = 'dark';
		}
		document.documentElement.setAttribute('data-theme', theme);
	});

	function toggleTheme() {
		theme = theme === 'light' ? 'dark' : 'light';
		localStorage.setItem('theme', theme);
		document.documentElement.setAttribute('data-theme', theme);
	}

	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}

	function closeMobileMenu() {
		mobileMenuOpen = false;
	}

	function closeDropdown() {
		dropdownOpen = false;
	}

	function isToolActive(toolId: string, pathname: string): boolean {
		return pathname.startsWith(`/${toolId}`);
	}

	function isAnyToolActive(pathname: string): boolean {
		return tools.some((tool) => pathname.startsWith(`/${tool.id}`));
	}
</script>

<nav class="navbar bg-base-200 shadow-lg sticky top-0 z-50">
	<div class="container mx-auto flex flex-row items-center">
		<!-- Logo -->
		<div class="flex-1">
			<a href="/" class="btn btn-ghost text-xl font-bold gap-2" aria-label="Lakitu.dev Home">
				<Hammer class="h-6 w-6 text-primary" />
				Lakitu.dev
			</a>
		</div>

		<!-- Desktop Navigation -->
		<div class="hidden md:flex flex-none">
			<!-- Tools Dropdown -->
			<div class="dropdown dropdown-end">
				<button
					tabindex="0"
					class="btn btn-ghost gap-1"
					class:text-primary={isAnyToolActive($page.url.pathname)}
					aria-haspopup="true"
					aria-expanded={dropdownOpen}
					onclick={() => (dropdownOpen = !dropdownOpen)}
				>
					Tools
					<ChevronDown class="h-4 w-4" />
				</button>
				<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
				<ul
					tabindex="0"
					class="dropdown-content menu bg-base-200 rounded-box z-50 w-56 p-2 shadow-lg mt-2"
				>
					{#each tools as tool}
						{@const Icon = tool.icon}
						{@const href = getToolHref(tool)}
						<li>
							<a
								{href}
								class={isToolActive(tool.id, $page.url.pathname) ? 'active' : ''}
								aria-current={isToolActive(tool.id, $page.url.pathname) ? 'page' : undefined}
								onclick={closeDropdown}
							>
								<Icon class="h-4 w-4" />
								{tool.label}
							</a>
						</li>
					{/each}
				</ul>
			</div>
		</div>

		<!-- Theme Toggle -->
		<div class="flex-none">
			<button
				onclick={toggleTheme}
				class="btn btn-ghost btn-circle"
				aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
			>
				{#if theme === 'light'}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
						/>
					</svg>
				{:else}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
						/>
					</svg>
				{/if}
			</button>
		</div>

		<!-- Mobile Menu Button -->
		<div class="flex-none md:hidden">
			<button
				onclick={toggleMobileMenu}
				class="btn btn-ghost btn-circle"
				aria-label="Toggle mobile menu"
				aria-expanded={mobileMenuOpen}
			>
				{#if mobileMenuOpen}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				{:else}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 6h16M4 12h16M4 18h16"
						/>
					</svg>
				{/if}
			</button>
		</div>
	</div>

	<!-- Mobile Menu Dropdown -->
	{#if mobileMenuOpen}
		<div class="absolute top-full left-0 right-0 bg-base-200 shadow-lg md:hidden">
			<ul class="menu menu-vertical px-4 py-2">
				{#each tools as tool}
					{@const Icon = tool.icon}
					{@const href = getToolHref(tool)}
					<li>
						<a
							{href}
							class={isToolActive(tool.id, $page.url.pathname) ? 'active' : ''}
							aria-current={isToolActive(tool.id, $page.url.pathname) ? 'page' : undefined}
							onclick={closeMobileMenu}
						>
							<Icon class="h-4 w-4" />
							{tool.label}
						</a>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</nav>
