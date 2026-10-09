/* Kanwal Shoes Store - shared data, size checking, shoe artwork & Supabase data adapter */

const STORE = {
  name: "Kanwal Shoes Store",
  nameUr: "کنول شوز اسٹور",
  phone: "03327478281",
  wa: "923327478281",
  email: "kanwalshoesstore2026@gmail.com",
  address: "CRBC Chowk, D.I. Khan",
  addressUr: "سی آر بی سی چوک، ڈیرہ اسماعیل خان",
  delivery: 250,
  freeOver: 5000,
  currency: "Rs."
};

const RANGES = {
  women: [35, 42],
  men: [39, 46],
  kids: [18, 34]
};

const TYPES = ["sneaker", "heel", "sandal", "boot", "loafer"];

/* ---------- shoe artwork (SVG fallback when photo is loading/absent) ---------- */
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = v => Math.max(0, Math.min(255, v + amt));
  return "#" + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(f).map(v => v.toString(16).padStart(2, "0")).join("");
}

function shoeSVG(type, c, kid) {
  c = /^#[0-9a-f]{6}$/i.test(c || "") ? c : "#B8567A";
  const d = shade(c, -40), l = shade(c, 45);
  const shadow = '<ellipse cx="200" cy="240" rx="165" ry="9" fill="rgba(45,27,46,.14)"/>';
  let body = "";
  if (type === "heel") {
    body = `<path d="M62 78 C84 66 104 72 114 94 C142 146 202 170 268 176 C330 182 352 190 348 205 C345 214 326 214 300 213 L196 208 C154 205 122 192 104 172 L96 236 L82 236 L88 150 C68 130 56 104 62 78Z" fill="${c}"/>
    <path d="M62 78 C84 66 104 72 114 94 C122 112 134 126 150 138 C120 130 92 112 80 96Z" fill="${l}" opacity=".55"/>
    <path d="M104 172 C122 192 154 205 196 208 L300 213 C326 214 345 214 348 205 C350 200 346 197 340 195 L196 190 C150 188 118 176 104 172Z" fill="${d}"/>
    <circle cx="112" cy="118" r="7" fill="#C9A15B"/>`;
  } else if (type === "sandal") {
    body = `<path d="M38 204 Q38 190 58 188 L330 188 Q374 190 374 208 Q374 222 350 222 L60 222 Q38 222 38 204Z" fill="${d}"/>
    <path d="M38 204 Q38 192 58 192 L330 192 Q366 194 370 206 L40 210Z" fill="${shade(c, -70)}" opacity=".45"/>
    <path d="M232 190 Q262 118 330 192" fill="none" stroke="${c}" stroke-width="26" stroke-linecap="round"/>
    <path d="M104 190 Q134 112 196 190" fill="none" stroke="${c}" stroke-width="22" stroke-linecap="round"/>
    <path d="M232 190 Q262 124 330 192" fill="none" stroke="${l}" stroke-width="6" stroke-linecap="round" opacity=".6"/>
    <circle cx="150" cy="140" r="9" fill="#C9A15B"/>`;
  } else if (type === "boot") {
    body = `<path d="M108 36 L202 36 L206 118 C232 140 292 148 342 168 C374 182 376 206 374 216 L98 216 C86 216 82 205 84 194Z" fill="${c}"/>
    <path d="M108 36 L202 36 L203 62 L106 62Z" fill="${d}"/>
    <path d="M206 118 C232 140 292 148 342 168 C374 182 376 206 374 216 L300 216 L300 168Z" fill="rgba(255,255,255,.14)"/>
    <rect x="80" y="214" width="296" height="20" rx="8" fill="${shade(c, -75)}"/>
    <path d="M150 84 H196 M150 104 H198 M152 124 H200" stroke="${d}" stroke-width="5" stroke-linecap="round"/>`;
  } else if (type === "loafer") {
    body = `<path d="M44 198 C44 176 70 168 100 166 C150 160 182 150 216 140 C262 130 322 150 354 176 C374 192 374 208 374 214 L44 214Z" fill="${c}"/>
    <path d="M216 140 C262 130 322 150 354 176 C322 164 270 156 226 160Z" fill="${l}" opacity=".5"/>
    <path d="M150 164 C176 160 206 154 232 146 L238 176 C206 184 176 186 150 182Z" fill="${d}"/>
    <rect x="186" y="156" width="26" height="9" rx="3" fill="#C9A15B"/>
    <rect x="40" y="212" width="338" height="20" rx="8" fill="${shade(c, -80)}"/>`;
  } else {
    body = `<path d="M38 202 C38 170 52 150 78 146 L128 138 C150 112 178 98 210 96 C226 112 252 128 290 140 C345 156 372 176 372 204 L372 216 L38 216Z" fill="${c}"/>
    <path d="M38 202 C38 170 52 150 78 146 L98 144 L98 208Z" fill="${d}"/>
    <path d="M210 96 C226 112 252 128 290 140 L266 152 C242 142 224 124 210 96Z" fill="${l}" opacity=".7"/>
    <path d="M300 144 C345 158 372 176 372 204 L372 216 L300 216Z" fill="rgba(255,255,255,.2)"/>
    ${kid
      ? '<rect x="146" y="124" width="60" height="12" rx="6" fill="#fff" opacity=".9"/><rect x="154" y="148" width="60" height="12" rx="6" fill="#fff" opacity=".9"/>'
      : '<path d="M146 130 L176 142 M162 116 L194 130 M180 106 L210 120" stroke="#fff" stroke-width="6" stroke-linecap="round"/>'}
    <path d="M30 210 H380 V224 Q380 236 364 236 H46 Q30 236 30 224Z" fill="#fff" stroke="#EADFE3"/>
    <path d="M110 190 Q200 176 300 188" stroke="#fff" stroke-width="5" fill="none" opacity=".7" stroke-linecap="round"/>`;
  }
  return `<svg viewBox="0 0 400 260" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="shoe">${shadow}${body}</svg>`;
}

