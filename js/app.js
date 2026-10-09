/* Kanwal Shoes Store - storefront */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
let lang = localStorage.getItem("ks_lang") || "";
let cart = [];
try {
  cart = JSON.parse(localStorage.getItem("ks_cart") || "[]");
  if (!Array.isArray(cart)) cart = [];
} catch (e) { cart = []; }

const t = (k, v) => {
  let s = (T[lang || "en"] || T.en)[k] || T.en[k] || k;
  if (v) Object.keys(v).forEach(x => (s = s.replace("{" + x + "}", v[x])));
  return s;
};

const money = n => STORE.currency + " " + Number(n || 0).toLocaleString("en-US");

const pname = p => (lang === "ur" ? (p.nameUr || p.name_ur || p.name) : p.name);

const ICON = {
  cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></svg>',
  arrow: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  wa: '<svg viewBox="0 0 24 24"><path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9s-.5-.1-.7.1-.8.9-.9 1.1-.3.2-.6.1a7.3 7.3 0 0 1-3.6-3.1c-.3-.5.3-.5.8-1.5.1-.2 0-.4 0-.5l-.9-2.1c-.2-.5-.5-.5-.7-.5h-.6a1.2 1.2 0 0 0-.9.4 3.7 3.7 0 0 0-1.1 2.7 6.4 6.4 0 0 0 1.3 3.4 14.6 14.6 0 0 0 5.6 4.9c2.1.9 2.9.9 3.9.8a3.3 3.3 0 0 0 2.2-1.5 2.7 2.7 0 0 0 .2-1.5c-.1-.1-.3-.2-.6-.4zM12 2a10 10 0 0 0-8.6 15L2 22l5.1-1.3A10 10 0 1 0 12 2z"/></svg>'
};

const waLink = txt => "https://wa.me/" + STORE.wa + "?text=" + encodeURIComponent(txt);

function getYouTubeEmbedUrl(url) {
  if (!url) return null;
  const str = String(url).trim();
  const m = str.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/i);
  return m ? `https://www.youtube-nocookie.com/embed/${m[1]}` : null;
}

/* ---------- layout pieces ---------- */
function applyLang() {
  document.documentElement.lang = lang === "ur" ? "ur" : "en";
  document.body.dir = lang === "ur" ? "rtl" : "ltr";
  document.title = lang === "ur" ? (STORE.nameUr || "کنول شوز اسٹور") : STORE.name;
}

function drawHeader() {
  const cnt = cart.reduce((a, i) => a + (Number(i.qty) || 0), 0);
  const hash = (location.hash || "").replace(/^#/, "") || "/";
  const curShop = (hash.match(/^\/shop\/(\w+)/) || [])[1];
  const isHome = hash === "/" || hash === "";
  const isUr = lang === "ur";
  const brand = t("brandName");
  $("#header").innerHTML = `
  <div class="bar">
    <a class="logo" href="#/" aria-label="${t("home")}">${brand}</a>
    <nav class="main">
      <a href="#/" class="${isHome ? "on" : ""}">${t("home")}</a>
      <a href="#/shop/women" class="${curShop === "women" ? "on" : ""}">${t("women")}</a>
      <a href="#/shop/men" class="${curShop === "men" ? "on" : ""}">${t("men")}</a>
      <a href="#/shop/kids" class="${curShop === "kids" ? "on" : ""}">${t("kids")}</a>
      <a href="javascript:void(0)" id="navCart" class="nav-cart-btn">${t("cart")}${cnt ? ` (${cnt})` : ""}</a>
    </nav>
    <div class="tools">
      <button class="ibtn lang" id="langBtn" aria-label="${isUr ? "زبان" : "Language"}">${isUr ? "EN" : "اردو"}</button>
      <button class="ibtn" id="cartBtn" aria-label="${t("cart")}">${ICON.cart}${cnt ? `<span class="badge">${cnt}</span>` : ""}</button>
    </div>
  </div>`;
  $("#langBtn").onclick = () => setLang(lang === "ur" ? "en" : "ur");
  $("#cartBtn").onclick = openCart;
  const nc = $("#navCart"); if (nc) nc.onclick = openCart;
}

function drawFooter() {
  const isUr = lang === "ur";
  const brand = t("brandName");
  const phoneLabel = isUr ? "رابطہ نمبر" : "Contact";
  const waLabel = isUr ? "واٹس ایپ" : "WhatsApp";
  const emailLabel = isUr ? "ای میل" : "Email";
  const addrLabel = isUr ? "پتہ" : "Address";
  const addrVal = isUr ? "سی آر بی سی چوک، ڈیرہ اسماعیل خان" : STORE.address;
  const copyText = isUr ? `© ${brand}۔ جملہ حقوق محفوظ ہیں۔` : `© ${brand}. All rights reserved.`;

  $("#footer").innerHTML = `
  <div class="footer-container">
    <div class="footer-brand">${brand}</div>
    <div class="footer-contact">
      <a href="tel:${STORE.phone}">${phoneLabel}: ${STORE.phone}</a>
      <a href="${waLink(isUr ? "ہیلو" : "Hello")}" target="_blank" rel="noopener">${waLabel}: ${STORE.phone}</a>
      <a href="mailto:${STORE.email}">${emailLabel}: ${STORE.email}</a>
      <p>${addrLabel}: ${addrVal}</p>
    </div>
    <div class="footer-copy">${copyText}</div>
  </div>`;
  $("#wafab").href = waLink(isUr ? "ہیلو" : "Hello");
  $("#wafab").setAttribute("aria-label", isUr ? "واٹس ایپ" : "WhatsApp");
}

function toast(msg) {
  const el = $("#toast"); el.textContent = msg; el.classList.add("on");
  clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove("on"), 2200);
}

