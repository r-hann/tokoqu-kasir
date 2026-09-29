import { Transaction, AppSettings } from '../types/pos';
import { formatRupiah } from './feedback';

// Web Bluetooth thermal printer GATT service UUIDs commonly used by 58mm/80mm Bluetooth printers
const PRINTER_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Standard POS printer service
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC proprietary service
  '0000ffe0-0000-1000-8000-00805f9b34fb', // HMSoft / Chinese thermal printers
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Posnet / Xprinter
];

class BluetoothPrinterService {
  private device: any = null;
  private characteristic: any = null;
  public deviceName: string | null = null;
  public isConnected: boolean = false;

  isBluetoothSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  async connect(): Promise<{ success: boolean; deviceName?: string; error?: string }> {
    if (!this.isBluetoothSupported()) {
      return { success: false, error: 'Web Bluetooth tidak didukung di browser ini. Gunakan Chrome di Android/Windows/Mac.' };
    }

    try {
      const nav = navigator as any;
      const device = await nav.bluetooth.requestDevice({
        filters: [
          { services: ['000018f0-0000-1000-8000-00805f9b34fb'] },
          { services: ['49535343-fe7d-4ae5-8fa9-9fafd205e455'] },
          { services: ['0000ffe0-0000-1000-8000-00805f9b34fb'] },
          { namePrefix: 'MPT' },
          { namePrefix: 'RPP' },
          { namePrefix: 'POS' },
          { namePrefix: 'Printer' },
          { namePrefix: 'BlueTooth' },
          { namePrefix: 'Thermal' },
        ],
        optionalServices: PRINTER_SERVICES,
      });

      this.device = device;
      this.deviceName = device.name || 'Printer Bluetooth';

      device.addEventListener('gattserverdisconnected', () => {
        this.isConnected = false;
        this.characteristic = null;
        console.log('Bluetooth printer terputus');
      });

      const server = await device.gatt.connect();

      // Find usable writable characteristic
      let writableChar: any = null;

      for (const serviceUuid of PRINTER_SERVICES) {
        try {
          const service = await server.getPrimaryService(serviceUuid);
          const characteristics = await service.getCharacteristics();
          for (const char of characteristics) {
            if (char.properties.write || char.properties.writeWithoutResponse) {
              writableChar = char;
              break;
            }
          }
          if (writableChar) break;
        } catch {
          // Continue search in other services
        }
      }

      if (!writableChar) {
        // Fallback: search all services
        const services = await server.getPrimaryServices();
        for (const service of services) {
          const characteristics = await service.getCharacteristics();
          for (const char of characteristics) {
            if (char.properties.write || char.properties.writeWithoutResponse) {
              writableChar = char;
              break;
            }
          }
          if (writableChar) break;
        }
      }

      if (!writableChar) {
        throw new Error('Tidak dapat menemukan characteristic tulis pada printer Bluetooth.');
      }

      this.characteristic = writableChar;
      this.isConnected = true;
      return { success: true, deviceName: this.deviceName || undefined };
    } catch (err: any) {
      this.isConnected = false;
      return { success: false, error: err.message || 'Gagal menyambungkan Bluetooth.' };
    }
  }

  async disconnect() {
    if (this.device && this.device.gatt?.connected) {
      this.device.gatt.disconnect();
    }
    this.isConnected = false;
    this.characteristic = null;
    this.deviceName = null;
  }

