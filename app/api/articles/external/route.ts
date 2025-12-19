import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

// 記事URL一覧
const ARTICLE_URLS = [
  "https://myjugaad-japan-career.com/indian-student-in-japan-real-experience-after-1-month/",
  "https://myjugaad-japan-career.com/building-the-future-together/",
  "https://myjugaad-japan-career.com/mext-student-learning-living-and-researching-in-japan-a-story-of-grit-curiosity-and-cross-cultural-growth/",
  "https://myjugaad-japan-career.com/how-to-master-the-japanese-interview-process/",
];

// OGタグを取得する関数
async function fetchArticleMetadata(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; DoJoBot/1.0)",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // OGタグから情報取得
    const title =
      $('meta[property="og:title"]').attr("content") ||
      $("title").text() ||
      "記事";

    const description =
      $('meta[property="og:description"]').attr("content") ||
      $('meta[name="description"]').attr("content") ||
      "";

    const image =
      $('meta[property="og:image"]').attr("content") ||
      null;

    return {
      title: title.trim(),
      excerpt: description.trim().slice(0, 100),
      url,
      image,
      date: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Failed to fetch metadata for ${url}:`, error);

    // フォールバック: URLから推測
    const urlTitle = url
      .split("/")
      .filter((part) => part)
      .pop()
      ?.replace(/-/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase()) || "記事";

    return {
      title: urlTitle,
      excerpt: "日本でのキャリアに役立つ情報をお届けします",
      url,
      image: null,
      date: new Date().toISOString(),
    };
  }
}

// キャッシュ（メモリ）
let cachedArticles: any[] | null = null;
let cacheTime: number | null = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1時間

export async function GET() {
  try {
    // キャッシュチェック
    if (
      cachedArticles &&
      cacheTime &&
      Date.now() - cacheTime < CACHE_DURATION
    ) {
      console.log("✅ Returning cached articles");
      return NextResponse.json({ articles: cachedArticles });
    }

    console.log("🔄 Fetching fresh articles...");

    // 並列で全記事のメタデータを取得
    const articles = await Promise.all(
      ARTICLE_URLS.map((url) => fetchArticleMetadata(url))
    );

    console.log("✅ Articles fetched:", articles.length);

    // キャッシュに保存
    cachedArticles = articles;
    cacheTime = Date.now();

    return NextResponse.json({ articles });
  } catch (error) {
    console.error("❌ Failed to fetch articles:", error);

    // エラー時のフォールバック
    return NextResponse.json({
      articles: ARTICLE_URLS.map((url) => ({
        title: "日本でのキャリアに役立つ記事",
        excerpt: "日本で働くための情報をお届けします",
        url,
        image: null,
        date: new Date().toISOString(),
      })),
    });
  }
}