function setLang(l) {
  lang = l; localStorage.setItem("ks_lang", l);
  applyLang(); drawHeader(); drawFooter(); route(); drawCart();
}

function langPopup() {
  const m = document.createElement("div"); m.className = "modal";
  const isUr = lang === "ur";
  const popupTitle = isUr ? "کنول شوز اسٹور" : "Kanwal Shoes Store";
  m.innerHTML = `<div class="box" role="dialog" aria-modal="true">
  <h2>${popupTitle}</h2>
  <p>Choose your language<br>\u0627\u067e\u0646\u06cc \u0632\u0628\u0627\u0646 \u0645\u0646\u062a\u062e\u0628 \u06a9\u0631\u06cc\u06ba</p>
  <div class="btns"><button class="btn rose" data-l="en">English</button><button class="btn ghost" data-l="ur">\u0627\u0631\u062f\u0648</button></div></div>`;
  document.body.appendChild(m);
  $$("button", m).forEach(b => b.onclick = () => { m.remove(); setLang(b.dataset.l); });
  $("button", m).focus();
}

/* ---------- product bits ---------- */
function pic(p, color) {
  const col = color || (p.colors && p.colors[0] && p.colors[0].c) || "#B8567A";
  const photo = (p.photos && p.photos[0]) || p.img;
  return photo
    ? `<img src="${photo}" alt="${esc(pname(p))}" loading="lazy">`
    : shoeSVG(p.type, col, p.cat === "kids");
}

function card(p) {
  const col = (p.colors && p.colors[0]) ? p.colors[0].c : "#B8567A";
  const sale = p.sale && p.sale < p.price;
  const isSoldOut = totalStock(p) === 0;

  return `<a class="card" href="#/product/${p.id}">
  <div class="pic" style="background:radial-gradient(circle at 50% 38%,#fff,${tint(col)})">
    ${isSoldOut ? `<span class="badge-soldout" style="position:absolute;top:10px;inset-inline-start:10px;z-index:2">${t("soldOut")}</span>` : ""}
    ${pic(p, col)}
  </div>
  <div class="info">
    <div class="nm">${esc(pname(p))}</div>
    <div class="price">${money(priceOf(p))}${sale ? ` <s>${money(p.price)}</s>` : ""}</div>
  </div></a>`;
}

