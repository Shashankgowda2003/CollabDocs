import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url).searchParams.get("url");
  if (!url) return NextResponse.json({ error: "URL required" }, { status: 400 });

  try {
    const res = await fetch(url, { headers: { "User-Agent": "CollabDocs/1.0" } });
    const html = await res.text();

    const getMeta = (prop: string) => {
      const match = html.match(new RegExp(`<meta[^>]*property="${prop}"[^>]*content="([^"]*)"`, "i"));
      return match?.[1] || "";
    };

    const title = getMeta("og:title") || html.match(/<title>([^<]*)<\/title>/i)?.[1] || url;
    const description = getMeta("og:description") || "";
    const image = getMeta("og:image") || "";
    const siteName = getMeta("og:site_name") || "";

    return NextResponse.json({ title, description, image, siteName, url });
  } catch {
    return NextResponse.json({ title: url, url, description: "", image: "", siteName: "" });
  }
}
