import React, { useState } from 'react';
import { Product, AppSettings } from '../types/pos';
import { formatRupiah, triggerScanSuccessFeedback } from '../utils/feedback';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import {
  Scan,
  Search,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  PlusCircle,
  Tag,
  Package,
  Layers,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

interface PriceCheckViewProps {
  products: Product[];
  settings: AppSettings;
  onAddToCart?: (product: Product) => void;
  onSwitchToCashier?: () => void;
}

export const PriceCheckView: React.FC<PriceCheckViewProps> = ({
  products,
  settings,
  onAddToCart,
  onSwitchToCashier,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [showCostPrice, setShowCostPrice] = useState(false);
  const [notFoundBarcode, setNotFoundBarcode] = useState<string | null>(null);
  const [recentChecks, setRecentChecks] = useState<Product[]>([]);
  const [addedNotice, setAddedNotice] = useState<string | null>(null);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setNotFoundBarcode(null);
    if (!term.trim()) {
      return;
    }

    const clean = term.trim().toLowerCase();
    // Prioritize exact barcode match
    const foundBarcode = products.find((p) => p.barcode.trim().toLowerCase() === clean);
    if (foundBarcode) {
      handleProductFound(foundBarcode);
      return;
    }

    // Try name match
    const foundName = products.find((p) => p.name.toLowerCase().includes(clean));
    if (foundName) {
      handleProductFound(foundName);
      return;
    }
  };

  const handleProductFound = (product: Product) => {
    setSelectedProduct(product);
    setNotFoundBarcode(null);
    setRecentChecks((prev) => {
      const filtered = prev.filter((p) => p.id !== product.id);
      return [product, ...filtered].slice(0, 6);
    });
  };

  const handleScanSuccess = (barcode: string) => {
    setSearchTerm(barcode);
    const clean = barcode.trim().toLowerCase();
    const found = products.find((p) => p.barcode.trim().toLowerCase() === clean);

    if (found) {
      handleProductFound(found);
    } else {
      setSelectedProduct(null);
      setNotFoundBarcode(barcode);
    }
  };

  const handleAddToCartClick = (product: Product) => {
    if (onAddToCart) {
      onAddToCart(product);
      setAddedNotice(`"${product.name}" ditambahkan ke Keranjang Kasir!`);
      setTimeout(() => setAddedNotice(null), 2500);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-in fade-in duration-200">
      {/* Banner / Card Header */}
      <div className="bg-linear-to-r from-amber-500 via-amber-600 to-orange-500 text-slate-950 p-5 rounded-2xl shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-black/20 text-white rounded-full text-xs font-bold uppercase tracking-wider">
              Toko Heni
            </span>
            <span className="text-xs text-amber-950 font-medium">Cepat & Akurat</span>
          </div>
          <h1 className="text-2xl font-black mt-1 tracking-tight">Cek Harga Barang</h1>
          <p className="text-xs sm:text-sm text-amber-950/80 mt-0.5">
            Scan barcode pada kemasan barang atau ketik nama untuk melihat harga jual & stok.
          </p>
        </div>

        {/* Scan Barcode Main Button */}
        <button
          onClick={() => setIsScannerOpen(true)}
          className="w-full sm:w-auto px-6 py-3.5 bg-slate-950 hover:bg-slate-900 active:scale-95 text-amber-400 font-black rounded-xl shadow-lg flex items-center justify-center gap-3 transition-transform"
        >
          <Scan className="w-6 h-6 animate-pulse" />
          <span className="text-base">BUKA SCANNER KAMERA</span>
        </button>
      </div>

      {/* Search Input Bar */}
      <div className="bg-white p-3.5 rounded-2xl shadow-xs border border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch(searchTerm);
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Scan barcode dengan scanner tembak atau ketik nama/barcode..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-sm"
              autoFocus
            />
          </div>

          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="p-3 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl transition-colors flex items-center gap-1.5 font-bold text-xs shrink-0"
            title="Scan Barcode via Kamera"
          >
            <Scan className="w-5 h-5 text-amber-700" />
            <span className="hidden sm:inline">Kamera</span>
          </button>
        </form>

        {/* Quick hint for flash & vibrate */}
        <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 px-1">
          <div className="flex items-center gap-2">
            <span>⚡ Flash kamera otomatis: {settings.scanAutoTorch ? 'Aktif' : 'Nonaktif'}</span>
            <span>•</span>
            <span>📳 Getar saat scan: {settings.scanVibrate ? 'Aktif' : 'Nonaktif'}</span>
          </div>
          <span className="text-slate-400 italic">Pengaturan di tab 'Pengaturan'</span>
        </div>
      </div>

      {/* Notification when item added to cashier */}
      {addedNotice && (
        <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-md text-xs sm:text-sm font-semibold flex items-center justify-between animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            <span>{addedNotice}</span>
          </div>
          {onSwitchToCashier && (
            <button
              onClick={onSwitchToCashier}
              className="px-3 py-1 bg-white text-emerald-800 rounded-lg text-xs font-bold hover:bg-emerald-50 transition-colors flex items-center gap-1"
            >
              Lihat Kasir <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Main Result Card */}
      {selectedProduct ? (
        <div className="bg-white rounded-2xl shadow-md border-2 border-amber-400 overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Tag className="w-4 h-4" />
              {selectedProduct.category || 'Barang Toko Heni'}
            </span>
            <span className="font-mono text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded-md">
              Barcode: {selectedProduct.barcode}
            </span>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {selectedProduct.name}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-medium flex items-center gap-1">
                  <Package className="w-3.5 h-3.5" /> Satuan: {selectedProduct.unit}
                </span>

                <span
                  className={`text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1 ${
                    selectedProduct.stock > 5
                      ? 'bg-emerald-100 text-emerald-800'
                      : selectedProduct.stock > 0
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  Stok: {selectedProduct.stock} {selectedProduct.unit}
                  {selectedProduct.stock <= 0 && ' (Habis!)'}
                </span>
              </div>
            </div>

            {/* Price Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              {/* Selling Price (Customer view) */}
              <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-xl">
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                  Harga Jual ke Pembeli
                </span>
                <div className="text-3xl sm:text-4xl font-black text-amber-600 tracking-tight mt-1">
                  {formatRupiah(selectedProduct.sellingPrice)}
                </div>
                <span className="text-[11px] text-amber-800/80">per {selectedProduct.unit}</span>
              </div>

              {/* Cost Price & Profit (Protected with eye toggle) */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Harga Modal / Kulak
                  </span>
                  <button
                    onClick={() => setShowCostPrice(!showCostPrice)}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded-md transition-colors"
                    title={showCostPrice ? 'Sembunyikan modal' : 'Lihat harga modal'}
                  >
                    {showCostPrice ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="text-2xl font-bold text-slate-800 tracking-tight mt-1 font-mono">
                  {showCostPrice ? formatRupiah(selectedProduct.costPrice) : 'Rp •••••••'}
                </div>

                {showCostPrice && (
                  <div className="mt-2 text-xs font-semibold text-emerald-700 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Untung: {formatRupiah(selectedProduct.sellingPrice - selectedProduct.costPrice)} (
                    {Math.round(
                      ((selectedProduct.sellingPrice - selectedProduct.costPrice) /
                        (selectedProduct.costPrice || 1)) *
                        100
                    )}
                    %)
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => handleAddToCartClick(selectedProduct)}
                className="flex-1 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
              >
                <PlusCircle className="w-5 h-5" />
                Tambah ke Keranjang Kasir
              </button>

              <button
                onClick={() => {
                  setSelectedProduct(null);
                  setSearchTerm('');
                  setIsScannerOpen(true);
                }}
                className="py-3.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Scan className="w-4 h-4" />
                Scan Barang Lain
              </button>
            </div>
          </div>
        </div>
      ) : notFoundBarcode ? (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-6 text-center space-y-3">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h3 className="text-lg font-bold text-rose-900">Barang Belum Terdaftar</h3>
          <p className="text-xs text-rose-700 max-w-md mx-auto">
            Barcode <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-rose-200">{notFoundBarcode}</span> tidak ditemukan di katalog Toko Heni.
          </p>
          <div className="pt-2 flex justify-center gap-2">
            <button
              onClick={() => setIsScannerOpen(true)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold"
            >
              Scan Ulang
            </button>
          </div>
        </div>
      ) : null}

      {/* Recent Checks List */}
      {recentChecks.length > 0 && (
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Baru Saja Dicek
            </h3>
            <button
              onClick={() => setRecentChecks([])}
              className="text-[11px] text-slate-400 hover:text-rose-500 transition-colors"
            >
              Hapus Riwayat
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {recentChecks.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedProduct(item)}
                className="p-3 bg-slate-50 hover:bg-amber-50/70 border border-slate-200 hover:border-amber-300 rounded-xl cursor-pointer transition-all flex items-center justify-between group"
              >
                <div className="min-w-0 pr-2">
                  <div className="font-bold text-slate-800 text-xs truncate group-hover:text-amber-900">
                    {item.name}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">{item.barcode}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-black text-xs text-amber-600">
                    {formatRupiah(item.sellingPrice)}
                  </div>
                  <div className="text-[9px] text-slate-400">stok: {item.stock}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal with torch & vibration */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
        title="Scan Barcode Cek Harga"
        subtitle="Arahkan kamera ke kemasan barang Toko Heni"
      />
    </div>
  );
};