function pageHome(P = []) {
  const brand = t("brandName");
  const cats = ["women", "men", "kids"];

  return `
  <section class="hero-full">
    <img src="images/hero-banner.jpg" alt="${brand}" class="hero-bg" width="1024" height="434">
    <div class="hero-overlay">
      <div class="hero-content">
        <h1 class="hero-title">${brand}</h1>
        <a href="#/shop" class="btn rose hero-btn">${t("shop")} &rarr;</a>
      </div>
    </div>
  </section>

  <div class="home-sections">
    ${cats.map(c => {
      const prods = P.filter(p => p.cat === c && !p.hidden).slice(0, 8);
      return `
      <section class="home-section">
        <div class="sec-head">
          <h2 class="sec-title">${t(c)}</h2>
          <a class="view-all" href="#/shop/${c}">${t("viewAll")} &rarr;</a>
        </div>
        <div class="grid">${prods.length ? prods.map(card).join("") : `<p style="color:var(--muted);padding:20px 0">${t("empty")}</p>`}</div>
      </section>`;
    }).join("")}
  </div>`;
}

function pageShop(cat, type, P = []) {
  let list = P.filter(p => !p.hidden);
  if (cat) list = list.filter(p => p.cat === cat);
  const types = [...new Set(list.map(p => p.type))];
  if (type) list = list.filter(p => p.type === type);
  const base = "#/shop" + (cat ? "/" + cat : "");

  return `<div class="wrap">
  <div class="pagehead"><h1>${cat ? t(cat) : t("shop")}</h1></div>
  <div class="chips"><a class="chip ${!type ? "on" : ""}" href="${base}">${t("all")}</a>
  ${types.map(x => `<a class="chip ${type === x ? "on" : ""}" href="${base}?type=${x}">${TYPE_NAMES[lang || "en"][x] || x}</a>`).join("")}</div>
  <div class="grid" style="padding-bottom:50px">${list.length ? list.map(card).join("") : `<p style="color:var(--muted);padding:40px 0">${t("empty")}</p>`}</div></div>`;
}

function pageProduct(p) {
  if (!p) return `<div class="wrap"><div class="done"><h1>404</h1><a class="btn" href="#/">${t("home")}</a></div></div>`;
  const sale = p.sale && p.sale < p.price;
  const isSoldOut = totalStock(p) === 0;
  const [a, b] = RANGES[p.cat] || [35, 42];
  const photos = (p.photos && p.photos.length) ? p.photos : (p.img ? [p.img] : []);
  const mainPhoto = photos[0] || "";
  const ytUrl = getYouTubeEmbedUrl(p.video_url);

  // Filter sizes: only show sizes in stock (> 0)
  const inStockSizes = [];
  for (let n = a; n <= b; n++) {
    if (Number(p.sizes && p.sizes[n]) > 0) inStockSizes.push(n);
  }

  const sizeBtns = inStockSizes.map(n => `<button type="button" data-s="${n}">${n}</button>`);

  return `<div class="wrap"><div class="pdp">
  <div>
    <div class="big" id="big" style="background:radial-gradient(circle at 50% 40%,#fff,${tint(p.colors[0] && p.colors[0].c)})">
      ${mainPhoto ? `<img src="${mainPhoto}" alt="${esc(pname(p))}">` : shoeSVG(p.type, p.colors[0] && p.colors[0].c, p.cat === "kids")}
    </div>
    ${photos.length > 1 ? `
    <div class="gallery-thumbs" id="gThumbs">
      ${photos.map((ph, idx) => `
        <button type="button" class="g-thumb ${idx === 0 ? "on" : ""}" data-idx="${idx}" aria-label="Photo ${idx + 1}">
          <img src="${ph}" alt="" loading="lazy">
        </button>
      `).join("")}
    </div>` : ""}
    ${p.video_url ? (ytUrl ? `
    <div class="video-wrap">
      <iframe src="${ytUrl}" title="${t("video")}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
    </div>` : `
    <div class="video-wrap">
      <video controls muted playsinline poster="${mainPhoto}" src="${esc(p.video_url)}"></video>
    </div>`) : ""}
  </div>

  <div>
    <a href="#/shop/${p.cat}" class="chip" style="display:inline-block;margin-bottom:12px">${t(p.cat)}</a>
    <h1>${esc(pname(p))}</h1>
    <div style="display:flex;align-items:center;gap:12px;margin:8px 0 16px">
      <div class="price" style="font-size:24px">${money(priceOf(p))}${sale ? ` <s style="font-size:16px">${money(p.price)}</s>` : ""}</div>
      ${isSoldOut ? `<span class="badge-soldout">${t("soldOut")}</span>` : ""}
    </div>

    <div class="lbl">${t("color")}</div>
    <div class="sw" id="sw">${(p.colors || []).map((c, i) => `<button type="button" title="${esc(c.n)}" data-i="${i}" class="${i ? "" : "on"}" style="background:${esc(c.c)}"></button>`).join("")}</div>

    <div class="lbl">${t("size")} <span style="text-transform:none;letter-spacing:0">(${lang === "ur" ? "یورپی" : "EU"})</span></div>
    <div class="sizes" id="sizes">
      ${sizeBtns.length ? sizeBtns.join("") : `<p style="color:var(--bad);font-weight:600;font-size:14px;margin:4px 0">${t("soldOut")}</p>`}
    </div>

    <div class="sizein"><input id="sizeIn" type="number" inputmode="decimal" step="0.5" min="1" placeholder="${t("enterSize")}"></div>
    <div class="msg" id="msg"></div>

    <div class="actions">
      <button class="btn rose" id="addBtn" ${isSoldOut ? "disabled" : "disabled"}>
        ${ICON.cart} ${isSoldOut ? t("soldOut") : t("add")}
      </button>
      <a class="btn wa" id="waBtn" target="_blank" rel="noopener">${t("wa")}</a>
    </div>
  </div></div></div>`;
}

