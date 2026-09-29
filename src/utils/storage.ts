import { Product, Transaction, KasbonRecord, AppSettings } from '../types/pos';

const STORAGE_KEYS = {
  PRODUCTS: 'toko_qu_products_v1',
  TRANSACTIONS: 'toko_qu_transactions_v1',
  KASBON: 'toko_qu_kasbon_v1',
  SETTINGS: 'toko_qu_settings_v1',
};

export const DEFAULT_SETTINGS: AppSettings = {
  storeName: 'TOKO HENI',
  storeTagline: 'Sembako & Kebutuhan Rumah Tangga',
  storeAddress: 'Pasar Tradisional & Warung Heni',
  storePhone: '0812-3456-7890',
  receiptFooter: 'Terima kasih telah berbelanja di Toko Heni!\nBarang yang dibeli tidak dapat ditukar.',
  printerPaperWidth: 58,
  scanAutoTorch: true, // "kasih pengaturan buat kaya flash pas buka menu scan barcode buat cej harga"
  scanVibrate: true,   // "kemduian getar ketika scan barcode berhasil"
  soundBeep: true,
  spreadsheetUrl: '',
  cashierName: 'Hann',
  lastSyncTime: null,
};

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    barcode: '8999999195045',
    name: 'Indomie Goreng Spesial',
    category: 'Makanan Instan',
    costPrice: 2800,
    sellingPrice: 3500,
    stock: 48,
    unit: 'bks',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-002',
    barcode: '8999999002220',
    name: 'Indomie Kuah Ayam Bawang',
    category: 'Makanan Instan',
    costPrice: 2700,
    sellingPrice: 3500,
    stock: 36,
    unit: 'bks',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-003',
    barcode: '8996001304128',
    name: 'Minyak Goreng Bimoli 1 Liter',
    category: 'Minyak & Mentega',
    costPrice: 17500,
    sellingPrice: 20000,
    stock: 20,
    unit: 'btl',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-004',
    barcode: '8991389220019',
    name: 'Gula Pasir Gulaku Kuning 1 Kg',
    category: 'Bahan Pokok',
    costPrice: 15500,
    sellingPrice: 18000,
    stock: 15,
    unit: 'bks',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-005',
    barcode: '8998866100125',
    name: 'Beras Ramos Super 5 Kg',
    category: 'Bahan Pokok',
    costPrice: 68000,
    sellingPrice: 75000,
    stock: 12,
    unit: 'karung',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-006',
    barcode: '8992759211029',
    name: 'Kopi Kapal Api Spesial Mix 24g',
    category: 'Minuman',
    costPrice: 1500,
    sellingPrice: 2000,
    stock: 60,
    unit: 'bks',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-007',
    barcode: '8996001414001',
    name: 'Le Minerale 600ml',
    category: 'Minuman',
    costPrice: 2800,
    sellingPrice: 4000,
    stock: 24,
    unit: 'btl',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-008',
    barcode: '8991002101344',
    name: 'Telur Ayam Negeri Segar',
    category: 'Bahan Pokok',
    costPrice: 26000,
    sellingPrice: 29000,
    stock: 30,
    unit: 'kg',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-009',
    barcode: '8999999522100',
    name: 'Sabun Lifebuoy Total 10 110g',
    category: 'Sabun & Cuci',
    costPrice: 4200,
    sellingPrice: 5500,
    stock: 18,
    unit: 'pcs',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-010',
    barcode: '8991008101416',
    name: 'Deterjen Rinso Molto 770g',
    category: 'Sabun & Cuci',
    costPrice: 19500,
    sellingPrice: 23000,
    stock: 8,
    unit: 'bks',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-011',
    barcode: '8998989100112',
    name: 'Teh Celup Sariwangi Kotak isi 25',
    category: 'Minuman',
    costPrice: 6500,
    sellingPrice: 8000,
    stock: 14,
    unit: 'kotak',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-012',
    barcode: '8992775213455',
    name: 'Kecap Manis Bango 550ml Refill',
    category: 'Bumbu Dapur',
    costPrice: 22000,
    sellingPrice: 25500,
    stock: 10,
    unit: 'bks',
    updatedAt: new Date().toISOString(),
  },
];

export const INITIAL_KASBON: KasbonRecord[] = [
  {
    id: 'KSB-001',
    transactionId: 'TRX-SAMPLE-01',
    customerName: 'Bu RT Wati',
    customerPhone: '081399887766',
    totalAmount: 115000,
    paidAmount: 50000,
    remainingAmount: 65000,
    status: 'belum_lunas',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    dueDate: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
    notes: 'Ambil beras 5kg & minyak bimoli',
    payments: [
      {
        id: 'PAY-1',
        date: new Date(Date.now() - 3 * 86400000).toISOString(),
        amount: 50000,
        note: 'Uang Muka (DP)',
      },
    ],
  },
  {
    id: 'KSB-002',
    transactionId: 'TRX-SAMPLE-02',
    customerName: 'Pak Budi Bengkel',
    customerPhone: '085711223344',
    totalAmount: 45000,
    paidAmount: 0,
    remainingAmount: 45000,
    status: 'belum_lunas',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    dueDate: new Date(Date.now() + 6 * 86400000).toISOString().split('T')[0],
    notes: 'Kopi kapal api 1 renteng & telur 1kg',
    payments: [],
  },
];

// --- STORAGE GETTERS & SETTERS ---

export function getProducts(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading products:', err);
    return INITIAL_PRODUCTS;
  }
}

export function saveProducts(products: Product[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    window.dispatchEvent(new Event('toko_qu_products_updated'));
  } catch (err) {
    console.error('Error saving products:', err);
  }
}

