// frontend/src/services/userService.ts

// Predpokladáme, že User typ je definovaný globálne, napr. v AuthContext
// Ak nie, definuj ho tu alebo importuj z app.schemas.user (ak by si mal zdieľané typy)
export interface User {
    id: number;
    email: string;
    full_name: string | null;
    is_active: boolean;
    // Pridaj ďalšie polia, ak ich User schéma má
  }
  
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  
  export interface UserUpdatePayload {
    full_name?: string | null; // Povoliť null na vymazanie mena
  }
  
  export const updateCurrentUserProfile = async (
    userData: UserUpdatePayload,
    token: string
  ): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
  
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Failed to update profile' }));
      throw new Error(errorData.detail || 'Failed to update profile');
    }
    return response.json();
  };