import { useEffect } from "react";
import { Link, Outlet } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { ADMIN_QUERY_KEY } from "@/lib/admin-api/hooks";

const AdminLayout = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Leaving /admin (including signing out) drops cached admin data, so it never outlives the session.
  useEffect(() => () => queryClient.removeQueries({ queryKey: [ADMIN_QUERY_KEY] }), [queryClient]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/admin" className="font-display text-lg font-bold">
            Admin
          </Link>
          <div className="flex items-center gap-4">
            {user?.email && <span className="hidden text-sm text-muted-foreground sm:inline">{user.email}</span>}
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link to="/logout">Sign out</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="container py-10">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
