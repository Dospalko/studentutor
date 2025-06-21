// frontend/src/services/authService.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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