function tint(c) {
  return /^#[0-9a-f]{6}$/i.test(c || "") ? c + "2e" : "#f3e6ea";
}

/* ---------- data normalization ---------- */
function normalizeProduct(raw) {
  if (!raw) return null;
  const photos = Array.isArray(raw.photos)
    ? raw.photos.filter(Boolean)
    : (raw.img ? [raw.img] : []);
  const colours = Array.isArray(raw.colours)
    ? raw.colours
    : (Array.isArray(raw.colors) ? raw.colors : []);
  const sale = raw.sale_price != null
    ? Number(raw.sale_price)
    : (raw.sale != null ? Number(raw.sale) : null);

  return {
    id: String(raw.id),
    name: raw.name || "Shoe",
    nameUr: raw.name_ur || raw.nameUr || raw.name,
    name_ur: raw.name_ur || raw.nameUr || raw.name,
    cat: raw.collection || raw.cat || "women",
    collection: raw.collection || raw.cat || "women",
    type: raw.type || "sneaker",
    price: Number(raw.price) || 0,
    sale: sale && sale > 0 ? sale : 0,
    sale_price: sale && sale > 0 ? sale : null,
    colors: colours.length ? colours : [{ n: "Default", c: "#B8567A" }],
    colours: colours.length ? colours : [{ n: "Default", c: "#B8567A" }],
    sizes: raw.sizes && typeof raw.sizes === "object" ? raw.sizes : {},
    photos: photos,
    img: photos[0] || raw.img || "",
    video_url: raw.video_url || null,
    hidden: Boolean(raw.hidden),
    created: raw.created_at || raw.created || Date.now()
  };
}

