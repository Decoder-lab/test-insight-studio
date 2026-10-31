import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import FullPageSpinner from "@/components/FullPageSpinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { redirectTargetFromState, type SignInError } from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().trim().min(1, "Enter your email").email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

type LoginValues = z.infer<typeof loginSchema>;

// Deliberately vague for bad credentials, so the page never reveals which emails have accounts.
const ERROR_MESSAGES: Record<SignInError, string> = {
  invalid_credentials: "Invalid email or password.",
  rate_limited: "Too many attempts. Please wait a moment and try again.",
  unknown: "Could not sign in. Please try again.",
};

const Login = () => {
  const { session, loading, configured, signIn } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const target = redirectTargetFromState(location.state);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  // Navigate from session state rather than after signIn resolves, so the target route
  // never sees a stale "signed out" session. Also covers visiting /login while signed in.
  useEffect(() => {
    if (!loading && session) navigate(target, { replace: true });
  }, [loading, session, navigate, target]);

  if (loading || session) return <FullPageSpinner />;

  const onSubmit = async ({ email, password }: LoginValues) => {
    setFormError(null);
    const error = await signIn(email, password);
    if (error) setFormError(ERROR_MESSAGES[error]);
  };

  const submitting = form.formState.isSubmitting;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="font-display text-2xl font-bold">Sign in</CardTitle>
          <CardDescription>Admin access for the Decoder team.</CardDescription>
        </CardHeader>
        <CardContent>
          {!configured ? (
            <Alert variant="destructive">
              <AlertDescription>Authentication is not configured for this build.</AlertDescription>
            </Alert>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
                {formError && (
                  <Alert variant="destructive">
                    <AlertDescription>{formError}</AlertDescription>
                  </Alert>
                )}

                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" autoComplete="username" disabled={submitting} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="current-password" disabled={submitting} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full gap-2 rounded-full bg-accent text-accent-foreground hover:brightness-95"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Sign in
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
