import { Meilisearch } from "meilisearch";

const MEILISEARCH_HOST = process.env.MEILISEARCH_HOST || "http://localhost:7700";
const MEILISEARCH_API_KEY = process.env.MEILISEARCH_API_KEY || "masterKey";

const client = new Meilisearch({
  host: MEILISEARCH_HOST,
  apiKey: MEILISEARCH_API_KEY,
});

const INDEX_NAME = "documents";

async function ensureIndex() {
  try {
    await client.getIndex(INDEX_NAME);
  } catch {
    await client.createIndex(INDEX_NAME, { primaryKey: "id" });
    await client.index(INDEX_NAME).updateFilterableAttributes([
      "workspaceId",
      "folderId",
      "authorId",
      "type",
      "tags",
      "updatedAt",
    ]);
    await client.index(INDEX_NAME).updateSortableAttributes(["updatedAt"]);
  }
}

interface SearchDocument {
  id: string;
  type: "document" | "block" | "comment";
  workspaceId: string;
  folderId: string | null;
  workspaceName: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  tags: string[];
  updatedAt: number;
}

export async function indexDocument(doc: {
  id: string;
  title: string;
  workspaceId: string;
  workspaceName: string;
  folderId: string | null;
  authorId: string;
  authorName: string;
  tags: string[];
  blocks: { id: string; content: string }[];
  updatedAt: Date;
}) {
  await ensureIndex();

  const documents: SearchDocument[] = [
    {
      id: doc.id,
      type: "document",
      workspaceId: doc.workspaceId,
      folderId: doc.folderId,
      workspaceName: doc.workspaceName,
      title: doc.title,
      content: doc.blocks.map((b) => b.content).join(" "),
      authorId: doc.authorId,
      authorName: doc.authorName,
      tags: doc.tags,
      updatedAt: doc.updatedAt.getTime(),
    },
  ];

  await client.index(INDEX_NAME).addDocuments(documents);
}

export async function removeDocument(documentId: string) {
  await ensureIndex();
  try {
    await client.index(INDEX_NAME).deleteDocument(documentId);
  } catch {
    // Index or document may not exist
  }
}

export async function searchContent(
  query: string,
  accessibleWorkspaceIds: string[],
  filters?: { type?: string; workspaceId?: string; tag?: string }
) {
  await ensureIndex();

  let filter = `workspaceId IN [${accessibleWorkspaceIds.map((id) => `"${id}"`).join(",")}]`;

  if (filters?.type) {
    filter += ` AND type = "${filters.type}"`;
  }
  if (filters?.workspaceId) {
    filter += ` AND workspaceId = "${filters.workspaceId}"`;
  }
  if (filters?.tag) {
    filter += ` AND tags = "${filters.tag}"`;
  }

  const results = await client.index(INDEX_NAME).search<SearchDocument>(query, {
    filter,
    sort: ["updatedAt:desc"],
    limit: 20,
    attributesToHighlight: ["title", "content"],
    attributesToCrop: ["content"],
    cropLength: 100,
  });

  return results;
}

export async function clearSearchIndex() {
  try {
    await client.index(INDEX_NAME).deleteAllDocuments();
  } catch {
    // Index may not exist
  }
}
