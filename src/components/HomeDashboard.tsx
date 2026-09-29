import React from 'react';
import {
  QrCode,
  PlusSquare,
  Edit3,
  List,
  ShoppingCart,
  BookOpen,
  Receipt,
  Settings,
  Bluetooth,
  TrendingUp,
  Banknote,
  Clock,
} from 'lucide-react';
import { Product, Transaction, KasbonRecord, AppSettings, CartItem } from '../types/pos';
import { formatRupiah } from '../utils/feedback';
import { bluetoothPrinter } from '../utils/bluetoothPrinter';

interface HomeDashboardProps {
  products: Product[];
  transactions: Transaction[];
  kasbonList: KasbonRecord[];
  settings: AppSettings;
  cart: CartItem[];
  onNavigate: (
    view: 'kasir' | 'cek_harga' | 'produk' | 'kasbon' | 'riwayat' | 'pengaturan',
    action?: 'tambah_produk'
  ) => void;
  onQuickScanFound?: (product: Product) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  products,
  transactions,
  kasbonList,
  settings,
  cart,
  onNavigate,
}) => {
  const isBtConnected = bluetoothPrinter.isConnected;
  const cartItemsCount = cart.reduce((sum, i) => sum + i.qty, 0);
  const unpaidKasbonCount = kasbonList.filter((k) => k.status === 'belum_lunas').length;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayTransactions = transactions.filter((t) => t.date.split('T')[0] === todayStr);
  const todayOmzet = todayTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
  const totalUnpaidKasbon = kasbonList
    .filter((k) => k.status === 'belum_lunas')
    .reduce((sum, k) => sum + k.remainingAmount, 0);

  const menuWidgets = [
    {
      id: 'cek_harga' as const,
      label: 'Cek Harga',
      icon: <QrCode className="w-8 h-8 sm:w-9 sm:h-9 text-slate-800" strokeWidth={2.2} />,
      onClick: () => onNavigate('cek_harga'),
    },
    {
      id: 'tambah_produk' as const,
      label: 'Tambah Produk',
      icon: (
        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-xs">
          <PlusSquare className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
        </div>
      ),
      onClick: () => onNavigate('produk', 'tambah_produk'),
    },
    {
      id: 'edit_produk' as const,
      label: 'Edit Produk',
      icon: <Edit3 className="w-8 h-8 sm:w-9 sm:h-9 text-slate-800" strokeWidth={2.2} />,
      onClick: () => onNavigate('produk'),
    },
    {
      id: 'daftar_produk' as const,
      label: 'Daftar Produk',
      icon: <List className="w-8 h-8 sm:w-9 sm:h-9 text-slate-800" strokeWidth={2.5} />,
      badge: `${products.length} Barang`,
      badgeColor: 'bg-slate-100 text-slate-700',
      onClick: () => onNavigate('produk'),
    },
    {
      id: 'kasir' as const,
      label: 'Kasir Penjualan',
      icon: <ShoppingCart className="w-8 h-8 sm:w-9 sm:h-9 text-amber-500" strokeWidth={2.2} />,
      badge: cartItemsCount > 0 ? `${cartItemsCount} item` : undefined,
      badgeColor: 'bg-amber-400 text-slate-950 font-black',
      onClick: () => onNavigate('kasir'),
    },
    {
      id: 'kasbon' as const,
      label: 'Buku Kasbon',
      icon: <BookOpen className="w-8 h-8 sm:w-9 sm:h-9 text-rose-500" strokeWidth={2.2} />,
      badge: unpaidKasbonCount > 0 ? `${unpaidKasbonCount} orang` : undefined,
      badgeColor: 'bg-rose-500 text-white font-bold',
      onClick: () => onNavigate('kasbon'),
    },
    {
      id: 'riwayat' as const,
      label: 'Riwayat Transaksi',
      icon: <Receipt className="w-8 h-8 sm:w-9 sm:h-9 text-indigo-500" strokeWidth={2.2} />,
      onClick: () => onNavigate('riwayat'),
    },
    {
      id: 'pengaturan' as const,
      label: 'Pengaturan & Struk',
      icon: <Settings className="w-8 h-8 sm:w-9 sm:h-9 text-slate-500" strokeWidth={2.2} />,
      badge: isBtConnected ? 'BT Aktif' : undefined,
      badgeColor: 'bg-emerald-500 text-white',
      onClick: () => onNavigate('pengaturan'),
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-3 sm:space-y-4 animate-in fade-in duration-200">
      
      {/* CLEAN MINIMALIST HEADER */}
      <div className="flex items-center justify-between px-1 pt-1 pb-1">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-slate-900 text-white font-black flex items-center justify-center text-base sm:text-lg shadow-sm">
            Q
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight leading-none">
              Toko Qu
            </h1>
            <p className="text-[10px] sm:text-xs font-bold text-amber-600 uppercase tracking-wide mt-0.5">
              {settings.storeName || 'Toko Heni'} • by Hann
            </p>
          </div>
        </div>

        {/* Top Right Quick Status Button */}
        <button
          type="button"
          onClick={() => onNavigate('pengaturan')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs border ${
            isBtConnected
              ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
          title={isBtConnected ? 'Printer Bluetooth Terhubung' : 'Sambungkan Bluetooth'}
        >
          <Bluetooth className={`w-3.5 h-3.5 ${isBtConnected ? 'text-emerald-600' : 'text-slate-400'}`} />
          <span className="text-[11px]">{isBtConnected ? 'Printer Aktif' : 'Printer'}</span>
        </button>
      </div>

      {/* QUICK SUMMARY PILLS (Compact on all screens) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <div className="bg-white px-3.5 py-2.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Omzet Hari Ini</div>
            <div className="text-sm sm:text-base font-black font-mono text-slate-900">{formatRupiah(todayOmzet)}</div>
          </div>
          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md hidden sm:inline">
            {todayTransactions.length} Struk
          </span>
        </div>

        <div className="bg-white px-3.5 py-2.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kasbon Pembeli</div>
            <div className="text-sm sm:text-base font-black font-mono text-rose-600">{formatRupiah(totalUnpaidKasbon)}</div>
          </div>
          <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md hidden sm:inline">
            {unpaidKasbonCount} Orang
          </span>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-white px-3.5 py-2.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Barang</div>
            <div className="text-sm sm:text-base font-black font-mono text-slate-900">{products.length} Produk</div>
          </div>
          <button
            onClick={() => onNavigate('produk')}
            className="text-[11px] font-bold text-blue-600 hover:underline"
          >
            Lihat Stok &gt;
          </button>
        </div>
      </div>

      {/* RESPONSIVE WIDGET GRID (2 cols on mobile, 4 cols on tablet and desktop) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
        {menuWidgets.map((w) => (
          <div
            key={w.id}
            onClick={w.onClick}
            className="group relative bg-white hover:bg-slate-50/80 active:scale-95 border border-slate-200/90 rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-xs hover:shadow-md transition-all duration-150 cursor-pointer flex flex-col items-center justify-center text-center select-none h-32 sm:h-36"
          >
            {/* Optional Floating Badge */}
            {w.badge && (
              <span
                className={`absolute top-2 right-2 text-[9px] px-2 py-0.5 rounded-full shadow-xs ${w.badgeColor}`}
              >
                {w.badge}
              </span>
            )}

            {/* Centered Icon */}
            <div className="flex items-center justify-center transition-transform group-hover:scale-105 duration-150">
              {w.icon}
            </div>

            {/* Label below icon */}
            <span className="font-bold text-slate-800 text-xs sm:text-sm mt-2.5 tracking-tight group-hover:text-slate-950">
              {w.label}
            </span>
          </div>
        ))}
      </div>

      {/* FOOTER */}
      <div className="text-center pt-2 pb-2 text-[10px] sm:text-[11px] text-slate-400">
        <span>Toko Qu • Eksklusif Toko Heni • Developed by Hann</span>
      </div>
    </div>
  );
};
