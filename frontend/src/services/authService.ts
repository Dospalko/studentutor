
/**
 * authService.ts
 *
 * Authentication and password reset service functions for Studentutor frontend.
 * Provides API calls for requesting password reset and resetting password using a token.
 *
 * Usage:
 *   import { requestPasswordReset, resetPassword } from '@/services/authService';
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';


/**
 * Request a password reset link to be sent to the user's email address.
 *
 * @param email The user's email address.
 * @returns Promise with API response (usually a message about email sent).
 * @throws Error if the request fails or the API returns an error.
 */
export async function requestPasswordReset(email: string): Promise<unknown> {
    const response = await fetch(`${API_BASE_URL}/auth/password-recovery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail || 'Failed to request password reset.');
    }
    return data;
}


/**
 * Reset the user's password using a reset token and a new password.
 *
 * @param token The password reset token received by email.
 * @param new_password The new password to set.
 * @returns Promise with API response (usually a success message).
 * @throws Error if the request fails or the API returns an error.
 */
export async function resetPassword(token: string, new_password: string): Promise<unknown> {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password }),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail || 'Failed to reset password.');
    }
    return data;
}