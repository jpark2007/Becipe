/**
 * Strip HTML tags and dangerous characters from user input.
 * Used to prevent XSS when displaying user-generated content.
 */
export function sanitizeText(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Sanitize text and also trim + limit length.
 */
export function sanitizeInput(input: string, maxLength: number = 5000): string {
  return sanitizeText(input.trim()).slice(0, maxLength);
}