function bindProduct(p) {
  if (!p) return;
  let ci = 0, size = "";
  const msg = $("#msg"), add = $("#addBtn"), inp = $("#sizeIn");
  const isSoldOut = totalStock(p) === 0;

  // Thumbnail switcher
  const thumbs = $$("#gThumbs button");
  thumbs.forEach(btn => {
    btn.onclick = () => {
      thumbs.forEach(b => b.classList.toggle("on", b === btn));
      const idx = Number(btn.dataset.idx);
      const chosen = (p.photos && p.photos[idx]) || p.img;
      if (chosen) {
        $("#big").innerHTML = `<img src="${chosen}" alt="${esc(pname(p))}">`;
      }
    };
  });

  const setWa = () => {
    const wa = $("#waBtn");
    if (!wa) return;
    wa.href = waLink(`${pname(p)}\n${t("color")}: ${p.colors[ci] ? p.colors[ci].n : ""}\n${t("size")}: ${size || "-"}\n${location.href}`);
  };

  const show = r => {
    msg.className = "msg";
    if (isSoldOut) {
      add.disabled = true;
      return;
    }
    add.disabled = true;
    if (!size && r.state === "invalid" && inp.value === "") return;
    let html = "", cls = "bad";
    if (r.state === "ok") {
      html = "\u2713 " + t("inStock"); cls = "ok"; add.disabled = false;
    } else if (r.state === "low") {
      html = "\u2713 " + t("inStock") + " - " + t("only", { n: r.stock }); cls = "low"; add.disabled = false;
    } else if (r.state === "out") {
      html = t("out") + (r.near && r.near.length ? `. ${t("tryNear")} ${r.near.join(", ")}` : "");
    } else if (r.state === "other") {
      html = t("other_" + r.other) + ` <a href="#/shop/${r.other}">${t("goTo")} \u2192</a>`;
    } else {
      html = t("invalid");
    }
    msg.innerHTML = html; msg.className = "msg show " + cls;
  };

  const apply = v => {
    size = v; inp.value = v;
    $$("#sizes button").forEach(b => b.classList.toggle("on", b.dataset.s === String(v)));
    show(checkSize(p, v));
    setWa();
  };

  $$("#sizes button").forEach(b => b.onclick = () => apply(b.dataset.s));
  inp.oninput = () => apply(inp.value);

  $$("#sw button").forEach(b => b.onclick = () => {
    ci = Number(b.dataset.i);
    $$("#sw button").forEach(x => x.classList.toggle("on", x === b));
    const col = (p.colors[ci] && p.colors[ci].c) || "#B8567A", big = $("#big");
    big.style.background = `radial-gradient(circle at 50% 40%,#fff,${tint(col)})`;
    if (!p.photos || !p.photos.length) {
      big.innerHTML = shoeSVG(p.type, col, p.cat === "kids");
    }
    setWa();
  });

  add.onclick = () => {
    const r = checkSize(p, size);
    if (r.state !== "ok" && r.state !== "low") { toast(t("pickFirst")); return; }
    const color = p.colors[ci] ? p.colors[ci].n : "";
    const line = cart.find(i => i.pid === p.id && i.size === Number(size) && i.color === color);
    const have = line ? line.qty : 0;
    if (have + 1 > r.stock) { toast(t("stockProblem") + " " + pname(p)); return; }

    const photo = (p.photos && p.photos[0]) || p.img || "";
    if (line) {
      line.qty++;
    } else {
      cart.push({
        pid: p.id,
        name: p.name,
        color,
        ci,
        size: Number(size),
        qty: 1,
        price: priceOf(p),
        img: photo
      });
    }
    saveCart();
    toast(t("added"));
    openCart();
  };

  setWa();
}

