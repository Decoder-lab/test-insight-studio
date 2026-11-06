import ApiErrorState from "@/components/admin/ApiErrorState";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { hasCode } from "@/lib/admin-api/errors";
import { useQuestionnaireResponse } from "@/lib/admin-api/hooks";
import { formatDateTime } from "@/lib/format";
import { POST_SURVEY_QUESTIONS, PRE_SURVEY_QUESTIONS } from "@/lib/respondent-api/questionnaire";

/** Question and answer pairs. The answers are free text from the respondent: rendered as text only. */
const AnswerList = ({ items }: { items: { question: string; answer: string }[] }) => (
  <dl className="space-y-4">
    {items.map(({ question, answer }) => (
      <div key={question}>
        <dt className="text-sm text-muted-foreground">{question}</dt>
        <dd className="mt-1 min-w-0 whitespace-pre-wrap break-words text-sm">{answer}</dd>
      </div>
    ))}
  </dl>
);

interface QuestionnaireCardProps {
  projectId: string;
  /** False while nothing can have been submitted yet (a `CREATED` project): no request is made. */
  enabled: boolean;
}

/** The stored questionnaire answers of a project, worded exactly as the respondent saw the questions. */
const QuestionnaireCard = ({ projectId, enabled }: QuestionnaireCardProps) => {
  const response = useQuestionnaireResponse(projectId, enabled);
  const empty = !enabled || (response.isError && hasCode(response.error, "not_found"));

  let body;
  if (empty) {
    body = <p className="text-sm text-muted-foreground">No answers submitted yet.</p>;
  } else if (response.isPending) {
    body = (
      <div className="space-y-3" role="status" aria-label="Loading answers">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  } else if (response.isError) {
    body = <ApiErrorState error={response.error} onRetry={() => void response.refetch()} />;
  } else {
    const { preSurvey, postSurvey } = response.data.answers;
    body = (
      <div className="space-y-6">
        <section aria-labelledby="questionnaire-pre" className="space-y-3">
          <h3 id="questionnaire-pre" className="text-sm font-medium">
            Before the test
          </h3>
          <AnswerList
            items={[
              { question: PRE_SURVEY_QUESTIONS.problemToSolve, answer: preSurvey.problemToSolve },
              { question: PRE_SURVEY_QUESTIONS.buyMotivation, answer: preSurvey.buyMotivation },
              { question: PRE_SURVEY_QUESTIONS.budgetRange, answer: preSurvey.budgetRange },
              { question: PRE_SURVEY_QUESTIONS.urgency, answer: `${preSurvey.urgency} / 5` },
            ]}
          />
        </section>
        <section aria-labelledby="questionnaire-post" className="space-y-3">
          <h3 id="questionnaire-post" className="text-sm font-medium">
            After the test
          </h3>
          {postSurvey ? (
            <AnswerList
              items={[
                { question: POST_SURVEY_QUESTIONS.disappointed, answer: postSurvey.disappointed },
                { question: POST_SURVEY_QUESTIONS.wouldBuy, answer: postSurvey.wouldBuy },
                { question: POST_SURVEY_QUESTIONS.mostConfusing, answer: postSurvey.mostConfusing },
                { question: POST_SURVEY_QUESTIONS.likedMost, answer: postSurvey.likedMost },
                { question: POST_SURVEY_QUESTIONS.whatsMissing, answer: postSurvey.whatsMissing },
              ]}
            />
          ) : (
            <p className="text-sm text-muted-foreground">The post-survey has not been submitted yet.</p>
          )}
        </section>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-1.5">
        <CardTitle className="font-display text-xl font-bold">Questionnaire</CardTitle>
        {response.isSuccess && <CardDescription>Last saved {formatDateTime(response.data.submittedAt)}</CardDescription>}
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  );
};

export default QuestionnaireCard;
