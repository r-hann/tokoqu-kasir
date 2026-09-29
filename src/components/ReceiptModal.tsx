import React, { useState } from 'react';
import { Transaction, AppSettings } from '../types/pos';
import { formatRupiah } from '../utils/feedback';
import { bluetoothPrinter, generateReceiptWhatsappText } from '../utils/bluetoothPrinter';
import { Printer, Smartphone, Share2, CheckCircle2, AlertTriangle, X, Check } from 'lucide-react';

interface ReceiptModalProps {
  transaction: Transaction | null;
  settings: AppSettings;
  isOpen: boolean;
  onClose: () => void;
  onNewTransaction?: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  transaction,
  settings,
  isOpen,
  onClose,
  onNewTransaction,
}) => {
  const [isPrintingBt, setIsPrintingBt] = useState(false);
  const [printError, setPrintError] = useState<string | null>(null);
  const [printSuccess, setPrintSuccess] = useState(false);

  if (!isOpen || !transaction) return null;

  const handleBluetoothPrint = async () => {
    setIsPrintingBt(true);
    setPrintError(null);
    setPrintSuccess(false);

    const res = await bluetoothPrinter.printReceipt(transaction, settings);
    setIsPrintingBt(false);

    if (res.success) {
      setPrintSuccess(true);
      setTimeout(() => setPrintSuccess(false), 3000);
    } else {
      setPrintError(res.error || 'Gagal mencetak ke printer Bluetooth.');
    }
  };

  const handleNativePrint = () => {
    window.print();
  };

  const handleShareWhatsapp = () => {
    const text = generateReceiptWhatsappText(transaction, settings);
    let url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    if (transaction.customerPhone) {
      const cleanPhone = transaction.customerPhone.replace(/[^0-9]/g, '');
      const waNumber = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
      url = `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`;
    }
    window.open(url, '_blank');
  };

  const handleFinish = () => {
    onClose();
    if (onNewTransaction) onNewTransaction();
  };

  const formattedDate = new Date(transaction.date).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-200 my-auto">
        
        {/* Modal Top Bar (shrink-0) */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm">Transaksi Berhasil</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Buttons Row (shrink-0) */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-2 justify-center shrink-0">
          <button
            type="button"
            onClick={handleBluetoothPrint}
            disabled={isPrintingBt}
            className="flex-1 min-w-[125px] flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all disabled:opacity-50"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>{isPrintingBt ? 'Mencetak...' : 'Cetak Bluetooth'}</span>
          </button>

          <button
            type="button"
            onClick={handleNativePrint}
            className="flex-1 min-w-[110px] flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak / PDF</span>
          </button>

          <button
            type="button"
            onClick={handleShareWhatsapp}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
            title="Kirim Struk via WhatsApp"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">WhatsApp</span>
          </button>
        </div>

        {/* Print Feedback Status */}
        {printSuccess && (
          <div className="mx-3 mt-2 p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2 shrink-0">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Perintah cetak berhasil dikirim ke printer Bluetooth!</span>
          </div>
        )}

        {printError && (
          <div className="mx-3 mt-2 p-2 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2 shrink-0">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{printError}</span>
          </div>
        )}

        {/* Realistic Thermal Receipt Paper Container (flex-1 scrollable) */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 bg-slate-100/90 flex flex-col items-center">
          <div
            id="printable-receipt"
            className="w-full max-w-[320px] bg-white text-slate-900 font-mono text-xs p-4 sm:p-5 shadow-lg border border-slate-200 border-t-4 border-t-slate-900 rounded-xl leading-relaxed select-text"
          >
            {/* Header */}
            <div className="text-center pb-2.5 border-b border-dashed border-slate-300">
              <h2 className="text-base font-black tracking-wide uppercase text-slate-900">
                {settings.storeName || 'TOKO HENI'}
              </h2>
              {settings.storeTagline && (
                <p className="text-[11px] text-slate-600 font-sans mt-0.5">{settings.storeTagline}</p>
              )}
              {settings.storeAddress && (
                <p className="text-[10px] text-slate-500 mt-0.5">{settings.storeAddress}</p>
              )}
              {settings.storePhone && (
                <p className="text-[10px] text-slate-500 font-sans">Telp: {settings.storePhone}</p>
              )}
            </div>

            {/* Meta (Kasir removed as requested by user) */}
            <div className="py-2 border-b border-dashed border-slate-300 text-[11px] space-y-0.5">
              <div className="flex justify-between">
                <span className="text-slate-500">No:</span>
                <span className="font-semibold">{transaction.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tgl:</span>
                <span>{formattedDate}</span>
              </div>
              {transaction.customerName && (
                <div className="flex justify-between font-medium">
                  <span className="text-slate-500">Pelanggan:</span>
                  <span>{transaction.customerName}</span>
                </div>
              )}
            </div>

            {/* Item List */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-2">
              {transaction.items.map((item, idx) => (
                <div key={idx} className="text-[11px]">
                  <div className="font-bold text-slate-900">{item.name}</div>
                  <div className="flex justify-between text-slate-600 text-[10px] pl-2">
                    <span>
                      {item.qty} {item.unit} x {item.sellingPrice.toLocaleString('id-ID')}
                    </span>
                    <span className="font-bold text-slate-900">{formatRupiah(item.subtotal)}</span>
                  </div>
                  {item.discount > 0 && (
                    <div className="flex justify-between text-rose-600 text-[10px] pl-2 italic">
                      <span>Diskon</span>
                      <span>-{formatRupiah(item.discount)}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Calculations & Payment */}
            <div className="py-2.5 border-b-2 border-slate-800 space-y-1 text-[11px]">
              <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-0.5">
                <span>TOTAL:</span>
                <span>{formatRupiah(transaction.totalAmount)}</span>
              </div>

              {transaction.paymentMethod === 'kasbon' ? (
                <div className="mt-2 pt-2 border-t border-dashed border-rose-300 bg-rose-50/70 p-2 rounded-lg text-rose-900 font-bold">
                  <div className="flex justify-between text-xs">
                    <span>METODE:</span>
                    <span>KASBON (HUTANG)</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-normal text-slate-700 mt-1">
                    <span>Uang Muka (DP):</span>
                    <span>{formatRupiah(transaction.paidAmount)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-rose-700 mt-1">
                    <span>SISA HUTANG:</span>
                    <span>{formatRupiah(transaction.totalAmount - transaction.paidAmount)}</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-slate-600 text-[10px] pt-1">
                    <span>Metode:</span>
                    <span className="font-semibold uppercase text-slate-800">
                      {transaction.paymentMethod === 'qris' ? 'QRIS / Transfer' : 'Tunai'}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 text-[11px]">
                    <span>Bayar:</span>
                    <span>{formatRupiah(transaction.paidAmount)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-black text-xs pt-0.5">
                    <span>Kembali:</span>
                    <span>{formatRupiah(transaction.changeAmount)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Receipt Footer */}
            <div className="text-center pt-3 text-[10px] text-slate-600 whitespace-pre-line leading-relaxed">
              <p>{settings.receiptFooter}</p>
              <div className="mt-2.5 pt-2 border-t border-slate-200 text-[9px] text-slate-400 font-sans">
                <span className="font-bold text-slate-600">Toko Qu - Toko Heni</span>
                <br />
                Developed by Hann
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Done Button (shrink-0) */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200 shrink-0">
          <button
            type="button"
            onClick={handleFinish}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-slate-950 font-black rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            <span>Selesai / Transaksi Baru</span>
          </button>
        </div>
      </div>
    </div>
  );
};
