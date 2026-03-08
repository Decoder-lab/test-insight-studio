import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowUpRight } from "lucide-react";

interface PreSurveyData {
  name: string;
  role: string;
  familiarity: string;
  expectations: string;
}

interface PreSurveyProps {
  onComplete: (data: PreSurveyData) => void;
}

const PreSurvey = ({ onComplete }: PreSurveyProps) => {
  const { register, handleSubmit, setValue, watch } = useForm<PreSurveyData>();

  return (
    <form onSubmit={handleSubmit(onComplete)} className="space-y-8 max-w-lg mx-auto">
      <div>
        <div className="flex items-center gap-2 mb-6">
          <div className="w-2.5 h-2.5 rounded-full bg-accent" />
          <span className="text-sm text-muted-foreground">Pre-Test Survey</span>
        </div>
        <h2 className="font-display text-3xl font-bold mb-2">Before we begin</h2>
        <p className="text-muted-foreground text-sm">Help us understand your context.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Your name</Label>
        <Input id="name" placeholder="Jane Doe" {...register("name", { required: true })} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Your role</Label>
        <Input id="role" placeholder="Product Manager" {...register("role", { required: true })} />
      </div>

      <div className="space-y-3">
        <Label>How familiar are you with this product?</Label>
        <RadioGroup onValueChange={(v) => setValue("familiarity", v)} defaultValue="">
          {["Not at all", "Somewhat", "Very familiar"].map((opt) => (
            <div key={opt} className="flex items-center space-x-2">
              <RadioGroupItem value={opt} id={opt} />
              <Label htmlFor={opt} className="font-normal">{opt}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="expectations">What do you expect from this product?</Label>
        <Textarea id="expectations" placeholder="I'm hoping it will..." {...register("expectations")} />
      </div>

      <Button type="submit" className="bg-accent text-accent-foreground rounded-full px-6 gap-2 hover:brightness-95">
        Continue to recording <ArrowUpRight className="w-4 h-4" />
      </Button>
    </form>
  );
};

export default PreSurvey;
