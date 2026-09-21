import { 
  WhitelistEntry, 
  StaffContact, 
  KomponenItem, 
  ToolItem, 
  AmpliItem, 
  ComponentMediaGuide, 
  AnalisisUnitRecord,
  ServiceLogRecord,
  TesAmpliItem,
  TesSpeakerItem
} from '../types';

export const FULLTIME_USERS = [
  'VICKY',
  'AGAS MAULANA',
  'TOMMY WIJAYA'
];

export const INITIAL_WHITELIST: WhitelistEntry[] = [
  { id: 'wl-1', name: 'Vicky', accessType: 'fulltime', department: 'Audio Specialist', notes: 'Master Engineer - Akses Permanen' },
  { id: 'wl-2', name: 'Agas Maulana', accessType: 'fulltime', department: 'Class D Specialist', notes: 'Master Engineer - Akses Permanen' },
  { id: 'wl-3', name: 'Tommy Wijaya', accessType: 'fulltime', department: 'Head of Engineering', notes: 'Master Engineer - Akses Permanen' },
  { id: 'wl-4', name: 'Rian Hidayat', accessType: '6months', department: 'Teknisi Audio', notes: 'Terdaftar Spreadsheet - Batch 1' },
  { id: 'wl-5', name: 'Budi Santoso', accessType: '6months', department: 'Teknisi Perakitan', notes: 'Terdaftar Spreadsheet - Batch 1' },
  { id: 'wl-6', name: 'Hendra Kurniawan', accessType: '6months', department: 'Quality Control', notes: 'Terdaftar Spreadsheet - Batch 2' },
  { id: 'wl-7', name: 'Deni Pratama', accessType: '6months', department: 'Junior Tech', notes: 'Terdaftar Spreadsheet - Batch 2' },
  { id: 'wl-8', name: 'Doni Saputra', accessType: '6months', department: 'Teknisi Lapangan', notes: 'Terdaftar Spreadsheet - Batch 2' },
  { id: 'wl-9', name: 'Ahmad Fauzi', accessType: '6months', department: 'Maintenance', notes: 'Terdaftar Spreadsheet - Batch 3' },
  { id: 'wl-10', name: 'Rizky Ramadhan', accessType: '6months', department: 'Audio Tech', notes: 'Terdaftar Spreadsheet - Batch 3' },
  { id: 'wl-11', name: 'Eko Prasetyo', accessType: '6months', department: 'Lab Service', notes: 'Terdaftar Spreadsheet - Batch 3' },
];

export const STAFF_CONTACTS: StaffContact[] = [
  // Pembina
  {
    id: 'pem-1',
    name: 'Tommy Wijaya',
    role: 'Pembina',
    title: 'Master Audio Engineer & Pengawas Teknis Utama',
    phone: '+62 812-3456-7890',
    email: 'tommy.wijaya@service-audio.id',
    status: 'Online',
    specialty: 'Troubleshooting Sistem Daya Tinggi, Proteksi & Desain Topologi Power Amp'
  },
  {
    id: 'pem-2',
    name: 'Agas Maulana',
    role: 'Pembina',
    title: 'Spesialis Power Amp Kelas D & Switching Power Supply (SMPS)',
    phone: '+62 813-9876-5432',
    email: 'agas.maulana@service-audio.id',
    status: 'Bertugas',
    specialty: 'Modulasi PWM, Mosfet Driver IRS2092, Low-pass LC Filter, Core Ferrite'
  },
  {
    id: 'pem-3',
    name: 'Vicky',
    role: 'Pembina',
    title: 'Spesialis Karakteristik Komponen & Akustik Speaker',
    phone: '+62 821-4567-8910',
    email: 'vicky.audio@service-audio.id',
    status: 'Online',
    specialty: 'Kalibrasi DCO & Bias, Karakteristik Hfe Transistor, Rewinding Voice Coil'
  },
  // Admin
  {
    id: 'adm-1',
    name: 'Lestari Simatupang',
    role: 'Admin',
    title: 'Administrasi Pendaftaran & Manajemen Hak Akses Spreadsheet',
    phone: '+62 857-1122-3344',
    email: 'lestari.simatupang@service-audio.id',
    status: 'Online',
    specialty: 'Validasi Whitelist Spreadsheet, Akun Teknisi & Perpanjangan Akses 6 Bulan'
  },
  {
    id: 'adm-2',
    name: 'Mentari Redempta',
    role: 'Admin',
    title: 'Koordinator Helpdesk, Inventaris Tools & Logistik Komponen',
    phone: '+62 858-5566-7788',
    email: 'mentari.redempta@service-audio.id',
    status: 'Online',
    specialty: 'Stok Suku Cadang Asli, Pengadaan Alat Ukur & Penjadwalan Konsultasi'
  }
];

