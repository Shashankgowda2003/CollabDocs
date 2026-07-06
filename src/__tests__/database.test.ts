import { describe, it, expect } from "vitest";
import type { DatabaseData, Column, Row } from "@/components/editor/blocks/database-types";

function createEmptyDatabase(): DatabaseData {
  return {
    schema: [
      { id: "col-name", name: "Name", type: "text" },
      { id: "col-status", name: "Status", type: "select", options: ["Todo", "Done"] },
    ],
    rows: [],
    views: [
      { id: "view-table", type: "table", name: "Table" },
      { id: "view-board", type: "board", name: "Board" },
    ],
  };
}

function createRow(schema: Column[]): Row {
  const cells: Record<string, unknown> = {};
  for (const col of schema) {
    if (col.type === "checkbox") cells[col.id] = false;
    else if (col.type === "select" && col.options && col.options.length > 0) cells[col.id] = col.options[0];
    else cells[col.id] = "";
  }
  return { id: "row-1", cells };
}

function getCellValue(row: Row, columnId: string, defaultValue?: unknown): unknown {
  return row.cells[columnId] ?? defaultValue;
}

function setCellValue(row: Row, columnId: string, value: unknown): Row {
  return { ...row, cells: { ...row.cells, [columnId]: value } };
}

describe("database utilities", () => {
  it("creates empty database structure", () => {
    const data = createEmptyDatabase();
    expect(data.schema).toHaveLength(2);
    expect(data.rows).toHaveLength(0);
    expect(data.views).toHaveLength(2);
  });

  it("creates a row with default values", () => {
    const data = createEmptyDatabase();
    const row = createRow(data.schema);
    expect(row.cells["col-name"]).toBe("");
    expect(row.cells["col-status"]).toBe("Todo");
  });

  it("gets and sets cell values", () => {
    const data = createEmptyDatabase();
    const row = createRow(data.schema);
    expect(getCellValue(row, "col-name")).toBe("");

    const updated = setCellValue(row, "col-name", "Task A");
    expect(getCellValue(updated, "col-name")).toBe("Task A");
    expect(getCellValue(row, "col-name")).toBe(""); // immutable
  });

  it("validates database data structure", () => {
    const data = createEmptyDatabase();
    expect(Array.isArray(data.schema)).toBe(true);
    expect(Array.isArray(data.rows)).toBe(true);
    expect(Array.isArray(data.views)).toBe(true);
  });

  it("filters rows by select column for kanban", () => {
    const data = createEmptyDatabase();
    const row1 = createRow(data.schema);
    row1.cells["col-status"] = "Todo";
    const row2 = createRow(data.schema);
    row2.cells["col-status"] = "Done";

    const todoRows = [row1, row2].filter((r) => getCellValue(r, "col-status", "") === "Todo");
    expect(todoRows).toHaveLength(1);
    expect(getCellValue(todoRows[0], "col-name")).toBe("");
  });

  it("parses database content JSON", () => {
    const data = createEmptyDatabase();
    const json = JSON.stringify(data);
    const parsed = JSON.parse(json);
    expect(parsed.schema).toHaveLength(2);
    expect(parsed.views[0].type).toBe("table");
  });

  it("groups rows by status for board view", () => {
    const data = createEmptyDatabase();
    const statusCol = data.schema.find((c: Column) => c.id === "col-status")!;
    const rows = [
      { id: "1", cells: { "col-status": "Todo" } },
      { id: "2", cells: { "col-status": "Done" } },
      { id: "3", cells: { "col-status": "Todo" } },
    ];

    const groups: Record<string, Row[]> = {};
    for (const row of rows) {
      const group = getCellValue(row, statusCol.id, "") as string;
      groups[group] = groups[group] || [];
      groups[group].push(row);
    }

    expect(groups["Todo"]).toHaveLength(2);
    expect(groups["Done"]).toHaveLength(1);
  });
});
