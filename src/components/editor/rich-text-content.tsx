"use client";

import { useEffect, useRef } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Highlight from "@tiptap/extension-highlight";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { FormattingToolbar } from "./formatting-toolbar";

interface RichTextProps {
  content: string;
  placeholder?: string;
  className?: string;
  onChange: (html: string, plainText: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  autoFocus?: boolean;
  editorRef?: React.MutableRefObject<Editor | null>;
}

function toHtml(content: string): string {
  if (!content) return "<p></p>";
  if (content.startsWith("<") && content.includes(">")) return content;
  const escaped = content.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<p>${escaped}</p>`;
}

export function RichTextContent({
  content,
  placeholder = "Type '/' for commands...",
  className = "",
  onChange,
  onKeyDown,
  onFocus,
  onBlur,
  autoFocus,
  editorRef,
}: RichTextProps) {
  const isExternalUpdate = useRef(false);
  const skipUpdate = useRef(false);
  const prevContentRef = useRef(content);

  const editor = useEditor({
    immediatelyRender: true,
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        horizontalRule: false,
        hardBreak: false,
        gapcursor: false,
        link: {
          openOnClick: true,
          HTMLAttributes: { class: "text-blue-500 dark:text-blue-400 underline cursor-pointer hover:text-blue-600 dark:hover:text-blue-300" },
        },
      }),
      Placeholder.configure({ placeholder }),
      Highlight.configure({ multicolor: true }),
      TextStyle,
      Color,
      Subscript,
      Superscript,
    ],
    content: toHtml(content),
    editable: true,
    autofocus: autoFocus ? "end" : false,
    onUpdate: ({ editor: ed }) => {
      if (skipUpdate.current) {
        skipUpdate.current = false;
        return;
      }
      isExternalUpdate.current = true;
      onChange(ed.getHTML(), ed.getText());
    },
    onFocus: () => onFocus?.(),
    onBlur: () => onBlur?.(),
    editorProps: {
      attributes: {
        class: `outline-none min-h-[1.5rem] ${className}`,
      },
      handleKeyDown: (_view, event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          if (onKeyDown) {
            onKeyDown(event as unknown as React.KeyboardEvent);
            return true;
          }
        }
        if (event.key === "Backspace") {
          const text = editor?.getText() || "";
          if (text === "" && onKeyDown) {
            onKeyDown(event as unknown as React.KeyboardEvent);
            return true;
          }
        }
        return false;
      },
    },
  });

  useEffect(() => {
    if (editorRef && editor) {
      editorRef.current = editor;
    }
  }, [editor, editorRef]);

  useEffect(() => {
    if (!editor) return;
    if (isExternalUpdate.current) {
      isExternalUpdate.current = false;
      prevContentRef.current = content;
      return;
    }
    if (content !== prevContentRef.current) {
      prevContentRef.current = content;
      const currentHtml = editor.getHTML();
      const targetHtml = toHtml(content);
      if (currentHtml !== targetHtml) {
        const { from, to } = editor.state.selection;
        skipUpdate.current = true;
        editor.commands.setContent(targetHtml);
        const newFrom = Math.min(from, editor.state.doc.content.size);
        const newTo = Math.min(to, editor.state.doc.content.size);
        try {
          editor.commands.setTextSelection({ from: newFrom, to: newTo });
        } catch { /* selection may be invalid after setContent */ }
      }
    }
  }, [content, editor]);

  if (!editor) return null;

  return (
    <>
      <FormattingToolbar editor={editor} />
      <EditorContent editor={editor} />
    </>
  );
}

export { toHtml };