export const INITIAL_TOOLS: ToolItem[] = [
  {
    id: 'tool-1',
    name: 'Multimeter Digital True RMS (Sanwa / Fluke / Aneng)',
    category: 'Pengukuran',
    specs: 'Auto-ranging, Mode Dioda, Continuity Buzzer, Kapasitansi (µF), Frekuensi (Hz)',
    description: 'Instrumen utama untuk mengukur tegangan DC/AC, arus, hambatan resistor, drop tegangan sambungan PN dioda/transistor, dan memeriksa hubung singkat.',
    functionDesc: 'Mengukur DCO di terminal speaker, tegangan simetris PSU, tegangan bias basis transistor (0.35V - 0.45V), dan mendeteksi jalur putus pada PCB.',
    howToUse: [
      'Gunakan mode Dioda (simbol panah) untuk cek transistor dan dioda (terbaca ~0.5V - 0.7V arah maju).',
      'Gunakan range VDC skala mV untuk mengukur DCO (DC Offset). Nilai aman harus di bawah 20mV.',
      'Gunakan mode Continuity (Buzzer) untuk melacak kontinuitas jalur dan memastikan fuse atau kawat tidak putus.'
    ],
    safetyTips: [
      'Jangan pernah mengukur hambatan (Ohm) saat unit amplifier masih tersambung listrik!',
      'Pastikan elco filter utama sudah dibuang muatannya (discharge) sebelum mengukur komponen di PCB.'
    ]
  },
  {
    id: 'tool-2',
    name: 'Bohlam Seri Pengaman 100W (Current Limiter / Anti-Jeglek)',
    category: 'Keamanan',
    specs: 'Bohlam Pijar Filamen 100 Watt / 220V AC, Saklar Bypass, Stop Kontak Uji',
    description: 'Alat pengaman wajib saat pertama kali menyalakan amplifier yang baru diperbaiki untuk membatasi arus masuk dan mencegah transistor final langsung jebol.',
    functionDesc: 'Jika ada hubungan singkat (short) pada transistor final atau power supply, bohlam akan menyala sangat terang dan menyerap arus, mencegah trip MCB PLN dan ledakan komponen.',
    howToUse: [
      'Pasang steker kabel amplifier ke stop kontak rangkaian bohlam seri.',
      'Nyalakan saklar power amplifier. Amati bohlam: pada kondisi normal, bohlam akan menyala sejenak (karena elco mengisi muatan) lalu redup padam.',
      'Jika bohlam terus menyala terang benderang, segera matikan amplifier! Menandakan masih ada korsleting parah pada rangkaian.'
    ],
    safetyTips: [
      'Gunakan HANYA bohlam pijar filamen wolfram, JANGAN gunakan lampu LED atau lampu hemat energi (CFL) karena tidak memiliki sifat hambatan murni.',
      'Jangan mem-bypass bohlam sebelum DCO dan tegangan bias terkonfirmasi stabil.'
    ]
  },
  {
    id: 'tool-3',
    name: 'Stasiun Solder Suhu Teratur (Temperature Controlled Soldering Station)',
    category: 'Solder & Pasang',
    specs: '60W - 80W, Rentang Suhu 200°C - 480°C, Mata Solder Keramik Pisau & Runcing',
    description: 'Peralatan mematri dan melepas komponen elektronika dengan pengaturan suhu presisi agar jalur tembaga PCB tidak mengelupas akibat panas berlebih.',
    functionDesc: 'Menyolder transistor final ke heatsink, mengganti elco, resistor terbakar, soket, kabel output speaker, dan IC.',
    howToUse: [
      'Atur suhu pada 320°C - 350°C untuk timah standar 60/40.',
      'Untuk menyolder kaki transistor final pada tembaga tebal atau heatsink, naikkan ke 380°C sejenak.',
      'Selalu bersihkan mata solder menggunakan spons basah atau kawat pembersih kuningan.'
    ],
    safetyTips: [
      'Jangan biarkan solder menyentuh kaki transistor lebih dari 5 detik untuk menghindari kerusakan internal semikonduktor.',
      'Gunakan pasta flux untuk mempermudah perataan timah dan mencegah cold joint (solderan retak/kusam).'
    ]
  },
  {
    id: 'tool-4',
    name: 'Desoldering Pump (Atraktor / Penyedot Timah) & Solder Wick',
    category: 'Solder & Pasang',
    specs: 'Bodi aluminium antistatik dengan daya hisap vakum tinggi & pita tembaga tembus timah',
    description: 'Alat esensial untuk mengangkat timah cair saat mencabut komponen rusak dari papan sirkuit dua sisi (double layer PCB) tanpa merusak jalur tembaga.',
    functionDesc: 'Membersihkan lubang pad PCB agar komponen baru dapat masuk dengan pas dan rapi.',
    howToUse: [
      'Panaskan sambungan solder hingga timah mencair sempurna.',
      'Tempelkan ujung nozzle penyedot timah tepat di atas timah cair dan tekan tombol pelepas pegas vakum.',
      'Gunakan solder wick (serabut tembaga) untuk menyerap sisa-sisa timah pada pin IC berkaki rapat.'
    ],
    safetyTips: [
      'Rutin buang tumpukan timah kering di dalam tabung atraktor agar daya hisap tetap maksimal.'
    ]
  },
  {
    id: 'tool-5',
    name: 'Dummy Load 8Ω & 4Ω Daya Tinggi (Resistor Beban Tiruan 500W - 1000W)',
    category: 'Pengukuran',
    specs: 'Hambatan non-induktif 4 Ohm / 8 Ohm, Daya 500W - 1000W dengan heatsink pendingin',
    description: 'Beban pengganti speaker nyata untuk menguji daya output amplifier pada volume maksimal tanpa menimbulkan kebisingan memekakkan telinga atau risiko merusak speaker asli.',
    functionDesc: 'Memeriksa kestabilan penguat pada daya penuh, mengukur arus puncak, mendeteksi osilasi liar, dan memantau kenaikan suhu heatsink saat amplifier dibebani.',
    howToUse: [
      'Sambungkan dummy load ke terminal output speaker (+ dan -).',
      'Pasang osiloskop atau multitester paralel pada terminal dummy load.',
      'Putar volume secara bertahap sambil memantau bentuk gelombang output.'
    ],
    safetyTips: [
      'Dummy load akan menjadi SANGAT PANAS saat pengujian daya tinggi, jangan sentuh sirip resistor dengan tangan telanjang!',
      'Gunakan kipas pendingin tambahan jika melakukan stress-test lebih dari 10 menit.'
    ]
  },
  {
    id: 'tool-6',
    name: 'Audio Signal Generator (Function Generator)',
    category: 'Pengukuran',
    specs: 'Frekuensi 10Hz - 100kHz, Bentuk Gelombang Sinus murni, Segitiga, Kotak, Output 0-2V RMS',
    description: 'Pembangkit sinyal frekuensi suara buatan untuk diumpankan ke jack input amplifier saat pengujian performa respon frekuensi dan bentuk gelombang.',
    functionDesc: 'Mengetes kejernihan sinyal, mendeteksi cacat potong gelombang (clipping), crossover distortion, dan penguatan per kanal (gain).',
    howToUse: [
      'Pilih gelombang Sinus (Sine wave) dengan frekuensi acuan 1.000 Hz (1 kHz).',
      'Atur amplitudo input rendah (misal 100mV RMS - 500mV RMS).',
      'Amati apakah bentuk gelombang di output tetap mulus tanpa terpotong.'
    ],
    safetyTips: [
      'Jangan memberikan sinyal kotak (square wave) frekuensi tinggi terlalu lama pada amplifier karena dapat memicu osilasi panas berlebih pada Zobel network.'
    ]
  },
  {
    id: 'tool-7',
    name: 'Osiloskop Digital Dual Channel (Rigol / Hantek / FNIRSI)',
    category: 'Pengukuran',
    specs: 'Bandwidth minimal 20MHz - 100MHz, Real-time sampling 1GSa/s, Probe 1X/10X',
    description: 'Alat visualisasi bentuk gelombang listrik yang menampilkan sinyal audio secara riil dalam domain waktu dan tegangan.',
    functionDesc: 'Melihat clipping gelombang, crossover distortion, osilasi frekuensi tinggi tak terdengar yang bisa membakar transistor, dan ripple tegangan power supply.',
    howToUse: [
      'Pasang probe osiloskop skala 10X ke terminal beban dummy load.',
      'Jepit ground probe ke ground chasis amplifier.',
      'Nyalakan generator sinyal 1kHz dan amati puncak gelombang atas dan bawah untuk memastikan simetris.'
    ],
    safetyTips: [
      'Pastikan jepitan ground probe tidak terhubung ke jalur tegangan bertegangan tinggi untuk mencegah korsleting ground.'
    ]
  },
  {
    id: 'tool-8',
    name: 'DC Power Supply Simetris Variabel dengan Proteksi Arus (Current Limit)',
    category: 'Utama',
    specs: 'Output Simetris (+VCC, GND, -VCC) 0-60V DC, Arus 0-5A, OCP / OVP Protection',
    description: 'Sumber daya laboratorium pengganti trafo internal untuk menguji modul driver amplifier secara terisolasi tanpa risiko ledakan.',
    functionDesc: 'Menyalakan driver amplifier pada tegangan rendah terlebih dahulu (+/- 25V) untuk setting DCO dan bias awal sebelum dipasang ke tegangan tinggi trafo asli (+/- 65V s.d 90V).',
    howToUse: [
      'Batasi arus maksimal pada 0.5 Ampere.',
      'Hubungkan +VCC, GND, dan -VCC ke terminal PCB modul driver.',
      'Jika jarum arus melonjak ke batas maksimal, berarti ada kebocoran semikonduktor.'
    ],
    safetyTips: [
      'Periksa polaritas kabel (+, GND, -) dua kali sebelum menekan saklar output!'
    ]
  }
];

