import { Product, Transaction, KasbonRecord } from '../types/pos';

export const APPS_SCRIPT_TEMPLATE = `/**
 * ====================================================================
 * TOKO QU - KASIR TOKO HENI (Developed by Hann)
 * Google Apps Script Web App Endpoint
 * ====================================================================
 * CARA PAKAI:
 * 1. Buka Google Spreadsheet baru (beri nama misal: "Database Toko Heni").
 * 2. Klik menu 'Ekstensi' > 'Apps Script'.
 * 3. Hapus semua kode yang ada, lalu Paste seluruh kode ini.
 * 4. Klik tombol 'Deploy' (Terapkan) di kanan atas > 'Deployment baru' (New deployment).
 * 5. Pilih jenis: 'Aplikasi Web' (Web app).
 * 6. Pada 'Akses' (Who has access), PILIH: 'Siapa saja' (Anyone / Anonim).
 * 7. Klik 'Terapkan' (Deploy), berikan izin Google, lalu SALIN URL Aplikasi Web.
 * 8. Tempelkan URL tersebut ke Pengaturan Toko Qu!
 * ====================================================================
 */

function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Sheet 1: Barang
  let sheetBarang = ss.getSheetByName('Barang');
  if (!sheetBarang) {
    sheetBarang = ss.insertSheet('Barang');
    sheetBarang.appendRow(['ID', 'Barcode', 'Nama Barang', 'Kategori', 'Harga Modal', 'Harga Jual', 'Stok', 'Satuan', 'Diperbarui']);
    sheetBarang.getRange('A1:I1').setFontWeight('bold').setBackground('#e2e8f0');
    sheetBarang.setFrozenRows(1);
  }

  // Sheet 2: Transaksi
  let sheetTransaksi = ss.getSheetByName('Transaksi');
  if (!sheetTransaksi) {
    sheetTransaksi = ss.insertSheet('Transaksi');
    sheetTransaksi.appendRow(['ID Transaksi', 'Tanggal', 'Pelanggan', 'Metode Bayar', 'Total Belanja', 'Nominal Bayar', 'Kembalian', 'Kasir', 'Rincian Barang', 'Catatan']);
    sheetTransaksi.getRange('A1:J1').setFontWeight('bold').setBackground('#e2e8f0');
    sheetTransaksi.setFrozenRows(1);
  }

  // Sheet 3: Kasbon (Hutang Pembeli)
  let sheetKasbon = ss.getSheetByName('Kasbon');
  if (!sheetKasbon) {
    sheetKasbon = ss.insertSheet('Kasbon');
    sheetKasbon.appendRow(['ID Kasbon', 'ID Transaksi', 'Nama Pembeli', 'No HP', 'Total Hutang', 'Sudah Dibayar', 'Sisa Hutang', 'Status', 'Jatuh Tempo', 'Riwayat Cicilan', 'Tanggal Dibuat']);
    sheetKasbon.getRange('A1:K1').setFontWeight('bold').setBackground('#e2e8f0');
    sheetKasbon.setFrozenRows(1);
  }
}

function doGet(e) {
  setupSheets();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const action = e.parameter ? e.parameter.action : 'getAll';

  const output = { success: true, timestamp: new Date().toISOString() };

  try {
    // 1. Ambil Data Barang
    const sheetBarang = ss.getSheetByName('Barang');
    const dataBarang = sheetBarang.getDataRange().getValues();
    const products = [];
    for (let i = 1; i < dataBarang.length; i++) {
      const row = dataBarang[i];
      if (row[0] && row[1]) {
        products.push({
          id: String(row[0]),
          barcode: String(row[1]),
          name: String(row[2]),
          category: String(row[3] || 'Umum'),
          costPrice: Number(row[4] || 0),
          sellingPrice: Number(row[5] || 0),
          stock: Number(row[6] || 0),
          unit: String(row[7] || 'pcs'),
          updatedAt: String(row[8] || new Date().toISOString())
        });
      }
    }
    output.products = products;

    // 2. Ambil Data Transaksi (terbaru di atas)
    const sheetTrx = ss.getSheetByName('Transaksi');
    const dataTrx = sheetTrx.getDataRange().getValues();
    const transactions = [];
    for (let i = dataTrx.length - 1; i >= 1; i--) {
      const row = dataTrx[i];
      if (row[0]) {
        let items = [];
        try { items = JSON.parse(row[8]); } catch(err) { items = []; }
        transactions.push({
          id: String(row[0]),
          date: String(row[1]),
          customerName: String(row[2] || ''),
          paymentMethod: String(row[3] || 'tunai'),
          totalAmount: Number(row[4] || 0),
          paidAmount: Number(row[5] || 0),
          changeAmount: Number(row[6] || 0),
          cashierName: String(row[7] || 'Hann'),
          items: items,
          notes: String(row[9] || ''),
          isKasbon: String(row[3]) === 'kasbon'
        });
      }
    }
    output.transactions = transactions;

    // 3. Ambil Data Kasbon
    const sheetKasbon = ss.getSheetByName('Kasbon');
    const dataKasbon = sheetKasbon.getDataRange().getValues();
    const kasbons = [];
    for (let i = 1; i < dataKasbon.length; i++) {
      const row = dataKasbon[i];
      if (row[0]) {
        let payments = [];
        try { payments = JSON.parse(row[9]); } catch(err) { payments = []; }
        kasbons.push({
          id: String(row[0]),
          transactionId: String(row[1]),
          customerName: String(row[2]),
          customerPhone: String(row[3] || ''),
          totalAmount: Number(row[4] || 0),
          paidAmount: Number(row[5] || 0),
          remainingAmount: Number(row[6] || 0),
          status: String(row[7] || 'belum_lunas'),
          dueDate: String(row[8] || ''),
          payments: payments,
          createdAt: String(row[10] || new Date().toISOString())
        });
      }
    }
    output.kasbons = kasbons;

    return ContentService.createTextOutput(JSON.stringify(output))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  setupSheets();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  try {
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;

    if (action === 'bulkSync' || action === 'syncAll') {
      // 1. Simpan Barang (Replace / Update sheet Barang)
      if (payload.products && Array.isArray(payload.products)) {
        const sheetBarang = ss.getSheetByName('Barang');
        sheetBarang.clear();
        sheetBarang.appendRow(['ID', 'Barcode', 'Nama Barang', 'Kategori', 'Harga Modal', 'Harga Jual', 'Stok', 'Satuan', 'Diperbarui']);
        sheetBarang.getRange('A1:I1').setFontWeight('bold').setBackground('#e2e8f0');
        sheetBarang.setFrozenRows(1);
        
        const rows = payload.products.map(p => [
          p.id,
          p.barcode,
          p.name,
          p.category,
          p.costPrice,
          p.sellingPrice,
          p.stock,
          p.unit,
          p.updatedAt
        ]);
        if (rows.length > 0) {
          sheetBarang.getRange(2, 1, rows.length, 9).setValues(rows);
        }
      }

      // 2. Simpan Transaksi
      if (payload.transactions && Array.isArray(payload.transactions)) {
        const sheetTrx = ss.getSheetByName('Transaksi');
        sheetTrx.clear();
        sheetTrx.appendRow(['ID Transaksi', 'Tanggal', 'Pelanggan', 'Metode Bayar', 'Total Belanja', 'Nominal Bayar', 'Kembalian', 'Kasir', 'Rincian Barang', 'Catatan']);
        sheetTrx.getRange('A1:J1').setFontWeight('bold').setBackground('#e2e8f0');
        sheetTrx.setFrozenRows(1);

        const rows = payload.transactions.map(t => [
          t.id,
          t.date,
          t.customerName || '',
          t.paymentMethod,
          t.totalAmount,
          t.paidAmount,
          t.changeAmount,
          t.cashierName || 'Hann',
          JSON.stringify(t.items),
          t.notes || ''
        ]);
        if (rows.length > 0) {
          sheetTrx.getRange(2, 1, rows.length, 10).setValues(rows);
        }
      }

      // 3. Simpan Kasbon
      if (payload.kasbons && Array.isArray(payload.kasbons)) {
        const sheetKasbon = ss.getSheetByName('Kasbon');
        sheetKasbon.clear();
        sheetKasbon.appendRow(['ID Kasbon', 'ID Transaksi', 'Nama Pembeli', 'No HP', 'Total Hutang', 'Sudah Dibayar', 'Sisa Hutang', 'Status', 'Jatuh Tempo', 'Riwayat Cicilan', 'Tanggal Dibuat']);
        sheetKasbon.getRange('A1:K1').setFontWeight('bold').setBackground('#e2e8f0');
        sheetKasbon.setFrozenRows(1);

        const rows = payload.kasbons.map(k => [
          k.id,
          k.transactionId,
          k.customerName,
          k.customerPhone || '',
          k.totalAmount,
          k.paidAmount,
          k.remainingAmount,
          k.status,
          k.dueDate || '',
          JSON.stringify(k.payments || []),
          k.createdAt
        ]);
        if (rows.length > 0) {
          sheetKasbon.getRange(2, 1, rows.length, 11).setValues(rows);
        }
      }

      return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Data berhasil disinkronkan ke Spreadsheet Toko Heni!' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Append single transaction
    if (action === 'addTransaction' && payload.transaction) {
      const t = payload.transaction;
      const sheetTrx = ss.getSheetByName('Transaksi');
      sheetTrx.appendRow([
        t.id,
        t.date,
        t.customerName || '',
        t.paymentMethod,
        t.totalAmount,
        t.paidAmount,
        t.changeAmount,
        t.cashierName || 'Hann',
        JSON.stringify(t.items),
        t.notes || ''
      ]);

      // Update stock di sheet barang
      const sheetBarang = ss.getSheetByName('Barang');
      const dataBarang = sheetBarang.getDataRange().getValues();
      t.items.forEach(item => {
        for (let i = 1; i < dataBarang.length; i++) {
          if (String(dataBarang[i][1]) === String(item.barcode)) {
            const currentStock = Number(dataBarang[i][6] || 0);
            const newStock = Math.max(0, currentStock - item.qty);
            sheetBarang.getRange(i + 1, 7).setValue(newStock);
            break;
          }
        }
      });

      return ContentService.createTextOutput(JSON.stringify({ success: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Aksi tidak dikenal' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
`;

