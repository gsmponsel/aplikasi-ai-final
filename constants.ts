
import { SceneStructure } from './types';

// Helper to generate common instructions
const getCommonRules = (ctaPerScene: boolean, isSales: boolean, productName: string) => `
      PERAN ANDA: CONSISTENCY DIRECTOR & SENIOR COPYWRITER (SALES SPECIALIST).
      
      ATURAN VISUAL WAJIB (STRICT VISUAL RULES - CRITICAL):
      1. STRICT IDENTITY ENFORCEMENT: The character in the generated image MUST look exactly like the person in the provided [Model Image].
      2. PRODUCT ISOLATION: 
         - Focus ONLY on the object/product "${productName}" from the [Product Image].
         - IGNORE ANY HUMAN, BODY PARTS, OR CLOTHES in the original [Product Image]. Take the item only.
      3. COMPOSITION: Combine the face/body from [Model Image] with the object from [Product Image].
      4. FRAMING: "A vertical 9:16 portrait photo". Subject centered in frame with headroom for vertical cropping.
      5. PHOTOREALISM: "A photorealistic shot of [Model]..." is mandatory start.
      
      ATURAN NASKAH (VOICE OVER) - ${isSales ? 'HARD SELL MODE' : 'STORY MODE'}:
      - BAHASA: Indonesia Natural, Enerjik, & Persuasif.
      - STRUKTUR (${isSales ? 'WAJIB ADA DI SETIAP SCENE' : 'Kondisional'}):
        1. MENTION: Sebut nama produk "${productName}" ATAU Benefit utamanya di SETIAP SCENE.
        2. HOOK: Gunakan kata seru singkat di awal (Cth: "Gila!", "Sumpah,", "Liat deh,").
        3. NO FILLER: Jangan ada kalimat basa-basi. Langsung ke poin penjualan.
      - PANJANG: ${isSales ? 'MAKSIMAL 15 KATA (Cepat, Padat, Nendang).' : 'MAKSIMAL 30 KATA (Bercerita).'}
      ${ctaPerScene ? '- CTA: SETIAP SCENE harus mengandung ajakan bertindak (Cek Keranjang, Klik Sini).' : '- CTA: Hanya di SCENE TERAKHIR.'}

      ATURAN CAPTION & HASHTAG (WAJIB):
      - KONTEN: Caption HARUS menyebutkan nama produk "${productName}" secara eksplisit.
      - ELABORASI: Jelaskan 1 keunggulan/manfaat utama produk dalam kalimat yang menarik.
      - FORMAT: ${ctaPerScene ? 'Maksimal 2 kalimat pendek per scene + 3-5 hashtag relevan.' : 'Hanya di SCENE TERAKHIR. Kosongkan untuk scene lain.'}
`;

const getOutputFormat = (sceneCount: number, productName: string) => `
      Kembalikan JSON valid dengan kunci "scenes" berisi array ${sceneCount} objek.
      Setiap objek HARUS memiliki:
      1. "title": Judul adegan.
      2. "description": Penjelasan alur.
      3. "script": Voice-over. WAJIB mengandung "${productName}"/Benefit + Hook. Max 15 kata (Sales) / 30 kata (Story).
      4. "image_prompt": Prompt visual bahasa Inggris. 
         - START WITH: "A photorealistic vertical 9:16 portrait shot of..."
         - INCLUDE: "[Model Description] holding/using [${productName} Object]". 
         - MANDATORY: "Ignore human in product image, use input model face. Seamless integration."
      5. "video_prompt": Instruksi animasi dalam BAHASA INDONESIA (misal: "Model menunjuk ke keranjang kuning", "Zoom in ke tekstur").
      6. "overlay_text": Teks layar (Bahasa Indonesia) yang singkat & nendang.
      7. "caption": Caption sosmed yang membahas "${productName}" + Hashtag.
`;