export const INITIAL_AMPLIS: AmpliItem[] = [
  {
    id: 'amp-1',
    name: 'Driver SOCL 504 / 506 (Super OCL 500 Watt)',
    classType: 'Amplifier Low Impedance',
    powerRange: '150W - 600W RMS per kanal',
    voltageSupply: '+/- 32V s.d +/- 65V DC Simetris (CT)',
    description: 'Salah satu topologi amplifier Kelas AB paling populer di Indonesia untuk keperluan sound system lapangan skala menengah dan rumahan. Dikenal tahan banting dan mudah dimodifikasi.',
    characteristics: [
      'SOCL 504 menggunakan trimpot 100k untuk penyetelan DCO secara manual.',
      'SOCL 506 menggunakan IC DC Servo (TL071 / NE5534) sehingga DCO otomatis 0.00V tanpa perlu disetel.',
      'Karakter suara flat dengan bass punch bertenaga dan vokal lantang.',
      'Menggunakan 4 hingga 8 set transistor final Sanken atau Toshiba.'
    ],
    commonFailures: [
      'Transistor diferensial input (2N5401 sepasang) nilai hfe tidak seimbang menyebabkan DCO melompat ke tegangan belasan volt.',
      'Dioda 1N4148 / transistor bias MJE340 jebol menyebabkan tegangan bias melonjak dan membakar transistor final.',
      'Resistor kapur 0.22Ω 5W putus atau hangus akibat beban berlebih (speaker impedansi di bawah 2 ohm).'
    ],
    schematicTips: 'Gunakan transistor diferensial original yang sudah di-match hfe-nya menggunakan ESR tester sebelum dipasang.',
    typicalTransistors: 'Final: 2SC5200/2SA1943 atau 2SC3858/2SA1494. Driver: A1837/C4793 atau TIP41C/TIP42C. VAS: MJE340.'
  },
  {
    id: 'amp-2',
    name: 'Power Amplifier Kelas D (IRS2092 Full-Bridge & Half-Bridge)',
    classType: 'Amplifier Low Impedance',
    powerRange: '500W - 3000W RMS (D900, D2K, D3K)',
    voltageSupply: '+/- 45V s.d +/- 90V DC Simetris (biasanya dipasangkan dengan SMPS)',
    description: 'Amplifier digital dengan efisiensi konversi daya sangat tinggi (>90%), menghasilkan panas yang minim dan bobot jauh lebih ringan dibanding trafo konvensional.',
    characteristics: [
      'Bekerja dengan prinsip modulasi lebar pulsa (PWM / Pulse Width Modulation) pada frekuensi switching 200kHz - 400kHz.',
      'Menggunakan sepasang atau ganda N-Channel MOSFET kecepatan tinggi (IRFB4227 / IRFP260N).',
      'Wajib memiliki low-pass filter (LPF) berupa lilitan toroid core sendust/micrometals dan kapasitor MKP 1µF di outputnya.',
      'Sangat cocok untuk mengangkat subwoofer bertenaga besar.'
    ],
    commonFailures: [
      'IC Driver IRS2092S mati atau pin deadtime error akibat lonjakan arus balik saat mosfet terbakar.',
      'Dioda ultrafast (MUR120 / ES1D) penyearah bootstrap korslet.',
      'Inti toroid LPF terbakar atau panas ekstrem jika frekuensi osilasi carrier melenceng dari batas aman.'
    ],
    schematicTips: 'Jangan pernah menyalakan amplifier Kelas D tanpa memasang heatsink pada Mosfet dan pastikan tegangan bias 12V untuk VCC IC stabil.',
    typicalTransistors: 'Driver: IRS2092S SMD, Mosfet Output: IRFB4227, IRFP250N, IRFB4115.'
  },
  {
    id: 'amp-3',
    name: 'Power Amplifier Kelas H (2-Step / 3-Step Rail Voltage)',
    classType: 'Amplifier Low Impedance',
    powerRange: '1200W - 4000W RMS (Standar Sound Balap & Panggung Besar)',
    voltageSupply: 'Multi-Rail: Low Volt (+/- 55V) dan High Volt (+/- 110V) DC Simetris',
    description: 'Topologi efisiensi tinggi berbasis Kelas AB yang dilengkapi sistem saklar tegangan bertingkat (Stepper / Mosfet Switched Rail). Saat musik pelan beroperasi di Low Rail, dan melompat ke High Rail saat hentakan drum/bass.',
    characteristics: [
      'Sangat efisien dan tidak membuang panas sebanyak Kelas AB murni.',
      'Menggunakan dioda ultrafast berdaya besar (Fast Recovery Diode 30A-60A) dan transistor stepper IRFP260 / IRFZ44.',
      'Populer pada seri Soundstandard CA18 / CA20, RCF, Carver, dan Crown Macro-Tech.'
    ],
    commonFailures: [
      'Mosfet stepper jebol menyebabkan amplifier stuck di tegangan tinggi (High Rail), memicu panas mendadak pada transistor final.',
      'Dioda komutasi stepper (MUR3060) short.',
      'IC pembanding level sinyal (LM393 / LM311) rusak sehingga langkah stepper tidak berpindah mulus.'
    ],
    schematicTips: 'Pastikan pengetesan dilakukan pada tegangan Low Rail terlebih dahulu sebelum menyuntikkan High Rail.',
    typicalTransistors: 'Final: 16 - 24 pasang Toshiba 2SC5200/2SA1943 atau OnSemi NJW0302/NJW0281 per kanal. Stepper: IRFP260N.'
  },
  {
    id: 'amp-4',
    name: 'Yamaha P-Series (P5000S / P7000S EEEngine)',
    classType: 'Amplifier Low Impedance',
    powerRange: '700W - 1400W RMS per kanal @ 4 Ohm',
    voltageSupply: 'Switching / High-Efficiency EEEngine Dual Track',
    description: 'Power amplifier profesional rancangan Yamaha dengan teknologi hemat energi EEEngine (Energy Efficient Engine) yang terkenal dengan kejernihan suara dan kehandalan proteksi sirkuitnya.',
    characteristics: [
      'Dilengkapi fitur pemrosesan speaker YS Processing (Yamaha Speaker Processing) untuk memaksimalkan respon frekuensi rendah.',
      'Sistem proteksi menyeluruh: Thermal, DC Output Protection, Turn-on Mute, Over-current Limiting.',
      'Menggunakan kipas pendingin cerdas bertingkat variabel sesuai suhu heatsink.'
    ],
    commonFailures: [
      'Transistor modul EEEngine short akibat korslet pada kabel speaker di panggung.',
      'Sirkuit proteksi DC speaker terus aktif (lampu Protect merah menyala) akibat kebocoran kapasitor kopling sinyal atau resistor bias molor.',
      'Konektor Speakon di panel belakang aus atau meleleh karena beban terlalu berat.'
    ],
    schematicTips: 'Saat servis modul EEEngine, gunakan lampu seri dan pastikan jalur Ground Audio terpisah dari Ground Chasis listrik.',
    typicalTransistors: 'Final: Sanken 2SA1492 / 2SC3856 atau Toshiba original Japan.'
  },
  {
    id: 'amp-5',
    name: 'Behringer Europower EP2500 / EP4000',
    classType: 'Amplifier Low Impedance',
    powerRange: '1400W @ 4 Ohm, 2000W @ 2 Ohm per kanal',
    voltageSupply: '+/- 55V (Low) & +/- 110V (High) Rail Transformer Toroid Raksasa',
    description: 'Workhorse amplifier dual channel Kelas H yang menggunakan replika arsitektur QSC RMX Series dengan trafo donat (toroidal) berdaya sangat masif dan kipas turbin pendingin belakang.',
    characteristics: [
      'Memiliki saklar filter Sub-sonic 30Hz / 50Hz di panel belakang untuk memproteksi speaker dari frekuensi infra-bass.',
      'Dilengkapi klip limiter otomatis independen per kanal.',
      'Konstruksi heatsink terowongan ganda (wind tunnel) dengan sensor termal NTC presisi.'
    ],
    commonFailures: [
      'Transistor final Toshiba terbakar karena debu menumpuk tebal di saluran terowongan pendingin heatsink.',
      'Trimpot kalibrasi bias aus atau retak solderannya menyebabkan crossover distortion (suara kresek pada desah kecil).',
      'Kabel pita konektor modul input ke modul amplifier berkarat atau kendor.'
    ],
    schematicTips: 'Selalu bersihkan terowongan pendingin dari debu menggunakan kuas dan kompresor udara sebelum perbaikan final.',
    typicalTransistors: 'Final: 2SC5200 / 2SA1943 (8 pasang per heatsink).'
  }
];