export interface SyncResult {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    products?: Product[];
    transactions?: Transaction[];
    kasbons?: KasbonRecord[];
  };
}

export async function testSpreadsheetConnection(url: string): Promise<SyncResult> {
  if (!url || !url.startsWith('http')) {
    return { success: false, error: 'URL Google Apps Script tidak valid. Pastikan diawali https://script.google.com/macros/s/...' };
  }

  try {
    const cleanUrl = url.trim();
    const res = await fetch(`${cleanUrl}?action=test&ts=${Date.now()}`, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache',
    });

    if (!res.ok) {
      throw new Error(`Server merespons status ${res.status}`);
    }

    const json = await res.json();
    if (json.success) {
      return { success: true, message: 'Koneksi ke Google Spreadsheet Toko Heni berhasil!' };
    } else {
      return { success: false, error: json.error || 'Respons dari spreadsheet tidak valid.' };
    }
  } catch (err: any) {
    return {
      success: false,
      error: `Gagal tersambung: ${err.message}. Pastikan izin deployment Web App disetel ke "Anyone" (Siapa saja).`,
    };
  }
}

export async function pullDataFromSpreadsheet(url: string): Promise<SyncResult> {
  if (!url || !url.startsWith('http')) {
    return { success: false, error: 'URL Google Apps Script belum diisi.' };
  }

  try {
    const cleanUrl = url.trim();
    const res = await fetch(`${cleanUrl}?action=getAll&ts=${Date.now()}`, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache',
    });

    if (!res.ok) {
      throw new Error(`HTTP Error ${res.status}`);
    }

    const json = await res.json();
    if (json.success) {
      return {
        success: true,
        message: 'Data berhasil ditarik dari Google Spreadsheet!',
        data: {
          products: json.products || [],
          transactions: json.transactions || [],
          kasbons: json.kasbons || [],
        },
      };
    } else {
      return { success: false, error: json.error || 'Gagal memuat data.' };
    }
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function pushAllToSpreadsheet(
  url: string,
  payload: { products: Product[]; transactions: Transaction[]; kasbons: KasbonRecord[] }
): Promise<SyncResult> {
  if (!url || !url.startsWith('http')) {
    return { success: false, error: 'URL Google Apps Script belum diisi.' };
  }

  try {
    const cleanUrl = url.trim();
    // Using text/plain to avoid CORS preflight options blocking on Google Apps Script
    const res = await fetch(cleanUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'bulkSync',
        ...payload,
      }),
    });

    const json = await res.json();
    if (json.success) {
      return { success: true, message: json.message || 'Semua data berhasil disimpan ke Spreadsheet!' };
    } else {
      return { success: false, error: json.error || 'Gagal menyimpan ke Spreadsheet.' };
    }
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
