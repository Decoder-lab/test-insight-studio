import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowUpRight } from "lucide-react";

const postSurveySchema = z.object({
  disappointed: z.string().min(1, "Please select an option"),
  wouldBuy: z.string().min(1, "Please select an option"),
  mostConfusing: z.string().trim().min(1, "Required").max(1000),
  likedMost: z.string().trim().min(1, "Required").max(1000),
  whatsMissing: z.string().trim().min(1, "Required").max(1000),
});

export type PostSurveyAnswers = z.infer<typeof postSurveySchema>;

interface PostSurveyProps {
  onComplete: (data: PostSurveyAnswers) => void;
}

const PostSurvey = ({ onComplete }: PostSurveyProps) => {
  const form = useForm<PostSurveyAnswers>({
    resolver: zodResolver(postSurveySchema),
    defaultValues: { disappointed: "", wouldBuy: "", mostConfusing: "", likedMost: "", whatsMissing: "" },
  });

  const fields = ["disappointed", "wouldBuy", "mostConfusing", "likedMost", "whatsMissing"] as const;
  const filled = fields.filter((f) => !!form.watch(f)).length;
  const progress = (filled / fields.length) * 100;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onComplete)} className="space-y-8 max-w-lg mx-auto">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2.5 h-2.5 rounded-full bg-accent" />
            <span className="text-sm text-muted-foreground">Post-Test Survey</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-border mb-6">
            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progress}%` }} />
          </div>
          <h2 className="font-display text-3xl font-bold mb-2">How was that?</h2>
          <p className="text-muted-foreground text-sm">Your feedback helps us measure product-market fit.</p>
        </div>

        <FormField control={form.control} name="disappointed" render={({ field }) => (
          <FormItem>
            <FormLabel>How would you feel if you could no longer use this product?</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger><SelectValue placeholder="Select an option" /></SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="Very disappointed">Very disappointed</SelectItem>
                <SelectItem value="Somewhat disappointed">Somewhat disappointed</SelectItem>
                <SelectItem value="Not disappointed">Not disappointed</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="wouldBuy" render={({ field }) => (
          <FormItem>
            <FormLabel>Would you buy this product?</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger><SelectValue placeholder="Select an option" /></SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="Yes">Yes</SelectItem>
                <SelectItem value="Maybe">Maybe</SelectItem>
                <SelectItem value="No">No</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="mostConfusing" render={({ field }) => (
          <FormItem>
            <FormLabel>What was most confusing?</FormLabel>
            <FormControl><Textarea placeholder="The part that confused me was…" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="likedMost" render={({ field }) => (
          <FormItem>
            <FormLabel>What did you like most?</FormLabel>
            <FormControl><Textarea placeholder="The thing I liked most was…" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="whatsMissing" render={({ field }) => (
          <FormItem>
            <FormLabel>What's missing?</FormLabel>
            <FormControl><Textarea placeholder="I wish it had…" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <Button type="submit" className="bg-accent text-accent-foreground rounded-full px-6 gap-2 hover:brightness-95">
          View Results <ArrowUpRight className="w-4 h-4" />
        </Button>
      </form>
    </Form>
  );
};

export default PostSurvey;
