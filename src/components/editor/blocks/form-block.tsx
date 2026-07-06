"use client";

import { useState } from "react";

interface FormField {
  id: string;
  type: "text" | "textarea" | "select" | "checkbox" | "email";
  label: string;
  placeholder?: string;
  options?: string[];
  required?: boolean;
}

interface FormBlockProps {
  content: string;
  onChange: (content: string) => void;
}

const FIELD_TYPES: { value: FormField["type"]; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Long Text" },
  { value: "select", label: "Dropdown" },
  { value: "checkbox", label: "Checkbox" },
  { value: "email", label: "Email" },
];

export function FormBlock({ content, onChange }: FormBlockProps) {
  let title = "Form";
  let description = "";
  let fields: FormField[] = [];
  try {
    const p = JSON.parse(content);
    title = p.title || title;
    description = p.description || "";
    fields = p.fields || [];
  } catch {
    fields = [];
  }

  const [mode, setMode] = useState<"preview" | "builder">(fields.length === 0 ? "builder" : "preview");
  const [responses, setResponses] = useState<Record<string, unknown>>({});
  const [submitted, setSubmitted] = useState(false);

  function save(newFields: FormField[], newTitle?: string, newDesc?: string) {
    onChange(JSON.stringify({
      title: newTitle ?? title,
      description: newDesc ?? description,
      fields: newFields,
    }));
  }

  function addField() {
    const field: FormField = {
      id: crypto.randomUUID(),
      type: "text",
      label: "New Field",
      placeholder: "",
    };
    save([...fields, field]);
  }

  function updateField(fieldId: string, updates: Partial<FormField>) {
    save(fields.map((f) => (f.id === fieldId ? { ...f, ...updates } : f)));
  }

  function removeField(fieldId: string) {
    save(fields.filter((f) => f.id !== fieldId));
  }

  function updateResponse(fieldId: string, value: unknown) {
    setResponses((prev) => ({ ...prev, [fieldId]: value }));
  }

  function handleSubmit() {
    const result = { title, responses, submittedAt: new Date().toISOString() };
    onChange(JSON.stringify({ title, description, fields, lastResponse: result }));
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">Form</span>
          <input
            className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 bg-transparent outline-none"
            value={title}
            onChange={(e) => save(fields, e.target.value)}
            placeholder="Form title"
          />
        </div>
        <button
          onClick={() => setMode(mode === "builder" ? "preview" : "builder")}
          className="text-[10px] font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 px-2 py-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
        >
          {mode === "builder" ? "Preview" : "Build"}
        </button>
      </div>

      {mode === "builder" ? (
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-[10px] font-medium text-zinc-400 mb-1">Description</label>
            <input
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 outline-none placeholder:text-zinc-400"
              value={description}
              onChange={(e) => save(fields, undefined, e.target.value)}
              placeholder="Optional description"
            />
          </div>

          <div className="space-y-3">
            {fields.map((field) => (
              <div key={field.id} className="rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    className="flex-1 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1 text-xs text-zinc-700 dark:text-zinc-300 outline-none"
                    value={field.label}
                    onChange={(e) => updateField(field.id, { label: e.target.value })}
                    placeholder="Field label"
                  />
                  <select
                    className="rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1 text-[10px] text-zinc-600 dark:text-zinc-400 outline-none"
                    value={field.type}
                    onChange={(e) => updateField(field.id, {
                      type: e.target.value as FormField["type"],
                      options: e.target.value === "select" ? (field.options || ["Option 1"]) : undefined,
                    })}
                  >
                    {FIELD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <label className="flex items-center gap-1 text-[10px] text-zinc-500">
                    <input
                      type="checkbox"
                      className="h-3 w-3 rounded"
                      checked={field.required ?? false}
                      onChange={(e) => updateField(field.id, { required: e.target.checked })}
                    />
                    Req.
                  </label>
                  <button onClick={() => removeField(field.id)} className="text-zinc-400 hover:text-red-400 text-xs">×</button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    className="flex-1 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1 text-xs text-zinc-500 outline-none placeholder:text-zinc-400"
                    value={field.placeholder ?? ""}
                    onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                    placeholder="Placeholder text"
                  />
                  {field.type === "select" && (
                    <input
                      className="flex-1 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1 text-xs text-zinc-500 outline-none placeholder:text-zinc-400"
                      value={field.options?.join(", ") ?? ""}
                      onChange={(e) => updateField(field.id, { options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                      placeholder="Option 1, Option 2, Option 3"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={addField}
            className="w-full rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 py-2 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-all"
          >
            + Add field
          </button>
        </div>
      ) : (
        <div className="p-5">
          {description && <p className="text-xs text-zinc-500 mb-4">{description}</p>}

          <div className="space-y-3">
            {fields.map((field) => (
              <div key={field.id}>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                  {field.label}
                  {field.required && <span className="text-red-400 ml-0.5">*</span>}
                </label>
                {field.type === "textarea" ? (
                  <textarea
                    className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 outline-none resize-y placeholder:text-zinc-400"
                    placeholder={field.placeholder}
                    value={String(responses[field.id] ?? "")}
                    onChange={(e) => updateResponse(field.id, e.target.value)}
                    rows={3}
                  />
                ) : field.type === "select" ? (
                  <select
                    className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 outline-none"
                    value={String(responses[field.id] ?? "")}
                    onChange={(e) => updateResponse(field.id, e.target.value)}
                  >
                    <option value="">Select...</option>
                    {field.options?.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                ) : field.type === "checkbox" ? (
                  <input
                    type="checkbox"
                    checked={Boolean(responses[field.id])}
                    onChange={(e) => updateResponse(field.id, e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 text-blue-600"
                  />
                ) : field.type === "email" ? (
                  <input
                    type="email"
                    className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 outline-none placeholder:text-zinc-400"
                    placeholder={field.placeholder}
                    value={String(responses[field.id] ?? "")}
                    onChange={(e) => updateResponse(field.id, e.target.value)}
                  />
                ) : (
                  <input
                    type="text"
                    className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 outline-none placeholder:text-zinc-400"
                    placeholder={field.placeholder}
                    value={String(responses[field.id] ?? "")}
                    onChange={(e) => updateResponse(field.id, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>

          {fields.length > 0 && (
            <button
              onClick={handleSubmit}
              className="mt-4 rounded-xl bg-blue-500 hover:bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-all"
            >
              {submitted ? "Submitted!" : "Submit"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
