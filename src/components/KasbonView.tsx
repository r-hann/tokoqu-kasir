import React, { useState } from 'react';
import { KasbonRecord, AppSettings } from '../types/pos';
import { formatRupiah } from '../utils/feedback';
import { addKasbonPayment, saveKasbonList } from '../utils/storage';
import {
  BookOpen,
  Search,
  CheckCircle2,
  Clock,
  Phone,
  MessageSquare,
  DollarSign,
  PlusCircle,
  X,
  AlertCircle,
  History,
  Calendar,
  User,
} from 'lucide-react';

interface KasbonViewProps {
  kasbonList: KasbonRecord[];
  settings: AppSettings;
  onRefresh: () => void;
}

export const KasbonView: React.FC<KasbonViewProps> = ({
  kasbonList,
  settings,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'belum_lunas' | 'lunas'>('belum_lunas');
  const [payingRecord, setPayingRecord] = useState<KasbonRecord | null>(null);
  const [payAmount, setPayAmount] = useState<string>('');
  const [payNote, setPayNote] = useState<string>('Cicilan');
  const [historyRecord, setHistoryRecord] = useState<KasbonRecord | null>(null);

  // Math summary
  const totalUnpaid = kasbonList
    .filter((k) => k.status === 'belum_lunas')
    .reduce((sum, k) => sum + k.remainingAmount, 0);

  const unpaidCount = kasbonList.filter((k) => k.status === 'belum_lunas').length;

  const handleOpenPayModal = (record: KasbonRecord) => {
    setPayingRecord(record);
    setPayAmount(record.remainingAmount.toString()); // default to full payment
    setPayNote('Pelunasan');
  };

  const handleProcessPay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingRecord) return;

    const amount = parseFloat(payAmount) || 0;
    if (amount <= 0) {
      alert('Nominal pembayaran harus lebih dari 0!');
      return;
    }

    addKasbonPayment(payingRecord.id, amount, payNote);
    setPayingRecord(null);
    onRefresh();
  };

  const handleSendWhatsAppReminder = (record: KasbonRecord) => {
    if (!record.customerPhone) {
      alert(`Nomor telepon untuk ${record.customerName} belum ada.`);
      return;
    }

    const cleanPhone = record.customerPhone.replace(/[^0-9]/g, '');
    const waNumber = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;

    const msg = `Halo ${record.customerName}, salam hangat dari *${settings.storeName || 'Toko Heni'}*.\n\nMengingatkan catatan kasbon belanjaan senilai *${formatRupiah(
      record.remainingAmount
    )}*.\nBila ada waktu luang, silakan mampir ke toko ya. Terima kasih banyak! 🙏`;

    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Filter list
  const filteredList = kasbonList.filter((k) => {
    const matchStatus =
      filterStatus === 'all'
        ? true
        : filterStatus === 'belum_lunas'
        ? k.status === 'belum_lunas'
        : k.status === 'lunas';

    const matchSearch =
      k.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (k.customerPhone && k.customerPhone.includes(searchTerm)) ||
      (k.notes && k.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wide">
              Total Hutang Belum Lunas
            </span>
            <div className="text-2xl sm:text-3xl font-black text-rose-600 font-mono mt-0.5">
              {formatRupiah(totalUnpaid)}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-200/60 text-rose-700 flex items-center justify-center font-bold">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wide">
              Pelanggan Kasbon Aktif
            </span>
            <div className="text-2xl sm:text-3xl font-black text-amber-700 font-mono mt-0.5">
              {unpaidCount} Orang
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-200/60 text-amber-800 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wide">
              Hutang Sudah Lunas
            </span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono mt-0.5">
              {kasbonList.filter((k) => k.status === 'lunas').length} Transaksi
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-200/60 text-emerald-800 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
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
            placeholder="Cari nama pembeli kasbon..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setFilterStatus('belum_lunas')}
            className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
              filterStatus === 'belum_lunas'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Belum Lunas ({unpaidCount})
          </button>
          <button
            onClick={() => setFilterStatus('lunas')}
            className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
              filterStatus === 'lunas'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Sudah Lunas
          </button>
          <button
            onClick={() => setFilterStatus('all')}
            className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
              filterStatus === 'all'
                ? 'bg-slate-900 text-amber-400 shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua
          </button>
        </div>
      </div>

      {/* Kasbon Cards List */}
      <div className="space-y-3">
        {filteredList.length === 0 ? (
          <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center text-slate-400">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
            <p className="font-bold text-slate-700 text-sm">Tidak ada catatan kasbon</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Semua hutang pembeli telah lunas atau belum ada data sesuai filter.
            </p>
          </div>
        ) : (
          filteredList.map((k) => {
            const formattedDate = new Date(k.createdAt).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });

            return (
              <div
                key={k.id}
                className={`bg-white rounded-2xl p-4 sm:p-5 border transition-all shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  k.status === 'lunas'
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : 'border-rose-200 hover:border-rose-300'
                }`}
              >
                {/* Customer & Info */}
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        k.status === 'lunas'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {k.status === 'lunas' ? 'LUNAS' : 'BELUM LUNAS'}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">ID: {k.id}</span>
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-500" />
                    <span>{k.customerName}</span>
                  </h3>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" /> {formattedDate}
                    </span>
                    {k.customerPhone && (
                      <span className="flex items-center gap-1 font-mono">
                        <Phone className="w-3.5 h-3.5 text-slate-400" /> {k.customerPhone}
                      </span>
                    )}
                    {k.notes && <span className="italic text-slate-400">"{k.notes}"</span>}
                  </div>
                </div>

                {/* Amount & Actions */}
                <div className="flex flex-col sm:items-end gap-3 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                  <div className="sm:text-right">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">
                      Sisa Hutang:
                    </span>
                    <div
                      className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${
                        k.status === 'lunas' ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {formatRupiah(k.remainingAmount)}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Total: {formatRupiah(k.totalAmount)} | Dibayar: {formatRupiah(k.paidAmount)}
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {k.status === 'belum_lunas' && (
                      <button
                        onClick={() => handleOpenPayModal(k)}
                        className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-transform flex items-center justify-center gap-1.5"
                      >
                        <DollarSign className="w-4 h-4" />
                        <span>Bayar Cicilan</span>
                      </button>
                    )}

                    {k.status === 'belum_lunas' && k.customerPhone && (
                      <button
                        onClick={() => handleSendWhatsAppReminder(k)}
                        className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-xl transition-colors"
                        title="Kirim Pengingat Sopan via WhatsApp"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => setHistoryRecord(k)}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors text-xs font-bold flex items-center gap-1"
                      title="Lihat Riwayat Pembayaran"
                    >
                      <History className="w-4 h-4" />
                      <span className="hidden sm:inline">Riwayat</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* PAY MODAL */}
      {payingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[11px] text-amber-400 font-bold uppercase">
                  Buku Kasbon Toko Heni
                </span>
                <h3 className="text-base font-black">Bayar Cicilan Kasbon</h3>
              </div>
              <button
                onClick={() => setPayingRecord(null)}
                className="p-1 rounded-md text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProcessPay} className="p-5 space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-xs text-slate-500">Nama Pembeli:</div>
                <div className="font-bold text-slate-900 text-sm">{payingRecord.customerName}</div>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-200 text-xs">
                  <span className="text-slate-500">Sisa Hutang:</span>
                  <span className="font-black text-rose-600 font-mono text-sm">
                    {formatRupiah(payingRecord.remainingAmount)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Nominal Pembayaran (Rp)
                </label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="0"
                  max={payingRecord.remainingAmount}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                  autoFocus
                />
                <div className="flex gap-2 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setPayAmount(payingRecord.remainingAmount.toString())}
                    className="text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-md transition-colors"
                  >
                    Bayar Lunas ({formatRupiah(payingRecord.remainingAmount)})
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Catatan / Keterangan
                </label>
                <input
                  type="text"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  placeholder="Contoh: Cicilan ke-1, Titip uang lewat anak..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setPayingRecord(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition-all"
                >
                  Simpan Pembayaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HISTORY MODAL */}
      {historyRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[11px] text-amber-400 font-bold uppercase">
                  Riwayat Cicilan Kasbon
                </span>
                <h3 className="text-base font-black">{historyRecord.customerName}</h3>
              </div>
              <button
                onClick={() => setHistoryRecord(null)}
                className="p-1 rounded-md text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 max-h-[60vh] overflow-y-auto space-y-3">
              <div className="text-xs text-slate-500 pb-2 border-b border-slate-100 flex justify-between">
                <span>Total Hutang Awal:</span>
                <span className="font-bold text-slate-900 font-mono">
                  {formatRupiah(historyRecord.totalAmount)}
                </span>
              </div>

              {historyRecord.payments && historyRecord.payments.length > 0 ? (
                historyRecord.payments.map((p, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl text-xs flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-800">{p.note || 'Pembayaran'}</div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(p.date).toLocaleString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                    <div className="font-mono font-bold text-emerald-600 text-sm">
                      +{formatRupiah(p.amount)}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">Belum ada riwayat cicilan.</p>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setHistoryRecord(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
