import React, { useState } from 'react';
import { Product, AppSettings } from '../types/pos';
import { formatRupiah } from '../utils/feedback';
import {
  addOrUpdateProduct,
  deleteProduct,
  checkDuplicateBarcode,
} from '../utils/storage';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Scan,
  AlertTriangle,
  CheckCircle,
  Package,
  Layers,
  Sparkles,
  X,
  Shuffle,
  Tag,
  AlertCircle,
} from 'lucide-react';

interface ProductManageViewProps {
  products: Product[];
  settings: AppSettings;
  onRefresh: () => void;
  initialOpenAdd?: boolean;
}

const CATEGORIES = [
  'Semua',
  'Bahan Pokok',
  'Makanan Instan',
  'Minuman',
  'Minyak & Mentega',
  'Bumbu Dapur',
  'Sabun & Cuci',
  'Kebutuhan Rumah',
  'Rokok',
  'Snack & Cemilan',
  'Lainnya',
];

const UNITS = ['pcs', 'bks', 'btl', 'kg', 'karung', 'kotak', 'renteng', 'dus', 'pack', 'butir'];

export const ProductManageView: React.FC<ProductManageViewProps> = ({
  products,
  settings,
  onRefresh,
  initialOpenAdd = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [isModalOpen, setIsModalOpen] = useState(Boolean(initialOpenAdd));
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    barcode: '',
    name: '',
    category: 'Bahan Pokok',
    costPrice: '',
    sellingPrice: '',
    stock: '',
    unit: 'pcs',
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Check duplicate barcode whenever barcode field changes
  const handleBarcodeChange = (val: string) => {
    const clean = val.trim();
    setFormData((prev) => ({ ...prev, barcode: clean }));

    if (clean) {
      const check = checkDuplicateBarcode(clean, editingProduct?.id);
      if (check.isDuplicate && check.existingProduct) {
        setDuplicateWarning(
          `⚠️ Barcode "${clean}" sudah digunakan oleh produk: "${check.existingProduct.name}". Barcode tidak boleh kembar!`
        );
      } else {
        setDuplicateWarning(null);
      }
    } else {
      setDuplicateWarning(null);
    }
  };

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({
      barcode: '',
      name: '',
      category: 'Bahan Pokok',
      costPrice: '',
      sellingPrice: '',
      stock: '',
      unit: 'pcs',
    });
    setFormError(null);
    setDuplicateWarning(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      barcode: product.barcode,
      name: product.name,
      category: product.category || 'Bahan Pokok',
      costPrice: product.costPrice.toString(),
      sellingPrice: product.sellingPrice.toString(),
      stock: product.stock.toString(),
      unit: product.unit || 'pcs',
    });
    setFormError(null);
    setDuplicateWarning(null);
    setIsModalOpen(true);
  };

  const handleGenerateRandomBarcode = () => {
    // Generate simple EAN-like 13 digit number for homemade / unpackaged goods
    const prefix = '899' + Math.floor(1000000000 + Math.random() * 9000000000).toString().slice(0, 10);
    handleBarcodeChange(prefix);
  };

  const handleScanBarcodeForForm = (barcode: string) => {
    handleBarcodeChange(barcode);
    setIsScannerOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const barcode = formData.barcode.trim();
    const name = formData.name.trim();
    const costPrice = parseFloat(formData.costPrice) || 0;
    const sellingPrice = parseFloat(formData.sellingPrice) || 0;
    const stock = parseInt(formData.stock, 10) || 0;

    if (!barcode) {
      setFormError('Barcode atau kode barang wajib diisi!');
      return;
    }

    if (!name) {
      setFormError('Nama barang wajib diisi!');
      return;
    }

    if (sellingPrice <= 0) {
      setFormError('Harga jual harus lebih dari 0!');
      return;
    }

    // Strict validation: Barcode uniqueness check
    const check = checkDuplicateBarcode(barcode, editingProduct?.id);
    if (check.isDuplicate && check.existingProduct) {
      setFormError(
        `Barcode "${barcode}" sudah terdaftar untuk barang: "${check.existingProduct.name}". Mohon gunakan barcode yang berbeda!`
      );
      return;
    }

    const newProduct: Product = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
      barcode,
      name,
      category: formData.category,
      costPrice,
      sellingPrice,
      stock,
      unit: formData.unit,
      updatedAt: new Date().toISOString(),
    };

    const res = addOrUpdateProduct(newProduct);
    if (res.success) {
      setIsModalOpen(false);
      onRefresh();
      setSuccessToast(
        editingProduct ? `Produk "${name}" berhasil diperbarui!` : `Produk "${name}" berhasil ditambahkan!`
      );
      setTimeout(() => setSuccessToast(null), 3000);
    } else {
      setFormError(res.error || 'Gagal menyimpan barang.');
    }
  };

  const handleDelete = (id: string, name: string) => {
    deleteProduct(id);
    setDeleteConfirmId(null);
    onRefresh();
    setSuccessToast(`Produk "${name}" telah dihapus.`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchCat = selectedCategory === 'Semua' || p.category === selectedCategory;
    const matchSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl shadow-xs border border-slate-200">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Katalog & Stok Barang</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Total {products.length} barang terdaftar di Toko Heni. Barcode dijamin unik & tidak kembar.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black rounded-xl text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-transform"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          Tambah Produk Baru
        </button>
      </div>

      {/* Success Notification */}
      {successToast && (
        <div className="p-3 bg-emerald-600 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md flex items-center gap-2 animate-in slide-in-from-top-2 duration-200">
          <CheckCircle className="w-4 h-4" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white p-3.5 rounded-2xl shadow-xs border border-slate-200 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari berdasarkan nama barang atau scan barcode..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs sm:text-sm font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-amber-400'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Table / Cards */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="p-10 text-center text-slate-400 space-y-2">
            <Package className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">Tidak ada barang yang cocok</p>
            <p className="text-xs">Coba ubah kata kunci pencarian atau kategori.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Barang & Barcode</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4 text-right">Modal</th>
                  <th className="py-3 px-4 text-right">Harga Jual</th>
                  <th className="py-3 px-4 text-center">Stok</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredProducts.map((p) => {
                  const profit = p.sellingPrice - p.costPrice;
                  return (
                    <tr key={p.id} className="hover:bg-amber-50/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-xs sm:text-sm">{p.name}</div>
                        <div className="font-mono text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <Tag className="w-3 h-3 text-slate-400" />
                          <span>{p.barcode}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[11px]">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500">
                        {formatRupiah(p.costPrice)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        <div>{formatRupiah(p.sellingPrice)}</div>
                        <div className="text-[10px] text-emerald-600 font-sans">
                          + {formatRupiah(profit)}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            p.stock <= 0
                              ? 'bg-rose-100 text-rose-800'
                              : p.stock <= 5
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {p.stock} {p.unit}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Edit Produk"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(p.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Hapus Produk"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Hapus Produk Ini?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Barang yang dihapus tidak akan muncul lagi di kasir & cek harga.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  const p = products.find((x) => x.id === deleteConfirmId);
                  if (p) handleDelete(p.id, p.name);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-colors"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="flex items-center justify-between px-5 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-sm sm:text-base">
                  {editingProduct ? 'Edit Data Barang' : 'Tambah Barang Baru Toko Heni'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Duplicate Barcode Warning / Error */}
              {duplicateWarning && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs font-semibold flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{duplicateWarning}</span>
                </div>
              )}

              {formError && (
                <div className="p-3 bg-rose-100 border border-rose-400 rounded-xl text-rose-900 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Barcode Field with Scan & Generate buttons */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Barcode / Kode Barang <span className="text-rose-500">* (Harus Unik)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => handleBarcodeChange(e.target.value)}
                    placeholder="Scan kemasan atau buat barcode..."
                    className={`flex-1 px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm font-mono font-bold focus:outline-none focus:bg-white ${
                      duplicateWarning
                        ? 'border-rose-500 bg-rose-50/40 text-rose-900 focus:ring-rose-500'
                        : 'border-slate-300 focus:ring-2 focus:ring-amber-500'
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setIsScannerOpen(true)}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-amber-400 font-bold rounded-xl text-xs flex items-center gap-1.5 shrink-0"
                    title="Scan Barcode Kemasan"
                  >
                    <Scan className="w-4 h-4" />
                    <span className="hidden sm:inline">Scan</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateRandomBarcode}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1 shrink-0"
                    title="Buat Barcode Acak untuk Barang Tanpa Barcode (beras, telur, dll)"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Acak</span>
                  </button>
                </div>
              </div>

              {/* Nama Produk */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Nama Barang <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Beras Ramos 5 Kg, Kopi Kapal Api..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  required
                />
              </div>

              {/* Kategori & Satuan */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Kategori
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {CATEGORIES.filter((c) => c !== 'Semua').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Satuan
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Harga Modal & Harga Jual */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Harga Modal (Kulak)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      Rp
                    </span>
                    <input
                      type="number"
                      value={formData.costPrice}
                      onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                      placeholder="0"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Harga Jual <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-600">
                      Rp
                    </span>
                    <input
                      type="number"
                      value={formData.sellingPrice}
                      onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                      placeholder="0"
                      className="w-full pl-9 pr-3 py-2.5 bg-amber-50/50 border border-amber-300 rounded-xl text-xs sm:text-sm font-mono font-bold text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Stok */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Jumlah Stok
                </label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs sm:text-sm transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={Boolean(duplicateWarning)}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black rounded-xl text-xs sm:text-sm shadow-md transition-all"
                >
                  {editingProduct ? 'Simpan Perubahan' : 'Simpan Barang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barcode Scanner for Form */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanBarcodeForForm}
        title="Scan Barcode Kemasan Barang"
        subtitle="Arahkan kamera ke barcode kemasan barang baru"
      />
    </div>
  );
};