export const SCENE_STRUCTURES: SceneStructure[] = [
  // --- SALES ORIENTED CATEGORIES ---
  {
    id: 'problem-solution',
    name: 'Problem / Solution (General Sales)',
    description: 'Classic marketing funnel: Hook -> Problem -> Solution -> CTA.',
    requiredParts: ['product', 'model'],
    planningPrompt: (productName, additionalBrief, sceneCount, ctaPerScene) => `
      Buat storyboard iklan vertical "${productName}".
      ${getCommonRules(ctaPerScene, true, productName)}
      
      Struktur: 
      - Scene Awal: Masalah yang bikin frustrasi (Hook: "Duh, capek banget...").
      - Scene Tengah: Produk "${productName}" muncul sebagai solusi instan (Benefit).
      - Scene Akhir: Hasil nyata & Kebahagiaan menggunakan "${productName}" (CTA).
      ${additionalBrief ? `Instruksi: ${additionalBrief}` : ''}
      ${getOutputFormat(sceneCount, productName)}
    `
  },
  {
    id: 'shoes-footwear',
    name: 'Shoes / Footwear (Sales)',
    description: 'Dynamic shots, walking, focus on design and comfort.',
    requiredParts: ['product', 'model'],
    planningPrompt: (productName, additionalBrief, sceneCount, ctaPerScene) => `
      Buat storyboard iklan SEPATU/ALAS KAKI untuk "${productName}".
      ${getCommonRules(ctaPerScene, true, productName)}
      
      Struktur:
      - Scene 1: Low angle shot, kaki melangkah/berjalan (Hook: "Sepatu ternyaman!").
      - Scene 2: Close up detail bahan/desain sepatu "${productName}" (Benefit: "Empuk banget").
      - Scene 3: Full body shot, styling dengan outfit (Benefit: "Auto kece").
      - Scene 4: Model memegang sepatu / menunjuk kaki (CTA: "Cek keranjang!").
      ${additionalBrief ? `Instruksi: ${additionalBrief}` : ''}
      ${getOutputFormat(sceneCount, productName)}
    `
  },
  {
    id: 'herbal-wellness',
    name: 'Herbal / Vitamins / Wellness',
    description: 'Trust, health, purity, glowing skin, consumption.',
    requiredParts: ['product', 'model'],
    planningPrompt: (productName, additionalBrief, sceneCount, ctaPerScene) => `
      Buat storyboard iklan KESEHATAN/HERBAL untuk "${productName}".
      ${getCommonRules(ctaPerScene, true, productName)}
      
      Struktur:
      - Scene 1: Model terlihat lesu/sakit ATAU memegang area tubuh yang sakit (Hook).
      - Scene 2: Konsumsi produk "${productName}" (Minum/Oles) (Solusi).
      - Scene 3: Efek visual kesehatan (Glowing/Bugar/Segar) karena "${productName}" (Benefit).
      - Scene 4: Model tersenyum memegang botol produk (Trust & CTA).
      ${additionalBrief ? `Instruksi: ${additionalBrief}` : ''}
      ${getOutputFormat(sceneCount, productName)}
    `
  },
  {
    id: 'equipment-tools',
    name: 'Equipment / Tools / Gadget',
    description: 'Durability, usage demonstration, rugged or tech vibe.',
    requiredParts: ['product', 'model'],
    planningPrompt: (productName, additionalBrief, sceneCount, ctaPerScene) => `
      Buat storyboard iklan PERALATAN/ALAT untuk "${productName}".
      ${getCommonRules(ctaPerScene, true, productName)}
      
      Struktur:
      - Scene 1: Tantangan/Pekerjaan berat (Hook: "Kerja jadi gampang!").
      - Scene 2: Demo penggunaan alat "${productName}" (Close up aksi mekanis/teknis).
      - Scene 3: Hasil kerja yang rapi/cepat berkat alat "${productName}".
      - Scene 4: Model puas mengacungkan jempol dengan alat (CTA).
      ${additionalBrief ? `Instruksi: ${additionalBrief}` : ''}
      ${getOutputFormat(sceneCount, productName)}
    `
  },
  {
    id: 'fashion-bags',
    name: 'Tas / Fashion Accessories',
    description: 'Focus on texture, holding mechanism, OOTD matching.',
    requiredParts: ['product', 'model'],
    planningPrompt: (productName, additionalBrief, sceneCount, ctaPerScene) => `
      Buat storyboard iklan TAS/AKSESORIS untuk "${productName}".
      ${getCommonRules(ctaPerScene, true, productName)}
      
      Struktur:
      - Scene 1: Model berjalan/berpose, tas "${productName}" jadi pusat perhatian (Hook: "Tas viral nih!").
      - Scene 2: Close up tekstur bahan/resleting/detail tas "${productName}" (Benefit: "Jahitan rapi").
      - Scene 3: Model membuka tas/mengambil barang (Benefit: "Muat banyak").
      - Scene 4: Pose aesthetic memeluk/memegang tas (CTA).
      ${additionalBrief ? `Instruksi: ${additionalBrief}` : ''}
      ${getOutputFormat(sceneCount, productName)}
    `
  },
  {
    id: 'automotive',
    name: 'Otomotif (Produk/Kendaraan)',
    description: 'Sleek lines, motion blur, driving, interior/exterior.',
    requiredParts: ['product', 'model'],
    planningPrompt: (productName, additionalBrief, sceneCount, ctaPerScene) => `
      Buat storyboard iklan OTOMOTIF untuk "${productName}".
      ${getCommonRules(ctaPerScene, true, productName)}
      
      Struktur:
      - Scene 1: Shot eksterior kendaraan/produk "${productName}" mengkilap (Hook: "Ganteng banget!").
      - Scene 2: Model berinteraksi (Membuka pintu/Memegang stir/Menuang cairan) dengan "${productName}".
      - Scene 3: Sensasi berkendara/penggunaan (Benefit: "Mesin halus").
      - Scene 4: Shot bersama model di samping kendaraan/produk (CTA).
      ${additionalBrief ? `Instruksi: ${additionalBrief}` : ''}
      ${getOutputFormat(sceneCount, productName)}
    `
  },
  {
    id: 'food-beverage',
    name: 'Food / Beverage',
    description: 'Appetite appeal, eating shots, texture.',
    requiredParts: ['product', 'model'],
    planningPrompt: (productName, additionalBrief, sceneCount, ctaPerScene) => `
      Buat storyboard iklan MAKANAN/MINUMAN untuk "${productName}".
      ${getCommonRules(ctaPerScene, true, productName)}
      
      Struktur:
      - Scene 1: Food porn (Uap/Lelehan/Kesegaran) - Close up produk "${productName}" (Hook: "Ngiler gak sih?").
      - Scene 2: Model menyuap/meminum "${productName}" dengan nikmat.
      - Scene 3: Ekspresi mata membelalak (Benefit: "Rasanya pecah!").
      - Scene 4: Produk di meja, tangan model hendak mengambil lagi (CTA).
      ${additionalBrief ? `Instruksi: ${additionalBrief}` : ''}
      ${getOutputFormat(sceneCount, productName)}
    `
  },
  {
    id: 'fashion-lifestyle',
    name: 'Fashion / Lifestyle (General)',
    description: 'Aesthetic, vibe, OOTD, cinematic transitions.',
    requiredParts: ['product', 'model'],
    planningPrompt: (productName, additionalBrief, sceneCount, ctaPerScene) => `
      Buat storyboard iklan FASHION LIFESTYLE untuk "${productName}".
      ${getCommonRules(ctaPerScene, true, productName)}
      
      Struktur:
      - Scene 1: Outfit check (Transition) mengenakan "${productName}" (Hook: "OOTD Check!").
      - Scene 2: Detail kain/pola produk "${productName}" (Benefit).
      - Scene 3: Movement (Berputar/Berjalan) (Benefit: "Nyaman banget").
      - Scene 4: Confidence pose (CTA).
      ${additionalBrief ? `Instruksi: ${additionalBrief}` : ''}
      ${getOutputFormat(sceneCount, productName)}
    `
  },
  {
    id: 'unboxing',
    name: 'Unboxing (Sales)',
    description: 'Excitement of opening, first impressions.',
    requiredParts: ['product', 'model'],
    planningPrompt: (productName, additionalBrief, sceneCount, ctaPerScene) => `
      Buat storyboard UNBOXING untuk "${productName}".
      ${getCommonRules(ctaPerScene, true, productName)}
      
      Struktur:
      - Scene 1: Paket "${productName}" di meja/diterima dari kurir (Hook: "Akhirnya sampe!").
      - Scene 2: Proses unboxing (POV atau shot tangan).
      - Scene 3: Produk "${productName}" terungkap (Wow factor).
      - Scene 4: Model pamer produk ke kamera (CTA).
      ${additionalBrief ? `Instruksi: ${additionalBrief}` : ''}
      ${getOutputFormat(sceneCount, productName)}
    `
  },
  {
    id: 'digital-service',
    name: 'Digital Product / Service',
    description: 'Apps, websites, courses, e-books.',
    requiredParts: ['product', 'model'],
    planningPrompt: (productName, additionalBrief, sceneCount, ctaPerScene) => `
      Buat storyboard iklan PRODUK DIGITAL untuk "${productName}".
      ${getCommonRules(ctaPerScene, true, productName)}
      
      Struktur:
      - Scene 1: Masalah ribet tanpa tools (Hook).
      - Scene 2: Model scroll HP/Laptop (Menemukan solusi "${productName}").
      - Scene 3: Layar menampilkan UI Produk/Dashboard "${productName}" (Benefit: "Simpel banget").
      - Scene 4: Model lega/senyum ke kamera (CTA).
      ${additionalBrief ? `Instruksi: ${additionalBrief}` : ''}
      ${getOutputFormat(sceneCount, productName)}
    `
  },

  // --- NON-SALES / SOFT SELL CATEGORIES ---
  {
    id: 'storytelling-camera',
    name: 'Storytelling (Depan Kamera)',
    description: 'Personal experience, emotional connection. (Max 30 words/scene)',
    requiredParts: ['model'],
    planningPrompt: (productName, additionalBrief, sceneCount, ctaPerScene) => `
      Buat storyboard STORYTELLING PERSONAL tentang "${productName}".
      ${getCommonRules(false, false, productName)}
      
      Struktur:
      - Scene 1: Hook Emosional (Vulnerability).
      - Scene 2: Perjalanan/Konflik.
      - Scene 3: Realisasi/Titik Balik.
      - Scene 4: Ajakan Relate (Sharing di komen).
      ${additionalBrief ? `Instruksi: ${additionalBrief}` : ''}
      ${getOutputFormat(sceneCount, productName)}
    `
  },
  {
    id: 'talking-head-awareness',
    name: 'Talking Head (Opini/Edukasi)',
    description: 'Thought leadership, educational, sharing opinion. (Max 30 words/scene)',
    requiredParts: ['model'],
    planningPrompt: (productName, additionalBrief, sceneCount, ctaPerScene) => `
      Buat storyboard TALKING HEAD / EDUKASI tentang "${productName}".
      ${getCommonRules(false, false, productName)}
      
      Struktur:
      - Scene 1: Hook Fakta/Opini Kontroversial.
      - Scene 2: Penjelasan/Argumen.
      - Scene 3: Insight Utama.
      - Scene 4: Pertanyaan ke audiens.
      ${additionalBrief ? `Instruksi: ${additionalBrief}` : ''}
      ${getOutputFormat(sceneCount, productName)}
    `
  }
];