export const INITIAL_KOMPONEN: KomponenItem[] = [
  // PASIF
  {
    id: 'pasif-1',
    name: 'Resistor Kapur (Cement Wirewound Resistor)',
    category: 'pasif',
    subType: 'Resistor Daya Emitor',
    symbol: 'R (Nilai: 0.22Ω, 0.33Ω, 0.47Ω / 5W)',
    description: 'Resistor kawat berbalut semen tahan api yang dipasang pada kaki Emitor setiap transistor final untuk menyeimbangkan pembagian arus saat beberapa pasang transistor dipasang paralel.',
    functionDesc: 'Menjaga agar setiap transistor final memikul beban arus yang sama dan mencegah efek thermal runaway yang bisa mematikan salah satu transistor lebih cepat.',
    howToTest: 'Gunakan multitester digital mode Ohm range terendah (200Ω). Ukur di antara kedua kawat kakinya.',
    goodCondition: 'Terbaca nilai hambatan sesuai label fisik (antara 0.2Ω s.d 0.5Ω plus toleransi kabel probe).',
    badCondition: 'Layar multitester menunjukkan angka OL / Open Loop (kawat di dalam putus) atau hangus pecah terbelah.',
    safetyNote: 'Jika resistor ini terbakar, biasanya transistor final yang terhubung langsung dengannya juga sudah short.',
    pinoutOrColorCode: 'Tulisan fisik putih: misal "5W 0R22 J" (5 Watt, 0.22 Ohm, Toleransi 5%)',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 'pasif-2',
    name: 'Resistor Metal Film 1% (Precision Resistor)',
    category: 'pasif',
    subType: 'Resistor Sinyal & Pembagi Tegangan',
    symbol: 'R (100Ω, 1kΩ, 10kΩ, 47kΩ / 0.5W - 1W)',
    description: 'Resistor dengan lapisan film logam presisi tinggi (toleransi 1% gelang biru muda) untuk rangkaian umpan balik negatif (NFB), pengatur DCO, dan penentu penguatan (gain).',
    functionDesc: 'Menjaga kestabilan titik kerja bias transistor penguat diferensial dan meminimalkan derau desis (noise) pada jalur audio.',
    howToTest: 'Lepaskan minimal satu kaki resistor dari papan sirkuit sebelum diukur agar nilai tidak terpengaruh komponen lain.',
    goodCondition: 'Nilai yang terbaca pada ohmmeter sesuai dengan kode gelang warna dengan deviasi di bawah 1%.',
    badCondition: 'Nilai hambatan molor membesar berkali-kali lipat (misal 10k terbaca 180k) atau hangus hitam tidak berhambatan (putus).',
    safetyNote: 'Jangan mengganti resistor metal film 1% dengan resistor karbon biasa 5% pada bagian diferensial amplifier.',
    pinoutOrColorCode: '5 Gelang Warna: Coklat(1), Hitam(0), Hitam(0), Merah(x100), Coklat(1%) = 10kΩ 1%',
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 'pasif-3',
    name: 'Kapasitor Elektrolit (Elco Filter Power Supply)',
    category: 'pasif',
    subType: 'Kapasitor Terpolarisasi (Elco)',
    symbol: 'C+ / C- (10.000µF s.d 22.000µF / 80V - 100V)',
    description: 'Komponen penyimpan cadangan muatan listrik utama pada penyearah catu daya simetris untuk meratakan tegangan DC dan menyuplai hentakan bass tanpa drop.',
    functionDesc: 'Menghilangkan ripple frekuensi jala-jala 100Hz dari penyearah dioda bridge sehingga suara amplifier bersih dari suara dengung (humming).',
    howToTest: 'Gunakan mode Kapasitansi (F) pada multimeter atau ESR meter. Sebelum tes, buang sisa muatan elco dengan resistor 1k 5W.',
    goodCondition: 'Kapasitansi mendekati nilai tertera (toleransi 10-15%), ESR sangat rendah (< 0.05 Ohm), bodi silinder rata dan segel karet bawah utuh.',
    badCondition: 'Bagian atas kaleng aluminium menggelembung kembung (venting), ada bekas rembesan cairan elektrolit korosif di bawah kaki, atau nilai kapasitas turun drastis (kering).',
    safetyNote: 'BAHAYA TENGAN TINGGI! Elco ukuran besar mampu menyimpan sengatan listrik mematikan meski amplifier sudah dimatikan berhari-hari.',
    pinoutOrColorCode: 'Garis strip putih/abu-abu pada bodi menandakan kaki Negatif (-). Kaki lebih panjang adalah Positif (+).',
    image: 'https://images.unsplash.com/photo-1597733336794-12d05021d510?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 'pasif-4',
    name: 'Kapasitor Mylar / MKP / Box Film (Audio Coupling & Snubber)',
    category: 'pasif',
    subType: 'Kapasitor Non-Polar',
    symbol: 'C (100nF / 250V - 400V, 470pF, 100pF)',
    description: 'Kapasitor film dielektrik padat tanpa polaritas untuk meloloskan sinyal audio AC sambil memblokir tegangan searah DC, serta meredam osilasi liar frekuensi tinggi.',
    functionDesc: 'Bekerja bersama resistor 10Ω pada Zobel network di output speaker untuk menjaga stabilitas penguat saat menerima beban induktif/kapasitif kabel panjang.',
    howToTest: 'Gunakan multimeter skala Ohm tinggi (Mega-Ohm) atau mode kapasitansi.',
    goodCondition: 'Terbaca nilai nF/pF yang pas, pada skala resistansi harus menunjukkan nilai isolasi tak hingga (tidak tembus DC sama sekali).',
    badCondition: 'Short tembus (resistansi 0 Ohm), retak fisik terbakar akibat osilasi frekuensi tinggi.',
    safetyNote: 'Gunakan jenis MKP tegangan minimal 250V untuk bagian Zobel network output.',
    pinoutOrColorCode: 'Kode angka: "104" = 100.000 pF = 100 nF = 0.1 µF.',
    image: 'https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 'pasif-5',
    name: 'Potensiometer Logaritmik & Trimpot Multiturn Bias',
    category: 'pasif',
    subType: 'Resistor Variabel',
    symbol: 'VR (50k Log, 100k Lin, Trimpot 1k / 500Ω Multiturn 3296)',
    description: 'Komponen mekanis pengubah nilai hambatan untuk mengatur volume suara atau mengkalibrasi tegangan bias dan DCO pada rangkaian penguat.',
    functionDesc: 'Trimpot multiturn 3296 memungkinkan kalibrasi tegangan bias basis transistor secara sangat presisi hingga satuan milivolt.',
    howToTest: 'Ukur pin tengah (wiper) terhadap pin pinggir sambil memutar tangkai perlahan. Amati pergerakan nilai resistansi.',
    goodCondition: 'Nilai naik/turun secara halus dan mulus tanpa lonjakan mendadak atau nilai putus di tengah jalan.',
    badCondition: 'Jalur karbon di dalam tergores aus atau berdebu sehingga timbul suara kresek-kresek parah saat diputar, atau kaki lepas koneksi.',
    safetyNote: 'Jangan menyetel trimpot bias amplifier tanpa mengawasi amperemeter atau multimeter tegangan bias!',
    pinoutOrColorCode: 'Pin 1: Input, Pin 2: Wiper Output, Pin 3: Ground (Potensio Volume)',
    image: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 'pasif-6',
    name: 'Fuse / Sekring Kaca Pengaman Cepat Putus (Fast-Blow Fuse)',
    category: 'pasif',
    subType: 'Proteksi Arus Lebih',
    symbol: 'F (5A, 10A, 15A / 250V AC)',
    description: 'Kawat pengaman yang akan meleleh dan memutus sirkuit ketika arus yang melewatinya melebihi batas rancangannya.',
    functionDesc: 'Mencegah kebakaran trafo dan melindungi instalasi listrik rumah saat terjadi kerusakan parah di modul penguat.',
    howToTest: 'Gunakan mode continuity (buzzer) pada multitester.',
    goodCondition: 'Bunyi "BEEP" kontinyu, kawat filamen di dalam tabung kaca terlihat utuh bersih mengkilap.',
    badCondition: 'Tabung kaca gosong menghitam, kawat filamen putus menganga atau ada serpihan logam meleleh di dinding kaca.',
    safetyNote: 'JANGAN PERNAH melilitkan kawat tembaga kabel serabut ke sekring yang putus! Ini adalah penyebab utama terbakarnya power amplifier.',
    pinoutOrColorCode: 'Tulisan di tutup timah: "F10A 250V" (Fast blow 10 Ampere 250 Volt)',
    image: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=500&auto=format&fit=crop&q=60'
  },

  // AKTIF
  {
    id: 'aktif-1',
    name: 'Transistor Final Bipolar Toshiba (2SC5200 & 2SA1943)',
    category: 'aktif',
    subType: 'Transistor Daya Silikon (BJT NPN & PNP Pasangan Komplementer)',
    symbol: 'Q (Vceo: 230V, Ic: 15A, Pc: 150W)',
    description: 'Transistor penguat akhir paling legendaris dan paling banyak digunakan pada amplifier audio bertenaga sedang hingga tinggi karena linearitas dan karakternya yang hangat.',
    functionDesc: 'Memperkuat arus sinyal audio untuk disalurkan ke daun membran speaker impedansi rendah (4 - 8 Ohm).',
    howToTest: 'Gunakan Multimeter Digital mode Dioda. Tempelkan probe Merah ke Basis, Hitam ke Kolektor (terbaca ~0.55V) dan ke Emitor (~0.56V) untuk NPN 2SC5200. Balik probe untuk PNP 2SA1943.',
    goodCondition: 'Sambungan B-C dan B-E tembus maju ~0.5V - 0.6V. Sedangkan hubungan Kolektor ke Emitor (C-E) harus TERISOLASI TOTAL (OL pada kedua arah).',
    badCondition: 'Hubungan Kolektor ke Emitor (C-E) tembus short (0.000V bunyi buzzer) atau tembus sebagian (bocor/leakage terbaca nilai ohm puluhan ohm).',
    safetyNote: 'Selalu gunakan mika isolator dan pasta silikon heatsink (thermal paste) yang rata sebelum membaut ke pendingin.',
    pinoutOrColorCode: 'Urutan Kaki (Tampak depan tulisan): Kaki 1 = Basis (B), Kaki 2 = Kolektor (C), Kaki 3 = Emitor (E).',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 'aktif-2',
    name: 'Transistor Final Sanken High Power (2SC3858 & 2SA1494)',
    category: 'aktif',
    subType: 'Transistor Daya Bipolar Fisik Besar (MT-200)',
    symbol: 'Q (Vceo: 200V, Ic: 17A, Pc: 200W)',
    description: 'Transistor berbadan lebar (tipe kodok) dengan ketahanan daya dan arus puncak yang sangat tinggi, menjadi andalan sound balap lapangan.',
    functionDesc: 'Menyediakan pukulan frekuensi rendah (sub-bass) bertenaga tanpa mudah jebol saat dihajar dinamika suara drum mendadak.',
    howToTest: 'Sama seperti pengujian BJT Toshiba: uji sambungan semikonduktor PN antara basis terhadap kolektor dan emitor.',
    goodCondition: 'Drop tegangan dioda stabil di kisaran 0.52V - 0.58V. C-E tidak ada kebocoran sama sekali.',
    badCondition: 'Short total C-E, atau bodi retak meledak terkena arus berlebih.',
    safetyNote: 'Banyak beredar Sanken KW / tiruan berdaya rendah. Ciri yang asli: tulisan rapi tidak luntur digosok tinner dan bobot lebih berat.',
    pinoutOrColorCode: 'Pinout (Depan tulisan): 1 = Basis, 2 = Kolektor (badan tengah), 3 = Emitor.',
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 'aktif-3',
    name: 'Dioda Bridge Penyearah Utama (GBPC3510 / KBPC5010)',
    category: 'aktif',
    subType: 'Penyearah Gelombang Penuh (Full Wave Rectifier)',
    symbol: 'D-Bridge (1000V / 35A s.d 50A Logam Kotak)',
    description: 'Modul empat dioda yang dirangkai dalam jembatan tertutup dengan kemasan logam untuk mengubah tegangan AC sekunder trafo menjadi tegangan searah DC.',
    functionDesc: 'Menyuplai arus listrik searah berkekuatan puluhan ampere ke elco penampung catu daya simetris.',
    howToTest: 'Gunakan mode dioda multitester. Ukur antara pin AC (~) ke pin (+) dan pin AC (~) ke pin (-).',
    goodCondition: 'Setiap sambungan dioda internal menunjukkan nilai drop tegangan maju ~0.5V dan nilai tak hingga jika probe dibalik.',
    badCondition: 'Salah satu atau lebih dioda di dalamnya jebol short (tembus dua arah) menyebabkan sekring utama langsung meledak saat amplifier dicolokkan ke listrik.',
    safetyNote: 'Wajib dipasang menempel pada chasis pelat besi atau heatsink dengan baut kencang karena modul ini menghasilkan panas cukup tinggi saat dibebani.',
    pinoutOrColorCode: 'Terdapat 4 kaki: Dua kaki bertanda gelombang (~) adalah input AC dari trafo, kaki (+) adalah output positif, kaki (-) output negatif.',
    image: 'https://images.unsplash.com/photo-1597733336794-12d05021d510?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 'aktif-4',
    name: 'Power MOSFET Switching N-Channel (IRFB4227 / IRFP260N)',
    category: 'aktif',
    subType: 'Transistor Efek Medan Kanal-N Daya Tinggi',
    symbol: 'MOSFET (Vds: 200V, Id: 65A, Rds(on): 0.021Ω)',
    description: 'Komponen switching super cepat dengan hambatan on sangat rendah yang menjadi jantung penguat daya Kelas D dan power supply SMPS.',
    functionDesc: 'Mencacah tegangan catu daya dengan kecepatan tinggi sesuai pulsa modulasi audio PWM.',
    howToTest: 'Gunakan multimeter mode dioda: sentuhkan probe hitam ke Drain, merah ke Source (terbaca internal body diode ~0.5V). Sentuhkan sejenak probe merah ke Gate untuk mengisi muatan kapasitansi gate, lalu ukur Drain-Source (akan terbuka konduksi mendekati 0.0V).',
    goodCondition: 'Gate terisolasi sempurna dari Drain dan Source. Mampu membuka saklar saat gate diberi picuan muatan positif.',
    badCondition: 'Gate tembus bocor ke Drain atau Source (short total 0 Ohm). Jika gate jebol, IC driver PWM biasanya juga ikut rusak.',
    safetyNote: 'Sangat sensitif terhadap listrik statis (ESD). Sentuh benda logam sebelum memegang kaki komponen ini.',
    pinoutOrColorCode: 'Urutan Kaki (Depan): Pin 1 = Gate (G), Pin 2 = Drain (D), Pin 3 = Source (S).',
    image: 'https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 'aktif-5',
    name: 'IC Dual Op-Amp Low Noise (NE5532 / TL072 / OPA2134)',
    category: 'aktif',
    subType: 'Penguat Operasional Ganda 8-Pin DIP / SMD',
    symbol: 'IC (Vcc: +/- 15V Simetris)',
    description: 'Sirkuit terintegrasi serbaguna yang bertugas sebagai penguat sinyal masukan (preamp), rangkaian buffer pembalik/non-pembalik, dan rangkaian penstabil servo tegangan DC (DC Servo).',
    functionDesc: 'Menjaga DCO amplifier tetap nol milivolt secara otomatis dan memperkuat sinyal mikrofon/line tanpa menambahkan desis kotor.',
    howToTest: 'Ukur tegangan pada pin 8 (+15V) dan pin 4 (-15V) saat ditenagai. Ukur pin output (pin 1 dan pin 7) terhadap ground.',
    goodCondition: 'Pada kondisi diam tanpa sinyal, pin 1 dan pin 7 output harus terukur 0.00V DC.',
    badCondition: 'Pin output mengeluarkan tegangan DC belasan volt (+14V atau -14V), atau badan IC terasa sangat panas menyengat saat disentuh.',
    safetyNote: 'Pastikan regulator zener 15V tidak putus sebelum mengganti IC baru.',
    pinoutOrColorCode: 'Pinout: 1=Out A, 2=In- A, 3=In+ A, 4=VCC-, 5=In+ B, 6=In- B, 7=Out B, 8=VCC+.',
    image: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 'aktif-6',
    name: 'Relay Proteksi Speaker (12V / 24V DC Coil 30A)',
    category: 'aktif',
    subType: 'Saklar Elektromekanik Pengaman Beban',
    symbol: 'RLY (Kontak Rating 30A 250V AC)',
    description: 'Saklar otomatis yang dikendalikan oleh sirkuit sensor proteksi. Selalu terbuka saat awal dinyalakan (delay 3-5 detik) dan akan segera memutuskan speaker jika terdeteksi tegangan DC di jalur output.',
    functionDesc: 'Menyelamatkan spul speaker bernilai jutaan rupiah agar tidak terbakar hangus saat transistor final amplifier mengalami kerusakan korslet.',
    howToTest: 'Ukur resistansi kumparan coil (biasanya 200Ω - 800Ω). Beri tegangan 12V/24V pada coil dan dengarkan bunyi "KLIK" tajam.',
    goodCondition: 'Kumparan tidak putus, saat coil aktif kontak platina terhubung dengan resistansi di bawah 0.1 Ohm.',
    badCondition: 'Coil putus (tidak ada reaksi), atau platina kontak di dalam hangus berkerak hitam sehingga suara speaker sering hilang timbul sebelah.',
    safetyNote: 'Bersihkan platina dengan amplas halus jika kontak kotor berdebu.',
    pinoutOrColorCode: '2 Pin Kumparan Coil, 1 Pin Common, 1 Pin Normally Open (NO), 1 Pin Normally Closed (NC).',
    image: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=500&auto=format&fit=crop&q=60'
  }
];