  // Sends byte buffer in chunks to respect BLE MTU limits (usually 20-512 bytes)
  private async sendRaw(data: Uint8Array): Promise<void> {
    if (!this.characteristic) {
      throw new Error('Printer belum tersambung!');
    }

    const CHUNK_SIZE = 100;
    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
      const chunk = data.slice(i, i + CHUNK_SIZE);
      if (this.characteristic.writeValueWithResponse) {
        await this.characteristic.writeValueWithResponse(chunk);
      } else {
        await this.characteristic.writeValue(chunk);
      }
      // Small pause to allow printer buffer to process
      await new Promise((resolve) => setTimeout(resolve, 30));
    }
  }

  // Build ESC/POS bytes for Receipt
  buildReceiptCommands(transaction: Transaction, settings: AppSettings): Uint8Array {
    const charsPerLine = settings.printerPaperWidth === 80 ? 48 : 32;
    const encoder = new TextEncoder();
    const parts: number[] = [];

    const append = (...bytes: number[]) => {
      parts.push(...bytes);
    };

    const appendText = (text: string) => {
      const encoded = encoder.encode(text);
      for (const b of encoded) parts.push(b);
    };

    const appendLine = (text: string = '') => {
      appendText(text + '\n');
    };

    const padRow = (left: string, right: string): string => {
      const spaceNeeded = charsPerLine - (left.length + right.length);
      if (spaceNeeded <= 0) {
        return left.substring(0, charsPerLine - right.length - 1) + ' ' + right;
      }
      return left + ' '.repeat(spaceNeeded) + right;
    };

    const divider = '='.repeat(charsPerLine);
    const thinDivider = '-'.repeat(charsPerLine);

    // 1. Initialize Printer
    append(0x1b, 0x40); // ESC @ (Initialize)

    // 2. Header (Center, Bold, Double Height/Width for Store Name)
    append(0x1b, 0x61, 0x01); // ESC a 1 (Align center)
    append(0x1b, 0x21, 0x30); // Double height + double width
    appendLine(settings.storeName || 'TOKO HENI');
    append(0x1b, 0x21, 0x00); // Normal text

    if (settings.storeTagline) {
      appendLine(settings.storeTagline);
    }
    if (settings.storeAddress) {
      appendLine(settings.storeAddress);
    }
    if (settings.storePhone) {
      appendLine('Telp/WA: ' + settings.storePhone);
    }

    appendLine(divider);

    // 3. Meta info (Left aligned)
    append(0x1b, 0x61, 0x00); // Align left
    const formattedDate = new Date(transaction.date).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    appendLine(`No: ${transaction.id}`);
    appendLine(`Tgl: ${formattedDate}`);
    if (transaction.customerName) {
      appendLine(`Pelanggan: ${transaction.customerName}`);
    }
    appendLine(thinDivider);

    // 4. Items
    for (const item of transaction.items) {
      appendLine(item.name);
      const qtyStr = `${item.qty} ${item.unit || 'pcs'} x ${item.sellingPrice.toLocaleString('id-ID')}`;
      const subStr = item.subtotal.toLocaleString('id-ID');
      appendLine(padRow(`  ${qtyStr}`, subStr));
      if (item.discount > 0) {
        appendLine(padRow(`  Diskon`, `-${item.discount.toLocaleString('id-ID')}`));
      }
    }

    appendLine(thinDivider);

    // 5. Total & Payment
    appendLine(padRow('TOTAL', formatRupiah(transaction.totalAmount)));
    
    if (transaction.paymentMethod === 'kasbon') {
      append(0x1b, 0x45, 0x01); // Bold on
      appendLine(padRow('METODE', 'KASBON / HUTANG'));
      appendLine(padRow('DIBAYAR (DP)', formatRupiah(transaction.paidAmount)));
      appendLine(padRow('SISA HUTANG', formatRupiah(transaction.totalAmount - transaction.paidAmount)));
      append(0x1b, 0x45, 0x00); // Bold off
    } else {
      const methodLabel = transaction.paymentMethod === 'qris' ? 'QRIS / TRANSFER' : 'TUNAI';
      appendLine(padRow('METODE', methodLabel));
      appendLine(padRow('BAYAR', formatRupiah(transaction.paidAmount)));
      appendLine(padRow('KEMBALI', formatRupiah(transaction.changeAmount)));
    }

    appendLine(divider);

    // 6. Footer (Center)
    append(0x1b, 0x61, 0x01); // Align center
    if (settings.receiptFooter) {
      appendLine(settings.receiptFooter);
    } else {
      appendLine('Terima kasih atas kunjungannya!');
      appendLine('Barang yang dibeli tidak dapat ditukar.');
    }
    appendLine('~ Toko Qu - Toko Heni ~');
    appendLine('Developed by Hann');

    // 7. Feeds and Cut
    appendLine();
    appendLine();
    appendLine();
    append(0x1d, 0x56, 0x41, 0x03); // GS V A 3 (Feed and full cut)

    return new Uint8Array(parts);
  }

  async printReceipt(transaction: Transaction, settings: AppSettings): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.isConnected || !this.characteristic) {
        const connectResult = await this.connect();
        if (!connectResult.success) {
          return { success: false, error: connectResult.error || 'Printer Bluetooth tidak tersambung.' };
        }
      }

      const commands = this.buildReceiptCommands(transaction, settings);
      await this.sendRaw(commands);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Gagal mengirim data ke printer Bluetooth.' };
    }
  }

  async printTest(settings: AppSettings): Promise<{ success: boolean; error?: string }> {
    const dummyTrx: Transaction = {
      id: 'TEST-001',
      date: new Date().toISOString(),
      items: [
        {
          productId: '1',
          barcode: '12345678',
          name: 'Tes Cetak Toko Qu',
          sellingPrice: 15000,
          costPrice: 12000,
          qty: 1,
          unit: 'pcs',
          subtotal: 15000,
          discount: 0,
        },
      ],
      totalAmount: 15000,
      paidAmount: 20000,
      changeAmount: 5000,
      paymentMethod: 'tunai',
      cashierName: 'Hann',
      isKasbon: false,
    };

    return this.printReceipt(dummyTrx, settings);
  }
}