// CRITICAL VALIDATION: "jangan sampai barcode yang sama bisa dimasukin lagi"
export function checkDuplicateBarcode(barcode: string, currentProductId?: string): { isDuplicate: boolean; existingProduct?: Product } {
  if (!barcode || !barcode.trim()) {
    return { isDuplicate: false };
  }
  const cleanBarcode = barcode.trim();
  const products = getProducts();
  const found = products.find(p => p.barcode.trim().toLowerCase() === cleanBarcode.toLowerCase() && p.id !== currentProductId);
  
  if (found) {
    return { isDuplicate: true, existingProduct: found };
  }
  return { isDuplicate: false };
}

export function addOrUpdateProduct(product: Product): { success: boolean; error?: string } {
  const check = checkDuplicateBarcode(product.barcode, product.id);
  if (check.isDuplicate && check.existingProduct) {
    return {
      success: false,
      error: `Barcode "${product.barcode}" sudah dipakai oleh produk: "${check.existingProduct.name}". Barcode tidak boleh kembar!`,
    };
  }

  const products = getProducts();
  const existingIdx = products.findIndex(p => p.id === product.id);
  
  if (existingIdx >= 0) {
    products[existingIdx] = { ...product, updatedAt: new Date().toISOString() };
  } else {
    products.unshift({ ...product, updatedAt: new Date().toISOString() });
  }

  saveProducts(products);
  return { success: true };
}

export function deleteProduct(productId: string): void {
  const products = getProducts().filter(p => p.id !== productId);
  saveProducts(products);
}

export function findProductByBarcode(barcode: string): Product | undefined {
  if (!barcode) return undefined;
  const clean = barcode.trim().toLowerCase();
  const products = getProducts();
  return products.find(p => p.barcode.trim().toLowerCase() === clean);
}

// --- TRANSACTIONS ---

export function getTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Error loading transactions:', err);
    return [];
  }
}

export function saveTransaction(transaction: Transaction): void {
  try {
    const list = getTransactions();
    list.unshift(transaction);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(list));

    // Deduct inventory stock
    const products = getProducts();
    let updatedProducts = false;

    transaction.items.forEach(item => {
      const idx = products.findIndex(p => p.id === item.productId || p.barcode === item.barcode);
      if (idx >= 0) {
        products[idx].stock = Math.max(0, products[idx].stock - item.qty);
        products[idx].updatedAt = new Date().toISOString();
        updatedProducts = true;
      }
    });

    if (updatedProducts) {
      saveProducts(products);
    }

    // If Kasbon, record into Kasbon records
    if (transaction.isKasbon || transaction.paymentMethod === 'kasbon') {
      const remaining = Math.max(0, transaction.totalAmount - transaction.paidAmount);
      const kasbonRecord: KasbonRecord = {
        id: `KSB-${Date.now().toString().slice(-6)}`,
        transactionId: transaction.id,
        customerName: transaction.customerName || 'Pelanggan Toko Heni',
        customerPhone: transaction.customerPhone || '',
        totalAmount: transaction.totalAmount,
        paidAmount: transaction.paidAmount,
        remainingAmount: remaining,
        status: remaining <= 0 ? 'lunas' : 'belum_lunas',
        createdAt: transaction.date,
        notes: transaction.notes || `Transaksi Kasbon ${transaction.id}`,
        payments: transaction.paidAmount > 0 ? [
          {
            id: `PAY-${Date.now()}`,
            date: transaction.date,
            amount: transaction.paidAmount,
            note: 'Uang Muka (DP)',
          }
        ] : [],
      };
      saveKasbonRecord(kasbonRecord);
    }

    window.dispatchEvent(new Event('toko_qu_transactions_updated'));
  } catch (err) {
    console.error('Error saving transaction:', err);
  }
}

export function saveTransactionsList(transactions: Transaction[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    window.dispatchEvent(new Event('toko_qu_transactions_updated'));
  } catch (err) {
    console.error('Error saving transactions list:', err);
  }
}

// --- KASBON (HUTANG PEMBELI) ---

export function getKasbonList(): KasbonRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.KASBON);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.KASBON, JSON.stringify(INITIAL_KASBON));
      return INITIAL_KASBON;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading kasbon:', err);
    return INITIAL_KASBON;
  }
}

export function saveKasbonList(list: KasbonRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.KASBON, JSON.stringify(list));
    window.dispatchEvent(new Event('toko_qu_kasbon_updated'));
  } catch (err) {
    console.error('Error saving kasbon list:', err);
  }
}

export function saveKasbonRecord(record: KasbonRecord): void {
  const list = getKasbonList();
  const idx = list.findIndex(k => k.id === record.id);
  if (idx >= 0) {
    list[idx] = record;
  } else {
    list.unshift(record);
  }
  saveKasbonList(list);
}

export function addKasbonPayment(kasbonId: string, amount: number, note: string): boolean {
  const list = getKasbonList();
  const idx = list.findIndex(k => k.id === kasbonId);
  if (idx === -1) return false;

  const current = list[idx];
  const newPaidAmount = current.paidAmount + amount;
  const newRemaining = Math.max(0, current.totalAmount - newPaidAmount);
  
  current.paidAmount = newPaidAmount;
  current.remainingAmount = newRemaining;
  current.status = newRemaining <= 0 ? 'lunas' : 'belum_lunas';
  current.payments = current.payments || [];
  current.payments.push({
    id: `PAY-${Date.now()}`,
    date: new Date().toISOString(),
    amount,
    note: note || 'Pembayaran cicilan kasbon',
  });

  saveKasbonList(list);
  return true;
}

// --- SETTINGS ---

export function getSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (err) {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    window.dispatchEvent(new Event('toko_qu_settings_updated'));
  } catch (err) {
    console.error('Error saving settings:', err);
  }
}
