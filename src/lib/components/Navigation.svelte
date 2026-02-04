<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { Hammer } from 'lucide-svelte';

	let theme = $state('light');
	let mobileMenuOpen = $state(false);

	const navLinks = [
		{ href: '/', label: 'Home' },
		{ href: '/base64', label: 'Base64' },
		{ href: '/json', label: 'JSON' },
		{ href: '/jwt', label: 'JWT' },
		{ href: '/uuid', label: 'UUID' }
	];

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

	function isActive(href: string, pathname: string): boolean {
		if (href === '/') {
			return pathname === '/';
		}
		return pathname.startsWith(href);
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
			<ul class="menu menu-horizontal px-1 gap-1">
				{#each navLinks as link}
					<li>
						<a
							href={link.href}
							class={isActive(link.href, $page.url.pathname) ? 'active' : ''}
							aria-current={isActive(link.href, $page.url.pathname) ? 'page' : undefined}
						>
							{link.label}
						</a>
					</li>
				{/each}
			</ul>
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
				{#each navLinks as link}
					<li>
						<a
							href={link.href}
							class={isActive(link.href, $page.url.pathname) ? 'active' : ''}
							aria-current={isActive(link.href, $page.url.pathname) ? 'page' : undefined}
							onclick={closeMobileMenu}
						>
							{link.label}
						</a>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</nav>
