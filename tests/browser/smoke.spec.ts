import { expect, test } from '@playwright/test';

test('all tool pages load without browser errors', async ({ page }) => {
	const errors: string[] = [];
	page.on('pageerror', (error) => errors.push(error.message));
	for (const route of [
		'/',
		'/base64',
		'/json',
		'/jwt',
		'/uuid',
		'/cron',
		'/regex',
		'/subnet',
		'/unix-time',
		'/yaml'
	]) {
		const response = await page.goto(route);
		expect(response?.status()).toBe(200);
		await expect(page.locator('main h1')).toBeVisible();
	}
	expect(errors).toEqual([]);
});

test('navigation and theme switching work', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('button', { name: 'Tools', exact: true }).click();
	await page.locator('nav').getByRole('link', { name: 'JSON', exact: true }).click();
	await expect(page).toHaveURL(/\/json$/);
	await page.getByRole('button', { name: 'Switch to dark mode' }).click();
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
	await page.reload();
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('Base64 encoding and decoding work', async ({ page }) => {
	await page.goto('/base64');
	const input = page.getByPlaceholder('Enter text to encode or Base64 to decode...');
	await input.fill('hello');
	await page.getByRole('button', { name: 'Encode', exact: true }).click();
	await expect(page.locator('textarea').nth(1)).toHaveValue('aGVsbG8=');
	await input.fill('aGVsbG8=');
	await page.getByRole('button', { name: 'Decode', exact: true }).click();
	await expect(page.locator('textarea').nth(1)).toHaveValue('hello');
});

test('JSON formatting and invalid input handling work', async ({ page }) => {
	await page.goto('/json');
	const input = page.getByPlaceholder('Enter JSON here, e.g. {"key": "value"}');
	await input.fill('{"hello":"world"}');
	await page.getByRole('button', { name: 'Format', exact: true }).click();
	await expect(page.locator('pre')).toContainText('"hello": "world"');
	await input.fill('{invalid');
	await page.getByRole('button', { name: 'Format', exact: true }).click();
	await expect(page.getByRole('alert').first()).toBeVisible();
});