export const COMPONENT_MEDIA_GUIDES: ComponentMediaGuide[] = [
  {
    id: 'media-1',
    title: 'Video Panduan: Uji Transistor Final BJT (Bagus vs Short Korslet)',
    mediaType: 'video',
    mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    caption: 'Panduan teknis langkah demi langkah menguji pasangan transistor Toshiba 2SC5200 & 2SA1943 menggunakan multimeter digital mode dioda (bisa dari Google Drive / upload MP4 langsung).',
    componentName: 'Transistor Bipolar (BJT Final)',
    goodSymptom: 'Drop tegangan basis-kolektor & basis-emitor stabil di 0.55V - 0.65V. Kolektor-Emitor sama sekali tidak bocor (OL).',
    badSymptom: 'Kolektor ke Emitor mengeluarkan bunyi beep kontinuitas (0.000V) atau terbaca nilai resistansi bocor puluhan ohm.',
    testMethod: 'Probe Merah di Basis, Probe Hitam di Kolektor lalu Emitor (NPN). Balik untuk transistor PNP.',
    normalValue: 'Vbe: ~0.60V | Vbc: ~0.59V | Vce: Open Loop (OL)',
    damagedValue: 'Vce: 0.000V (Korslet Total) atau < 50Ω (Bocor Halus)'
  },
  {
    id: 'media-2',
    title: 'Visual Diagram: Mengenali Fisik Elco Melembung, Kering, dan Bocor Elektrolit',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1597733336794-12d05021d510?w=1000&auto=format&fit=crop&q=80',
    caption: 'Inspeksi visual kaleng atas kapasitor elektrolit dan deteksi kebocoran cairan korosif di dasar pinboard.',
    componentName: 'Kapasitor Elektrolit (Elco)',
    goodSymptom: 'Tutup kaleng ventilasi atas rata sempurna, segel karet bawah rapat tanpa kerak putih/kuning.',
    badSymptom: 'Permukaan atas menggelembung mekar seperti kubah, timbul karat basah pada pin solderan PCB, suara ampli mendengung berat.',
    testMethod: 'Ukur kapasitas (µF) dan ESR (Equivalent Series Resistance). Normal jika ESR di bawah 0.1 Ohm.',
    normalValue: 'Kapasitansi ±10% dari nilai bodi, ESR < 0.08 Ω',
    damagedValue: 'Kapasitansi susut drastis (>30% drop) atau ESR melonjak > 2.0 Ω'
  },
  {
    id: 'media-3',
    title: 'Video Panduan: Uji & Kalibrasi Tegangan Bias dan DCO Amplifier Lapangan',
    mediaType: 'video',
    mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    caption: 'Pengaturan trimpot bias dan offset menggunakan multimeter presisi untuk mencegah panas liar dan dengung pada power rakitan / built-up.',
    componentName: 'Sirkuit Pengatur Bias & DCO',
    goodSymptom: 'DCO di terminal speaker mendekati 0.00mV (aman jika < 20mV). Tegangan bias basis ke emitor stabil di 0.35V - 0.45V.',
    badSymptom: 'DCO melonjak di atas 100mV (bisa membuat speaker bau gosong). Tegangan bias lebih dari 0.55V membuat heatsink panas mendidih tanpa musik.',
    testMethod: 'Ukur tegangan DC antara terminal Output Speaker (+) terhadap Ground chasis (tanpa ada musik/volume 0).',
    normalValue: 'DCO: 0mV - 15mV DC | Vbias: 0.38V - 0.42V DC',
    damagedValue: 'DCO: > 500mV (Bocor DC) | Vbias: > 0.6V (Overbias)'
  },
  {
    id: 'media-4',
    title: 'Visual Diagram: Membaca Kode Gelang Resistor Terbakar dan Resistor Emitor Putus',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1000&auto=format&fit=crop&q=80',
    caption: 'Identifikasi resistor basis dan emitor yang rusak akibat terhantam arus lonjakan transistor final jebol.',
    componentName: 'Resistor Kapur & Metal Film',
    goodSymptom: 'Warna gelang jelas, bodi tidak retak, nilai resistansi tepat sesuai kode rumus.',
    badSymptom: 'Badan resistor hitam mengarang, nilai hambatan naik tak terhingga atau kawat kancing semen terlepas.',
    testMethod: 'Ukur dengan ohmmeter setelah minimal salah satu kaki dilepas dari jalur solder.',
    normalValue: 'Resistor Emitor: 0.22Ω - 0.47Ω | Resistor Basis: 4.7Ω - 10Ω',
    damagedValue: 'Terbaca tak terhingga (OL / Open Circuit)'
  }
];

