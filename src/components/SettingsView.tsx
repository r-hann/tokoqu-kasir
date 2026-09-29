import React, { useState } from 'react';
import { AppSettings, Product, Transaction, KasbonRecord } from '../types/pos';
import { saveSettings } from '../utils/storage';
import { bluetoothPrinter } from '../utils/bluetoothPrinter';
import {
  APPS_SCRIPT_TEMPLATE,
  testSpreadsheetConnection,
  pushAllToSpreadsheet,
  pullDataFromSpreadsheet,
} from '../utils/spreadsheetSync';
import {
  Printer,
  Bluetooth,
  FileSpreadsheet,
  Sliders,
  Store,
  CheckCircle,
  AlertCircle,
  Copy,
  Check,
  Send,
  Download,
  Upload,
  RefreshCw,
  Zap,
  Volume2,
  Vibrate,
  ShieldCheck,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface SettingsViewProps {
  settings: AppSettings;
  products: Product[];
  transactions: Transaction[];
  kasbons: KasbonRecord[];
  onSettingsSaved: (newSettings: AppSettings) => void;
  onDataImported: (data: { products?: Product[]; transactions?: Transaction[]; kasbons?: KasbonRecord[] }) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  products,
  transactions,
  kasbons,
  onSettingsSaved,
  onDataImported,
}) => {
  const [formData, setFormData] = useState<AppSettings>({ ...settings });
  const [saveToast, setSaveToast] = useState(false);

  // Bluetooth state
  const [btStatus, setBtStatus] = useState({
    isConnected: bluetoothPrinter.isConnected,
    deviceName: bluetoothPrinter.deviceName,
    isConnecting: false,
    message: '',
    error: '',
  });

  // Spreadsheet state
  const [ssLoading, setSsLoading] = useState(false);
  const [ssResult, setSsResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);
  const [showScriptModal, setShowScriptModal] = useState(false);

  const handleSaveSettings = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    saveSettings(formData);
    onSettingsSaved(formData);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  // Bluetooth handlers
  const handleConnectBt = async () => {
    setBtStatus((prev) => ({ ...prev, isConnecting: true, message: '', error: '' }));
    const res = await bluetoothPrinter.connect();
    setBtStatus({
      isConnected: bluetoothPrinter.isConnected,
      deviceName: bluetoothPrinter.deviceName,
      isConnecting: false,
      message: res.success ? `Tersambung ke ${res.deviceName}` : '',
      error: res.error || '',
    });
  };

  const handleDisconnectBt = async () => {
    await bluetoothPrinter.disconnect();
    setBtStatus({
      isConnected: false,
      deviceName: null,
      isConnecting: false,
      message: 'Printer diputuskan.',
      error: '',
    });
  };

  const handleTestPrint = async () => {
    setBtStatus((prev) => ({ ...prev, isConnecting: true, message: '', error: '' }));
    const res = await bluetoothPrinter.printTest(formData);
    setBtStatus((prev) => ({
      ...prev,
      isConnecting: false,
      message: res.success ? 'Berhasil mengirim tes cetak!' : '',
      error: res.error || '',
    }));
  };

  // Spreadsheet handlers
  const handleTestSpreadsheet = async () => {
    setSsLoading(true);
    setSsResult(null);
    const res = await testSpreadsheetConnection(formData.spreadsheetUrl);
    setSsLoading(false);
    setSsResult(res);
  };

  const handlePushAllToSpreadsheet = async () => {
    if (!formData.spreadsheetUrl) {
      setSsResult({ error: 'Harap masukkan URL Google Apps Script terlebih dahulu!' });
      return;
    }
    setSsLoading(true);
    setSsResult(null);
    const res = await pushAllToSpreadsheet(formData.spreadsheetUrl, {
      products,
      transactions,
      kasbons,
    });
    setSsLoading(false);
    setSsResult(res);
    if (res.success) {
      const updated = { ...formData, lastSyncTime: new Date().toISOString() };
      setFormData(updated);
      saveSettings(updated);
      onSettingsSaved(updated);
    }
  };

  const handlePullFromSpreadsheet = async () => {
    if (!formData.spreadsheetUrl) {
      setSsResult({ error: 'Harap masukkan URL Google Apps Script terlebih dahulu!' });
      return;
    }
    if (!window.confirm('Tarik data dari Google Spreadsheet akan memperbarui katalog & transaksi lokal. Lanjutkan?')) {
      return;
    }
    setSsLoading(true);
    setSsResult(null);
    const res = await pullDataFromSpreadsheet(formData.spreadsheetUrl);
    setSsLoading(false);
    setSsResult(res);
    if (res.success && res.data) {
      onDataImported(res.data);
    }
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_TEMPLATE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 3000);
  };

  // Backup & Restore
  const handleExportBackup = () => {
    const backup = {
      timestamp: new Date().toISOString(),
      app: 'Toko Qu - Toko Heni',
      author: 'Hann',
      products,
      transactions,
      kasbons,
      settings: formData,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_toko_heni_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const json = JSON.parse(evt.target?.result as string);
        if (json.products || json.transactions || json.kasbons) {
          onDataImported(json);
          if (json.settings) {
            setFormData(json.settings);
            saveSettings(json.settings);
            onSettingsSaved(json.settings);
          }
          alert('Backup Toko Heni berhasil dimuat!');
        } else {
          alert('Format file backup tidak cocok!');
        }
      } catch (err) {
        alert('Gagal membaca file JSON backup.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* Save Success Toast */}
      {saveToast && (
        <div className="sticky top-20 z-40 p-3 bg-emerald-600 text-white rounded-xl shadow-lg flex items-center justify-between text-xs sm:text-sm font-semibold animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            <span>Pengaturan Toko Qu berhasil disimpan!</span>
          </div>
        </div>
      )}

      {/* SECTION 1: PROFIL TOKO & CUSTOM STRUK */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="font-black text-sm sm:text-base">Profil Toko & Custom Struk</h2>
              <p className="text-[11px] text-slate-400">Identitas Toko Heni pada cetakan struk thermal</p>
            </div>
          </div>
          <span className="text-[10px] font-bold bg-amber-400/20 text-amber-300 px-2.5 py-0.5 rounded-full uppercase">
            Eksklusif Toko Heni
          </span>
        </div>

        <form onSubmit={handleSaveSettings} className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Nama Toko
              </label>
              <input
                type="text"
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold focus:ring-2 focus:ring-amber-500"
                placeholder="TOKO HENI"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Slogan / Tagline
              </label>
              <input
                type="text"
                value={formData.storeTagline}
                onChange={(e) => setFormData({ ...formData, storeTagline: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500"
                placeholder="Sembako & Kebutuhan Sehari-hari"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Alamat Toko
              </label>
              <input
                type="text"
                value={formData.storeAddress}
                onChange={(e) => setFormData({ ...formData, storeAddress: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500"
                placeholder="Jl. Pasar Tradisional No. 12"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Nomor Telepon / WhatsApp
              </label>
              <input
                type="text"
                value={formData.storePhone}
                onChange={(e) => setFormData({ ...formData, storePhone: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 font-mono"
                placeholder="0812-3456-7890"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
              Lebar Kertas Printer Thermal
            </label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl hover:bg-slate-100">
                <input
                  type="radio"
                  name="printerPaperWidth"
                  checked={formData.printerPaperWidth === 58}
                  onChange={() => setFormData({ ...formData, printerPaperWidth: 58 })}
                  className="text-amber-500"
                />
                <span>58 mm (Printer Mini / Portable)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl hover:bg-slate-100">
                <input
                  type="radio"
                  name="printerPaperWidth"
                  checked={formData.printerPaperWidth === 80}
                  onChange={() => setFormData({ ...formData, printerPaperWidth: 80 })}
                  className="text-amber-500"
                />
                <span>80 mm (Printer Standar)</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Pesan Catatan Kaki (Footer Struk)
            </label>
            <textarea
              rows={2}
              value={formData.receiptFooter}
              onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500"
              placeholder="Terima kasih telah berbelanja di Toko Heni!..."
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black rounded-xl text-xs sm:text-sm shadow-md transition-all"
            >
              Simpan Profil & Struk
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 2: BLUETOOTH THERMAL PRINTER */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bluetooth className="w-5 h-5 text-blue-400" />
            <div>
              <h2 className="font-black text-sm sm:text-base">Printer Struk Bluetooth (ESC/POS)</h2>
              <p className="text-[11px] text-slate-400">Hubungkan printer thermal via Web Bluetooth tanpa kabel</p>
            </div>
          </div>
          <span
            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1 ${
              btStatus.isConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-300'
            }`}
          >
            {btStatus.isConnected ? '● Terhubung' : '○ Belum Terhubung'}
          </span>
        </div>

        <div className="p-5 space-y-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase">Status Perangkat</div>
              <div className="text-base font-black text-slate-900 mt-0.5">
                {btStatus.isConnected
                  ? btStatus.deviceName || 'Printer Bluetooth Tersambung'
                  : 'Belum ada printer Bluetooth terhubung'}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Mendukung printer thermal 58mm / 80mm portabel (Zjiang, RPP02, GOOJPRT, Panda, Bellav, dll.)
              </p>
            </div>

            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              {!btStatus.isConnected ? (
                <button
                  type="button"
                  onClick={handleConnectBt}
                  disabled={btStatus.isConnecting}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-transform flex items-center gap-2"
                >
                  <Bluetooth className="w-4 h-4" />
                  <span>{btStatus.isConnecting ? 'Mencari Printer...' : 'Sambungkan Bluetooth'}</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleTestPrint}
                    className="px-3.5 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-transform flex items-center gap-1.5"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Tes Cetak</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDisconnectBt}
                    className="px-3 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                  >
                    Putus
                  </button>
                </>
              )}
            </div>
          </div>

          {btStatus.message && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{btStatus.message}</span>
            </div>
          )}

          {btStatus.error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{btStatus.error}</span>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 3: SCANNER BARCODE & SENSOR PENGATURAN */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="font-black text-sm sm:text-base">Pengaturan Scanner & Sensor Kamera</h2>
              <p className="text-[11px] text-slate-400">Kontrol flash kamera, getaran, dan efek audio saat scan</p>
            </div>
          </div>
        </div>

        <div className="p-5 divide-y divide-slate-100 space-y-4">
          {/* Flashlight toggle setting */}
          <div className="flex items-center justify-between pt-1">
            <div className="pr-4">
              <div className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>Nyalakan Flash Otomatis saat Buka Scanner</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Lampu senter kamera langsung aktif saat membuka menu cek harga / scan barcode barang.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={formData.scanAutoTorch}
                onChange={(e) => {
                  const updated = { ...formData, scanAutoTorch: e.target.checked };
                  setFormData(updated);
                  saveSettings(updated);
                  onSettingsSaved(updated);
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {/* Vibrate setting */}
          <div className="flex items-center justify-between pt-4">
            <div className="pr-4">
              <div className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
                <Vibrate className="w-4 h-4 text-purple-600" />
                <span>Getar saat Scan Barcode Berhasil (Haptic)</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                HP bergetar ketika kamera berhasil membaca kode barcode kemasan.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={formData.scanVibrate}
                onChange={(e) => {
                  const updated = { ...formData, scanVibrate: e.target.checked };
                  setFormData(updated);
                  saveSettings(updated);
                  onSettingsSaved(updated);
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {/* Sound Beep setting */}
          <div className="flex items-center justify-between pt-4">
            <div className="pr-4">
              <div className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-emerald-600" />
                <span>Suara Bip saat Scan Barcode</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Bunyi nada bip kasir saat barcode terdeteksi di kamera atau scanner tembak.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={formData.soundBeep}
                onChange={(e) => {
                  const updated = { ...formData, soundBeep: e.target.checked };
                  setFormData(updated);
                  saveSettings(updated);
                  onSettingsSaved(updated);
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>
        </div>
      </div>

      {/* SECTION 4: GOOGLE SPREADSHEET VIA APPS SCRIPT */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="font-black text-sm sm:text-base">Database Google Spreadsheet (Apps Script)</h2>
              <p className="text-[11px] text-slate-400">
                Semua barang, barcode, stok, transaksi, dan hutang (kasbon) tersimpan aman di Sheet
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowScriptModal(true)}
            className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Lihat Kode Script</span>
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              URL Web App Google Apps Script
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={formData.spreadsheetUrl}
                onChange={(e) => setFormData({ ...formData, spreadsheetUrl: e.target.value })}
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-mono focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={handleTestSpreadsheet}
                disabled={ssLoading || !formData.spreadsheetUrl}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 active:scale-95 disabled:opacity-40 text-amber-400 font-bold text-xs rounded-xl transition-all shrink-0 flex items-center justify-center gap-1.5"
              >
                {ssLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                <span>Tes Sambungan</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Tempel URL deployment Google Apps Script (Web App) yang di-deploy dengan akses "Anyone".
            </p>
          </div>

          {/* Sync action buttons */}
          <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-emerald-950 uppercase">Sinkronisasi Data Toko Heni</div>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                {formData.lastSyncTime
                  ? `Terakhir disinkronkan: ${new Date(formData.lastSyncTime).toLocaleString('id-ID')}`
                  : 'Belum pernah disinkronkan'}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handlePushAllToSpreadsheet}
                disabled={ssLoading || !formData.spreadsheetUrl}
                className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-transform flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Simpan Semua ke Sheet</span>
              </button>

              <button
                type="button"
                onClick={handlePullFromSpreadsheet}
                disabled={ssLoading || !formData.spreadsheetUrl}
                className="flex-1 sm:flex-none px-4 py-2 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tarik dari Sheet</span>
              </button>
            </div>
          </div>

          {/* Feedback messages */}
          {ssResult && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                ssResult.success
                  ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
                  : 'bg-rose-50 border border-rose-300 text-rose-800'
              }`}
            >
              {ssResult.success ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{ssResult.message || ssResult.error}</span>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 5: CADANGAN LOKAL (BACKUP & RESTORE) */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-900 text-sm">Cadangan & Pemulihan Offline</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Simpan file cadangan (JSON) ke HP / laptop atau pulihkan data kapan saja tanpa internet.
          </p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleExportBackup}
            className="flex-1 sm:flex-none px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh Cadangan</span>
          </button>

          <label className="flex-1 sm:flex-none px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5" />
            <span>Muat Cadangan</span>
            <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
          </label>
        </div>
      </div>

      {/* FOOTER BRANDING AS REQUESTED */}
      <div className="text-center pt-4 text-xs text-slate-500 space-y-1">
        <p className="font-bold text-slate-700">Toko Qu - Aplikasi Kasir Eksklusif Toko Heni</p>
        <p className="font-medium text-amber-700">Developed by Hann</p>
        <p className="text-[10px] text-slate-400">Ringan • Hemat RAM • Cepat & Presisi</p>
      </div>

      {/* APPS SCRIPT CODE MODAL */}
      {showScriptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-white">Kode Google Apps Script Toko Heni</h3>
                <p className="text-xs text-slate-400">Salin kode ini dan tempel di editor Apps Script Google Sheet kamu</p>
              </div>
              <button
                onClick={() => setShowScriptModal(false)}
                className="text-slate-400 hover:text-white text-sm font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-900 space-y-1">
                <span className="font-bold">Panduan Kilat (1 Menit):</span>
                <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-amber-800">
                  <li>Buka spreadsheet Google baru (beri nama "Database Toko Heni").</li>
                  <li>Buka menu <b>Ekstensi &gt; Apps Script</b>.</li>
                  <li>Hapus semua teks bawaan, lalu klik tombol <b>Salin Semua Kode</b> di bawah dan tempelkan.</li>
                  <li>Klik tombol <b>Terapkan (Deploy) &gt; Deployment baru (New deployment)</b>.</li>
                  <li>Pilih jenis <b>Aplikasi Web (Web App)</b>, pada 'Who has access' pilih <b>Anyone (Siapa saja)</b>.</li>
                  <li>Salin URL Web App dan tempelkan di form pengaturan Toko Qu!</li>
                </ol>
              </div>

              <div className="relative">
                <pre className="p-4 bg-slate-900 text-slate-200 text-[11px] font-mono rounded-xl max-h-72 overflow-y-auto whitespace-pre-wrap select-all border border-slate-800">
                  {APPS_SCRIPT_TEMPLATE}
                </pre>

                <button
                  type="button"
                  onClick={handleCopyScript}
                  className="absolute top-3 right-3 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-lg text-xs flex items-center gap-1 shadow-md transition-all"
                >
                  {copiedScript ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedScript ? 'Tersalin!' : 'Salin Kode Script'}</span>
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowScriptModal(false)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs"
              >
                Tutup Panduan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
