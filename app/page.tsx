import { getAllUsers } from "@/utils/supabase/queries";
import { DashboardContainer } from "@/features/dashboard/components/DashboardContainer";

export default async function HomePage() {
  const users = await getAllUsers();

  return <DashboardContainer users={users} />;
}