export const INITIAL_ANALISIS_DATABASE: AnalisisUnitRecord[] = [
  {
    id: 'ana-1',
    unitName: 'Yamaha P7000S',
    serialNumber: 'YMH-7000-8812',
    damagedComponent: 'Transistor final 2SC5200 short, fuse 15A putus',
    diagnosisResult: 'Short-Circuit pada Output Stage Channel B akibat beban speaker di bawah 2 Ohm yang memicu thermal runaway.',
    rootCause: 'Beban speaker overload saat pemakaian konser malam, heatsink berdebu tebal menghambat pendinginan kipas otomatis.',
    repairSteps: [
      'Ganti 4 pasang transistor final Toshiba 2SC5200 & 2SA1943 dengan lot nomor yang seragam.',
      'Ganti sekring utama F15A 250V tipe fast-blow.',
      'Periksa dan ganti resistor kapur 0.22Ω 5W yang ikut terbakar.',
      'Cek transistor driver C4793 / A1837 untuk memastikan tidak mengalami kebocoran sambungan PN.',
      'Nyalakan melalui Bohlam Seri 100W, setel kembali tegangan bias pada 0.38V DC.'
    ],
    recommendedParts: ['Toshiba 2SC5200 Original (4 pcs)', 'Toshiba 2SA1943 Original (4 pcs)', 'Resistor Kapur 0.22Ω 5W (8 pcs)', 'Fuse 15A Tabung Kaca (2 pcs)'],
    difficulty: 'Sedang',
    estimatedTime: '2 - 3 Jam'
  },
  {
    id: 'ana-2',
    unitName: 'Behringer EP4000',
    serialNumber: 'BHR-4000-0931',
    damagedComponent: 'DC offset tinggi 35V di terminal out, lampu protect merah aktif',
    diagnosisResult: 'Tegangan rel catu daya simetris positif bocor langsung ke jalur speaker akibat transistor diferensial masukan korslet.',
    rootCause: 'Salah satu transistor kembar 2N5401 di bagian input stage mengalami break down sambungan kolektor-basis.',
    repairSteps: [
      'Lepas transistor input sepasang Q1 & Q2 (2N5401).',
      'Pilih dua transistor 2N5401 pengganti baru dengan hfe yang seimbang persis (selisih hfe < 5%).',
      'Periksa dioda zener regulator 15V dan resistor feed 22k.',
      'Bersihkan relay protektor speaker Omron dari debu kerak platina.',
      'Uji DCO terminal speaker tanpa beban: harus turun menjadi di bawah 10mV sebelum relay meng-klik aktif.'
    ],
    recommendedParts: ['Transistor 2N5401 Hfe Matched Pair (2 pcs)', 'Dioda Zener 15V 1W (2 pcs)', 'Elco Bipolar 47µF 50V (2 pcs)'],
    difficulty: 'Sedang',
    estimatedTime: '1.5 Jam'
  },
  {
    id: 'ana-3',
    unitName: 'Crown XLi 1500',
    serialNumber: 'CRW-1500-4421',
    damagedComponent: 'Suara serak/distorsi pada volume rendah, trimpot bias aus',
    diagnosisResult: 'Crossover Distortion akibat tegangan bias drop mendekati 0 Volt karena wiper trimpot pengatur bias putus kontak.',
    rootCause: 'Oksidasi jalur resistif trimpot bias murah dan solderan retak di sekitar heatsink pengatur suhu Vbe multiplier.',
    repairSteps: [
      'Ganti trimpot bias standar dengan Trimpot Bourns Multiturn 3296 nilai 1k Ohm.',
      'Solder ulang seluruh kaki transistor sensor suhu bias yang menempel di heatsink utama.',
      'Hubungkan ke Audio Signal Generator sinus 1kHz dan amati bentuk gelombang di osiloskop.',
      'Putar trimpot perlahan hingga celah distorsi crossover pada titik tengah gelombang sinus hilang sempurna (tegangan bias basis terbaca ~0.42V).'
    ],
    recommendedParts: ['Trimpot Multiturn Bourns 3296W 1kΩ (2 pcs)', 'Thermal Paste Heatsink Keramik', 'Timah Asahi 60/40'],
    difficulty: 'Mudah',
    estimatedTime: '45 Menit'
  },
  {
    id: 'ana-4',
    unitName: 'Soundstandard CA20',
    serialNumber: 'STD-CA20-1092',
    damagedComponent: 'Elco PSU 10000uF 100V kembung bocor, dengung keras 50Hz',
    diagnosisResult: 'Ripple tegangan AC tinggi masuk ke power stage karena satu bank kapasitor filter utama kehilangan kapasitas simpan.',
    rootCause: 'Usia pakai kapasitor elco lebih dari 5 tahun di bawah beban tegangan tinggi kontinu serta panas transformator.',
    repairSteps: [
      'Kuras seluruh muatan bank elco menggunakan resistor beban 100Ω 10W.',
      'Lepas PCB modul power supply bank elco.',
      'Ganti elco kembung 10.000µF / 100V dengan kapasitor original Nichicon / Nippon Chemi-Con 105°C.',
      'Periksa dioda bridge 50A dengan multimeter mode dioda untuk memastikan tidak ada dioda penyearah yang setengah jebol.',
      'Ukur tegangan simetris: pastikan tegangan +VCC dan -VCC seimbang simetris dengan selisih di bawah 0.5V.'
    ],
    recommendedParts: ['Elco 10.000µF 100V 105°C High Ripple (4 pcs)', 'Dioda Bridge KBPC5010 50A (1 pcs)'],
    difficulty: 'Sedang',
    estimatedTime: '2 Jam'
  },
  {
    id: 'ana-5',
    unitName: 'SOCL 506 Custom Rakitan',
    serialNumber: 'SOCL-506-001',
    damagedComponent: 'IC DC Servo TL071 rusak, output mengeluarkan arus DC 24V',
    diagnosisResult: 'Kerusakan pada rangkaian umpan balik DC Servo aktif yang seharusnya menekan DCO ke 0.00V.',
    rootCause: 'Tegangan suplai zener 15V melonjak karena resistor penurun tegangan 4k7 2W terbakar atau melorot nilainya.',
    repairSteps: [
      'Ganti IC Op-Amp TL071 dengan tipe original Texas Instruments atau NE5534.',
      'Ganti sepasang resistor shunt 4k7 2W dengan daya 3W metal oxide agar tidak mudah kepanasan.',
      'Ganti kapasitor milar kopling servo 100nF dan elco bipolar 10µF 50V.',
      'Ukur kembali DCO pada terminal speaker: otomatis terkunci stabil pada 0.00V hingga maksimal 3mV.'
    ],
    recommendedParts: ['IC TL071 TI Original (1 pcs)', 'Resistor 4k7 3W Metal Oxide (2 pcs)', 'Dioda Zener 15V 1W (2 pcs)'],
    difficulty: 'Mudah',
    estimatedTime: '30 Menit'
  },
  {
    id: 'ana-6',
    unitName: 'Ampli OCL 150W',
    serialNumber: 'SN-2025-001',
    damagedComponent: 'Transistor Final 2SC5200 short',
    diagnosisResult: 'Ganti TR final pair dan cek DCO sebelum pasang beban',
    rootCause: 'Beban speaker berlebih menyebabkan transistor daya akhir korslet.',
    repairSteps: [
      'Ganti TR final pair 2SC5200 dan 2SA1943.',
      'Cek resistor kapur emitor 0.22 Ohm 5W.',
      'Ukur dan cek DCO (DC Offset) sebelum memasang beban speaker.'
    ],
    recommendedParts: ['Transistor Final 2SC5200 & 2SA1943 (1 pair)', 'Resistor Kapur 0.22Ω 5W'],
    difficulty: 'Mudah',
    estimatedTime: '30 Menit'
  },
  {
    id: 'ana-7',
    unitName: 'Power SOCL 504',
    serialNumber: 'SN-2025-002',
    damagedComponent: 'Dioda Zener 12V bocor',
    diagnosisResult: 'Ganti Zener dan kalibrasi bias TR driver',
    rootCause: 'Tegangan rel regulator bias tidak stabil akibat kebocoran dioda zener proteksi.',
    repairSteps: [
      'Ganti dioda zener 12V 1 Watt yang bocor.',
      'Cek transistor driver MJE340 / MJE350.',
      'Kalibrasi tegangan bias pada basis transistor driver ke 0.35V - 0.40V.'
    ],
    recommendedParts: ['Dioda Zener 12V 1W (2 pcs)', 'Transistor MJE340 / MJE350'],
    difficulty: 'Mudah',
    estimatedTime: '30 Menit'
  },
  {
    id: 'ana-8',
    unitName: 'ZA-2240',
    serialNumber: '12j11',
    damagedComponent: 'Dioda bridge',
    diagnosisResult: 'ganti doida bridge',
    rootCause: 'Dioda bridge penyearah catu daya utama mengalami kebocoran atau korsleting.',
    repairSteps: [
      'Lepaskan dioda bridge dari papan sirkuit pendingin.',
      'Ganti dengan dioda bridge baru dengan rating arus dan tegangan yang setara/lebih tinggi (ganti doida bridge).',
      'Ukur tegangan keluaran simetris DC sebelum menghubungkan modul penguat.'
    ],
    recommendedParts: ['Dioda Bridge KBPC2510 / 25A 1000V'],
    difficulty: 'Mudah',
    estimatedTime: '25 Menit'
  },
  {
    id: 'ana-9',
    unitName: 'ZA-2120',
    serialNumber: 'SN-GENERIC',
    damagedComponent: 'Fuse putus',
    diagnosisResult: 'Ganti Fuse',
    rootCause: 'Beban berlebih sesaat atau lonjakan arus awal menyebabkan sekring pengaman utama putus.',
    repairSteps: [
      'Buka penutup sekring (fuse holder) pada sirkuit ZA-2120.',
      'Periksa apakah ada korsleting pada dioda penyearah atau transistor.',
      'Ganti Fuse dengan ampere dan rating tegangan yang sesuai (Ganti Fuse).'
    ],
    recommendedParts: ['Fuse Kaca 2A / 250V (Slow blow)'],
    difficulty: 'Mudah',
    estimatedTime: '15 Menit'
  },
  {
    id: 'ana-10',
    unitName: 'ZA-2120',
    serialNumber: 'SN-GENERIC',
    damagedComponent: 'Fuse',
    diagnosisResult: 'Ganti Fuse',
    rootCause: 'Sekring daya putus akibat proteksi arus beban.',
    repairSteps: [
      'Ganti Fuse dengan sekring baru yang sesuai kapasitasnya.',
      'Uji nyala tanpa beban terlebih dahulu.'
    ],
    recommendedParts: ['Fuse 2A / 250V'],
    difficulty: 'Mudah',
    estimatedTime: '15 Menit'
  }
];