function totals(P = []) {
  const sub = cart.reduce((a, i) => {
    const p = P.find(x => x.id === i.pid);
    const pr = p ? priceOf(p) : (Number(i.price) || 0);
    return a + pr * (Number(i.qty) || 1);
  }, 0);
  const del = !cart.length || sub >= STORE.freeOver ? 0 : STORE.delivery;
  return { sub, del, total: sub + del };
}

function pageCheckout(P = []) {
  if (!cart.length) {
    return `<div class="wrap"><div class="done"><h1>${t("empty")}</h1><a class="btn" href="#/shop">${t("shop")}</a></div></div>`;
  }
  const tt = totals(P);

  return `<div class="wrap"><div class="pagehead"><h1>${t("checkout")}</h1></div>
  <div class="co">
    <form class="panel" id="coForm" novalidate>
      <div class="field"><label>${t("name")}</label><input name="name" required autocomplete="name"></div>
      <div class="field"><label>${t("phone")}</label><input name="phone" type="tel" required autocomplete="tel" placeholder="03XXXXXXXXX"></div>
      <div class="field"><label>${t("city")}</label><input name="city" required autocomplete="address-level2"></div>
      <div class="field"><label>${t("address")}</label><textarea name="address" required autocomplete="street-address"></textarea></div>
      <div class="lbl" style="margin-top:4px">${t("pay")}</div>
      <div class="pay">
        <label><input type="radio" name="pay" value="cod" checked> ${t("cod")}</label>
        <label><input type="radio" name="pay" value="bank"> ${t("bank")}</label>
      </div>
      <button class="btn rose" id="placeOrderBtn" style="width:100%" type="submit">${t("place")}</button>
    </form>

    <div class="panel">
      ${cart.map(i => {
        const p = P.find(x => x.id === i.pid);
        const imgUrl = (p && p.photos && p.photos[0]) || (p && p.img) || i.img || "";
        const col = (p && p.colors && p.colors[i.ci || 0] && p.colors[i.ci || 0].c) || "#B8567A";
        const unitPrice = p ? priceOf(p) : (Number(i.price) || 0);

        return `
        <div class="it" style="grid-template-columns:64px 1fr auto">
          <div class="th" style="background:${tint(col)}">
            ${imgUrl ? `<img src="${imgUrl}" alt="">` : shoeSVG("sneaker", col)}
          </div>
          <div>
            <b>${esc(p ? pname(p) : i.name)}</b>
            <small>${esc(i.color)} \u00b7 ${t("size")} ${i.size} \u00b7 \u00d7 ${i.qty}</small>
          </div>
          <b>${money(unitPrice * i.qty)}</b>
        </div>`;
      }).join("")}
      <div class="row" style="margin-top:14px"><span>${t("subtotal")}</span><span>${money(tt.sub)}</span></div>
      <div class="row"><span>${t("delivery")}</span><span>${tt.del ? money(tt.del) : t("free")}</span></div>
      <div class="row big" style="margin-top:8px"><span>${t("total")}</span><span>${money(tt.total)}</span></div>
    </div>
  </div></div>`;
}

