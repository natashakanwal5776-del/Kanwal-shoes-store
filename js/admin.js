/* Kanwal Shoes Store - admin */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const money = n => STORE.currency + " " + Number(n || 0).toLocaleString("en-US");
let tab = "dash";
function toast(m) {
 const el = $("#toast"); el.textContent = m; el.classList.add("on");
 clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove("on"), 2000);
}
/* ---------- login ---------- */
function showLogin() {
 $("#root").innerHTML = `<div class="login"><form class="box" id="lf">
 <h1>Kanwal Shoes Store</h1><p>Admin</p>
 <div class="field"><label>Password</label><input type="password" id="pw" autocomplete="current-password" autofocus></div>
 <button class="btn rose" style="width:100%" type="submit">Login</button>
 <p class="note" id="err"></p></form></div>`;
 $("#lf").onsubmit = e => {
 e.preventDefault();
 if ($("#pw").value === STORE.adminPassword) { sessionStorage.setItem("ks_admin", "1"); showApp(); }
 else $("#err").textContent = "Wrong password";
 };
}
/* ---------- shell ---------- */
function showApp() {
 $("#root").innerHTML = `
 <div class="atop"><div class="wrap bar">
 <a class="logo" href="index.html">Kanwal Shoes Store<small>Admin</small></a>
 <div class="tabs">
 <button data-t="dash">Dashboard</button><button data-t="products">Products</button><button data-t="orders">Orders</button>
 </div>
 <button class="out" id="logout">Logout</button>
 </div></div>
 <div class="wrap ac" id="ac"></div>`;
 $$(".tabs button").forEach(b => b.onclick = () => { tab = b.dataset.t; render(); });
 $("#logout").onclick = () => { sessionStorage.removeItem("ks_admin"); showLogin(); };
 render();
}
function render() {
 $$(".tabs button").forEach(b => b.classList.toggle("on", b.dataset.t === tab));
 if (tab === "products") viewProducts();
 else if (tab === "orders") viewOrders();
 else viewDash();
}
/* ---------- dashboard ---------- */
function viewDash() {
 const P = getProducts(), O = getOrders();
 const live = O.filter(o => o.status !== "cancelled");
 const revenue = live.reduce((a, o) => a + o.total, 0);
 const pending = O.filter(o => o.status === "pending").length;
 let low = 0;
 P.forEach(p => Object.values(p.sizes).forEach(s => { if (Number(s) <= 2) low++; }));
 $("#ac").innerHTML = `
 <div class="stats">
 <div class="stat"><b>${O.length}</b><span>Orders</span></div>
 <div class="stat"><b>${pending}</b><span>Pending</span></div>
 <div class="stat"><b>${money(revenue)}</b><span>Sales</span></div>
 <div class="stat"><b>${P.length}</b><span>Products</span></div>
 <div class="stat"><b>${low}</b><span>Sizes low / out</span></div>
 </div>
 <div class="ahead"><h2>Backup</h2></div>
 <div style="display:flex;gap:10px;flex-wrap:wrap">
 <button class="sbtn" id="exp">Download backup</button>
 <button class="sbtn g" id="imp">Restore backup</button>
 <button class="sbtn d" id="rst">Reset sample products</button>
 <input type="file" id="impf" accept="application/json" hidden>
 </div>
 <p class="note">Products and orders are saved in this browser. Download a backup regularly. (Antigravity can connect this to a real database - see README.)</p>`;
 $("#exp").onclick = () => {
 const blob = new Blob([JSON.stringify({ products: getProducts(), orders: getOrders() })], { type: "application/json" });
 const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
 a.download = "kanwal-shoes-backup.json"; a.click();
 };
 $("#imp").onclick = () => $("#impf").click();
 $("#impf").onchange = e => {
 const f = e.target.files[0]; if (!f) return;
 const r = new FileReader();
 r.onload = () => {
 try { const d = JSON.parse(r.result); saveProducts(d.products || []); saveOrders(d.orders || []); toast("Restored"); render(); }
 catch (x) { toast("Invalid file"); }
 };
 r.readAsText(f);
 };
 $("#rst").onclick = () => { if (confirm("Replace all products with the sample products?")) { saveProducts(seedProducts()); toast("Done"); render(); } };
}
/* ---------- products ---------- */
function viewProducts() {
 const P = getProducts();
 $("#ac").innerHTML = `
 <div class="ahead"><h2>Products</h2><button class="sbtn" id="newP">+ Add product</button></div>
 <div class="tw"><table><thead><tr><th></th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th></th></tr></thead><tbody>
 ${P.map(p => {
 const col = p.colors[0] ? p.colors[0].c : "#B8567A";
 const tot = Object.values(p.sizes).reduce((a, b) => a + Number(b), 0);
 return `<tr><td><div class="mini" style="background:${tint(col)}">${p.img ? `<img src="${p.img}" alt="">` : shoeSVG(p.type, col, p.cat === "kids")}</div></td>
 <td><b>${esc(pname(p))}</b></td><td><span class="pill">${p.cat}</span></td>
 <td>${money(priceOf(p))}${p.sale && p.sale < p.price ? ` <s style="color:#999">${money(p.price)}</s>` : ""}</td>
 <td>${tot}</td>
 <td style="white-space:nowrap"><button class="sbtn g" data-e="${p.id}">Edit</button> <button class="sbtn d" data-d="${p.id}">Delete</button></td></tr>`;
 }).join("")}
 </tbody></table></div>`;
 $("#newP").onclick = () => productForm();
 $$("[data-e]").forEach(b => b.onclick = () => productForm(Number(b.dataset.e)));
 $$("[data-d]").forEach(b => b.onclick = () => {
 if (!confirm("Delete this product?")) return;
 saveProducts(getProducts().filter(p => p.id !== Number(b.dataset.d))); render();
 });
}
function resizeImage(file, cb) {
 const fr = new FileReader();
 fr.onload = () => {
 const im = new Image();
 im.onload = () => {
 const max = 800, k = Math.min(1, max / Math.max(im.width, im.height));
 const c = document.createElement("canvas"); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
 c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
 cb(c.toDataURL("image/jpeg", .82));
 };
 im.src = fr.result;
 };
 fr.readAsDataURL(file);
}
function productForm(id) {
 const all = getProducts();
 const p = id ? JSON.parse(JSON.stringify(all.find(x => x.id === id))) :
 { id: 0, cat: "women", type: "sneaker", name: "", nameUr: "", price: 0, sale: 0, colors: [{ n: "Black", c: "#2D1B2E" }], sizes: {}, img: "" };
 let sizes = { ...p.sizes }, img = p.img || "";
 const m = document.createElement("div"); m.className = "mbk";
 m.innerHTML = `<form class="mbox" novalidate>
 <h3>${id ? "Edit product" : "Add product"}</h3>
 <div class="two">
 <div class="field"><label>Name</label><input name="name" value="${esc(p.name)}" required></div>
 <div class="field"><label>Urdu name (optional)</label><input name="nameUr" value="${esc(p.nameUr)}" dir="rtl"></div>
 <div class="field"><label>Category</label><select name="cat">${["women", "men", "kids"].map(c => `<option ${p.cat === c ? "selected" : ""}>${c}</option>`).join("")}</select></div>
 <div class="field"><label>Type</label><select name="type">${TYPES.map(c => `<option ${p.type === c ? "selected" : ""}>${c}</option>`).join("")}</select></div>
 <div class="field"><label>Price (${STORE.currency})</label><input name="price" type="number" min="0" value="${p.price}" required></div>
 <div class="field"><label>Sale price (0 = none)</label><input name="sale" type="number" min="0" value="${p.sale || 0}"></div>
 </div>
 <div class="lbl">Colours</div><div id="cols"></div>
 <button type="button" class="sbtn g" id="addCol">+ Colour</button>
 <div class="lbl">Photo (optional)</div>
 <div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap">
 <div class="prev" id="prev"></div>
 <div><input type="file" id="imgf" accept="image/*"> <button type="button" class="sbtn g" id="noimg">Remove photo</button>
 <p class="note">No photo = a drawn shoe in the chosen colour is shown.</p></div></div>
 <div class="lbl">Stock per size (EU) <span id="rng" style="text-transform:none"></span></div>
 <div class="sgrid" id="sg"></div>
 <div class="mfoot"><button type="button" class="sbtn g" id="cx">Cancel</button><button type="submit" class="sbtn">Save</button></div>
 </form>`;
 document.body.appendChild(m);
 const f = $("form", m);
 const drawCols = () => {
 $("#cols", m).innerHTML = p.colors.map((c, i) => `<div class="crow">
 <input type="text" data-cn="${i}" value="${esc(c.n)}" placeholder="Colour name">
 <input type="color" data-cc="${i}" value="${/^#[0-9a-f]{6}$/i.test(c.c) ? c.c : "#B8567A"}">
 <button type="button" class="sbtn d" data-cr="${i}">\u2715</button></div>`).join("");
 $$("[data-cn]", m).forEach(x => x.oninput = () => { p.colors[x.dataset.cn].n = x.value; });
 $$("[data-cc]", m).forEach(x => x.oninput = () => { p.colors[x.dataset.cc].c = x.value; drawPrev(); });
 $$("[data-cr]", m).forEach(x => x.onclick = () => { p.colors.splice(Number(x.dataset.cr), 1); drawCols(); drawPrev(); });
 };
 const drawPrev = () => {
 const col = p.colors[0] ? p.colors[0].c : "#B8567A";
 $("#prev", m).innerHTML = img ? `<img src="${img}" alt="">` : `<div style="width:92%">${shoeSVG(f.type.value, col, f.cat.value === "kids")}</div>`;
 };
 const drawSizes = () => {
 const [a, b] = RANGES[f.cat.value];
 $("#rng", m).textContent = `(${a} - ${b})`;
 let h = "";
 for (let n = a; n <= b; n++) h += `<label>${n}<input type="number" min="0" data-sz="${n}" value="${sizes[n] || 0}"></label>`;
 $("#sg", m).innerHTML = h;
 $$("[data-sz]", m).forEach(x => x.oninput = () => { sizes[x.dataset.sz] = Math.max(0, Number(x.value) || 0); });
 };
 drawCols(); drawPrev(); drawSizes();
 f.cat.onchange = () => { drawSizes(); drawPrev(); };
 f.type.onchange = drawPrev;
 $("#addCol", m).onclick = () => { p.colors.push({ n: "", c: "#B8567A" }); drawCols(); };
 $("#imgf", m).onchange = e => { const file = e.target.files[0]; if (file) resizeImage(file, d => { img = d; drawPrev(); }); };
 $("#noimg", m).onclick = () => { img = ""; drawPrev(); };
 $("#cx", m).onclick = () => m.remove();
 f.onsubmit = e => {
 e.preventDefault();
 const name = f.name.value.trim(); if (!name) { toast("Enter a name"); return; }
 const [a, b] = RANGES[f.cat.value], clean = {};
 for (let n = a; n <= b; n++) clean[n] = Number(sizes[n] || 0);
 const cols = p.colors.filter(c => c.n.trim()).map(c => ({ n: c.n.trim(), c: c.c }));
 if (!cols.length) cols.push({ n: "Default", c: "#B8567A" });
 const rec = {
 id: p.id || (Math.max(0, ...all.map(x => x.id)) + 1), cat: f.cat.value, type: f.type.value, name,
 nameUr: f.nameUr.value.trim(), price: Number(f.price.value) || 0, sale: Number(f.sale.value) || 0,
 colors: cols, sizes: clean, img, created: p.created || Date.now()
 };
 const list = id ? all.map(x => (x.id === id ? rec : x)) : [...all, rec];
 saveProducts(list); m.remove(); toast("Saved"); render();
 };
}
/* ---------- orders ---------- */
const STATUSES = ["pending", "confirmed", "packed", "shipped", "delivered", "cancelled"];
function viewOrders() {
 const O = [...getOrders()].reverse();
 $("#ac").innerHTML = `<div class="ahead"><h2>Orders</h2></div>
 <div class="tw"><table><thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th></th></tr></thead><tbody>
 ${O.length ? O.map(o => `<tr>
 <td><b>${esc(o.id)}</b><br><small style="color:#888">${new Date(o.date).toLocaleDateString()}</small><br><span class="pill">${o.pay === "cod" ? "COD" : "Transfer"}</span></td>
 <td>${esc(o.customer.name)}<br><a href="tel:${esc(o.customer.phone)}">${esc(o.customer.phone)}</a><br><small>${esc(o.customer.city)}, ${esc(o.customer.address)}</small></td>
 <td>${o.items.map(i => `${esc(i.name)} <small>(${esc(i.color)}, ${i.size}) \u00d7${i.qty}</small>`).join("<br>")}</td>
 <td><b>${money(o.total)}</b></td>
 <td><select class="st" data-o="${o.id}">${STATUSES.map(s => `<option ${o.status === s ? "selected" : ""}>${s}</option>`).join("")}</select></td>
 <td><a class="sbtn g" style="display:inline-grid;place-items:center" target="_blank" rel="noopener" href="https://wa.me/92${esc(o.customer.phone.replace(/\D/g, "").replace(/^0/, "").replace(/^92/, ""))}?text=${encodeURIComponent("Kanwal Shoes Store - order " + o.id)}">WhatsApp</a></td>
 </tr>`).join("") : `<tr><td colspan="6" style="text-align:center;color:#888;padding:40px">No orders yet</td></tr>`}
 </tbody></table></div>`;
 $$("[data-o]").forEach(s => s.onchange = () => {
 const list = getOrders(), o = list.find(x => x.id === s.dataset.o);
 const was = o.status; o.status = s.value;
 if (s.value === "cancelled" && was !== "cancelled" && !o.restocked) {
 const P = getProducts();
 o.items.forEach(i => { const p = P.find(x => x.id === i.pid); if (p) p.sizes[i.size] = (p.sizes[i.size] || 0) + i.qty; });
 saveProducts(P); o.restocked = true;
 }
 saveOrders(list); toast("Updated");
 });
}
if (sessionStorage.getItem("ks_admin")) showApp(); else showLogin();