export const INITIAL_SERVICE_LOGS: ServiceLogRecord[] = [
  {
    id: 'srv-1',
    namaYangMengerjakan: 'Vicky',
    nomorService: 'SRV-2025-001',
    analisaKerusakan: 'Power CA20 mati total, TR final short 4 set dan bias pincang karena zener 15V jebol',
    komponenDiganti: 'Toshiba 2SC5200 & 2SA1943 (4 set), Zener 15V 1W (2 pcs), Resistor kapur 0.22Ω 5W (4 pcs)',
    createdAt: '2025-05-10 14:30'
  },
  {
    id: 'srv-2',
    namaYangMengerjakan: 'Agas Maulana',
    nomorService: 'SRV-2025-002',
    analisaKerusakan: 'Ampli Kelas D D2K SMPS suara serak di volume tinggi, LC filter panas berlebih',
    komponenDiganti: 'IC IR2110 driver (1 pcs), Mosfet IRFP4227 (2 pcs), Induktor toroid red-core 22uH (1 pcs)',
    createdAt: '2025-05-11 10:15'
  },
  {
    id: 'srv-3',
    namaYangMengerjakan: 'Tommy Wijaya',
    nomorService: 'SRV-2025-003',
    analisaKerusakan: 'Speaker aktif 15 inch protek terus menerus, DCO keluar tegangan DC 18V ke woofer',
    komponenDiganti: 'Transistor diff-amp 2N5401 (2 pcs matched pair), Trimpot DCO 1k cermet multi-turn (1 pcs)',
    createdAt: '2025-05-12 16:45'
  }
];

