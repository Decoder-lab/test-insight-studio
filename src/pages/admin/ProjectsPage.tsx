import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Plus } from "lucide-react";
import ApiErrorState from "@/components/admin/ApiErrorState";
import { InvitationStatusBadge, ProjectStatusBadge } from "@/components/admin/StatusBadges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useProjects } from "@/lib/admin-api/hooks";
import type { InvitationSummary, ProjectStatus } from "@/lib/admin-api/types";
import { formatDate, formatDateTime } from "@/lib/format";

type Filter = "all" | ProjectStatus;

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "CREATED", label: "Created" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "READY", label: "Ready" },
];

const InvitationCell = ({ invitation }: { invitation?: InvitationSummary | null }) => {
  if (!invitation) return <span className="text-sm text-muted-foreground">No link</span>;
  return (
    <div className="space-y-1">
      <InvitationStatusBadge status={invitation.status} />
      <p className="text-xs text-muted-foreground">Expires {formatDateTime(invitation.expiresAt)}</p>
    </div>
  );
};

const ProjectsPage = () => {
  const [filter, setFilter] = useState<Filter>("all");
  const query = useProjects(filter === "all" ? undefined : filter);
  const projects = query.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between space-y-0">
        <div className="space-y-1.5">
          <CardTitle className="font-display text-2xl font-bold">Projects</CardTitle>
          <CardDescription>Tests you have set up, newest first.</CardDescription>
        </div>
        <Button asChild className="gap-2 rounded-full bg-accent text-accent-foreground hover:brightness-95">
          <Link to="/admin/projects/new">
            <Plus className="h-4 w-4" />
            New test
          </Link>
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="w-full sm:w-52">
          <Select value={filter} onValueChange={(next) => setFilter(next as Filter)}>
            <SelectTrigger aria-label="Filter by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FILTERS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {query.isPending && (
          <div className="space-y-2" role="status" aria-label="Loading projects">
            {[0, 1, 2].map((row) => (
              <Skeleton key={row} className="h-14 w-full" />
            ))}
          </div>
        )}

        {query.isError && !query.data && <ApiErrorState error={query.error} onRetry={() => void query.refetch()} />}

        {query.data && projects.length === 0 && (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="font-medium">{filter === "all" ? "No projects yet" : "No projects with this status"}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {filter === "all" ? "Create a test to get a link you can send to a respondent." : "Try another status."}
            </p>
          </div>
        )}

        {projects.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="hidden sm:table-cell">Created</TableHead>
                <TableHead className="hidden sm:table-cell">Link</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell>
                    <Link to={`/admin/projects/${project.id}`} className="break-words font-medium hover:underline">
                      {project.name}
                    </Link>
                    {/* Narrow screens: everything is stacked here instead of scrolling a wide table sideways. */}
                    <div className="mt-2 space-y-1.5 sm:hidden">
                      <div className="flex flex-wrap items-center gap-2">
                        <ProjectStatusBadge status={project.status} />
                        {project.activeInvitation ? (
                          <InvitationStatusBadge status={project.activeInvitation.status} />
                        ) : (
                          <span className="text-sm text-muted-foreground">No link</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Created {formatDate(project.createdAt)}
                        {project.activeInvitation && ` · Link expires ${formatDateTime(project.activeInvitation.expiresAt)}`}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <ProjectStatusBadge status={project.status} />
                  </TableCell>
                  <TableCell className="hidden whitespace-nowrap text-muted-foreground sm:table-cell">
                    {formatDate(project.createdAt)}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <InvitationCell invitation={project.activeInvitation} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {query.isFetchNextPageError && (
          <ApiErrorState error={query.error} onRetry={() => void query.fetchNextPage()} />
        )}

        {query.hasNextPage && !query.isFetchNextPageError && (
          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => void query.fetchNextPage()}
              disabled={query.isFetchingNextPage}
              className="gap-2 rounded-full"
            >
              {query.isFetchingNextPage && <Loader2 className="h-4 w-4 animate-spin" />}
              Load more
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectsPage;