/* ---------- sample products fallback (if db has not yet seeded) ---------- */
function getSampleProducts() {
  return [
    { id: "00000000-0000-0000-0000-000000000001", cat: "women", type: "boot", name: "Kanwal Ankle Boot", nameUr: "کنول اینکل بوٹ", price: 5900, sale: 4900, colors: [{ n: "Mocha Brown", c: "#6B4A3A" }, { n: "Black", c: "#2D1B2E" }], sizes: { "35": 4, "36": 6, "37": 8, "38": 6, "39": 5, "40": 4, "41": 2, "42": 2 }, photos: ["images/women-boot.jpg"] },
    { id: "00000000-0000-0000-0000-000000000002", cat: "women", type: "sneaker", name: "Kanwal Cloud Walk Sneaker", nameUr: "کنول کلاؤڈ واک اسنیکر", price: 4600, sale: 0, colors: [{ n: "Lilac Purple", c: "#9B7AD4" }, { n: "Soft Lavender", c: "#B7A3D6" }, { n: "Pure White", c: "#F5F3F4" }], sizes: { "35": 5, "36": 7, "37": 9, "38": 7, "39": 4, "40": 3, "41": 2, "42": 1 }, photos: ["images/women-sneaker.jpg"] },
    { id: "00000000-0000-0000-0000-000000000003", cat: "women", type: "sandal", name: "Kanwal Pearl Flat Sandal", nameUr: "کنول پرل فلیٹ سینڈل", price: 3400, sale: 2800, colors: [{ n: "Dusty Rose", c: "#C47A8F" }, { n: "Champagne Pink", c: "#D8A5B2" }], sizes: { "35": 3, "36": 5, "37": 7, "38": 6, "39": 4, "40": 3, "41": 2, "42": 1 }, photos: ["images/women-sandal.jpg"] },
    { id: "00000000-0000-0000-0000-000000000004", cat: "women", type: "loafer", name: "Kanwal Soft Ballet Loafer", nameUr: "کنول سافٹ بیلے لوفر", price: 3800, sale: 0, colors: [{ n: "Blush Pink", c: "#DE9BAE" }, { n: "Rose Nude", c: "#D9A98C" }], sizes: { "35": 4, "36": 6, "37": 8, "38": 5, "39": 3, "40": 3, "41": 2, "42": 1 }, photos: ["images/women-loafer.jpg"] },
    { id: "00000000-0000-0000-0000-000000000007", cat: "men", type: "boot", name: "Kanwal Leather Ankle Boot", nameUr: "کنول لیدر اینکل بوٹ", price: 6900, sale: 5900, colors: [{ n: "Mocha Brown", c: "#5C3A2A" }, { n: "Midnight Black", c: "#1F1B24" }], sizes: { "39": 4, "40": 6, "41": 8, "42": 7, "43": 5, "44": 4, "45": 3, "46": 2 }, photos: ["images/men-boot.jpg"] },
    { id: "00000000-0000-0000-0000-000000000008", cat: "men", type: "sandal", name: "Kanwal Cross-Strap Slide Sandal", nameUr: "کنول کراس اسٹریپ سینڈل", price: 3400, sale: 0, colors: [{ n: "Classic Black", c: "#1F1B24" }, { n: "Charcoal Grey", c: "#4A4A52" }], sizes: { "39": 5, "40": 7, "41": 9, "42": 8, "43": 6, "44": 4, "45": 2, "46": 2 }, photos: ["images/men-sandal.jpg"] },
    { id: "00000000-0000-0000-0000-000000000009", cat: "men", type: "sandal", name: "Kanwal Peshawari Chappal Sandal", nameUr: "کنول پشاوری چپل سینڈل", price: 3900, sale: 3400, colors: [{ n: "Navy & Brown", c: "#27395E" }, { n: "Rich Walnut", c: "#5C3A2A" }], sizes: { "39": 4, "40": 6, "41": 8, "42": 8, "43": 5, "44": 4, "45": 3, "46": 2 }, photos: ["images/men-chappal.jpg"] },
    { id: "00000000-0000-0000-0000-000000000010", cat: "men", type: "sneaker", name: "Kanwal Runner Sports Sneaker", nameUr: "کنول رنر اسپورٹس اسنیکر", price: 4900, sale: 0, colors: [{ n: "Navy Blue", c: "#1F2B48" }, { n: "Steel Grey", c: "#6B7280" }], sizes: { "39": 6, "40": 8, "41": 10, "42": 8, "43": 6, "44": 4, "45": 3, "46": 2 }, photos: ["images/men-sneaker.jpg"] },
    { id: "00000000-0000-0000-0000-000000000013", cat: "kids", type: "sneaker", name: "Kanwal Kids Aero Sport Sneaker", nameUr: "کنول کڈز ایرو اسپورٹس اسنیکر", price: 2600, sale: 0, colors: [{ n: "Royal Blue & Orange", c: "#274CB5" }, { n: "Neon Lime", c: "#A3D42C" }], sizes: { "18": 3, "19": 3, "20": 4, "21": 4, "22": 5, "23": 5, "24": 6, "25": 6, "26": 5, "27": 5, "28": 4, "29": 4, "30": 3, "31": 3, "32": 2, "33": 2, "34": 2 }, photos: ["images/kids-sneaker.jpg"] },
    { id: "00000000-0000-0000-0000-000000000014", cat: "kids", type: "sneaker", name: "Kanwal Kids Active Runner Sneaker", nameUr: "کنول کڈز ایکٹو رنر اسنیکر", price: 2500, sale: 2100, colors: [{ n: "Bright Blue & Green", c: "#3472C6" }, { n: "Sunset Orange", c: "#EA6B25" }], sizes: { "18": 4, "19": 4, "20": 5, "21": 5, "22": 6, "23": 6, "24": 6, "25": 5, "26": 5, "27": 4, "28": 4, "29": 3, "30": 3, "31": 3, "32": 2, "33": 2, "34": 1 }, photos: ["images/kids-runner.jpg"] },
    { id: "00000000-0000-0000-0000-000000000015", cat: "kids", type: "sandal", name: "Kanwal Kids Floral Charm Sandal", nameUr: "کنول کڈز فلورل سینڈل", price: 2200, sale: 0, colors: [{ n: "Soft Blush & Gold", c: "#E2A4B8" }, { n: "Rose Pink", c: "#D58A9F" }], sizes: { "18": 3, "19": 3, "20": 4, "21": 4, "22": 5, "23": 5, "24": 5, "25": 4, "26": 4, "27": 3, "28": 3, "29": 2, "30": 2, "31": 2, "32": 1, "33": 1, "34": 1 }, photos: ["images/kids-floral-sandal.jpg"] },
    { id: "00000000-0000-0000-0000-000000000016", cat: "kids", type: "sandal", name: "Kanwal Kids Caged Fisherman Sandal", nameUr: "کنول کڈز کیجڈ لیدر سینڈل", price: 2400, sale: 1950, colors: [{ n: "Navy & Tan Brown", c: "#2C3E60" }, { n: "Walnut Brown", c: "#8A5A36" }], sizes: { "18": 4, "19": 4, "20": 5, "21": 5, "22": 5, "23": 6, "24": 6, "25": 5, "26": 4, "27": 4, "28": 3, "29": 3, "30": 2, "31": 2, "32": 2, "33": 1, "34": 1 }, photos: ["images/kids-caged-sandal.jpg"] },
    { id: "00000000-0000-0000-0000-000000000017", cat: "kids", type: "sandal", name: "Kanwal Kids Double Buckle Slide Sandal", nameUr: "کنول کڈز ڈبل بکل سلائیڈ سینڈل", price: 2100, sale: 0, colors: [{ n: "Rich Walnut Leather", c: "#533325" }, { n: "Mocha Brown", c: "#6E4532" }], sizes: { "18": 3, "19": 4, "20": 4, "21": 5, "22": 5, "23": 5, "24": 5, "25": 4, "26": 4, "27": 3, "28": 3, "29": 2, "30": 2, "31": 2, "32": 2, "33": 1, "34": 1 }, photos: ["images/kids-buckle-slide.jpg"] }
  ].map(normalizeProduct);
}

