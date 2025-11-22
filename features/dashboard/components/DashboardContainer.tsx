"use client";

import { useUserSelection } from "@/features/user/hooks/useUserSelection";
import { UserSelectionScreen } from "@/features/user/components/UserSelectionScreen";
import { MainDashboard } from "./MainDashboard";
import type { AppUser } from "@/utils/supabase/queries";

interface DashboardContainerProps {
  readonly users: readonly AppUser[];
}

export function DashboardContainer({ users }: DashboardContainerProps) {
  const { currentUser, selectUser, clearUser } = useUserSelection();

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
