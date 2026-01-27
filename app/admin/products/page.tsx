"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

const ADMIN_EMAILS = ["keisuke.mjugaad91@gmail.com"];

interface ProductMapping {
  id: string;
  keyword: string;
  amazonUrl: string;
  productName: string;
  category: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminProductsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [products, setProducts] = useState<ProductMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductMapping | null>(null);
  const [formData, setFormData] = useState({
    keyword: "",
    amazonUrl: "",
    productName: "",
    category: "food",
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (
      session?.user?.email &&
      !ADMIN_EMAILS.includes(session.user.email)
    ) {
      router.push("/");
    }
  }, [status, session, router]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== "all") {
        params.set("category", selectedCategory);
      }
      const res = await fetch(`/api/admin/products?${params.toString()}`);
      if (!res.ok) {
        if (res.status === 403) {
          router.push("/");
          return;
        }
        throw new Error("Failed to fetch data");
      }
      const data = await res.json();
      setProducts(data.products);
    } catch (err) {
      console.error(err);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.email && ADMIN_EMAILS.includes(session.user.email)) {
      fetchProducts();
    }
  }, [session, router, selectedCategory]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      keyword: "",
      amazonUrl: "",
      productName: "",
      category: "food",
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (product: ProductMapping) => {
    setEditingProduct(product);
    setFormData({
      keyword: product.keyword,
      amazonUrl: product.amazonUrl,
      productName: product.productName,
      category: product.category,
      isActive: product.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const url = editingProduct
        ? `/api/admin/products/${editingProduct.id}`
        : "/api/admin/products";
      const method = editingProduct ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (product: ProductMapping) => {
    if (!confirm(`「${product.keyword}」を削除しますか？`)) return;

    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete");
      }

      fetchProducts();
    } catch (err) {
      console.error(err);
      setError("削除に失敗しました");
    }
  };

  const toggleActive = async (product: ProductMapping) => {
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !product.isActive }),
      });

      if (!res.ok) {
        throw new Error("Failed to update");
      }

      fetchProducts();
    } catch (err) {
      console.error(err);
      setError("更新に失敗しました");
    }
  };

  const filteredProducts = products.filter((product) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      product.keyword.toLowerCase().includes(query) ||
      product.productName.toLowerCase().includes(query)
    );
  });

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-2xl font-bold text-gray-900">
                Do Jo
              </Link>
              <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                Admin
              </span>
            </div>
            <nav className="flex items-center gap-4">
              <Link
                href="/admin/reservations"
                className="text-gray-600 hover:text-gray-900"
              >
                予約管理
              </Link>
              <Link
                href="/admin/users"
                className="text-gray-600 hover:text-gray-900"
              >
                ユーザー一覧
              </Link>
              <Link
                href="/admin/feedback"
                className="text-gray-600 hover:text-gray-900"
              >
                スコア一覧
              </Link>
              <Link
                href="/admin/products"
                className="text-gray-900 font-medium"
              >
                商品管理
              </Link>
              <span className="text-gray-600">{session.user.email}</span>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow p-4">
            <p className="text-sm text-gray-500">総商品数</p>
            <p className="text-2xl font-bold text-gray-900">{products.length}</p>
          </div>
          <div className="bg-green-50 rounded-xl shadow p-4">
            <p className="text-sm text-green-600">有効</p>
            <p className="text-2xl font-bold text-green-900">
              {products.filter((p) => p.isActive).length}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl shadow p-4">
            <p className="text-sm text-gray-600">無効</p>
            <p className="text-2xl font-bold text-gray-900">
              {products.filter((p) => !p.isActive).length}
            </p>
          </div>
          <div className="bg-orange-50 rounded-xl shadow p-4">
            <p className="text-sm text-orange-600">食品カテゴリ</p>
            <p className="text-2xl font-bold text-orange-900">
              {products.filter((p) => p.category === "food").length}
            </p>
          </div>
        </div>

        {/* Filters & Add Button */}
        <div className="bg-white rounded-xl shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="キーワード、商品名で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              {[
                { value: "all", label: "すべて" },
                { value: "food", label: "食品" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedCategory(option.value)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedCategory === option.value
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              + 新規追加
            </button>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                    キーワード
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                    商品名
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                    カテゴリ
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                    登録日
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded font-mono text-sm">
                        {product.keyword}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900 truncate max-w-xs">
                          {product.productName}
                        </p>
                        <a
                          href={product.amazonUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline truncate block max-w-xs"
                        >
                          Amazon Link
                        </a>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-sm">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleActive(product)}
                        className={`px-2 py-1 rounded text-sm font-medium ${
                          product.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {product.isActive ? "有効" : "無効"}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(product.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(product)}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
                        >
                          編集
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                        >
                          削除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredProducts.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <p className="text-4xl mb-2">📦</p>
              <p>商品マッピングがありません</p>
            </div>
          )}
        </div>

        <div className="mt-4 text-sm text-gray-500 text-right">
          {filteredProducts.length}件の商品を表示中
        </div>
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingProduct ? "商品を編集" : "新規商品を追加"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  キーワード *
                </label>
                <input
                  type="text"
                  value={formData.keyword}
                  onChange={(e) =>
                    setFormData({ ...formData, keyword: e.target.value })
                  }
                  placeholder="例: pho, tacos, kimchi"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  学習者のhometownFoodとマッチング
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  商品名 *
                </label>
                <input
                  type="text"
                  value={formData.productName}
                  onChange={(e) =>
                    setFormData({ ...formData, productName: e.target.value })
                  }
                  placeholder="例: ベトナム フォー インスタント麺"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amazon URL *
                </label>
                <input
                  type="url"
                  value={formData.amazonUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, amazonUrl: e.target.value })
                  }
                  placeholder="https://www.amazon.co.jp/dp/..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  カテゴリ
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="food">食品</option>
                  <option value="drink">飲料</option>
                  <option value="other">その他</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">
                  有効にする
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? "保存中..." : "保存"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
