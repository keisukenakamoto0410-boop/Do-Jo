import Link from "next/link";
import Button from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
            404
          </div>
          <div className="text-6xl mt-4">🔍</div>
        </div>

        {/* Title and Description */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          ページが見つかりません
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          お探しのページは存在しないか、移動または削除された可能性があります。
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
          <Link href="/">
            <Button variant="primary" size="lg" leftIcon={<span>🏠</span>}>
              ホームに戻る
            </Button>
          </Link>
          <Link href="/candidate/dashboard">
            <Button variant="outline" size="lg" leftIcon={<span>📊</span>}>
              ダッシュボード
            </Button>
          </Link>
        </div>

        {/* Help Links */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">よくアクセスされるページ:</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/candidate/book"
              className="text-sm text-blue-600 hover:underline"
            >
              面接予約
            </Link>
            <span className="text-gray-300">•</span>
            <Link
              href="/candidate/resume"
              className="text-sm text-blue-600 hover:underline"
            >
              レジュメ
            </Link>
            <span className="text-gray-300">•</span>
            <Link
              href="/support"
              className="text-sm text-blue-600 hover:underline"
            >
              サポート
            </Link>
            <span className="text-gray-300">•</span>
            <Link
              href="/contact"
              className="text-sm text-blue-600 hover:underline"
            >
              お問い合わせ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
