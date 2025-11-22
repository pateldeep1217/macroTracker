"use client";

import { useState, useEffect } from "react";
import type { AppUser } from "@/utils/supabase/queries";
import { Button } from "@/app/components/button";
import { Heading } from "@/app/components/heading";
import { Text } from "@/app/components/text";
import { Fieldset, Label, Legend } from "@/app/components/fieldset";
import { Radio, RadioField, RadioGroup } from "@/app/components/radio";

interface UserSelectionScreenProps {
  readonly users: readonly AppUser[];
  readonly lastUserId?: string | null;
  readonly isClient?: boolean;
  readonly onSelectUser: (user: AppUser) => void;
}

export function UserSelectionScreen({
  users,
  lastUserId,
  isClient = false,
  onSelectUser,
}: UserSelectionScreenProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  // Only pre-select after client hydration is complete
  useEffect(() => {
    if (isClient && lastUserId && users.some((u) => u.id === lastUserId)) {
      setSelectedUserId(lastUserId);
    }
  }, [isClient, lastUserId, users]);

  const handleContinue = () => {
    const selectedUser = users.find((u) => u.id === selectedUserId);
    if (selectedUser) {
      onSelectUser(selectedUser);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-900">
      <div className="w-full max-w-md">
        <div className="text-center">
          <Heading>Welcome Back!</Heading>
          <Text className="mt-2">
            Who&apos;s using the app today? Select your profile to continue.
          </Text>
        </div>

        <div className="mt-8 rounded-2xl bg-white p-8 shadow-lg ring-1 ring-zinc-950/5 dark:bg-zinc-800 dark:ring-white/10">
          <Fieldset>
            <Legend>Select Your Profile</Legend>
            <RadioGroup
              name="user-selection"
              value={selectedUserId}
              onChange={setSelectedUserId}
              className="mt-4"
            >
              {users.map((user) => (
                <RadioField key={user.id}>
                  <Radio value={user.id} />
                  <Label>{user.name}</Label>
                </RadioField>
              ))}
            </RadioGroup>
          </Fieldset>

          <div className="mt-8">
            <Button
              className="w-full"
              onClick={handleContinue}
              disabled={!selectedUserId}
            >
              Continue
            </Button>
          </div>
        </div>

        <Text className="mt-4 text-center text-sm text-zinc-500">
          First time here? Contact your administrator to set up your profile.
        </Text>
      </div>
    </div>
  );
}
