import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { BUDGET_RANGES } from "@/lib/respondent-api/questionnaire";
import type { PreSurveyAnswers } from "@/lib/respondent-api/types";

const preSurveySchema = z.object({
  problemToSolve: z.string().trim().min(1, "Required").max(1000),
  buyMotivation: z.string().trim().min(1, "Required").max(1000),
  budgetRange: z.enum(BUDGET_RANGES, { message: "Please select a budget range" }),
  urgency: z.number().min(1).max(5),
});

// The contract's type, not `z.infer`: without `strictNullChecks` zod infers every field as optional.
export type { PreSurveyAnswers };

interface PreSurveyProps {
  /** May be async: the submit button stays disabled until the returned promise settles. */
  onComplete: (data: PreSurveyAnswers) => void | Promise<void>;
  /** Shown above the submit button, e.g. why the last submission failed. */
  error?: ReactNode;
  submitLabel?: string;
}

const PreSurvey = ({ onComplete, error, submitLabel = "Continue to recording" }: PreSurveyProps) => {
  const form = useForm<PreSurveyAnswers>({
    resolver: zodResolver(preSurveySchema),
    defaultValues: { problemToSolve: "", buyMotivation: "", urgency: 3 },
  });

  const fields = ["problemToSolve", "buyMotivation", "budgetRange", "urgency"] as const;
  const filled = fields.filter((f) => {
    const v = form.watch(f);
    return f === "urgency" ? true : !!v;
  }).length;
  const progress = (filled / fields.length) * 100;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onComplete)} className="space-y-8 max-w-lg mx-auto">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2.5 h-2.5 rounded-full bg-accent" />
            <span className="text-sm text-muted-foreground">Pre-Test Survey</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-border mb-6">
            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progress}%` }} />
          </div>
          <h2 className="font-display text-3xl font-bold mb-2">Before we begin</h2>
          <p className="text-muted-foreground text-sm">Help us understand your context.</p>
        </div>

        <FormField control={form.control} name="problemToSolve" render={({ field }) => (
          <FormItem>
            <FormLabel>What problem are you trying to solve?</FormLabel>
            <FormControl><Textarea placeholder="Describe the core problem…" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="buyMotivation" render={({ field }) => (
          <FormItem>
            <FormLabel>What would make you buy this product?</FormLabel>
            <FormControl><Textarea placeholder="What features or outcomes would convince you?" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="budgetRange" render={({ field }) => (
          <FormItem>
            <FormLabel>What's your budget range?</FormLabel>
            <Select onValueChange={field.onChange} value={field.value ?? ""}>
              <FormControl>
                <SelectTrigger><SelectValue placeholder="Select budget range" /></SelectTrigger>
              </FormControl>
              <SelectContent>
                {BUDGET_RANGES.map((range) => (
                  <SelectItem key={range} value={range}>{range}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="urgency" render={({ field }) => (
          <FormItem>
            <FormLabel>How urgent is solving this? ({field.value}/5)</FormLabel>
            <FormControl>
              <Slider min={1} max={5} step={1} value={[field.value]} onValueChange={(v) => field.onChange(v[0])} />
            </FormControl>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Not urgent</span><span>Very urgent</span>
            </div>
            <FormMessage />
          </FormItem>
        )} />

        {error}

        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="bg-accent text-accent-foreground rounded-full px-6 gap-2 hover:brightness-95"
        >
          {submitLabel}
          {form.formState.isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUpRight className="w-4 h-4" />}
        </Button>
      </form>
    </Form>
  );
};

export default PreSurvey;