function bindCheckout(P = []) {
  const f = $("#coForm"); if (!f) return;
  const btn = $("#placeOrderBtn");

  f.onsubmit = async e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(f));
    if (!d.name.trim() || !d.phone.trim() || !d.city.trim() || !d.address.trim()) {
      toast(t("fillAll"));
      return;
    }

    btn.disabled = true;
    btn.textContent = lang === "ur" ? "آرڈر بھیجا جا رہا ہے..." : "Placing order...";

    const tt = totals(P);
    const items = cart.map(i => {
      const p = P.find(x => x.id === i.pid);
      return {
        pid: i.pid,
        name: p ? p.name : i.name || "Shoe",
        color: i.color || "",
        size: String(i.size),
        qty: Number(i.qty) || 1,
        price: p ? priceOf(p) : Number(i.price) || 0,
        img: (p && p.photos && p.photos[0]) || (p && p.img) || i.img || ""
      };
    });

    const sb = getSupabase();
    if (sb) {
      try {
        const { data: orderNo, error } = await sb.rpc("place_order", {
          p_customer: {
            name: d.name.trim(),
            phone: d.phone.trim(),
            city: d.city.trim(),
            address: d.address.trim()
          },
          p_items: items,
          p_payment: d.pay,
          p_subtotal: tt.sub,
          p_delivery: tt.del,
          p_total: tt.total
        });

        if (error) {
          console.error("Order error:", error);
          toast(error.message || "Could not complete order. Please try again.");
          btn.disabled = false;
          btn.textContent = t("place");
          return;
        }

        // Successfully placed
        cart = [];
        saveCart();
        location.hash = "#/done/" + orderNo;
        return;
      } catch (err) {
        console.error("RPC error:", err);
        toast(err.message || "Network error. Please try again.");
        btn.disabled = false;
        btn.textContent = t("place");
        return;
      }
    }

    // Fallback if client is offline
    const orderNo = "KS-" + Math.floor(1000 + Math.random() * 9000);
    cart = [];
    saveCart();
    location.hash = "#/done/" + orderNo;
  };
}

function pageDone(id) {
  const isUr = lang === "ur";
  const txt = isUr
    ? `کنول شوز اسٹور - آرڈر ${id}\nشکریہ!`
    : `Hello Kanwal Shoes Store, I placed order ${id}`;

  return `<div class="wrap"><div class="done">
  <div class="ck"><svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></div>
  <h1>${t("done")}</h1><div class="no">${t("orderNo")}: ${esc(id)}</div>
  <p style="color:var(--muted);margin-bottom:24px">${t("thanks")}</p>
  <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
    <a class="btn wa" target="_blank" rel="noopener" href="${waLink(txt)}">${t("wa")}</a>
    <a class="btn ghost" href="#/">${t("home")}</a>
  </div></div></div>`;
}

/* ---------- cart drawer ---------- */
function saveCart() {
  localStorage.setItem("ks_cart", JSON.stringify(cart));
  drawHeader();
  drawCart();
}

