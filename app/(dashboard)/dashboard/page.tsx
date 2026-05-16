import { prisma } from "@/app/lib/db";
import { getSession } from "@/app/lib/session";
import Link from "next/link";

export default async function DashboardPage() {
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

  const isAdmin = userRole === "ADMIN";

  // Get stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [activeProducts, totalUsers, totalSales, todaySales] =
    await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.sale.count({ where: { status: "CONFIRMED" } }),
      prisma.sale.findMany({
        where: { createdAt: { gte: today }, status: "CONFIRMED" },
        select: { totalAmount: true },
      }),
    ]);

  // Low stock (admin only)
  let lowStockList: { id: string; name: string; stock: number; sku: string }[] = [];
  if (isAdmin) {
    const allActiveProducts = await prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, name: true, stock: true, lowStockThreshold: true, sku: true },
    });
    lowStockList = allActiveProducts
      .filter((p) => p.stock <= p.lowStockThreshold)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 5);
  }

  // Staff: their own sales today
  let mySalesToday = 0;
  if (!isAdmin && session?.userId) {
    mySalesToday = await prisma.sale.count({
      where: {
        createdBy: session.userId,
        createdAt: { gte: today },
        status: "CONFIRMED",
      },
    });
  }

  const todayRevenue = todaySales.reduce(
    (sum, s) => sum + Number(s.totalAmount),
    0
  );

  return (
    <div>
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Welcome back, {userName} 👋</h1>
        <p className="text-muted-foreground mt-1">
          {isAdmin
            ? "Here\u0027s an overview of your QuickBill system."
            : "Ready to take orders. Start a new sale below."}
        </p>
      </div>

      {/* Stats — different for admin vs staff */}
      {isAdmin ? (
        /* ─── ADMIN STATS ─── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
          <StatCard
            label="Active Products"
            value={activeProducts}
            color="primary"
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>}
          />
          <StatCard
            label="Total Sales"
            value={totalSales}
            color="success"
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" /></svg>}
          />
          <StatCard
            label="Today's Revenue"
            value={`₹${todayRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
            color="warning"
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <StatCard
            label="Active Users"
            value={totalUsers}
            color="primary"
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>}
          />
        </div>
      ) : (
        /* ─── STAFF STATS ─── */
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-children">
          <StatCard
            label="My Sales Today"
            value={mySalesToday}
            color="primary"
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" /></svg>}
          />
          <StatCard
            label="Today's Revenue"
            value={`₹${todayRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
            color="success"
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <StatCard
            label="Available Products"
            value={activeProducts}
            color="warning"
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>}
          />
        </div>
      )}

      {/* Low stock alert — admin only */}
      {isAdmin && lowStockList.length > 0 && (
        <div className="mt-6 bg-card border border-warning/20 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-warning-glow border border-warning/20 flex items-center justify-center text-warning">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-warning">Low Stock Alert</h3>
              <p className="text-xs text-muted-foreground">{lowStockList.length} product{lowStockList.length !== 1 ? "s" : ""} need attention</p>
            </div>
          </div>
          <div className="space-y-2">
            {lowStockList.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-1.5">
                <div>
                  <span className="text-sm font-medium">{p.name}</span>
                  <span className="text-xs text-muted ml-2 font-mono">{p.sku}</span>
                </div>
                <span className={`text-sm font-bold ${p.stock === 0 ? "text-danger" : "text-warning"}`}>
                  {p.stock === 0 ? "Out of stock" : `${p.stock} left`}
                </span>
              </div>
            ))}
          </div>
          <Link href="/stock" className="inline-flex items-center gap-1.5 text-xs text-warning hover:text-warning/80 mt-3 font-medium transition-colors">
            View all stock →
          </Link>
        </div>
      )}

      {/* Quick actions — role-based */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className={`grid grid-cols-1 ${isAdmin ? "sm:grid-cols-3" : "sm:grid-cols-2"} gap-4`}>
          {/* New Sale — both roles */}
          <Link href="/sales/new" className="bg-card border border-border rounded-2xl p-5 hover:border-primary/30 hover:bg-primary-glow/30 transition-all duration-300 group flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <div>
              <p className="font-medium">New Sale</p>
              <p className="text-sm text-muted">Create a new bill</p>
            </div>
          </Link>

          {/* View Sales — both roles */}
          <Link href="/sales" className="bg-card border border-border rounded-2xl p-5 hover:border-primary/30 hover:bg-primary-glow/30 transition-all duration-300 group flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </div>
            <div>
              <p className="font-medium">View Sales</p>
              <p className="text-sm text-muted">Browse past orders</p>
            </div>
          </Link>

          {/* Admin-only actions */}
          {isAdmin && (
            <Link href="/stock" className="bg-card border border-border rounded-2xl p-5 hover:border-primary/30 hover:bg-primary-glow/30 transition-all duration-300 group flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              </div>
              <div>
                <p className="font-medium">Manage Stock</p>
                <p className="text-sm text-muted">Restock & monitor</p>
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// Reusable stat card component
function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: string | number;
  color: "primary" | "success" | "warning";
  icon: React.ReactNode;
}) {
  const colorMap = {
    primary: { text: "text-primary", bg: "bg-primary-glow", border: "border-primary/20" },
    success: { text: "text-success", bg: "bg-success-glow", border: "border-success/20" },
    warning: { text: "text-warning", bg: "bg-warning-glow", border: "border-warning/20" },
  };
  const c = colorMap[color];
  return (
    <div className="bg-card border border-border rounded-2xl p-5 hover:border-border-hover transition-all duration-300 group">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-11 h-11 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center ${c.text} group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
