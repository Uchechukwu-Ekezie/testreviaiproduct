  import { NextResponse } from "next/server";
import { parseString } from "xml2js";

export async function GET(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit") as string, 10) : undefined;

  const username = process.env.NEXT_PUBLIC_MEDIUM_USERNAME || "ekezie";
  const mediumRSSFeed = `https://medium.com/feed/@${username}`;

  try {
    const response = await fetch(mediumRSSFeed);
    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch Medium feed" },
        { status: response.status }
      );
    }

    const xmlData = await response.text();

    // Convert XML to JSON
    const parsedData = await new Promise<{ rss: { channel: [{ item: RSSItem[] }] } }>((resolve, reject) => {
      parseString(xmlData, (err, result) => {
        if (err) {
          reject(new Error("Error parsing XML"));
        } else {
          resolve(result);
        }
      });
    });

    if (!parsedData.rss || !parsedData.rss.channel || !parsedData.rss.channel[0].item) {
      return NextResponse.json({ error: "Invalid RSS feed structure" }, { status: 500 });
    }

    interface RSSItem {
      title: string[];
      "content:encoded": string[];
      link: string[];
      category?: string[];
      pubDate: string[];
    }

    interface Post {
      title: string;
      description: string;
      link: string;
      category: string;
      pubDate: string;
      readTime: string;
      content: string;
      image: string | null;
    }

    const extractImage = (content: string): string | null => {
      const imgMatch = content.match(/<img.*?src=["'](.*?)["']/);
      const imgSrc = imgMatch ? imgMatch[1] : null;
      if (imgSrc && imgSrc.includes("medium.com/_/stat")) {
        return null;
      }
      return imgSrc;
    };

    const allPosts: Post[] = parsedData.rss.channel[0].item.map((item: RSSItem): Post => {
      const content = item["content:encoded"]?.[0] || "";
      const image = extractImage(content);

      return {
        title: item.title?.[0] || "Untitled",
        description: content.replace(/<[^>]*>/g, "").slice(0, 150) + "...",
        link: item.link?.[0] || "#",
        category: item.category?.[0] || "Uncategorized",
        pubDate: new Date(item.pubDate?.[0] || "").toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
        readTime: `${Math.ceil(content.split(" ").length / 200)} min read`,
        content,
        image,
      };
    });

    // ✅ Return the requested number of posts (or all if no limit)
    return NextResponse.json(limit ? allPosts.slice(0, limit) : allPosts, { status: 200 });

  } catch (error) {
    console.error("Error fetching Medium posts:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
