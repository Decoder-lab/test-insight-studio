import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowUpRight } from "lucide-react";

const preSurveySchema = z.object({
  problemToSolve: z.string().trim().min(1, "Required").max(1000),
  buyMotivation: z.string().trim().min(1, "Required").max(1000),
  budgetRange: z.string().min(1, "Please select a budget range"),
  urgency: z.number().min(1).max(5),
});

export type PreSurveyAnswers = z.infer<typeof preSurveySchema>;

interface PreSurveyProps {
  onComplete: (data: PreSurveyAnswers) => void;
}

const PreSurvey = ({ onComplete }: PreSurveyProps) => {
  const form = useForm<PreSurveyAnswers>({
    resolver: zodResolver(preSurveySchema),
    defaultValues: { problemToSolve: "", buyMotivation: "", budgetRange: "", urgency: 3 },
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
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger><SelectValue placeholder="Select budget range" /></SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="<€1K">&lt;€1K</SelectItem>
                <SelectItem value="€1-5K">€1-5K</SelectItem>
                <SelectItem value="€5-10K">€5-10K</SelectItem>
                <SelectItem value=">€10K">&gt;€10K</SelectItem>
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

        <Button type="submit" className="bg-accent text-accent-foreground rounded-full px-6 gap-2 hover:brightness-95">
          Continue to recording <ArrowUpRight className="w-4 h-4" />
        </Button>
      </form>
    </Form>
  );
};

export default PreSurvey;
