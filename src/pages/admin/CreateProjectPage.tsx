import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import ApiErrorState from "@/components/admin/ApiErrorState";
import ExpiryPicker from "@/components/admin/ExpiryPicker";
import InvitationLinkDialog from "@/components/admin/InvitationLinkDialog";
import ProjectFieldInputs from "@/components/admin/ProjectFieldInputs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { describeError, hasCode } from "@/lib/admin-api/errors";
import {
  buildFormSchema,
  DEFAULT_EXPIRY_HOURS,
  defaultFieldValues,
  sortDefinitions,
  toRequestFields,
  type CreateFormValues,
} from "@/lib/admin-api/fields";
import { useCreateProject, useIssueInvitation, useProjectFields } from "@/lib/admin-api/hooks";
import type { ProjectFieldDefinition } from "@/lib/admin-api/types";

const CreateProjectForm = ({ definitions }: { definitions: ProjectFieldDefinition[] }) => {
  const navigate = useNavigate();
  const createProject = useCreateProject();
  const invitation = useIssueInvitation();
  const [submitError, setSubmitError] = useState<unknown>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const schema = useMemo(() => buildFormSchema(definitions), [definitions]);
  const form = useForm<CreateFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", fields: defaultFieldValues(definitions), expiresInHours: DEFAULT_EXPIRY_HOURS },
  });
  const submitting = form.formState.isSubmitting;

  const onSubmit = async (values: CreateFormValues) => {
    setSubmitError(null);

    let projectId: string;
    try {
      const project = await createProject.mutateAsync({
        name: values.name,
        fields: toRequestFields(definitions, values.fields),
      });
      projectId = project.id;
    } catch (error) {
      // Nothing was created: keep everything the user typed.
      setSubmitError(error);
      return;
    }

    try {
      await invitation.issue({ projectId, expiresInHours: values.expiresInHours });
      setCreatedId(projectId); // the link dialog opens; closing it continues to the details page
    } catch {
      // The project exists, only the link is missing: go where it can be created again.
      navigate(`/admin/projects/${projectId}`, { state: { linkFailed: true } });
    }
  };

  const closeLinkDialog = () => {
    invitation.dismiss();
    if (createdId) navigate(`/admin/projects/${createdId}`);
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input autoComplete="off" disabled={submitting} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <ProjectFieldInputs control={form.control} definitions={definitions} disabled={submitting} />

          <FormField
            control={form.control}
            name="expiresInHours"
            render={({ field }) => (
              <FormItem>
                <ExpiryPicker
                  value={field.value}
                  onChange={field.onChange}
                  disabled={submitting}
                  error={form.formState.errors.expiresInHours?.message}
                />
              </FormItem>
            )}
          />

          {submitError !== null &&
            (hasCode(submitError, "validation_error") ? (
              // The message names the offending field key. Shown as is, never parsed.
              <p role="alert" className="text-sm font-medium text-destructive">
                {describeError(submitError)}
              </p>
            ) : (
              <ApiErrorState error={submitError} onRetry={() => void form.handleSubmit(onSubmit)()} />
            ))}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/admin">Cancel</Link>
            </Button>
            <Button
              type="submit"
              disabled={submitting || createdId !== null}
              className="gap-2 rounded-full bg-accent text-accent-foreground hover:brightness-95"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Create test
            </Button>
          </div>
        </form>
      </Form>

      <InvitationLinkDialog link={invitation.link} onClose={closeLinkDialog} />
    </>
  );
};

const CreateProjectPage = () => {
  const fields = useProjectFields();
  const definitions = useMemo(() => sortDefinitions(fields.data?.items ?? []), [fields.data]);

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="font-display text-2xl font-bold">New test</CardTitle>
        <CardDescription>Creates the project and a link you can send to a respondent.</CardDescription>
      </CardHeader>
      <CardContent>
        {fields.isPending && (
          <div className="space-y-4" role="status" aria-label="Loading form">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-2/3" />
          </div>
        )}
        {fields.isError && <ApiErrorState error={fields.error} onRetry={() => void fields.refetch()} />}
        {fields.data && <CreateProjectForm definitions={definitions} />}
      </CardContent>
    </Card>
  );
};

export default CreateProjectPage;
