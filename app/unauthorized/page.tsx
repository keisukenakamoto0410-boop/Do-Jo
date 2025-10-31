import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl mb-4">🚫</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          アクセスが拒否されました
        </h1>
        <p className="text-gray-600 mb-8">
          このページにアクセスする権限がありません。
        </p>
        <Link
          href="/"
          className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
        >
          ホームに戻る
        </Link>
      </div>
    </div>
  );
}
