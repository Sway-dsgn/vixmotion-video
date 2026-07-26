import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  name: string;
  email: string;
}

interface AuthState {
  isLoggedIn: boolean;
  user: User | null;
  login: (name: string, email: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      user: null,
      login: (name, email) => set({ isLoggedIn: true, user: { name, email } }),
      logout: () => {
        set({ isLoggedIn: false, user: null });
      },
    }),
    { name: "vixmotion-auth" },
  ),
);
