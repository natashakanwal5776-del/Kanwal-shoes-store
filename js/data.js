/* Kanwal Shoes Store - shared data, storage, shoe artwork, size check */
const STORE = {
  name: "Kanwal Shoes Store",
  nameUr: "کنول شوز اسٹور",
  phone: "03327478281",
  wa: "923327478281",
  email: "kanwalshoesstore2026@gmail.com",
  address: "CRBC Chowk, D.I. Khan",
  addressUr: "سی آر بی سی چوک، ڈیرہ اسماعیل خان",
  adminPassword: "kanwal2026", // change this
  delivery: 250,
  freeOver: 5000,
  currency: "Rs."
};
const RANGES = { women: [35, 42], men: [39, 46], kids: [18, 34] };
const TYPES = ["sneaker", "heel", "sandal", "boot", "loafer"];
/* ---------- storage ---------- */
const db = {
  get(k, d) { try { const v = localStorage.getItem("ks_" + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { localStorage.setItem("ks_" + k, JSON.stringify(v)); }
};
/* ---------- shoe artwork (SVG, any colour) ---------- */
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
  } else { /* sneaker */
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
function tint(c) { return /^#[0-9a-f]{6}$/i.test(c || "") ? c + "2e" : "#f3e6ea"; }
/* ---------- seed products ---------- */
const UR_NAMES = {
  1: "کنول اینکل بوٹ",
  2: "کنول کلاؤڈ واک اسنیکر",
  3: "کنول پرل فلیٹ سینڈل",
  4: "کنول سافٹ بیلے لوفر",
  7: "کنول لیدر اینکل بوٹ",
  8: "کنول کراس اسٹریپ سینڈل",
  9: "کنول پشاوری چپل سینڈل",
  10: "کنول رنر اسپورٹس اسنیکر",
  13: "کنول کڈز ایرو اسپورٹس اسنیکر",
  14: "کنول کڈز ایکٹو رنر اسنیکر",
  15: "کنول کڈز فلورل سینڈل",
  16: "کنول کڈز کیجڈ لیدر سینڈل",
  17: "کنول کڈز ڈبل بکل سلائیڈ سینڈل"
};
function makeSizes(cat, id) {
  const [a, b] = RANGES[cat], s = {};
  for (let n = a; n <= b; n++) s[n] = Math.max(2, (n * 7 + id * 3) % 9);
  return s;
}
function seedProducts() {
  const P = (id, cat, type, name, price, sale, colors, img = "", created = id) =>
    ({ id, cat, type, name, nameUr: UR_NAMES[id] || "", price, sale, colors, sizes: makeSizes(cat, id), img, created });
  return [
    P(1, "women", "boot", "Kanwal Ankle Boot", 5900, 4900, [{ n: "Mocha Brown", c: "#6B4A3A" }, { n: "Black", c: "#2D1B2E" }], "images/women-boot.jpg", 104),
    P(2, "women", "sneaker", "Kanwal Cloud Walk Sneaker", 4600, 0, [{ n: "Lilac Purple", c: "#9B7AD4" }, { n: "Soft Lavender", c: "#B7A3D6" }, { n: "Pure White", c: "#F5F3F4" }], "images/women-sneaker.jpg", 103),
    P(3, "women", "sandal", "Kanwal Pearl Flat Sandal", 3400, 2800, [{ n: "Dusty Rose", c: "#C47A8F" }, { n: "Champagne Pink", c: "#D8A5B2" }], "images/women-sandal.jpg", 102),
    P(4, "women", "loafer", "Kanwal Soft Ballet Loafer", 3800, 0, [{ n: "Blush Pink", c: "#DE9BAE" }, { n: "Rose Nude", c: "#D9A98C" }], "images/women-loafer.jpg", 101),
    P(7, "men", "boot", "Kanwal Leather Ankle Boot", 6900, 5900, [{ n: "Mocha Brown", c: "#5C3A2A" }, { n: "Midnight Black", c: "#1F1B24" }], "images/men-boot.jpg", 204),
    P(8, "men", "sandal", "Kanwal Cross-Strap Slide Sandal", 3400, 0, [{ n: "Classic Black", c: "#1F1B24" }, { n: "Charcoal Grey", c: "#4A4A52" }], "images/men-sandal.jpg", 203),
    P(9, "men", "sandal", "Kanwal Peshawari Chappal Sandal", 3900, 3400, [{ n: "Navy & Brown", c: "#27395E" }, { n: "Rich Walnut", c: "#5C3A2A" }], "images/men-chappal.jpg", 202),
    P(10, "men", "sneaker", "Kanwal Runner Sports Sneaker", 4900, 0, [{ n: "Navy Blue", c: "#1F2B48" }, { n: "Steel Grey", c: "#6B7280" }], "images/men-sneaker.jpg", 201),
    P(13, "kids", "sneaker", "Kanwal Kids Aero Sport Sneaker", 2600, 0, [{ n: "Royal Blue & Orange", c: "#274CB5" }, { n: "Neon Lime", c: "#A3D42C" }], "images/kids-sneaker.jpg", 305),
    P(14, "kids", "sneaker", "Kanwal Kids Active Runner Sneaker", 2500, 2100, [{ n: "Bright Blue & Green", c: "#3472C6" }, { n: "Sunset Orange", c: "#EA6B25" }], "images/kids-runner.jpg", 304),
    P(15, "kids", "sandal", "Kanwal Kids Floral Charm Sandal", 2200, 0, [{ n: "Soft Blush & Gold", c: "#E2A4B8" }, { n: "Rose Pink", c: "#D58A9F" }], "images/kids-floral-sandal.jpg", 303),
    P(16, "kids", "sandal", "Kanwal Kids Caged Fisherman Sandal", 2400, 1950, [{ n: "Navy & Tan Brown", c: "#2C3E60" }, { n: "Walnut Brown", c: "#8A5A36" }], "images/kids-caged-sandal.jpg", 302),
    P(17, "kids", "sandal", "Kanwal Kids Double Buckle Slide Sandal", 2100, 0, [{ n: "Rich Walnut Leather", c: "#533325" }, { n: "Mocha Brown", c: "#6E4532" }], "images/kids-buckle-slide.jpg", 301)
  ];
}
const DATA_VERSION = 7;
function getProducts() {
  let p = db.get("products", null);
  const v = db.get("data_v", 0);
  if (!p || v < DATA_VERSION) {
    p = seedProducts();
    db.set("products", p);
    db.set("data_v", DATA_VERSION);
    try {
      const c = db.get("cart", []);
      if (Array.isArray(c)) {
        const validIds = new Set(p.map(x => x.id));
        db.set("cart", c.filter(item => validIds.has(item.pid)));
      }
    } catch (e) {}
  }
  return p;
}
function saveProducts(p) { db.set("products", p); }
function getOrders() { return db.get("orders", []); }
function saveOrders(o) { db.set("orders", o); }
function priceOf(p) { return p.sale && p.sale < p.price ? p.sale : p.price; }
function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m])); }
/* ---------- size check (category aware) ---------- */
function categoryOfSize(n) {
  return Object.keys(RANGES).filter(k => n >= RANGES[k][0] && n <= RANGES[k][1]);
}
/* returns {state: ok|low|out|other|invalid, stock, other, near} */
function checkSize(p, raw) {
  const n = Number(raw);
  if (raw === "" || raw == null || !isFinite(n) || n <= 0) return { state: "invalid" };
  const [a, b] = RANGES[p.cat];
  if (n >= a && n <= b) {
    const stock = Number(p.sizes[n] || 0);
    if (stock <= 0) {
      const near = Object.keys(p.sizes).map(Number).filter(s => p.sizes[s] > 0)
        .sort((x, y) => Math.abs(x - n) - Math.abs(y - n)).slice(0, 3).sort((x, y) => x - y);
      return { state: "out", stock: 0, near };
    }
    return { state: stock <= 5 ? "low" : "ok", stock };
  }
  const cats = categoryOfSize(n);
  if (cats.length) return { state: "other", other: cats[0] };
  return { state: "invalid" };
}
