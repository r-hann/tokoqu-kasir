export interface Product {
  id: string;
  barcode: string;
  name: string;
  category: string;
  costPrice: number;    // Harga Modal / Kulak
  sellingPrice: number; // Harga Jual
  stock: number;        // Jumlah Stok
  unit: string;         // pcs, kg, bks, btl, renteng, dus, pack
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  qty: number;
  subtotal: number;
  discount: number; // Diskon nominal
  note?: string;
}

export type PaymentMethod = 'tunai' | 'qris' | 'kasbon';

export interface Transaction {
  id: string;
  date: string;
  items: {
    productId: string;
    barcode: string;
    name: string;
    sellingPrice: number;
    costPrice: number;
    qty: number;
    unit: string;
    subtotal: number;
    discount: number;
  }[];
  totalAmount: number;
  paidAmount: number;
  changeAmount: number;
  paymentMethod: PaymentMethod;
  customerName?: string;
  customerPhone?: string;
  cashierName: string;
  isKasbon: boolean;
  notes?: string;
  syncedToSpreadsheet?: boolean;
}

export interface KasbonPayment {
  id: string;
  date: string;
  amount: number;
  note: string;
}

export interface KasbonRecord {
  id: string;
  transactionId: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: 'belum_lunas' | 'lunas';
  createdAt: string;
  dueDate?: string;
  notes?: string;
  payments: KasbonPayment[];
  syncedToSpreadsheet?: boolean;
}

export interface AppSettings {
  storeName: string;
  storeTagline: string;
  storeAddress: string;
  storePhone: string;
  receiptFooter: string;
  printerPaperWidth: 58 | 80;
  scanAutoTorch: boolean;   // Nyalakan flash otomatis saat buka scanner barcode
  scanVibrate: boolean;     // Getar saat scan barcode berhasil
  soundBeep: boolean;       // Bunyi beep saat scan barcode
  spreadsheetUrl: string;   // Google Apps Script Web App URL
  cashierName: string;
  lastSyncTime: string | null;
}
