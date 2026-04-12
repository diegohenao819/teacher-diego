import React from "react";
// FIX: Import ValidationState and remove unused ValidationResult to match prop changes.
import { WORD_LIMITS } from "../constants";
import {
  CoherenceStatus,
  InputField,
  ParagraphData,
  ValidationState,
} from "../types";
import CheckIcon from "./icons/CheckIcon";
import LoaderIcon from "./icons/LoaderIcon";
import WarningIcon from "./icons/WarningIcon";
import Button from "./ui/Button";
import Card from "./ui/Card";
import Textarea from "./ui/Textarea";

export interface InputConfig {
  field: InputField;
  label: string;
  placeholder: string;
  rows: number;
}

// FIX: Removed generic <T> from props to simplify types and fix prop mismatch from App.
// Props now use concrete types like ParagraphData and InputField.
interface InputFormProps {
  inputs: ParagraphData;
  onInputChange: (field: InputField, value: string) => void;
  onSubmit: () => void;
  onCoherenceCheck: () => void;
  isLoading: boolean;
  validationResult: Partial<Record<InputField, ValidationState>>;
  isFormValid: boolean;
  isSyntaxValid: boolean;
  coherence: CoherenceStatus;
  config: InputConfig[];
  showThesisContext?: boolean;
}

const InputSection: React.FC<{
  field: InputField;
  label: string;
  value: string;
  placeholder: string;
  rows: number;
  onChange: (value: string) => void;
  // FIX: Changed type to `ValidationState | undefined` which is what the component receives.
  // The previous type was incorrect and caused compile errors.
  validationState: ValidationState | undefined;
}> = ({
  field,
  label,
  value,
  placeholder,
  rows,
  onChange,
  validationState,
}) => {
  const wordCount = value.trim().split(/\s+/).filter(Boolean).length;
  const limits = WORD_LIMITS[field];
  if (!limits) return null; // Should not happen with proper config
  const { min, max } = limits;
  const wordCountColor =
    wordCount > 0 && (wordCount < min || wordCount > max)
      ? "text-red-500"
      : "text-slate-500";

  return (
    <div>
      <label
        htmlFor={field}
        className="flex items-center text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2"
      >
        {label}
        <span className="ml-2">
          {validationState?.isValid === true && (
            <CheckIcon className="w-5 h-5 text-green-500" />
          )}
          {validationState?.isValid === false && validationState?.message && (
            <WarningIcon className="w-5 h-5 text-yellow-500" />
          )}
        </span>
      </label>
      <Textarea
        id={field}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        aria-describedby={`${field}-helper`}
      />
      <div id={`${field}-helper`} className="text-sm mt-1 flex justify-between">
        <span
          className={
            validationState?.message ? "text-red-500" : "text-slate-500"
          }
        >
          {validationState?.message}
        </span>
        <span className={`font-mono ${wordCountColor}`}>
          {wordCount} / {min}-{max} words
        </span>
      </div>
    </div>
  );
};

const CoherenceStatusDisplay: React.FC<{ coherence: CoherenceStatus }> = ({
  coherence,
}) => {
  if (coherence.status === "idle") {
    return null;
  }

  let icon = null;
  let textColor = "text-slate-500";

  if (coherence.status === "checking") {
    icon = <LoaderIcon className="w-5 h-5 mr-2 animate-spin" />;
    textColor = "text-slate-500 dark:text-slate-400";
  } else if (coherence.status === "success") {
    icon = <CheckIcon className="w-5 h-5 mr-2" />;
    textColor = "text-green-600 dark:text-green-400";
  } else if (coherence.status === "error") {
    icon = <WarningIcon className="w-5 h-5 mr-2" />;
    textColor = "text-red-600 dark:text-red-400";
  }

  const message = {
    checking: "Checking logical coherence...",
    success: coherence.message || "Logical connection looks good!",
    error:
      coherence.message || "There's a problem with the logical connection.",
  }[coherence.status];

  return (
    <div
      className={`flex items-center p-3 mb-4 rounded-md text-sm transition-all duration-300 ${textColor} bg-slate-100 dark:bg-slate-700/50 animate-fade-in`}
    >
      {icon}
      <span className="flex-1">{message}</span>
    </div>
  );
};

// FIX: Update component definition to use React.FC to correctly type it as a React component. This resolves a type error where the special `key` prop was not being handled correctly.
const InputForm: React.FC<InputFormProps> = ({
  inputs,
  onInputChange,
  onSubmit,
  onCoherenceCheck,
  isLoading,
  validationResult,
  isFormValid,
  isSyntaxValid,
  coherence,
  config,
  showThesisContext,
}) => {
  const isCoherenceChecking = coherence.status === "checking";
  return (
    <div className="space-y-4">
      {showThesisContext && (
        <div className="p-4 rounded-lg border-2 border-dashed border-indigo-300 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20">
          <label
            htmlFor="thesisContext"
            className="flex items-center text-sm font-semibold text-indigo-700 dark:text-indigo-300 mb-1"
          >
            Your Thesis Statement
            <span className="ml-2 font-normal text-indigo-500 dark:text-indigo-400">
              (reference only: not part of this paragraph)
            </span>
            <span className="ml-2">
              {validationResult["thesisContext"]?.isValid === true && (
                <CheckIcon className="w-4 h-4 text-green-500" />
              )}
              {validationResult["thesisContext"]?.isValid === false &&
                validationResult["thesisContext"]?.message && (
                  <WarningIcon className="w-4 h-4 text-yellow-500" />
                )}
            </span>
          </label>
          <Textarea
            id="thesisContext"
            value={
              (inputs as Record<InputField, string>)["thesisContext"] ?? ""
            }
            onChange={(e) => onInputChange("thesisContext", e.target.value)}
            placeholder="Paste your thesis here so the AI can check alignment."
            rows={2}
          />
          {validationResult["thesisContext"]?.message && (
            <p className="text-sm text-red-500 mt-1">
              {validationResult["thesisContext"].message}
            </p>
          )}
        </div>
      )}
      <Card>
        <div className="p-6 space-y-6">
          {config.map(({ field, label, placeholder, rows }) => (
            <InputSection
              key={field}
              field={field}
              label={label}
              value={(inputs as Record<InputField, string>)[field] ?? ""}
              onChange={(val) => onInputChange(field, val)}
              placeholder={placeholder}
              rows={rows}
              validationState={validationResult[field]}
            />
          ))}
          <CoherenceStatusDisplay coherence={coherence} />
          <div className="flex gap-3">
            <Button
              onClick={onCoherenceCheck}
              disabled={!isSyntaxValid || isCoherenceChecking || isLoading}
              className="flex-1 justify-center bg-slate-600 hover:bg-slate-700"
            >
              {isCoherenceChecking ? (
                <>
                  <LoaderIcon className="w-5 h-5 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                "Check Coherence"
              )}
            </Button>
            <Button
              onClick={onSubmit}
              disabled={isLoading || !isFormValid}
              className="flex-1 justify-center"
            >
              {isLoading ? (
                <>
                  <LoaderIcon className="w-5 h-5 mr-2 animate-spin" />
                  Getting Feedback...
                </>
              ) : (
                "Get Feedback"
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default InputForm;
