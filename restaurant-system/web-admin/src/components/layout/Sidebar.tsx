'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingBag,
  Grid,
  CalendarCheck,
  Package,
  Truck,
  Users,
  DollarSign,
  FileSpreadsheet,
  Settings,
  ShieldAlert,
  LogOut,
  MonitorPlay,
  CreditCard,
  Building2,
  Tag,
  Star,
} from 'lucide-react';

interface SidebarProps {
  userRole?: string;
  userPermissions?: string[];
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const menuItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: 'dashboard:view' },
    { label: 'Orders', href: '/orders', icon: ShoppingBag, permission: 'orders:view' },
    { label: 'POS Terminal', href: '/pos', icon: CreditCard, permission: 'orders:create', badge: 'POS' },
    { label: 'Kitchen Display', href: '/kitchen', icon: MonitorPlay, permission: 'kitchen:view', badge: 'KDS' },
    { label: 'Menu Catalog', href: '/menu', icon: UtensilsCrossed, permission: 'menu:view' },
    { label: 'Tables & QR', href: '/tables', icon: Grid, permission: 'tables:view' },
    { label: 'Reservations', href: '/reservations', icon: CalendarCheck, permission: 'reservations:view' },
    { label: 'Inventory & Stock', href: '/inventory', icon: Package, permission: 'inventory:view' },
    { label: 'Suppliers & PO', href: '/suppliers', icon: Building2, permission: 'suppliers:view' },
    { label: 'Delivery & Dispatch', href: '/delivery', icon: Truck, permission: 'delivery:view' },
    { label: 'Staff & HR', href: '/hr', icon: Users, permission: 'hr:view' },
    { label: 'Expenses', href: '/expenses', icon: DollarSign, permission: 'expenses:view' },
    { label: 'Coupons & Offers', href: '/coupons', icon: Tag, permission: 'coupons:view' },
    { label: 'Reviews', href: '/reviews', icon: Star, permission: 'reviews:view' },
    { label: 'Reports & Analytics', href: '/reports', icon: FileSpreadsheet, permission: 'reports:view' },
    { label: 'Audit Logs', href: '/audit', icon: ShieldAlert, permission: 'audit_logs:view' },
    { label: 'Settings', href: '/settings', icon: Settings, permission: 'settings:view' },
  ];

  // Dynamic filter: super_admin sees all; other roles see only allowed menus
  const userPermissions: string[] = user?.permissions || [];
  const isSuperAdmin = user?.role === 'super_admin';

  const filteredMenuItems = menuItems.filter(
    (item) => isSuperAdmin || !item.permission || userPermissions.includes(item.permission)
  );

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col h-screen shrink-0 border-r border-slate-800">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
        <div className="w-9 h-9 rounded-lg bg-orange-600 flex items-center justify-center text-white font-bold shadow-md">
          <UtensilsCrossed className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-white text-base leading-tight">Spice Garden</h1>
          <p className="text-xs text-orange-400 capitalize">{user?.role?.replace('_', ' ') || 'Staff Portal'}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs text-slate-300">
            {user?.name?.slice(0, 2).toUpperCase() || 'SG'}
          </div>
          <div className="truncate">
            <p className="text-xs font-medium text-white truncate">{user?.name || 'Staff'}</p>
            <p className="text-[11px] text-slate-500 truncate">{user?.email || ''}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          title="Sign out"
          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
