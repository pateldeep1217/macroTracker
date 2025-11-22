"use client";

import { useLocalStorage } from "@/features/shared/hooks/useLocalStorage";
import type { AppUser } from "@/utils/supabase/queries";

export function useUserSelection() {
  const [currentUser, setCurrentUser] = useLocalStorage<AppUser | null>(
    "selectedUser",
    null
  );

  const selectUser = (user: AppUser) => {
    setCurrentUser(user);
  };

  const clearUser = () => {
    setCurrentUser(null);
  };

  return {
    currentUser,
    selectUser,
    clearUser,
    isAuthenticated: currentUser !== null,
  } as const;
}
