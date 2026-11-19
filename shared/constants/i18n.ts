/**
 * Centralized Type-Safe i18n Dictionary for Kotakin UI Elements
 * Single Source of Truth (SSoT) for all language variants (EN, ID, etc.)
 */
export const i18n = {
  common: {
    goBack: ['Go back', 'Kembali'],
    cancel: ['Cancel', 'Batal', 'CANCEL'],
    delete: ['Delete', 'Hapus', 'DELETE'],
    save: ['Save', 'Simpan'],
    saveChanges: ['Save Changes', 'Simpan Perubahan'],
    ok: ['OK'],
    skip: ['Skip', 'Lewati'],
    gotIt: ['Got it!', 'Mengerti!']
  },
  dashboard: {
    header: ['My Stash', 'Simpananku', 'Kotak Saya'],
    btnNewBox: ['New box', 'Kotak baru'],
    btnScan: ['Scan', 'Pindai'],
    searchPlaceholder: ['Search boxes or items...', 'Cari kotak atau barang...'],
    clearSearch: ['Clear search', 'Hapus pencarian'],
    noResults: ['No results', 'Tidak ada hasil'],
    noItemsMatch: ['No items match your search.', 'Tidak ada barang yang cocok dengan pencarian Anda.']
  },
  box: {
    formTitleNew: ['New Box', 'Create box', 'Buat Kotak Baru', 'Buat kotak'],
    formTitleEdit: ['Edit Box', 'Edit box', 'Ubah Kotak', 'Ubah kotak'],
    inputName: ['Box name', 'Nama kotak'],
    inputDescription: ['Description', 'Deskripsi'],
    inputLocation: ['Location', 'Lokasi'],
    btnCreateBox: ['Create box', 'Create Box', 'Buat kotak'],
    btnAddNewItem: ['Add new item', 'Tambah barang baru'],
    btnShowQRCode: ['Show QR code', 'Tampilkan kode QR'],
    btnExpandActions: ['Expand actions', 'Buka menu aksi'],
    btnCollapseActions: ['Collapse actions', 'Tutup menu aksi'],
    btnAddToFavorites: ['Add to favorites', 'Tambah ke favorit'],
    btnRemoveFromFavorites: ['Remove from favorites', 'Hapus dari favorit'],
    btnEditBox: ['Edit box', 'Ubah kotak'],
    btnDeleteBox: ['Delete box', 'Hapus kotak'],
    dialogDeleteTitle: ['Delete Box?', 'Hapus Kotak?'],
    nameRequiredAlert: ['Name required', 'Please enter a name', 'Nama wajib diisi']
  },
  settings: {
    header: ['Settings', 'Pengaturan'],
    btnSettings: ['Settings', 'Pengaturan'],
    radioEnglish: ['Switch to English', 'English'],
    radioIndonesian: ['Switch to Indonesia', 'Switch to Indonesian', 'Bahasa Indonesia'],
    btnAbout: ['About Kotakin', 'Tentang Kotakin'],
    btnCreateBackup: ['Create zip backup', 'Create backup', 'Buat cadangan zip'],
    btnRestoreBackup: ['Restore from zip backup', 'Restore from backup', 'Pulihkan dari cadangan zip'],
    versionText: ['Version', 'versi', 'Versi']
  },
  item: {
    headerAddDetails: ['Add Item Details', 'Tambah Detail Barang'],
    inputTitle: ['Item title', 'Judul barang'],
    inputDescription: ['Description', 'Deskripsi'],
    btnSaveItem: ['Save Item', 'Simpan Barang']
  },
  scanner: {
    btnGrantPermission: ['Grant camera permission', 'Berikan izin kamera']
  }
} as const;

export type I18nDictionary = typeof i18n;
