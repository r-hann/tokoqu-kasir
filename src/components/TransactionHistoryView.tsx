import React, { useState } from 'react';
import { Transaction, AppSettings } from '../types/pos';
import { formatRupiah } from '../utils/feedback';
import { ReceiptModal } from './ReceiptModal';
import {
  Receipt,
  Search,
  Calendar,
  Printer,
  TrendingUp,
  Banknote,
  DollarSign,
  PackageCheck,
  Eye,
  X,
  CreditCard,
  BookOpen,
} from 'lucide-react';

interface TransactionHistoryViewProps {
  transactions: Transaction[];
  settings: AppSettings;
}

export const TransactionHistoryView: React.FC<TransactionHistoryViewProps> = ({
  transactions,
  settings,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'all'>('today');
  const [reprintTransaction, setReprintTransaction] = useState<Transaction | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [detailModalTrx, setDetailModalTrx] = useState<Transaction | null>(null);

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Filter transactions based on date & search
  const filteredTransactions = transactions.filter((t) => {
    const trxDate = t.date.split('T')[0];

    let matchTime = true;
    if (timeFilter === 'today') {
      matchTime = trxDate === todayStr;
    } else if (timeFilter === 'week') {
      const diffDays = (now.getTime() - new Date(t.date).getTime()) / (1000 * 3600 * 24);
      matchTime = diffDays <= 7;
    }

    const matchSearch =
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.customerName && t.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      t.items.some((i) => i.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchTime && matchSearch;
  });

  // Calculate stats from filtered transactions
  const totalOmzet = filteredTransactions.reduce((sum, t) => sum + t.totalAmount, 0);

  // Calculate gross profit (omzet minus cost)
  const totalProfit = filteredTransactions.reduce((sum, t) => {
    const cost = t.items.reduce((c, i) => c + (i.costPrice || 0) * i.qty, 0);
    return sum + (t.totalAmount - cost);
  }, 0);

  const handleOpenReprint = (trx: Transaction) => {
    setReprintTransaction(trx);
    setIsReceiptOpen(true);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              {timeFilter === 'today'
                ? 'Omzet Hari Ini'
                : timeFilter === 'week'
                ? 'Omzet 7 Hari Terakhir'
                : 'Total Semua Omzet'}
            </span>
            <div className="text-2xl font-black text-slate-900 font-mono mt-0.5">
              {formatRupiah(totalOmzet)}
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
            <Banknote className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              Perkiraan Keuntungan
            </span>
            <div className="text-2xl font-black text-emerald-600 font-mono mt-0.5">
              {formatRupiah(totalProfit)}
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              Jumlah Transaksi
            </span>
            <div className="text-2xl font-black text-blue-600 font-mono mt-0.5">
              {filteredTransactions.length} Struk
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
            <Receipt className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl shadow-xs border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari ID transaksi, nama, barang..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto text-xs">
          <button
            onClick={() => setTimeFilter('today')}
            className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl font-bold transition-colors ${
              timeFilter === 'today'
                ? 'bg-slate-900 text-amber-400 shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Hari Ini
          </button>
          <button
            onClick={() => setTimeFilter('week')}
            className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl font-bold transition-colors ${
              timeFilter === 'week'
                ? 'bg-slate-900 text-amber-400 shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            7 Hari
          </button>
          <button
            onClick={() => setTimeFilter('all')}
            className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl font-bold transition-colors ${
              timeFilter === 'all'
                ? 'bg-slate-900 text-amber-400 shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua
          </button>
        </div>
      </div>

      {/* Transaction List */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="p-10 text-center text-slate-400 space-y-2">
            <Receipt className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">Belum ada transaksi</p>
            <p className="text-xs">Lakukan penjualan di menu 'Kasir' untuk mencatat transaksi.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTransactions.map((t) => {
              const formattedDate = new Date(t.date).toLocaleString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={t.id}
                  className="p-4 hover:bg-amber-50/30 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-slate-900">{t.id}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                          t.paymentMethod === 'kasbon'
                            ? 'bg-rose-100 text-rose-800'
                            : t.paymentMethod === 'qris'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {t.paymentMethod}
                      </span>
                      <span className="text-[11px] text-slate-400">{formattedDate}</span>
                    </div>

                    <div className="text-xs text-slate-600 truncate max-w-md">
                      {t.items.map((i) => `${i.qty}x ${i.name}`).join(', ')}
                    </div>

                    {t.customerName && (
                      <div className="text-[11px] text-slate-500">
                        Pelanggan: <span className="font-semibold text-slate-700">{t.customerName}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                    <div className="sm:text-right">
                      <div className="text-sm sm:text-base font-black text-slate-900 font-mono">
                        {formatRupiah(t.totalAmount)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {t.items.reduce((s, i) => s + i.qty, 0)} item
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setDetailModalTrx(t)}
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
                        title="Lihat Detail Transaksi"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleOpenReprint(t)}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-900 active:scale-95 text-amber-400 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-transform"
                        title="Cetak Ulang Struk"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Cetak</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Transaction Details Modal */}
      {detailModalTrx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[11px] text-amber-400 font-bold uppercase">
                  Rincian Penjualan
                </span>
                <h3 className="text-base font-black">{detailModalTrx.id}</h3>
              </div>
              <button
                onClick={() => setDetailModalTrx(null)}
                className="p-1 rounded-md text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
              <div className="space-y-1 text-xs border-b border-slate-100 pb-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tanggal:</span>
                  <span>{new Date(detailModalTrx.date).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Metode Bayar:</span>
                  <span className="font-bold uppercase">{detailModalTrx.paymentMethod}</span>
                </div>
                {detailModalTrx.customerName && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Pelanggan:</span>
                    <span className="font-semibold">{detailModalTrx.customerName}</span>
                  </div>
                )}
              </div>

              {/* Items */}
              <div className="space-y-2 py-1">
                {detailModalTrx.items.map((i, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <div>
                      <div className="font-bold text-slate-800">{i.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {i.qty} {i.unit} x {formatRupiah(i.sellingPrice)}
                      </div>
                    </div>
                    <div className="font-mono font-bold text-slate-900">
                      {formatRupiah(i.subtotal)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-200 pt-3 space-y-1 text-xs">
                <div className="flex justify-between text-base font-black text-slate-900">
                  <span>Total:</span>
                  <span>{formatRupiah(detailModalTrx.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Dibayar:</span>
                  <span>{formatRupiah(detailModalTrx.paidAmount)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Kembalian:</span>
                  <span>{formatRupiah(detailModalTrx.changeAmount)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between gap-2">
              <button
                onClick={() => {
                  setDetailModalTrx(null);
                  handleOpenReprint(detailModalTrx);
                }}
                className="px-4 py-2 bg-slate-900 text-amber-400 font-bold rounded-xl text-xs flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                Cetak Struk
              </button>

              <button
                onClick={() => setDetailModalTrx(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Reprint Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        transaction={reprintTransaction}
        settings={settings}
      />
    </div>
  );
};
