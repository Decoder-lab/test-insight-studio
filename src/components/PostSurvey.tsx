import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowUpRight } from "lucide-react";

interface PostSurveyData {
  satisfaction: string;
  wouldRecommend: string;
  feedback: string;
  disappointed: string;
}

interface PostSurveyProps {
  onComplete: (data: PostSurveyData) => void;
}

const PostSurvey = ({ onComplete }: PostSurveyProps) => {
  const { register, handleSubmit, setValue } = useForm<PostSurveyData>();

  return (
    <form onSubmit={handleSubmit(onComplete)} className="space-y-8 max-w-lg mx-auto">
      <div>
        <div className="flex items-center gap-2 mb-6">
          <div className="w-2.5 h-2.5 rounded-full bg-accent" />
          <span className="text-sm text-muted-foreground">Post-Test Survey</span>
        </div>
        <h2 className="font-display text-3xl font-bold mb-2">How was that?</h2>
        <p className="text-muted-foreground text-sm">Your feedback helps us measure product-market fit.</p>
      </div>

      <div className="space-y-3">
        <Label>Overall satisfaction</Label>
        <RadioGroup onValueChange={(v) => setValue("satisfaction", v)}>
          {["Very dissatisfied", "Dissatisfied", "Neutral", "Satisfied", "Very satisfied"].map((opt) => (
            <div key={opt} className="flex items-center space-x-2">
              <RadioGroupItem value={opt} id={`sat-${opt}`} />
              <Label htmlFor={`sat-${opt}`} className="font-normal">{opt}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className="space-y-3">
        <Label>How would you feel if you could no longer use this product?</Label>
        <RadioGroup onValueChange={(v) => setValue("disappointed", v)}>
          {["Not disappointed", "Somewhat disappointed", "Very disappointed"].map((opt) => (
            <div key={opt} className="flex items-center space-x-2">
              <RadioGroupItem value={opt} id={`dis-${opt}`} />
              <Label htmlFor={`dis-${opt}`} className="font-normal">{opt}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className="space-y-3">
        <Label>Would you recommend this to a friend?</Label>
        <RadioGroup onValueChange={(v) => setValue("wouldRecommend", v)}>
          {["Definitely not", "Probably not", "Maybe", "Probably yes", "Definitely yes"].map((opt) => (
            <div key={opt} className="flex items-center space-x-2">
              <RadioGroupItem value={opt} id={`rec-${opt}`} />
              <Label htmlFor={`rec-${opt}`} className="font-normal">{opt}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="feedback">Any additional thoughts?</Label>
        <Textarea id="feedback" placeholder="The thing I liked most was..." {...register("feedback")} />
      </div>

      <Button type="submit" className="bg-accent text-accent-foreground rounded-full px-6 gap-2 hover:brightness-95">
        View Results <ArrowUpRight className="w-4 h-4" />
      </Button>
    </form>
  );
};

export default PostSurvey;
