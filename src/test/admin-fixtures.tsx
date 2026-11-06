/* eslint-disable react-refresh/only-export-components -- test support, never hot-reloaded */
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes, useLocation, useParams } from "react-router-dom";
import type { ReactElement } from "react";
import type {
  InvitationSummary,
  Project,
  ProjectDetails,
  ProjectFieldDefinition,
  QuestionnaireResponseDetails,
  RecordingPlayback,
} from "@/lib/admin-api/types";

export const field = (
  over: Partial<ProjectFieldDefinition> & Pick<ProjectFieldDefinition, "key" | "fieldType">,
): ProjectFieldDefinition => ({ label: over.key, required: false, options: [], position: 1, ...over });

export const invitation = (over: Partial<InvitationSummary> = {}): InvitationSummary => ({
  id: "inv-1",
  status: "active",
  createdAt: "2026-11-01T10:00:00.000Z",
  expiresAt: "2026-11-08T10:00:00.000Z",
  revokedAt: null,
  startedAt: null,
  lastUsedAt: null,
  ...over,
});

export const project = (over: Partial<Project> = {}): Project => ({
  id: "p1",
  name: "Pilot test",
  status: "CREATED",
  fields: {},
  createdAt: "2026-11-01T09:00:00.000Z",
  readyAt: null,
  activeInvitation: null,
  ...over,
});

export const projectDetails = (over: Partial<ProjectDetails> = {}): ProjectDetails => ({
  ...project(),
  invitations: [],
  questionnaireSubmitted: false,
  recordings: { camera: "NOT_STARTED", screen: "NOT_STARTED" },
  ...over,
});

export const questionnaireResponse = (over: Partial<QuestionnaireResponseDetails> = {}): QuestionnaireResponseDetails => ({
  answers: {
    preSurvey: {
      problemToSolve: "Interview notes get lost",
      buyMotivation: "One searchable place",
      budgetRange: "€1-5K",
      urgency: 4,
    },
    postSurvey: {
      disappointed: "Very disappointed",
      wouldBuy: "Maybe",
      mostConfusing: "Where to start",
      likedMost: "The summary view",
      whatsMissing: "Export to other tools",
    },
  },
  submittedAt: "2026-11-03T10:00:00.000Z",
  ...over,
});

export const playback = (over: Partial<RecordingPlayback> = {}): RecordingPlayback => ({
  url: "https://storage.example/object/sign/recordings/p1/camera/r1.webm?token=READ-TOKEN",
  expiresAt: "2026-11-03T10:15:00.000Z",
  contentType: "video/webm",
  sizeBytes: 1572864,
  durationMs: 65000,
  ...over,
});

/** Stands in for the details route: shows where the app navigated and the (non-sensitive) router state. */
const DetailsProbe = () => {
  const { projectId } = useParams();
  const state = useLocation().state as { linkFailed?: boolean } | null;
  return (
    <div>
      details of {projectId}
      {state?.linkFailed ? " (link failed)" : ""}
    </div>
  );
};

export function renderAdminRoute(ui: ReactElement, path: string, initialEntry: string | object = path) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/admin" element={<div>projects list</div>} />
          <Route path={path} element={ui} />
          <Route path="/admin/projects/:projectId" element={path.includes(":projectId") ? ui : <DetailsProbe />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
