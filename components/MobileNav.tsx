"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

interface NavItem {
  href: string;
  label: string;
  labelJa: string;
  icon: string;
}

interface MobileNavProps {
  isLearner?: boolean;
}

export default function MobileNav({ isLearner = true }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  const learnerNavItems: NavItem[] = [
    { href: "/learner/dashboard", label: "Home", labelJa: "ホーム", icon: "🏠" },
    { href: "/learner/browse", label: "Book", labelJa: "予約", icon: "📅" },
    { href: "/learner/reservations", label: "Sessions", labelJa: "予約一覧", icon: "📋" },
    { href: "/learner/post", label: "Post", labelJa: "投稿", icon: "📝" },
  ];

  const hostNavItems: NavItem[] = [
    { href: "/host/dashboard", label: "Home", labelJa: "ホーム", icon: "🏠" },
    { href: "/host/schedule", label: "Schedule", labelJa: "スケジュール", icon: "📅" },
    { href: "/host/reservations", label: "Sessions", labelJa: "予約一覧", icon: "📋" },
    { href: "/host/earnings", label: "Earnings", labelJa: "収益", icon: "💰" },
  ];

  const navItems = isLearner ? learnerNavItems : hostNavItems;

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href={isLearner ? "/learner/dashboard" : "/host/dashboard"} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">道</span>
            </div>
            <span className="font-bold text-gray-900">Do Jo</span>
          </Link>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/50"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="absolute right-0 top-0 h-full w-64 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Menu Header */}
            <div className="p-4 border-b bg-gradient-to-r from-sky-500 to-blue-600 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold">
                  {session?.user?.name?.[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <p className="font-bold">{session?.user?.name || "User"}</p>
                  <p className="text-xs text-sky-100">{session?.user?.email}</p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <nav className="p-4">
              <ul className="space-y-2">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                          isActive
                            ? "bg-sky-100 text-sky-700"
                            : "hover:bg-gray-100 text-gray-700"
                        }`}
                      >
                        <span className="text-xl">{item.icon}</span>
                        <span className="font-medium">
                          {isLearner ? item.label : item.labelJa}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>

              <hr className="my-4" />

              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
              >
                <span className="text-xl">🚪</span>
                <span className="font-medium">
                  {isLearner ? "Sign Out" : "ログアウト"}
                </span>
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Bottom Navigation (Mobile) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t shadow-lg">
        <div className="flex justify-around py-2">
          {navItems.slice(0, 4).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[60px] ${
                  isActive ? "text-sky-600" : "text-gray-500"
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-xs font-medium truncate">
                  {isLearner ? item.label.split(" ")[0] : item.labelJa}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Spacer for fixed header and bottom nav */}
      <div className="lg:hidden h-14"></div>
    </>
  );
}
