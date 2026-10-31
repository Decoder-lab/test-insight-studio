import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import FullPageSpinner from "@/components/FullPageSpinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { DEFAULT_REDIRECT } from "@/lib/auth";

/**
 * Landing route for Supabase email links (invite, recovery). The client reads the session
 * from the URL during initialisation; once that settles we either continue or report a bad link.
 */
const AuthCallback = () => {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && session) navigate(DEFAULT_REDIRECT, { replace: true });
  }, [loading, session, navigate]);

  if (loading || session) return <FullPageSpinner />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="font-display text-2xl font-bold">Link not valid</CardTitle>
          <CardDescription>This sign-in link is invalid, expired, or has already been used.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full rounded-full bg-accent text-accent-foreground hover:brightness-95">
            <Link to="/login">Go to sign in</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthCallback;
