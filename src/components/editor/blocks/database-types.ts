export type ColumnType =
  | "text"
  | "number"
  | "select"
  | "multi_select"
  | "date"
  | "checkbox"
  | "person"
  | "math";

export interface Column {
  id: string;
  name: string;
  type: ColumnType;
  options?: string[];
}

export interface Row {
  id: string;
  cells: Record<string, unknown>;
}

export type ViewType = "table" | "board" | "calendar" | "gallery" | "timeline";

export interface ViewConfig {
  id: string;
  type: ViewType;
  name: string;
  groupByColumnId?: string;
  dateColumnId?: string;
}

export interface DatabaseData {
  schema: Column[];
  rows: Row[];
  views: ViewConfig[];
}

export const COLUMN_TYPE_LABELS: Record<ColumnType, string> = {
  text: "Text",
  number: "Number",
  select: "Select",
  multi_select: "Multi-select",
  date: "Date",
  checkbox: "Checkbox",
  person: "Person",
  math: "Math",
};

export function createEmptyDatabase(): DatabaseData {
  return {
    schema: [
      { id: crypto.randomUUID(), name: "Name", type: "text" },
      { id: crypto.randomUUID(), name: "Status", type: "select", options: ["Todo", "In Progress", "Done"] },
    ],
    rows: [],
    views: [
      { id: crypto.randomUUID(), type: "table", name: "Table" },
      { id: crypto.randomUUID(), type: "board", name: "Board", groupByColumnId: "" },
      { id: crypto.randomUUID(), type: "calendar", name: "Calendar", dateColumnId: "" },
    ],
  };
}

export function getCellValue(row: Row, columnId: string, defaultValue?: unknown): unknown {
  return row.cells[columnId] ?? defaultValue;
}

export function setCellValue(row: Row, columnId: string, value: unknown): Row {
  return { ...row, cells: { ...row.cells, [columnId]: value } };
}

export function createRow(schema: Column[]): Row {
  const cells: Record<string, unknown> = {};
  for (const col of schema) {
    if (col.type === "checkbox") cells[col.id] = false;
    else if (col.type === "math") cells[col.id] = "";
    else if (col.type === "select" && col.options && col.options.length > 0) cells[col.id] = col.options[0];
    else cells[col.id] = "";
  }
  return { id: crypto.randomUUID(), cells };
}

export function createColumn(type: ColumnType): Column {
  return {
    id: crypto.randomUUID(),
    name: "New Column",
    type,
    options: type === "select" || type === "multi_select" ? ["Option 1"] : undefined,
  };
}