export const INITIAL_TEST_AMPLI_STEPS: TesAmpliItem[] = [
  {
    id: 'step-amp-1',
    num: 1,
    title: 'Uji Keamanan Awal via Bohlam Seri 100W (Current Limiter)',
    tag: 'Proteksi Wajib',
    action: 'Pasang steker amplifier ke stop kontak rangkaian bohlam seri 100W AC sebelum dicolokkan ke stop kontak dinding langsung.',
    target: 'Bohlam menyala terang sesaat (pengisian elco) lalu redup padam.',
    failure: 'Jika bohlam terus menyala terang benderang, berarti ada jalur short di transistor final atau power supply. SEGERA CABUT!',
    tips: 'Jangan pernah mem-bypass bohlam seri sebelum langkah DCO dan Bias dinyatakan aman.',
    mediaUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&auto=format&fit=crop&q=80',
    mediaType: 'image'
  },
  {
    id: 'step-amp-2',
    num: 2,
    title: 'Pengukuran Simetri Tegangan Catu Daya (+VCC, GND, -VCC)',
    tag: 'Power Supply DC',
    action: 'Gunakan multimeter digital skala DCV 200V. Probe hitam di Ground chasis (CT). Ukur probe merah ke rel (+) lalu ke rel (-).',
    target: 'Kedua rel harus seimbang (contoh: +65.2V dan -65.1V dengan selisih di bawah 0.5V).',
    failure: 'Jika salah satu rel drop (misal +65V tapi -20V), cek dioda bridge penyearah dan solderan kapasitor elco.',
    tips: 'Ketidakseimbangan tegangan rel PSU pasti memicu DCO tinggi di output speaker.',
    mediaUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
    mediaType: 'image'
  },
  {
    id: 'step-amp-3',
    num: 3,
    title: 'Pengukuran Tegangan DCO (DC Offset di Terminal Speaker)',
    tag: 'Kritis Untuk Speaker',
    action: 'Atur multimeter skala DCV terendah (mode 200mV atau auto mV). Ukur pada terminal output speaker (+) terhadap Ground tanpa musik.',
    target: 'Tegangan DCO harus di bawah 20mV (idealnya mendekati 0.00mV s.d 5mV).',
    failure: 'Jika DCO melonjak di atas 50mV apalagi sampai belasan volt, SPUL SPEAKER AKAN TERBAKAR dalam hitungan detik!',
    tips: 'Pada SOCL 504 putar trimpot DCO perlahan. Pada SOCL 506 periksa IC DC Servo TL071 dan transistor diferensial 2N5401.',
    mediaUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80',
    mediaType: 'image'
  },
  {
    id: 'step-amp-4',
    num: 4,
    title: 'Pengukuran & Kalibrasi Tegangan Bias Transistor Final',
    tag: 'Kalibrasi Suara',
    action: 'Multimeter skala VDC 2V / 2000mV. Ukur tegangan antara kaki Basis ke Emitor (Vbe) atau antara Basis transistor NPN ke Basis transistor PNP.',
    target: 'Tegangan Vbe basis final harus berada pada rentang 0.35V - 0.45V (atau tegangan basis NPN ke PNP sekitar 1.6V - 2.0V).',
    failure: 'Bias terlalu rendah (<0.3V) memicu Crossover Distortion (suara serak). Bias terlalu tinggi (>0.5V) membuat heatsink mendidih panas tanpa musik.',
    tips: 'Pastikan transistor sensor bias (Vbe multiplier MJE340 / BD139) menempel rapat pada heatsink utama dan dilumasi pasta termal.',
    mediaUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80',
    mediaType: 'image'
  },
  {
    id: 'step-amp-5',
    num: 5,
    title: 'Uji Osilasi Frekuensi Tinggi & Noise Mengambang',
    tag: 'Stabilitas Sirkuit',
    action: 'Hubungkan probe osiloskop pada terminal output tanpa beban, putar volume dari nol hingga maksimal tanpa sinyal input.',
    target: 'Garis layar osiloskop harus berupa garis lurus horizontal datar (flat line) tanpa gelombang riak / gerigi tinggi.',
    failure: 'Tampak gelombang osilasi sinus/gigi gergaji ratusan kHz yang membuat transistor final mendadak panas walau tanpa suara (self-oscillation).',
    tips: 'Pasang kapasitor keramik/mika 47pF - 100pF pada kaki C-B transistor driver atau pastikan rangkaian Boucherot (Zobel Network 10Ω + 100nF) terpasang baik.',
    mediaUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=600&auto=format&fit=crop&q=80',
    mediaType: 'image'
  },
  {
    id: 'step-amp-6',
    num: 6,
    title: 'Uji Beban Dummy Load 4 Ohm / 8 Ohm & Pengamatan Kliping',
    tag: 'Uji Kapasitas Daya',
    action: 'Pasang resistor daya 4Ω / 8Ω (500W-1000W di bak pendingin). Masukkan sinyal sinus 1kHz dari audio generator, naikkan volume perlahan.',
    target: 'Bentuk gelombang sinus di osiloskop mulus sempurna hingga batas puncak RMS sebelum melengkung/terpotong datar di pucuknya.',
    failure: 'Gelombang cacat terpotong asimetris (hanya rel atas atau rel bawah yang kliping), atau trafo berdengung keras dan sekring putus.',
    tips: 'Gunakan heatsink besar berventilasi kipas kencang saat uji dummy load karena energi suara diubah seluruhnya menjadi panas murni.',
    mediaUrl: '',
    mediaType: 'image'
  }
];

export const INITIAL_TEST_SPEAKER_STEPS: TesSpeakerItem[] = [
  {
    id: 'step-spk-1',
    num: 1,
    title: 'Inspeksi Fisik Membran, Rubber Surround, Spider, & Dust Cap',
    method: 'Pemeriksaan visual & sentuhan ringan',
    sop: 'Periksa daun speaker (cone) dari robekan atau lubang lapuk. Cek kelenturan karet pinggir (surround) dan spider (kain bergelombang kuning penopang spul di bawah).',
    normal: 'Daun speaker utuh kaku, spider merekat kuat pada keranjang sasis (frame), lem dust cap tidak retak.',
    defect: 'Daun robek bergetar, surround mengeras/getas, atau spider lepas dari lemnya yang membuat spul miring.',
    tip: 'Gunakan lem khusus speaker (gasket adhesive hitam) jika merekatkan kembali surround karet.',
    mediaUrl: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&auto=format&fit=crop&q=80',
    mediaType: 'image'
  },
  {
    id: 'step-spk-2',
    num: 2,
    title: 'Pengukuran Hambatan Kumparan Spul (DCR - DC Resistance)',
    method: 'Multimeter Digital skala Ohm (Range 200Ω)',
    sop: 'Tempelkan probe merah dan hitam ke terminal (+) dan (-) speaker. Pastikan tidak ada kabel eksternal atau crossover yang terpasang.',
    normal: 'Untuk speaker label 8 Ohm, multimeter akan terbaca sekitar 5.6Ω - 7.2Ω. Untuk speaker label 4 Ohm, multimeter akan terbaca sekitar 2.8Ω - 3.6Ω.',
    defect: 'Terbaca 0.0 Ohm (spul terbakar korslet / lilitan menempel) atau terbaca tak terhingga OL (kawat kumparan putus di dalam).',
    tip: 'Nilai DCR selalu sedikit lebih rendah dari impedansi nominal AC speaker karena impedansi AC menyertakan induktansi kumparan.',
    mediaUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
    mediaType: 'image'
  },
  {
    id: 'step-spk-3',
    num: 3,
    title: 'Uji Gerak Bebas & Polaritas Baterai 1.5V (Battery Pop Test)',
    method: 'Baterai AA / AAA 1.5 Volt DC (Jangan gunakan aki / baterai 9V)',
    sop: 'Sentuhkan kutub positif baterai ke terminal (+) speaker, dan kutub negatif baterai ke terminal (-) speaker secara sesaat (ketuk sekilas).',
    normal: 'Terdengar bunyi "POP" mantap dan daun speaker bergerak MAJU (keluar) secara simetris. Ini menandakan polaritas benar dan spul bebas bergerak.',
    defect: 'Tidak ada bunyi sama sekali (spul putus), atau gerakan daun speaker seret macet tidak mau maju.',
    tip: 'Jika daun bergerak mundur saat kutub positif baterai menyentuh terminal bertanda merah, berarti polaritas pabrikan terbalik.',
    mediaUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80',
    mediaType: 'image'
  },
  {
    id: 'step-spk-4',
    num: 4,
    title: 'Uji Gesekan Spul Manual (Voice Coil Scratch / Rubbing Test)',
    method: 'Penekanan manual daun speaker dengan 4 jari',
    sop: 'Letakkan 4 jari secara melingkar seimbang di sekeliling dust cap (jangan menekan di satu titik pinggir). Tekan daun speaker perlahan ke dalam lalu lepaskan.',
    normal: 'Pergerakan daun terasa sangat halus, empuk, dan kembali ke posisi semula tanpa sedikit pun ada gesekan bunyi gesrotan kawat.',
    defect: 'Terdengar bunyi serak bergesekan kasar "Srrrk-srrrk" antara gulungan kawat spul dengan dinding lubang magnet (terjadi akibat panas over atau magnet geser).',
    tip: 'Jika spul bergesek, speaker wajib dibongkar dan digulung ulang (reconing) karena kawat sudah mengelupas isolator enamelnya.',
    mediaUrl: '',
    mediaType: 'image'
  },
  {
    id: 'step-spk-5',
    num: 5,
    title: 'Uji Sinyal Audio Generator Sweep Frekuensi (20Hz - 200Hz)',
    method: 'Signal generator sinus disambung ke power amplifier kecil (10-20 Watt)',
    sop: 'Kirimkan sinyal frekuensi rendah bertahap dari 20Hz naik ke 100Hz pada level volume sedang di ruang tenang.',
    normal: 'Terdengar nada dengung bass yang bersih, bulat merata tanpa ada bunyi bergetar getar seng (buzzing) atau rattle mekanis.',
    defect: 'Terdengar dengung sengau (chuffing/buzzing) yang menandakan lem sambungan cone dengan spul atau spider sudah retak/longgar.',
    tip: 'Jangan menyuntikkan daya melebihi kapasitas tanpa memasang speaker di dalam box box kabinet.',
    mediaUrl: '',
    mediaType: 'image'
  },
  {
    id: 'step-spk-6',
    num: 6,
    title: 'Pemeriksaan Fleksibilitas Kabel Kawat Kepang (Lead Wire Tinsel)',
    method: 'Pemeriksaan fleksibilitas kabel kumis speaker',
    sop: 'Periksa kedua kawat perak fleksibel yang menghubungkan terminal soket ke spul pada daun speaker.',
    normal: 'Kawat lentur bebas bergerak, tidak menyentuh keranjang logam dan tidak tertarik tegang saat daun speaker terdorong maksimal.',
    defect: 'Kawat putus lelah di dekat pangkal daun, menghitam hangus karena arus lebih, atau menempel pada sasis keranjang.',
    tip: 'Ganti dengan kawat perak tinsel murni bertulang benang katun tahan tekuk, jangan menggunakan kabel serabut tembaga biasa yang kaku.',
    mediaUrl: '',
    mediaType: 'image'
  }
];