/* ---------- Supabase Data API ---------- */
let _cachedProducts = null;

async function fetchProducts(forceRefresh = false) {
  if (_cachedProducts && !forceRefresh) return _cachedProducts;
  const sb = getSupabase();
  if (!sb) {
    _cachedProducts = getSampleProducts();
    return _cachedProducts;
  }
  try {
    const { data, error } = await sb
      .from("products")
      .select("*")
      .eq("hidden", false)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Supabase products fetch warning, using fallback:", error.message);
      _cachedProducts = getSampleProducts();
      return _cachedProducts;
    }
    if (!data || !data.length) {
      _cachedProducts = getSampleProducts();
      return _cachedProducts;
    }
    _cachedProducts = data.map(normalizeProduct);
    return _cachedProducts;
  } catch (err) {
    console.error("fetchProducts error:", err);
    _cachedProducts = getSampleProducts();
    return _cachedProducts;
  }
}

async function fetchProductById(id) {
  const sb = getSupabase();
  if (!sb) {
    const sample = getSampleProducts().find(p => p.id === String(id));
    return sample || null;
  }
  try {
    const { data, error } = await sb
      .from("products")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) {
      const sample = getSampleProducts().find(p => p.id === String(id));
      return sample || null;
    }
    return normalizeProduct(data);
  } catch (err) {
    const sample = getSampleProducts().find(p => p.id === String(id));
    return sample || null;
  }
}

/* Helper functions */
function priceOf(p) {
  return p.sale && p.sale < p.price ? p.sale : p.price;
}

function totalStock(p) {
  if (!p || !p.sizes) return 0;
  return Object.values(p.sizes).reduce((sum, n) => sum + (Number(n) || 0), 0);
}

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
}

/* ---------- size check (category aware) ---------- */
function categoryOfSize(n) {
  return Object.keys(RANGES).filter(k => n >= RANGES[k][0] && n <= RANGES[k][1]);
}

/* returns {state: ok|low|out|other|invalid, stock, other, near} */
function checkSize(p, raw) {
  const n = Number(raw);
  if (raw === "" || raw == null || !isFinite(n) || n <= 0) return { state: "invalid" };
  const cat = p.cat || p.collection;
  const [a, b] = RANGES[cat] || [35, 42];
  if (n >= a && n <= b) {
    const stock = Number((p.sizes && p.sizes[n]) || 0);
    if (stock <= 0) {
      const near = Object.keys(p.sizes || {}).map(Number).filter(s => (p.sizes[s] || 0) > 0)
        .sort((x, y) => Math.abs(x - n) - Math.abs(y - n)).slice(0, 3).sort((x, y) => x - y);
      return { state: "out", stock: 0, near };
    }
    return { state: stock <= 5 ? "low" : "ok", stock };
  }
  const cats = categoryOfSize(n);
  if (cats.length) return { state: "other", other: cats[0] };
  return { state: "invalid" };
}
