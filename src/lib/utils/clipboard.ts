/**
 * Copies text to the clipboard using the Clipboard API.
 * @param text - The text to copy
 * @returns Promise<boolean> - True if successful, false otherwise
 */
export async function copyToClipboard(text: string): Promise<boolean> {
	if (!text) return false;

	try {
		if (navigator.clipboard && navigator.clipboard.writeText) {
			await navigator.clipboard.writeText(text);
			return true;
		}

		// Fallback for older browsers
		const textArea = document.createElement('textarea');
		textArea.value = text;
		textArea.style.position = 'fixed';
		textArea.style.left = '-9999px';
		textArea.style.top = '-9999px';
		document.body.appendChild(textArea);
		textArea.focus();
		textArea.select();

		const successful = document.execCommand('copy');
		document.body.removeChild(textArea);
		return successful;
	} catch {
		console.error('Failed to copy to clipboard');
		return false;
	}
}
