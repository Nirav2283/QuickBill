import Sidebar from "@/app/components/Sidebar";
import { logout } from "@/app/actions/auth";
import { getSession } from "@/app/lib/session";
import { prisma } from "@/app/lib/db";
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  let userName = "User";
  let userRole = "STAFF";

  if (session?.userId) {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { name: true, role: true },
    });
    if (user) {
      userName = user.name;
      userRole = user.role;
    }
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar role={userRole} />

      {/* Main content */}
      <div className="flex-1 lg:ml-64">
        {/* Top bar */}
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-20 flex items-center justify-between px-6">
          {/* Mobile menu */}
          <div className="lg:hidden">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
              <span className="font-bold">QuickBill</span>
            </Link>
          </div>

          <div className="hidden lg:block" />

          {/* User info */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">
                  {userName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="hidden sm:block">
                <span className="text-sm font-medium block leading-tight">{userName}</span>
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                  userRole === "ADMIN" ? "text-warning" : "text-primary"
                }`}>
                  {userRole}
                </span>
              </div>
            </div>
            <form action={logout}>
              <button
                type="submit"
                className="lg:hidden p-2 rounded-lg text-muted hover:text-danger hover:bg-danger-glow transition-all duration-200 cursor-pointer"
                title="Sign out"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
              </button>
            </form>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6 animate-fade-in">{children}</main>
      </div>
    </div>
  );
}
