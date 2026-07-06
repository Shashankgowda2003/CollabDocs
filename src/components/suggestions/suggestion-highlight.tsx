"use client";

interface Props {
  oldContent: string;
  newContent: string;
  type: "add" | "remove" | "change";
}

export function SuggestionHighlight({ oldContent, newContent, type }: Props) {
  if (type === "add") {
    return (
      <span className="bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 rounded-sm px-0.5 border-b border-dashed border-green-400">
        {newContent}
      </span>
    );
  }

  if (type === "remove") {
    return (
      <span className="bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 rounded-sm px-0.5 line-through">
        {oldContent}
      </span>
    );
  }

  return (
    <span className="relative">
      <span className="bg-red-100 dark:bg-red-500/10 text-red-400 rounded-sm px-0.5 line-through absolute top-0 left-0">
        {oldContent}
      </span>
      <span className="bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 rounded-sm px-0.5 opacity-0">
        {oldContent}
      </span>
      <span className="bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 rounded-sm px-0.5">
        {newContent}
      </span>
    </span>
  );
}
