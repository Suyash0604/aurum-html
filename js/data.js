// Initial data. It is copied into localStorage the first time the site is
// opened; after that the stored data is used, so admin changes are kept.

const daysFromToday = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

const SEED_WATCHES = [
  {
    id: 'meridian-39',
    name: 'Meridian 39',
    collection: 'Glacier',
    price: 745000,
    stock: 2,
    featured: true,
    image: 'images/meridian-39.jpg',
    tagline: 'Automatic chronograph in titanium',
    description:
      'The Meridian 39 is our everyday sports watch. Its brushed titanium case is light and strong, the sapphire crystal has an anti-reflective coating on both sides, and the automatic movement is adjusted in six positions. It is water-resistant to 200 metres and finished by hand in our workshop.',
    movement: 'Calibre A-07, automatic',
    caseMaterial: 'Grade 5 titanium',
    diameter: '39 mm',
    powerReserve: '72 hours',
    waterResistance: '200 metres',
    strap: 'Titanium bracelet',
  },
  {
    id: 'nocturne-skeleton',
    name: 'Nocturne Skeleton',
    collection: 'Glacier',
    price: 995000,
    stock: 0,
    featured: true,
    image: 'images/nocturne-skeleton.jpg',
    tagline: 'Open-worked movement in steel',
    description:
      'In the Nocturne Skeleton, every bridge of the movement is cut away and bevelled by hand so that the mechanism can be seen from both sides. The barrel, the escapement and the balance wheel are all visible through the sapphire dial and the open case back.',
    movement: 'Calibre A-SK, skeleton',
    caseMaterial: 'Brushed stainless steel',
    diameter: '40 mm',
    powerReserve: '65 hours',
    waterResistance: '50 metres',
    strap: 'Black leather',
  },
  {
    id: 'solstice-rose',
    name: 'Solstice Rose',
    collection: 'Atelier',
    price: 1310000,
    stock: 0,
    featured: true,
    image: 'images/solstice-rose.jpg',
    tagline: 'Dress watch in 18-carat rose gold',
    description:
      'The Solstice Rose is a classic dress watch. The 18-carat rose gold case is only 8.1 mm thick, so it sits easily under a shirt cuff, and the silver dial changes tone with the light in the room. Each case is polished from start to finish by one craftsman.',
    movement: 'Calibre A-11, automatic',
    caseMaterial: '18-carat rose gold',
    diameter: '38 mm',
    powerReserve: '60 hours',
    waterResistance: '30 metres',
    strap: 'Hand-stitched leather',
  },
  {
    id: 'obsidian-classic',
    name: 'Obsidian Classic',
    collection: 'Heritage',
    price: 560000,
    stock: 3,
    featured: false,
    image: 'images/obsidian-classic.jpg',
    tagline: 'Hand-wound watch with a black dial',
    description:
      'The Obsidian Classic is a simple three-hand watch with a deep black dial and polished steel case. It is wound by hand each morning and runs for more than two days. The slim case and leather strap make it suitable for both office and evening wear.',
    movement: 'Calibre A-03, hand-wound',
    caseMaterial: 'Polished stainless steel',
    diameter: '40 mm',
    powerReserve: '55 hours',
    waterResistance: '50 metres',
    strap: 'Black calf leather',
  },
  {
    id: 'stratos-chronograph',
    name: 'Stratos Chronograph',
    collection: 'Glacier',
    price: 825000,
    stock: 1,
    featured: false,
    image: 'images/stratos-chronograph.jpg',
    tagline: 'Sports chronograph with tachymeter',
    description:
      'The Stratos Chronograph is built for active use. It has a column-wheel chronograph movement, a ceramic bezel with a tachymeter scale and luminous hands that can be read in the dark. The screw-down crown and case back keep it water-resistant to 100 metres.',
    movement: 'Calibre A-21, automatic chronograph',
    caseMaterial: 'Stainless steel with ceramic bezel',
    diameter: '42 mm',
    powerReserve: '60 hours',
    waterResistance: '100 metres',
    strap: 'Black leather',
  },
  {
    id: 'lumen-36',
    name: 'Lumen 36',
    collection: 'Heritage',
    price: 420000,
    stock: 4,
    featured: false,
    image: 'images/lumen-36.jpg',
    tagline: 'Slim everyday watch with a white dial',
    description:
      'The Lumen 36 is our smallest and lightest watch. The clean white dial has thin hour markers and no date window, so the time is easy to read at a glance. A slim automatic movement keeps the case under 9 mm thick.',
    movement: 'Calibre A-05, automatic',
    caseMaterial: 'Stainless steel with rose gold plating',
    diameter: '36 mm',
    powerReserve: '48 hours',
    waterResistance: '30 metres',
    strap: 'Brown suede leather',
  },
];

// Demo accounts. This is a frontend-only project, so passwords are kept in the
// browser as plain text. Do not use a real password.
const SEED_USERS = [
  {
    id: 'admin-1',
    role: 'admin',
    name: 'Boutique Manager',
    email: 'admin@aurum.in',
    password: 'Aurum@Admin1',
    phone: '9820012345',
    city: 'Pune',
    createdAt: '2026-01-05',
  },
  {
    id: 'cust-1',
    role: 'customer',
    name: 'Arjun Mehta',
    email: 'arjun@example.com',
    password: 'Arjun@2026',
    phone: '9876501234',
    city: 'Mumbai',
    createdAt: '2026-06-18',
  },
];

const SEED_RESERVATIONS = [
  {
    id: 'AUR-10482',
    userId: 'cust-1',
    customerName: 'Arjun Mehta',
    customerEmail: 'arjun@example.com',
    customerPhone: '9876501234',
    watchId: 'meridian-39',
    watchName: 'Meridian 39',
    price: 745000,
    date: daysFromToday(4),
    time: '3:00 pm',
    note: 'I would like to try the titanium bracelet.',
    status: 'Pending',
    createdAt: daysFromToday(-1),
  },
  {
    id: 'AUR-10317',
    userId: 'cust-1',
    customerName: 'Arjun Mehta',
    customerEmail: 'arjun@example.com',
    customerPhone: '9876501234',
    watchId: 'obsidian-classic',
    watchName: 'Obsidian Classic',
    price: 560000,
    date: daysFromToday(-12),
    time: '11:00 am',
    note: '',
    status: 'Completed',
    createdAt: daysFromToday(-16),
  },
];

const COLLECTIONS = ['Glacier', 'Atelier', 'Heritage'];
const TIME_SLOTS = ['11:00 am', '1:00 pm', '3:00 pm', '5:00 pm'];
const RESERVATION_STATUSES = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];
