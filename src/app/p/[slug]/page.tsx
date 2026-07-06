import { getPublicDocument } from "@/server/actions/publish";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface Props { params: Promise<{ slug: string }>; }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const doc = await getPublicDocument(slug);
  return { title: doc ? `${doc.title} — CollabDocs` : "Not Found" };
}

export default async function PublicPage({ params }: Props) {
  const { slug } = await params;
  const doc = await getPublicDocument(slug);

  if (!doc) notFound();

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto p-8 md:p-16">
        <div className="mb-8 pb-8 border-b border-zinc-200">
          <h1 className="text-3xl font-bold text-zinc-900">{doc.title}</h1>
          <p className="text-sm text-zinc-500 mt-2">
            Published from {doc.workspace.name} &middot; CollabDocs
          </p>
        </div>

        <div className="space-y-6">
          {doc.blocks.map((block) => {
            switch (block.type) {
              case "heading":
                return <h2 key={block.id} className="text-2xl font-bold text-zinc-900">{block.content}</h2>;
              case "code":
                return <pre key={block.id} className="bg-zinc-100 rounded-xl p-4 text-sm font-mono text-zinc-800 overflow-x-auto">{block.content}</pre>;
              case "quote":
                return <blockquote key={block.id} className="border-l-4 border-blue-500 pl-4 italic text-zinc-600">{block.content}</blockquote>;
              case "callout":
                return <div key={block.id} className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-blue-800">{block.content}</div>;
              case "image": {
                let url = ""; try { url = JSON.parse(block.content).url; } catch { url = block.content; }
                return <img key={block.id} src={url} alt="" className="rounded-xl max-w-full" />;
              }
              default:
                return block.content ? <p key={block.id} className="text-zinc-700 leading-relaxed">{block.content}</p> : <br key={block.id} />;
            }
          })}
        </div>

        {doc.blocks.length === 0 && (
          <p className="text-zinc-400 text-center py-16">This document is empty.</p>
        )}

        <footer className="mt-16 pt-8 border-t border-zinc-200 text-center">
          <p className="text-xs text-zinc-400">Powered by CollabDocs</p>
        </footer>
      </div>
    </div>
  );
}