export const bluetoothPrinter = new BluetoothPrinterService();

// Generate WhatsApp text representation of receipt
export function generateReceiptWhatsappText(transaction: Transaction, settings: AppSettings): string {
  const formattedDate = new Date(transaction.date).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  let text = `🧾 *STRUK PEMBELIAN - ${settings.storeName.toUpperCase()}*\n`;
  if (settings.storeAddress) text += `📍 ${settings.storeAddress}\n`;
  if (settings.storePhone) text += `📞 ${settings.storePhone}\n`;
  text += `--------------------------------\n`;
  text += `No: *${transaction.id}*\n`;
  text += `Tgl: ${formattedDate}\n`;
  if (transaction.customerName) text += `Pelanggan: ${transaction.customerName}\n`;
  text += `--------------------------------\n`;

  for (const item of transaction.items) {
    text += `*${item.name}*\n`;
    text += `  ${item.qty} ${item.unit} x ${formatRupiah(item.sellingPrice)} = *${formatRupiah(item.subtotal)}*\n`;
    if (item.discount > 0) {
      text += `  (Diskon: -${formatRupiah(item.discount)})\n`;
    }
  }

  text += `--------------------------------\n`;
  text += `*TOTAL: ${formatRupiah(transaction.totalAmount)}*\n`;

  if (transaction.paymentMethod === 'kasbon') {
    text += `*METODE: KASBON / HUTANG*\n`;
    text += `Dibayar (DP): ${formatRupiah(transaction.paidAmount)}\n`;
    text += `*SISA HUTANG: ${formatRupiah(transaction.totalAmount - transaction.paidAmount)}*\n`;
  } else {
    const method = transaction.paymentMethod === 'qris' ? 'QRIS / Transfer' : 'Tunai';
    text += `Metode: ${method}\n`;
    text += `Bayar: ${formatRupiah(transaction.paidAmount)}\n`;
    text += `Kembali: ${formatRupiah(transaction.changeAmount)}\n`;
  }

  text += `--------------------------------\n`;
  text += `${settings.receiptFooter || 'Terima kasih telah berbelanja di Toko Heni!'}\n\n`;
  text += `_Toko Qu • Developed by Hann_`;

  return text;
}
