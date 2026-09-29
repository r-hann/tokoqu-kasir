import React, { useState } from 'react';
import {
  ShoppingCart,
  Scan,
  Package,
  BookOpen,
  Receipt,
  Settings,
  Bluetooth,
  Menu,
  X,
  Store,
  ChevronRight,
  ArrowLeft,
  Home,
} from 'lucide-react';
import { AppSettings } from '../types/pos';
import { bluetoothPrinter } from '../utils/bluetoothPrinter';

export type NavTab = 'home' | 'kasir' | 'cek_harga' | 'produk' | 'kasbon' | 'riwayat' | 'pengaturan';

interface NavbarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  cartCount: number;
  unpaidKasbonCount: number;
  settings: AppSettings;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  cartCount,
  unpaidKasbonCount,
  settings,
}) => {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const isBtConnected = bluetoothPrinter.isConnected;

  const navItems: {
    id: NavTab;
    label: string;
    icon: React.ReactNode;
    badge?: number;
    badgeColor?: string;
  }[] = [
    {
      id: 'home',
      label: 'Beranda (Menu Widget)',
      icon: <Home className="w-4 h-4" />,
    },
    {
      id: 'kasir',
      label: 'Kasir Penjualan',
      icon: <ShoppingCart className="w-4 h-4" />,
      badge: cartCount,
      badgeColor: 'bg-amber-500 text-slate-950',
    },
    {
      id: 'cek_harga',
      label: 'Cek Harga Barcode',
      icon: <Scan className="w-4 h-4" />,
    },
    {
      id: 'produk',
      label: 'Katalog & Stok',
      icon: <Package className="w-4 h-4" />,
    },
    {
      id: 'kasbon',
      label: 'Buku Kasbon / Hutang',
      icon: <BookOpen className="w-4 h-4" />,
      badge: unpaidKasbonCount,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'riwayat',
      label: 'Riwayat Transaksi',
      icon: <Receipt className="w-4 h-4" />,
    },
    {
      id: 'pengaturan',
      label: 'Pengaturan & Struk',
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  const getMenuTitle = (tab: NavTab): string => {
    switch (tab) {
      case 'kasir':
        return 'Kasir Penjualan';
      case 'cek_harga':
        return 'Cek Harga Barcode';
      case 'produk':
        return 'Katalog & Stok Barang';
      case 'kasbon':
        return 'Buku Kasbon (Hutang)';
      case 'riwayat':
        return 'Riwayat Transaksi';
      case 'pengaturan':
        return 'Pengaturan & Struk';
      default:
        return 'Menu Utama';
    }
  };

  const handleSelectTab = (tabId: NavTab) => {
    onTabChange(tabId);
    setIsMobileDrawerOpen(false);
  };

  const isSubPage = currentTab !== 'home';

  if (!isSubPage) return null;

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between h-14 sm:h-16">
            
            {/* Left Section: Either Back button (if inside sub-page) or Logo (if on Home) */}
            <div className="flex items-center gap-2 sm:gap-3">
              {isSubPage ? (
                <button
                  type="button"
                  onClick={() => onTabChange('home')}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-amber-400 font-black rounded-xl text-xs sm:text-sm border border-slate-700 transition-all shadow-xs"
                >
                  <ArrowLeft className="w-4 h-4 stroke-[3]" />
                  <span>Menu Utama</span>
                </button>
              ) : (
                <div
                  onClick={() => onTabChange('home')}
                  className="flex items-center gap-2.5 cursor-pointer select-none group"
                >
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 flex items-center justify-center font-black text-base sm:text-lg shadow-sm group-hover:scale-105 transition-transform">
                    Q
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 leading-none">
                      <span className="font-black text-base sm:text-lg text-white tracking-tight">
                        Toko Qu
                      </span>
                      <span className="text-[9px] sm:text-[10px] bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded font-black tracking-wide uppercase">
                        Heni
                      </span>
                    </div>
                    <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium block mt-0.5">
                      by Hann
                    </span>
                  </div>
                </div>
              )}

              {/* Sub-page Title Badge */}
              {isSubPage && (
                <div className="flex items-center gap-1.5 pl-1">
                  <span className="text-slate-600 hidden sm:inline">•</span>
                  <h2 className="text-xs sm:text-sm font-black text-white truncate max-w-[150px] sm:max-w-xs">
                    {getMenuTitle(currentTab)}
                  </h2>
                </div>
              )}
            </div>

            {/* Right Section: Bluetooth status & Drawer menu */}
            <div className="flex items-center gap-2">
              {/* Bluetooth Button */}
              <button
                type="button"
                onClick={() => onTabChange('pengaturan')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  isBtConnected
                    ? 'bg-emerald-950/80 border border-emerald-500/60 text-emerald-400'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                title={isBtConnected ? 'Printer Bluetooth Terhubung' : 'Sambungkan Printer Bluetooth'}
              >
                <Bluetooth
                  className={`w-3.5 h-3.5 ${
                    isBtConnected ? 'text-emerald-400 animate-pulse' : 'text-slate-400'
                  }`}
                />
                <span className="hidden sm:inline">
                  {isBtConnected ? 'BT Aktif' : 'Printer'}
                </span>
              </button>

              {/* Drawer Menu Button */}
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(true)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1"
                aria-label="Semua Menu"
                title="Buka Menu"
              >
                <Menu className="w-5 h-5" />
                <span className="text-xs font-bold hidden md:inline">Menu</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* MOBILE DRAWER / SLIDE-OVER MENU */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setIsMobileDrawerOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-4/5 max-w-xs bg-slate-900 text-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200 border-r border-slate-800">
            {/* Drawer Header */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 font-black flex items-center justify-center text-base">
                  Q
                </div>
                <div>
                  <h3 className="font-black text-sm text-white">Toko Qu</h3>
                  <p className="text-[10px] text-amber-400 font-bold uppercase">Toko Heni</p>
                </div>
              </div>

              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Links */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                Daftar Layanan Toko
              </div>

              {navItems.map((item) => {
                const active = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-xs font-bold transition-all ${
                      active
                        ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                        : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={active ? 'text-slate-950' : 'text-amber-400'}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {item.badge !== undefined && item.badge > 0 && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                            active
                              ? 'bg-slate-950 text-amber-300'
                              : item.badgeColor || 'bg-amber-500 text-slate-950'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 opacity-50" />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Drawer Footer Info */}
            <div className="p-4 bg-slate-950/70 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                <Store className="w-3.5 h-3.5 text-amber-400" />
                <span>{settings.storeName || 'Toko Heni'}</span>
              </div>
              <p className="text-[10px] text-slate-500">Aplikasi Kasir Ringan & Hemat RAM</p>
              <p className="text-[10px] text-amber-400/90 font-medium pt-1">Developed by Hann</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
