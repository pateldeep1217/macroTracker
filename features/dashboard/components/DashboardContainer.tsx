"use client";

import { useState } from "react";
import { UserSelectionScreen } from "@/features/user/components/UserSelectionScreen";
import { MainDashboard } from "./MainDashboard";
import type { AppUser } from "@/utils/supabase/queries";

interface DashboardContainerProps {
  readonly users: readonly AppUser[];
}

export function DashboardContainer({ users }: DashboardContainerProps) {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    // Check if we're in the browser before accessing localStorage
    if (typeof window === "undefined") {
      return null;
    }

    // Lazy initialization - only runs once on mount
    const savedUser = localStorage.getItem("selectedUser");
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser) as AppUser;
        // Verify user still exists
        if (users.some((u) => u.id === parsedUser.id)) {
          return parsedUser;
        }
      } catch (error) {
        console.error("Failed to parse saved user:", error);
        localStorage.removeItem("selectedUser");
      }
    }
    return null;
  });

  const selectUser = (user: AppUser) => {
    setCurrentUser(user);
    localStorage.setItem("selectedUser", JSON.stringify(user));
  };

  const clearUser = () => {
    setCurrentUser(null);
    localStorage.removeItem("selectedUser");
  };

  if (!currentUser) {
    return <UserSelectionScreen users={users} onSelectUser={selectUser} />;
  }

  return (
    <MainDashboard
      currentUser={currentUser}
      allUsers={users}
      onSwitchUser={clearUser}
    />
  );
}
