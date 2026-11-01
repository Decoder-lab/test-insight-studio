import { useCallback, useState } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { buildInvitationLink } from "@/lib/respondent-link";
import { adminApi } from "./client";
import type { CreateProjectRequest, InvitationSummary, ProjectDetails, ProjectStatus } from "./types";

/** Every admin query lives under this key, so AdminLayout can drop them all on sign-out. */
export const ADMIN_QUERY_KEY = "admin-api";

const keys = {
  fields: [ADMIN_QUERY_KEY, "project-fields"] as const,
  projects: (status?: ProjectStatus) => [ADMIN_QUERY_KEY, "projects", status ?? "all"] as const,
  project: (id: string) => [ADMIN_QUERY_KEY, "project", id] as const,
};

// Errors are categorised by the client and retried by the user ("Retry"), not automatically.
const noRetry = { retry: false } as const;

/**
 * Fetches the list of project fields.
 * @returns The list of project fields.
 */
export const useProjectFields = () =>
  useQuery({ queryKey: keys.fields, queryFn: adminApi.listProjectFields, staleTime: 5 * 60_000, refetchOnWindowFocus: false, ...noRetry });

/**
 * Fetches the list of projects, optionally filtered by status.
 * @param status The status to filter projects by.
 * @returns The list of projects.
 */
export const useProjects = (status?: ProjectStatus) =>
  useInfiniteQuery({
    queryKey: keys.projects(status),
    queryFn: ({ pageParam }) => adminApi.listProjects({ status, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    ...noRetry,
  });

/**
 * Fetches the details of a single project.
 * @param projectId The ID of the project to fetch.
 * @returns The project details.
 */
export const useProject = (projectId: string) =>
  useQuery({ queryKey: keys.project(projectId), queryFn: () => adminApi.getProject(projectId), ...noRetry });

/**
 * Creates a new project.
 * @returns The created project.
 */
export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateProjectRequest) => adminApi.createProject(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ADMIN_QUERY_KEY, "projects"] }),
  });
}

/** 
 * Replaces one invitation inside a cached project, e.g. after a revoke.
 * @param project The cached project details.
 * @param updated The updated invitation summary.
 * @returns The updated project details.
 */
function withInvitation(project: ProjectDetails, updated: InvitationSummary): ProjectDetails {
  return {
    ...project,
    invitations: project.invitations.map((item) => (item.id === updated.id ? updated : item)),
    activeInvitation: project.activeInvitation?.id === updated.id ? updated : project.activeInvitation,
  };
}

/**
 * Revokes an invitation for a project.
 * @param projectId The ID of the project.
 * @returns The mutation object for revoking the invitation.
 */
export function useRevokeInvitation(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: string) => adminApi.revokeInvitation(projectId, invitationId),
    onSuccess: (updated) => {
      queryClient.setQueryData<ProjectDetails>(keys.project(projectId), (cached) =>
        cached ? withInvitation(cached, updated) : cached,
      );
      void queryClient.invalidateQueries({ queryKey: [ADMIN_QUERY_KEY, "projects"] });
    },
  });
}

export interface IssuedLink {
  /** The full shareable link, including the plaintext token. */
  url: string;
  expiresAt: string;
}

/**
 * Creates (or renews) an invitation and holds the resulting link in component state only.
 *
 * The plaintext token is returned by the backend exactly once. It is copied into `link` from
 * inside the mutation function and never returned from it, so it does not enter the react-query
 * cache. Call `dismiss` when the dialog closes to drop it.
 */
export function useIssueInvitation() {
  const queryClient = useQueryClient();
  const [link, setLink] = useState<IssuedLink | null>(null);

  const mutation = useMutation({
    mutationFn: async ({ projectId, expiresInHours }: { projectId: string; expiresInHours: number }) => {
      const { invitation, token } = await adminApi.createInvitation(projectId, { expiresInHours });
      setLink({ url: buildInvitationLink(token), expiresAt: invitation.expiresAt });
      return invitation;
    },
    onSuccess: (_invitation, { projectId }) => {
      void queryClient.invalidateQueries({ queryKey: keys.project(projectId) });
      void queryClient.invalidateQueries({ queryKey: [ADMIN_QUERY_KEY, "projects"] });
    },
  });

  const dismiss = useCallback(() => setLink(null), []);

  return {
    issue: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
    link,
    dismiss,
  };
}