function drawCart() {
  const P = _cachedProducts || getSampleProducts();
  const tt = totals(P);
  $("#drawer").innerHTML = `
  <h3>${t("cart")} <button class="ibtn" id="closeCart" aria-label="${lang === "ur" ? "بند کریں" : "Close"}">\u2715</button></h3>
  <div class="items">${cart.length ? cart.map((i, idx) => {
    const p = P.find(x => x.id === i.pid);
    const col = (p && p.colors && p.colors[i.ci || 0] && p.colors[i.ci || 0].c) || "#B8567A";
    const imgUrl = (p && p.photos && p.photos[0]) || (p && p.img) || i.img || "";
    const unitPrice = p ? priceOf(p) : (Number(i.price) || 0);

    return `<div class="it"><div class="th" style="background:${tint(col)}">
      ${imgUrl ? `<img src="${imgUrl}" alt="">` : shoeSVG("sneaker", col)}
    </div>
    <div><b>${esc(p ? pname(p) : i.name)}</b><small>${esc(i.color)} \u00b7 ${t("size")} ${i.size}</small>
    <div class="qty"><button data-q="-1" data-i="${idx}">\u2212</button><b>${i.qty}</b><button data-q="1" data-i="${idx}">+</button></div></div>
    <div style="text-align:end"><b>${money(unitPrice * i.qty)}</b><br><button class="rm" data-r="${idx}">${t("remove")}</button></div></div>`;
  }).join("") : `<div class="emptyc">${t("empty")}</div>`}</div>
  ${cart.length ? `<div class="dfoot">
    <div class="row"><span>${t("subtotal")}</span><span>${money(tt.sub)}</span></div>
    <div class="row"><span>${t("delivery")}</span><span>${tt.del ? money(tt.del) : t("free")}</span></div>
    <div class="row big"><span>${t("total")}</span><span>${money(tt.total)}</span></div>
    <a class="btn rose" href="#/checkout" id="goCo">${t("checkout")}</a></div>` : ""}`;

  $("#closeCart").onclick = closeCart;
  const go = $("#goCo"); if (go) go.onclick = closeCart;
  $$("[data-q]").forEach(b => b.onclick = () => {
    const idx = Number(b.dataset.i);
    const i = cart[idx];
    const p = P.find(x => x.id === i.pid);
    const d = Number(b.dataset.q);
    const stock = Number((p && p.sizes && p.sizes[i.size]) || 99);
    if (d > 0 && i.qty + 1 > stock) { toast(t("stockProblem") + " " + (p ? pname(p) : "")); return; }
    i.qty += d;
    if (i.qty <= 0) cart.splice(idx, 1);
    saveCart();
  });
  $$("[data-r]").forEach(b => b.onclick = () => {
    cart.splice(Number(b.dataset.r), 1);
    saveCart();
  });
}

function openCart() { drawCart(); $("#drawer").classList.add("on"); $("#ovl").classList.add("on"); }
function closeCart() { $("#drawer").classList.remove("on"); $("#ovl").classList.remove("on"); }

/* ---------- router ---------- */
async function route() {
  const raw = location.hash.slice(1) || "/";
  const [path, qs] = raw.split("?");
  const q = new URLSearchParams(qs || "");
  const parts = path.split("/").filter(Boolean);
  const app = $("#app");

  if (!parts.length) {
    if (!_cachedProducts) {
      app.innerHTML = `<div class="loading-box"><div class="spinner"></div><p>${t("loading")}</p></div>`;
    }
    const P = await fetchProducts();
    app.innerHTML = pageHome(P);
  } else if (parts[0] === "shop") {
    if (!_cachedProducts) {
      app.innerHTML = `<div class="loading-box"><div class="spinner"></div><p>${t("loading")}</p></div>`;
    }
    const P = await fetchProducts();
    app.innerHTML = pageShop(parts[1], q.get("type"), P);
  } else if (parts[0] === "product") {
    app.innerHTML = `<div class="wrap"><div class="loading-box"><div class="spinner"></div><p>${t("loading")}</p></div></div>`;
    const p = await fetchProductById(parts[1]);
    if (!p) {
      app.innerHTML = `<div class="wrap"><div class="done"><h1>404</h1><p>Product not found</p><a class="btn" href="#/">${t("home")}</a></div></div>`;
    } else {
      app.innerHTML = pageProduct(p);
      bindProduct(p);
    }
  } else if (parts[0] === "checkout") {
    const P = await fetchProducts();
    app.innerHTML = pageCheckout(P);
    bindCheckout(P);
  } else if (parts[0] === "done") {
    app.innerHTML = pageDone(parts[1]);
  } else {
    const P = await fetchProducts();
    app.innerHTML = pageHome(P);
  }

  drawHeader();
  window.scrollTo(0, 0);
}

window.addEventListener("hashchange", route);
$("#ovl").onclick = closeCart;
document.addEventListener("keydown", e => { if (e.key === "Escape") closeCart(); });
window.addEventListener("storage", () => {
  try {
    cart = JSON.parse(localStorage.getItem("ks_cart") || "[]");
  } catch (e) { cart = []; }
  drawHeader();
});

applyLang();
drawHeader();
drawFooter();
drawCart();
route();
if (!lang) langPopup();
