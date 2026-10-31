import { Link, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

const AdminLayout = () => {
  const { user } = useAuth();

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
