import type { Control } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { CreateFormValues } from "@/lib/admin-api/fields";
import type { ProjectFieldDefinition } from "@/lib/admin-api/types";

// Radix Select cannot hold an empty-string item, so "clear" is a sentinel mapped back to "".
const NO_SELECTION = "__none__";

interface ProjectFieldInputsProps {
  /** The react-hook-form control object for managing form state. */
  control: Control<CreateFormValues>;
  /** Already ordered by `position`. May be empty, in which case nothing is rendered. */
  definitions: ProjectFieldDefinition[];
  /** Whether the inputs should be disabled. */
  disabled?: boolean;
}

/** Renders the extra project fields from their definitions, so a new field on the backend needs no change here. */
const ProjectFieldInputs = ({ control, definitions, disabled }: ProjectFieldInputsProps) => (
  <>
    {definitions.map((def) => (
      <FormField
        key={def.key}
        control={control}
        name={`fields.${def.key}`}
        render={({ field }) => {
          const text = typeof field.value === "string" ? field.value : "";
          const label = (
            <FormLabel>
              {def.label}
              {!def.required && <span className="ml-1 font-normal text-muted-foreground">(optional)</span>}
            </FormLabel>
          );

          switch (def.fieldType) {
            case "boolean":
              return (
                <FormItem className="flex flex-row items-center justify-between gap-4 rounded-lg border p-3">
                  {label}
                  <FormControl>
                    <Switch name={field.name} checked={field.value === true} onCheckedChange={field.onChange} disabled={disabled} />
                  </FormControl>
                </FormItem>
              );
            case "select":
              return (
                <FormItem>
                  {label}
                  <Select name={field.name} value={text} onValueChange={(next) => field.onChange(next === NO_SELECTION ? "" : next)} disabled={disabled}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select…" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {!def.required && <SelectItem value={NO_SELECTION}>No selection</SelectItem>}
                      {def.options.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              );
            case "long_text":
              return (
                <FormItem>
                  {label}
                  <FormControl>
                    <Textarea {...field} value={text} disabled={disabled} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            case "text":
            case "number":
            case "date":
              return (
                <FormItem>
                  {label}
                  <FormControl>
                    <Input
                      {...field}
                      value={text}
                      disabled={disabled}
                      type={def.fieldType === "text" ? "text" : def.fieldType}
                      inputMode={def.fieldType === "number" ? "decimal" : undefined}
                      step={def.fieldType === "number" ? "any" : undefined}
                      autoComplete="off"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            default:
              return (
                <FormItem>
                  {label}
                  <p className="text-sm text-muted-foreground">
                    This field has a type ({String(def.fieldType)}) that this version cannot fill in.
                  </p>
                  <FormMessage />
                </FormItem>
              );
          }
        }}
      />
    ))}
  </>
);

export default ProjectFieldInputs;
