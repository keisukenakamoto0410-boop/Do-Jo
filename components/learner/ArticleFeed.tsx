"use client";

import { useState, useEffect } from "react";

interface Article {
  title: string;
  excerpt: string;
  url: string;
  image?: string | null;
  date?: string;
}

export default function ArticleFeed() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const response = await fetch("/api/articles/external");

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setArticles(data.articles || []);
    } catch (error) {
      console.error("Failed to fetch articles:", error);
      setError("Failed to load articles");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <h3 className="text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
          <span className="text-2xl">📰</span>
          Career Tips & Resources
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-neutral-100 rounded-xl overflow-hidden animate-pulse">
              <div className="h-40 bg-neutral-200"></div>
              <div className="p-4 space-y-2">
                <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
                <div className="h-3 bg-neutral-200 rounded w-full"></div>
                <div className="h-3 bg-neutral-200 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📰</span>
          </div>
          <p className="text-neutral-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setLoading(true);
              setError(null);
              fetchArticles();
            }}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (articles.length === 0) {
    return null;
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
          <span className="text-2xl">📰</span>
          Career Tips & Resources
        </h3>
        <a
          href="https://myjugaad-japan-career.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary hover:text-primary-dark font-medium flex items-center gap-1 transition-colors"
        >
          <span>View All</span>
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 8l4 4m0 0l-4 4m4-4H3"
            />
          </svg>
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {articles.slice(0, 4).map((article, index) => (
          <a
            key={index}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group block bg-white rounded-xl overflow-hidden border border-neutral-100 hover:shadow-lg transition-all transform hover:-translate-y-1"
          >
            {/* Thumbnail */}
            {article.image ? (
              <div className="relative h-40 overflow-hidden bg-neutral-100">
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    if (target.parentElement) {
                      const fallback = document.createElement("div");
                      fallback.className = "w-full h-full bg-gradient-to-br from-primary via-primary-dark to-accent flex items-center justify-center";
                      fallback.innerHTML = '<span class="text-5xl">📝</span>';
                      target.parentElement.appendChild(fallback);
                    }
                  }}
                />
              </div>
            ) : (
              <div className="h-40 bg-gradient-to-br from-primary via-primary-dark to-accent flex items-center justify-center">
                <span className="text-5xl">📝</span>
              </div>
            )}

            {/* Text Content */}
            <div className="p-4">
              <h4 className="font-bold text-sm text-neutral-900 mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                {article.title}
              </h4>
              <p className="text-xs text-neutral-600 line-clamp-2 mb-3">
                {article.excerpt}
              </p>

              {/* Date and Link */}
              <div className="flex items-center justify-between text-xs">
                {article.date && (
                  <span className="text-neutral-500">
                    {new Date(article.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                )}
                <span className="flex items-center gap-1 text-primary group-hover:text-primary-dark font-medium">
                  <span>Read More</span>
                  <svg
                    className="w-3 h-3 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
