"use client";

import { useState } from "react";
import { UserSelectionScreen } from "../customComponents/user-selection-screen";

import type { AppUser } from "@/utils/supabase/queries";
import { MainDashboard } from "../customComponents/dashboard-view";

interface HomeContentProps {
  users: AppUser[];
}

export function HomeContent({ users }: HomeContentProps) {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    if (typeof window === "undefined") return null;

    const savedUserId = localStorage.getItem("selectedUserId");
    const savedUserName = localStorage.getItem("selectedUserName");

    if (savedUserId && savedUserName) {
      return {
        id: savedUserId,
        name: savedUserName,
        created_at: null,
      };
    }
    return null;
  });

  const handleSelectUser = (user: AppUser) => {
    localStorage.setItem("selectedUserId", user.id);
    localStorage.setItem("selectedUserName", user.name);
    setCurrentUser(user);
  };

  const handleSwitchUser = () => {
    localStorage.removeItem("selectedUserId");
    localStorage.removeItem("selectedUserName");
    setCurrentUser(null);
  };

  if (!currentUser) {
    return (
      <UserSelectionScreen users={users} onSelectUser={handleSelectUser} />
    );
  }

  return (
    <MainDashboard
      currentUser={currentUser}
      allUsers={users}
      onSwitchUser={handleSwitchUser}
    />
  );
}
