import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const AdminHome = () => (
  <Card>
    <CardHeader>
      <CardTitle className="font-display text-2xl font-bold">Access management</CardTitle>
      <CardDescription>Nothing to manage yet.</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground">Invite and access controls will appear here.</p>
    </CardContent>
  </Card>
);

export default AdminHome;
