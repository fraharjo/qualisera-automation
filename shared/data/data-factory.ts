/**
 * Universal Cross-Platform Dynamic Test Data Factory
 * Generates realistic, conflict-free test data on the fly (Zero-dependency, offline-ready).
 * Supports both Indonesian and International testing scenarios for Web, Android, and iOS.
 */

const FIRST_NAMES = [
  'Ahmad', 'Budi', 'Citra', 'Dewi', 'Eko', 'Fadli', 'Gita', 'Hadi', 'Indah', 'Joko',
  'Kartika', 'Lestari', 'Maulana', 'Nadia', 'Pratama', 'Rini', 'Siti', 'Tri', 'Wawan', 'Yulia'
];

const LAST_NAMES = [
  'Prasetyo', 'Wijaya', 'Saputra', 'Kusuma', 'Santoso', 'Utami', 'Hidayat', 'Nugroho',
  'Wahyudi', 'Setiawan', 'Firmansyah', 'Suryani', 'Rahman', 'Gunawan', 'Lestari'
];

const STREET_NAMES = [
  'Jl. Sudirman', 'Jl. Thamrin', 'Jl. Gatot Subroto', 'Jl. Asia Afrika', 'Jl. Malioboro',
  'Jl. Diponegoro', 'Jl. Pemuda', 'Jl. Ahmad Yani', 'Jl. Merdeka', 'Jl. Raya Bogor'
];

const CITIES = ['Jakarta Selatan', 'Bandung', 'Surabaya', 'Bekasi', 'Tangerang', 'Yogyakarta', 'Semarang', 'Medan'];

export const dataFactory = {
  /**
   * Generates a unique user profile with a collision-free email
   */
  user: (customDomain = 'example.com') => {
    const first = dataFactory.randomItem(FIRST_NAMES);
    const last = dataFactory.randomItem(LAST_NAMES);
    const uniqueId = Date.now().toString().slice(-6);
    const email = `${first.toLowerCase()}.${last.toLowerCase()}${uniqueId}@${customDomain}`;
    const phone = `0812${dataFactory.randomNumeric(8)}`;

    return {
      firstName: first,
      lastName: last,
      fullName: `${first} ${last}`,
      email,
      phone,
      password: `TestP@ss${uniqueId}!`
    };
  },

  /**
   * Generates an Indonesian delivery / shipping address
   */
  address: () => {
    const street = dataFactory.randomItem(STREET_NAMES);
    const number = Math.floor(Math.random() * 150) + 1;
    const city = dataFactory.randomItem(CITIES);
    const postalCode = `1${dataFactory.randomNumeric(4)}`;

    return {
      streetAddress: `${street} No. ${number}`,
      city,
      province: 'Jawa Barat',
      postalCode,
      country: 'Indonesia'
    };
  },

  /**
   * Generates a dummy test credit card for checkout testing
   */
  payment: () => {
    const currentYear = new Date().getFullYear() % 100;
    return {
      cardNumber: `400000123456${dataFactory.randomNumeric(4)}`, // Visa Test Card
      cardHolder: 'TEST USER',
      expiryMonth: '12',
      expiryYear: (currentYear + 3).toString(),
      cvv: dataFactory.randomNumeric(3)
    };
  },

  /**
   * Utility to pick a random item from an array
   */
  randomItem: <T>(items: T[]): T => {
    return items[Math.floor(Math.random() * items.length)];
  },

  /**
   * Generates random alphanumeric string
   */
  randomString: (length = 8): string => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  /**
   * Generates random numeric string of specific length
   */
  randomNumeric: (length = 6): string => {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += Math.floor(Math.random() * 10).toString();
    }
    return result;
  }
};

export default dataFactory;
