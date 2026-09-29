import React, { useState } from 'react';
import { Product, CartItem, Transaction, PaymentMethod, AppSettings } from '../types/pos';
import { formatRupiah, playBeepSound } from '../utils/feedback';
import { saveTransaction } from '../utils/storage';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { ReceiptModal } from './ReceiptModal';
import {
  Scan,
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  CreditCard,
  Banknote,
  BookOpen,
  ArrowRight,
  User,
  Phone,
  Tag,
  AlertCircle,
  X,
  Package,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CashierViewProps {
  products: Product[];
  settings: AppSettings;
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  onTransactionComplete: () => void;
}

const CATEGORIES = [
  'Semua',
  'Bahan Pokok',
  'Makanan Instan',
  'Minuman',
  'Minyak & Mentega',
  'Bumbu Dapur',
  'Sabun & Cuci',
  'Snack & Cemilan',
  'Lainnya',
];

export const CashierView: React.FC<CashierViewProps> = ({
  products,
  settings,
  cart,
  setCart,
  onTransactionComplete,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Checkout modal state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('tunai');
  const [paidInput, setPaidInput] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [kasbonNotes, setKasbonNotes] = useState<string>('');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Completed transaction & Receipt modal state
  const [completedTransaction, setCompletedTransaction] = useState<Transaction | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // Cart math
  const totalAmount = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const totalItemsCount = cart.reduce((sum, item) => sum + item.qty, 0);

  // Add product to cart
  const handleAddToCart = (product: Product) => {
    setCart((prev) => {
      const idx = prev.findIndex((item) => item.product.id === product.id);
      if (idx >= 0) {
        const next = [...prev];
        const nextQty = next[idx].qty + 1;
        next[idx] = {
          ...next[idx],
          qty: nextQty,
          subtotal: nextQty * next[idx].product.sellingPrice - (next[idx].discount || 0),
        };
        return next;
      } else {
        return [
          ...prev,
          {
            product,
            qty: 1,
            subtotal: product.sellingPrice,
            discount: 0,
          },
        ];
      }
    });

    if (settings.soundBeep) {
      playBeepSound(1800, 60);
    }
  };

  const handleUpdateQty = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.qty + delta;
            if (newQty <= 0) return null;
            return {
              ...item,
              qty: newQty,
              subtotal: newQty * item.product.sellingPrice - (item.discount || 0),
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleBarcodeScan = (barcode: string) => {
    const clean = barcode.trim().toLowerCase();
    const found = products.find((p) => p.barcode.trim().toLowerCase() === clean);
    if (found) {
      handleAddToCart(found);
    } else {
      alert(`Produk dengan barcode "${barcode}" belum ada di database Toko Heni.`);
    }
  };

  // Quick cash suggestions based on total
  const getQuickCashSuggestions = (total: number) => {
    if (total <= 0) return [];
    const suggestions = new Set<number>();
    suggestions.add(total); // Uang Pas

    // Common Indonesian rupiah denominations
    const denominations = [10000, 20000, 50000, 100000, 200000, 300000, 500000];
    for (const d of denominations) {
      if (d > total) {
        suggestions.add(d);
      }
    }

    // Next nearest round up (e.g. 23.500 -> 25.000 or 30.000)
    const nextFiveThousand = Math.ceil(total / 5000) * 5000;
    if (nextFiveThousand > total) suggestions.add(nextFiveThousand);
    const nextTenThousand = Math.ceil(total / 10000) * 10000;
    if (nextTenThousand > total) suggestions.add(nextTenThousand);

    return Array.from(suggestions).sort((a, b) => a - b).slice(0, 5);
  };

  const handleOpenCheckout = () => {
    if (cart.length === 0) return;
    setPaidInput(totalAmount.toString());
    setCheckoutError(null);
    setIsCheckoutOpen(true);
  };

  const handleProcessPayment = () => {
    setCheckoutError(null);
    const numericPaid = parseFloat(paidInput) || 0;

    if (paymentMethod === 'tunai' && numericPaid < totalAmount) {
      setCheckoutError(
        `Uang bayar kurang! Total belanja ${formatRupiah(totalAmount)}, dibayar ${formatRupiah(numericPaid)}.`
      );
      return;
    }

    if (paymentMethod === 'kasbon' && !customerName.trim()) {
      setCheckoutError('Untuk Kasbon (Hutang), Nama Pembeli wajib diisi agar tercatat di pembukuan!');
      return;
    }

    const changeAmount = paymentMethod === 'kasbon' ? 0 : Math.max(0, numericPaid - totalAmount);

    const transaction: Transaction = {
      id: `TRX-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString(),
      items: cart.map((item) => ({
        productId: item.product.id,
        barcode: item.product.barcode,
        name: item.product.name,
        sellingPrice: item.product.sellingPrice,
        costPrice: item.product.costPrice,
        qty: item.qty,
        unit: item.product.unit,
        subtotal: item.subtotal,
        discount: item.discount || 0,
      })),
      totalAmount,
      paidAmount: paymentMethod === 'qris' ? totalAmount : numericPaid,
      changeAmount,
      paymentMethod,
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      cashierName: settings.cashierName || 'Hann',
      isKasbon: paymentMethod === 'kasbon',
      notes: paymentMethod === 'kasbon' ? kasbonNotes : undefined,
    };

    // Save transaction and reduce stock
    saveTransaction(transaction);

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }

    setCompletedTransaction(transaction);
    setIsCheckoutOpen(false);
    setIsReceiptOpen(true);
    setCart([]);
    onTransactionComplete();
  };

  // Filter products for display in POS Catalog grid
  const filteredProducts = products.filter((p) => {
    const matchCat = selectedCategory === 'Semua' || p.category === selectedCategory;
    const matchSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 animate-in fade-in duration-200">
      
      {/* LEFT COLUMN: Product Catalog / Quick Add (7 cols on large) */}
      <div className="lg:col-span-7 flex flex-col space-y-3">
        {/* Top Search Bar & Camera Button */}
        <div className="bg-white p-3 rounded-2xl shadow-xs border border-slate-200 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari barang atau ketik barcode..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
            />
          </div>

          <button
            onClick={() => setIsScannerOpen(true)}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-transform shrink-0"
          >
            <Scan className="w-4 h-4" />
            <span>Scan Barcode</span>
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-amber-400 shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Products Grid (Touch-friendly & fast) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 lg:max-h-[calc(100vh-220px)] lg:overflow-y-auto pr-1 pb-20 lg:pb-0">
          {filteredProducts.map((p) => {
            const inCart = cart.find((item) => item.product.id === p.id);
            return (
              <div
                key={p.id}
                onClick={() => handleAddToCart(p)}
                className={`relative p-3 bg-white hover:bg-amber-50/50 border rounded-2xl cursor-pointer transition-all active:scale-[0.98] flex flex-col justify-between select-none shadow-xs group ${
                  inCart ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-slate-200 hover:border-amber-300'
                }`}
              >
                {inCart && (
                  <span className="absolute top-2 right-2 w-5 h-5 bg-amber-500 text-slate-950 font-black rounded-full flex items-center justify-center text-[10px] shadow-xs">
                    {inCart.qty}
                  </span>
                )}

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    {p.category}
                  </span>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2 leading-tight group-hover:text-amber-900 mt-0.5">
                    {p.name}
                  </h4>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-end justify-between">
                  <div>
                    <div className="text-xs sm:text-sm font-black text-amber-600 font-mono">
                      {formatRupiah(p.sellingPrice)}
                    </div>
                    <div className="text-[9px] text-slate-400 font-medium">/{p.unit}</div>
                  </div>

                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold ${
                      p.stock <= 0
                        ? 'bg-rose-100 text-rose-700'
                        : p.stock <= 5
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    stok: {p.stock}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT COLUMN: Cart & Checkout (Desktop only, 5 cols) */}
      <div className="hidden lg:flex lg:col-span-5 flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-[calc(100vh-210px)] sticky top-28">
        {/* Cart Header */}
        <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-sm">Keranjang Penjualan</span>
            <span className="px-2 py-0.5 bg-amber-400/20 text-amber-300 rounded-full text-xs font-semibold">
              {totalItemsCount} item
            </span>
          </div>

          {cart.length > 0 && (
            <button
              onClick={handleClearCart}
              className="text-xs text-rose-300 hover:text-rose-100 flex items-center gap-1 transition-colors"
              title="Kosongkan Keranjang"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Batal</span>
            </button>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-3 divide-y divide-slate-100">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400">
              <ShoppingCart className="w-12 h-12 text-slate-200 mb-2 stroke-1" />
              <p className="font-bold text-slate-600 text-sm">Keranjang Masih Kosong</p>
              <p className="text-xs text-slate-400 mt-1 max-w-[220px]">
                Pilih barang di sebelah kiri atau klik Scan Barcode untuk mulai bertransaksi.
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.product.id} className="py-2.5 flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-xs sm:text-sm text-slate-800 truncate">
                    {item.product.name}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {formatRupiah(item.product.sellingPrice)} / {item.product.unit}
                  </div>
                </div>

                {/* Qty Controls */}
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => handleUpdateQty(item.product.id, -1)}
                    className="w-6 h-6 rounded-lg bg-white shadow-xs text-slate-700 flex items-center justify-center hover:bg-slate-200 active:scale-95"
                  >
                    <Minus className="w-3 h-3" />
                  </button>

                  <span className="w-6 text-center font-bold text-xs text-slate-900">
                    {item.qty}
                  </span>

                  <button
                    onClick={() => handleUpdateQty(item.product.id, 1)}
                    className="w-6 h-6 rounded-lg bg-white shadow-xs text-slate-700 flex items-center justify-center hover:bg-slate-200 active:scale-95"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Subtotal */}
                <div className="text-right min-w-[70px]">
                  <div className="font-black text-xs sm:text-sm text-slate-900 font-mono">
                    {formatRupiah(item.subtotal)}
                  </div>
                  <button
                    onClick={() => handleRemoveFromCart(item.product.id)}
                    className="text-[10px] text-rose-500 hover:text-rose-700"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Bottom Summary & Checkout Button */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Pembayaran
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
              {formatRupiah(totalAmount)}
            </div>
          </div>

          <button
            onClick={handleOpenCheckout}
            disabled={cart.length === 0}
            className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] text-slate-950 font-black rounded-xl text-base shadow-md flex items-center justify-center gap-2 transition-all"
          >
            <span>LANJUT BAYAR</span>
            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* MOBILE FLOATING BOTTOM CART BAR */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-3 left-3 right-3 z-30 animate-in slide-in-from-bottom-3 duration-200">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-2xl shadow-2xl p-3 flex items-center justify-between gap-2 ring-2 ring-amber-400">
            <div
              onClick={() => setIsMobileCartOpen(true)}
              className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0"
            >
              <div className="relative w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center shrink-0">
                <ShoppingCart className="w-5 h-5" />
                <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {totalItemsCount}
                </span>
              </div>
              <div className="min-w-0">
                <div className="text-[11px] text-amber-300 font-bold truncate">Keranjang Kasir</div>
                <div className="text-sm font-black font-mono text-white tracking-tight">{formatRupiah(totalAmount)}</div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsMobileCartOpen(true)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold"
              >
                Lihat
              </button>
              <button
                type="button"
                onClick={handleOpenCheckout}
                className="px-3.5 py-2 bg-amber-400 hover:bg-amber-500 active:scale-95 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-1"
              >
                <span>Bayar</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE CART MODAL / BOTTOM SHEET */}
      {isMobileCartOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-200 overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-black text-sm">Keranjang Penjualan</h3>
                  <p className="text-[11px] text-slate-400">{totalItemsCount} barang dipilih</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {cart.length > 0 && (
                  <button
                    onClick={() => {
                      handleClearCart();
                      setIsMobileCartOpen(false);
                    }}
                    className="text-xs text-rose-300 hover:text-rose-100 flex items-center gap-1 px-2 py-1 bg-rose-900/40 rounded-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Kosongkan</span>
                  </button>
                )}
                <button
                  onClick={() => setIsMobileCartOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
              {cart.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <ShoppingCart className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                  <p className="font-bold text-slate-700 text-sm">Keranjang Kosong</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.product.id} className="py-3 flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-slate-900 truncate">
                        {item.product.name}
                      </div>
                      <div className="text-xs text-slate-500 font-mono">
                        {formatRupiah(item.product.sellingPrice)} / {item.product.unit}
                      </div>
                    </div>

                    {/* Qty Controls */}
                    <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                      <button
                        onClick={() => handleUpdateQty(item.product.id, -1)}
                        className="w-7 h-7 rounded-lg bg-white shadow-xs text-slate-700 flex items-center justify-center active:scale-95 font-bold"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <span className="w-6 text-center font-bold text-xs text-slate-900">
                        {item.qty}
                      </span>

                      <button
                        onClick={() => handleUpdateQty(item.product.id, 1)}
                        className="w-7 h-7 rounded-lg bg-white shadow-xs text-slate-700 flex items-center justify-center active:scale-95 font-bold"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Subtotal */}
                    <div className="text-right min-w-[70px]">
                      <div className="font-black text-xs font-mono text-slate-900">
                        {formatRupiah(item.subtotal)}
                      </div>
                      <button
                        onClick={() => handleRemoveFromCart(item.product.id)}
                        className="text-[10px] text-rose-500 hover:text-rose-700 font-semibold"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bottom Total & Checkout Button */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Total Tagihan</span>
                <span className="text-2xl font-black font-mono text-slate-900">
                  {formatRupiah(totalAmount)}
                </span>
              </div>

              <button
                onClick={() => {
                  setIsMobileCartOpen(false);
                  handleOpenCheckout();
                }}
                disabled={cart.length === 0}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-slate-950 font-black rounded-xl text-base shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <span>LANJUT KE PEMBAYARAN</span>
                <ArrowRight className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHECKOUT MODAL */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden my-6">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[11px] text-amber-400 font-bold uppercase tracking-wider">
                  Kasir Toko Heni
                </span>
                <h3 className="text-lg font-black tracking-tight">Pembayaran Transaksi</h3>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Grand Total Box */}
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-center">
                <span className="text-xs font-bold text-amber-900 uppercase">Total Tagihan</span>
                <div className="text-3xl sm:text-4xl font-black text-amber-600 font-mono mt-0.5">
                  {formatRupiah(totalAmount)}
                </div>
                <span className="text-xs text-amber-800">{totalItemsCount} barang dalam keranjang</span>
              </div>

              {checkoutError && (
                <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{checkoutError}</span>
                </div>
              )}

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                  Pilih Cara Bayar
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('tunai');
                      setPaidInput(totalAmount.toString());
                    }}
                    className={`py-3 px-2 rounded-xl border flex flex-col items-center gap-1 text-xs font-bold transition-all ${
                      paymentMethod === 'tunai'
                        ? 'border-amber-500 bg-amber-500 text-slate-950 shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Banknote className="w-5 h-5" />
                    <span>TUNAI</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('qris');
                      setPaidInput(totalAmount.toString());
                    }}
                    className={`py-3 px-2 rounded-xl border flex flex-col items-center gap-1 text-xs font-bold transition-all ${
                      paymentMethod === 'qris'
                        ? 'border-amber-500 bg-amber-500 text-slate-950 shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <CreditCard className="w-5 h-5" />
                    <span>QRIS / TRF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('kasbon');
                      setPaidInput('0');
                    }}
                    className={`py-3 px-2 rounded-xl border flex flex-col items-center gap-1 text-xs font-bold transition-all ${
                      paymentMethod === 'kasbon'
                        ? 'border-rose-500 bg-rose-600 text-white shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <BookOpen className="w-5 h-5" />
                    <span>KASBON (HUTANG)</span>
                  </button>
                </div>
              </div>

              {/* Cash Input & Quick denominations */}
              {paymentMethod === 'tunai' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                      Uang Diterima dari Pembeli
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                        Rp
                      </span>
                      <input
                        type="number"
                        value={paidInput}
                        onChange={(e) => setPaidInput(e.target.value)}
                        placeholder="0"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-lg font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Quick suggestion pills */}
                  <div className="flex flex-wrap gap-1.5">
                    {getQuickCashSuggestions(totalAmount).map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => setPaidInput(amount.toString())}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors ${
                          parseFloat(paidInput) === amount
                            ? 'bg-slate-900 text-amber-400'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {amount === totalAmount ? 'Uang Pas' : formatRupiah(amount)}
                      </button>
                    ))}
                  </div>

                  {/* Calculated Change */}
                  <div className="p-3 bg-slate-100 rounded-xl flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">Kembalian:</span>
                    <span
                      className={`text-lg font-mono font-black ${
                        (parseFloat(paidInput) || 0) >= totalAmount
                          ? 'text-emerald-700'
                          : 'text-rose-600'
                      }`}
                    >
                      {formatRupiah(Math.max(0, (parseFloat(paidInput) || 0) - totalAmount))}
                    </span>
                  </div>
                </div>
              )}

              {/* Kasbon / Hutang form details */}
              {paymentMethod === 'kasbon' && (
                <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-rose-800 text-xs font-bold">
                    <BookOpen className="w-4 h-4" />
                    <span>Catat Buku Hutang / Kasbon Pembeli</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Nama Pembeli <span className="text-rose-600">* Wajib</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Contoh: Bu RT Wati, Pak Budi..."
                        className="w-full pl-9 pr-3 py-2 bg-white border border-rose-300 rounded-lg text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Nomor HP / WhatsApp (opsional)
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="08123456789"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-rose-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Uang Muka / DP Dibayar Sekarang (Rp)
                    </label>
                    <input
                      type="number"
                      value={paidInput}
                      onChange={(e) => setPaidInput(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 bg-white border border-rose-300 rounded-lg text-xs sm:text-sm font-mono font-bold"
                    />
                    <div className="text-[11px] text-rose-800 font-bold mt-1">
                      Sisa Hutang: {formatRupiah(Math.max(0, totalAmount - (parseFloat(paidInput) || 0)))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Catatan Tambahan
                    </label>
                    <input
                      type="text"
                      value={kasbonNotes}
                      onChange={(e) => setKasbonNotes(e.target.value)}
                      placeholder="Janji bayar tanggal gajian, dll..."
                      className="w-full px-3 py-2 bg-white border border-rose-300 rounded-lg text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Optional Customer Name for Tunai / QRIS */}
              {paymentMethod !== 'kasbon' && (
                <div className="pt-2">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Nama Pelanggan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Bisa dikosongkan untuk umum..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              )}

              {/* Submit Payment Button */}
              <div className="pt-3 border-t border-slate-100 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs sm:text-sm transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleProcessPayment}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-slate-950 font-black rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4 stroke-[2.5]" />
                  <span>Selesaikan & Cetak Struk</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal for Quick Item Addition */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleBarcodeScan}
        title="Scan Barcode Kasir"
        subtitle="Arahkan kamera ke barcode barang yang dibeli"
        autoCloseOnScan={false}
      />

      {/* Thermal Receipt & Bluetooth Printing Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        transaction={completedTransaction}
        settings={settings}
      />
    </div>
  );
};
