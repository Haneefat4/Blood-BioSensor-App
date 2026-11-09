export interface DateTimeFieldProps {
  value: Date;
  mode: "date" | "time";
  onChange: (next: Date) => void;
  label: string;
  accessibilityHint?: string;
  maximumDate?: Date;
  minimumDate?: Date;
}
