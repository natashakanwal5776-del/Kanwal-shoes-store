/* Kanwal Shoes Store - Full-Control Admin Panel with Supabase Auth, DB, and Storage */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const money = n => STORE.currency + " " + Number(n || 0).toLocaleString("en-US");

let tab = "products";
let currentProducts = [];
let currentOrders = [];
let currentUser = null;

function toast(m) {
  const el = $("#toast");
  if (!el) return;
  el.textContent = m;
  el.classList.add("on");
  clearTimeout(toast.t);
  toast.t = setTimeout(() => el.classList.remove("on"), 2500);
}

/* ---------- Supabase Client Helper ---------- */
function sb() {
  return getSupabase();
}

/* ---------- Login UI ---------- */
function showLogin() {
  $("#root").innerHTML = `
  <div class="login">
    <form class="box" id="loginForm" novalidate>
      <h1>Kanwal Shoes Store</h1>
      <p>Owner & Admin Sign In</p>
      <div class="field">
        <label style="display:block;font-weight:600;font-size:13px;margin-bottom:6px">Admin Email</label>
        <input type="email" id="admEmail" required autocomplete="email" placeholder="admin@example.com" autofocus>
      </div>
      <div class="field">
        <label style="display:block;font-weight:600;font-size:13px;margin-bottom:6px">Password</label>
        <input type="password" id="admPassword" required autocomplete="current-password" placeholder="••••••••">
      </div>
      <button class="sbtn" style="width:100%;margin-top:10px" type="submit" id="loginBtn">Sign In</button>
      <p class="note" id="loginErr" style="color:var(--bad);margin-top:12px;font-weight:600"></p>
    </form>
  </div>`;

  $("#loginForm").onsubmit = async e => {
    e.preventDefault();
    const email = $("#admEmail").value.trim();
    const password = $("#admPassword").value;
    const btn = $("#loginBtn");
    const err = $("#loginErr");

    if (!email || !password) {
      err.textContent = "Please enter both email and password";
      return;
    }

    btn.disabled = true;
    btn.textContent = "Signing in...";
    err.textContent = "";

    const client = sb();
    if (!client) {
      err.textContent = "Supabase client is not loaded. Check internet connection.";
      btn.disabled = false;
      btn.textContent = "Sign In";
      return;
    }

    try {
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) {
        err.textContent = error.message || "Invalid login credentials";
        btn.disabled = false;
        btn.textContent = "Sign In";
        return;
      }
      currentUser = data.user;
      showApp();
    } catch (ex) {
      err.textContent = ex.message || "An error occurred during sign in";
      btn.disabled = false;
      btn.textContent = "Sign In";
    }
  };
}

/* ---------- App Shell ---------- */
function showApp() {
  $("#root").innerHTML = `
  <div class="atop">
    <div class="wrap bar">
      <a class="logo" href="index.html">Kanwal Shoes Store <small>Admin</small></a>
      <div class="tabs">
        <button data-t="products" class="${tab === "products" ? "on" : ""}">Products</button>
        <button data-t="orders" class="${tab === "orders" ? "on" : ""}">Orders</button>
        <button data-t="dash" class="${tab === "dash" ? "on" : ""}">Dashboard</button>
      </div>
      <button class="out" id="logoutBtn">Logout</button>
    </div>
  </div>
  <div class="wrap ac" id="ac"></div>`;

  $$(".tabs button").forEach(b => {
    b.onclick = () => {
      tab = b.dataset.t;
      $$(".tabs button").forEach(btn => btn.classList.toggle("on", btn === b));
      render();
    };
  });

  $("#logoutBtn").onclick = async () => {
    const client = sb();
    if (client) await client.auth.signOut();
    currentUser = null;
    showLogin();
  };

  render();
}

function render() {
  if (tab === "products") viewProducts();
  else if (tab === "orders") viewOrders();
  else viewDash();
}

/* ==========================================================================
   PRODUCTS MANAGEMENT
   ========================================================================== */
let prodSearchQuery = "";
let prodCollectionFilter = "all";

async function fetchAllAdminProducts() {
  const client = sb();
  if (!client) return getSampleProducts();
  try {
    const { data, error } = await client
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch products error:", error);
      toast("Error fetching products: " + error.message);
      return currentProducts.length ? currentProducts : getSampleProducts();
    }
    currentProducts = (data || []).map(normalizeProduct);
    return currentProducts;
  } catch (err) {
    console.error(err);
    return currentProducts.length ? currentProducts : getSampleProducts();
  }
}

async function viewProducts() {
  const container = $("#ac");
  container.innerHTML = `<div class="loading-box"><div class="spinner"></div><p>Loading products from Supabase...</p></div>`;

  const prods = await fetchAllAdminProducts();
  renderProductsList(prods);
}

function renderProductsList(prods) {
  let filtered = prods;
  if (prodCollectionFilter !== "all") {
    filtered = filtered.filter(p => p.cat === prodCollectionFilter);
  }
  if (prodSearchQuery) {
    const q = prodSearchQuery.toLowerCase();
    filtered = filtered.filter(p =>
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.nameUr && p.nameUr.toLowerCase().includes(q)) ||
      (p.type && p.type.toLowerCase().includes(q))
    );
  }

  $("#ac").innerHTML = `
  <div class="ahead">
    <h2>Shoe Products (${prods.length})</h2>
    <button class="sbtn" id="newProdBtn">+ Add a New Shoe</button>
  </div>

  <div class="filter-bar">
    <input type="text" class="search-in" id="prodSearch" placeholder="Search by name or shoe type..." value="${esc(prodSearchQuery)}">
    <select class="sel-cat" id="prodFilterCat">
      <option value="all" ${prodCollectionFilter === "all" ? "selected" : ""}>All Collections</option>
      <option value="women" ${prodCollectionFilter === "women" ? "selected" : ""}>Women</option>
      <option value="men" ${prodCollectionFilter === "men" ? "selected" : ""}>Men</option>
      <option value="kids" ${prodCollectionFilter === "kids" ? "selected" : ""}>Kids</option>
    </select>
  </div>

  <div class="tw">
    <table>
      <thead>
        <tr>
          <th style="width:70px">Photo</th>
          <th>Name & Category</th>
          <th>Price</th>
          <th>Total Stock</th>
          <th>Status</th>
          <th>Hide / Show</th>
          <th style="text-align:end">Actions</th>
        </tr>
      </thead>
      <tbody>
        ${filtered.length ? filtered.map(p => {
          const mainImg = (p.photos && p.photos[0]) || p.img || "";
          const tot = totalStock(p);
          const isSoldOut = tot === 0;

          return `
          <tr>
            <td>
              <div class="mini">
                ${mainImg ? `<img src="${mainImg}" alt="">` : shoeSVG(p.type, p.colors[0] && p.colors[0].c, p.cat === "kids")}
              </div>
            </td>
            <td>
              <b>${esc(p.name)}</b>
              ${p.nameUr ? `<br><small style="color:var(--muted)">${esc(p.nameUr)}</small>` : ""}
              <br><span class="pill" style="margin-top:4px">${p.cat} &bull; ${p.type}</span>
            </td>
            <td>
              <b>${money(p.price)}</b>
              ${p.sale && p.sale < p.price ? `<br><small style="color:var(--rose)">Sale: ${money(p.sale)}</small>` : ""}
            </td>
            <td>
              <b>${tot}</b> pairs
            </td>
            <td>
              ${isSoldOut ? `<span class="badge-soldout">Sold out</span>` : ""}
              ${p.hidden ? `<span class="badge-hidden">Hidden</span>` : (!isSoldOut ? `<span class="badge-live">Live</span>` : "")}
            </td>
            <td>
              <label class="toggle-switch" title="Toggle visibility on website">
                <input type="checkbox" data-toggle="${p.id}" ${!p.hidden ? "checked" : ""}>
                <span class="toggle-slider"></span>
              </label>
            </td>
            <td style="text-align:end;white-space:nowrap">
              <button class="sbtn g" style="padding:0 12px;min-height:34px;font-size:13px" data-edit="${p.id}">Edit</button>
              <button class="sbtn d" style="padding:0 12px;min-height:34px;font-size:13px" data-del="${p.id}">Delete</button>
            </td>
          </tr>`;
        }).join("") : `
          <tr>
            <td colspan="7" style="text-align:center;color:var(--muted);padding:40px">
              No products found matching filters.
            </td>
          </tr>
        `}
      </tbody>
    </table>
  </div>`;

  $("#newProdBtn").onclick = () => openProductModal();

  $("#prodSearch").oninput = e => {
    prodSearchQuery = e.target.value;
    renderProductsList(currentProducts);
  };

  $("#prodFilterCat").onchange = e => {
    prodCollectionFilter = e.target.value;
    renderProductsList(currentProducts);
  };

  // Toggle Visibility
  $$("[data-toggle]").forEach(chk => {
    chk.onchange = async () => {
      const id = chk.dataset.toggle;
      const hidden = !chk.checked;
      const client = sb();
      if (client) {
        const { error } = await client.from("products").update({ hidden }).eq("id", id);
        if (error) {
          toast("Error updating visibility: " + error.message);
          chk.checked = !chk.checked;
          return;
        }
      }
      const item = currentProducts.find(x => x.id === id);
      if (item) item.hidden = hidden;
      toast(hidden ? "Product hidden from store" : "Product is now live on store");
      renderProductsList(currentProducts);
    };
  });

  // Edit Product
  $$("[data-edit]").forEach(btn => {
    btn.onclick = () => {
      const p = currentProducts.find(x => x.id === btn.dataset.edit);
      if (p) openProductModal(p);
    };
  });

  // Delete Product
  $$("[data-del]").forEach(btn => {
    btn.onclick = async () => {
      const id = btn.dataset.del;
      const p = currentProducts.find(x => x.id === id);
      if (!p) return;

      if (!confirm(`Delete this shoe?\n\n"${p.name}" will disappear from the website immediately, and its photos and video will be deleted.`)) {
        return;
      }

      btn.disabled = true;
      btn.textContent = "Deleting...";

      const client = sb();
      if (client) {
        try {
          // Remove from products table
          const { error } = await client.from("products").delete().eq("id", id);
          if (error) {
            toast("Delete failed: " + error.message);
            btn.disabled = false;
            btn.textContent = "Delete";
            return;
          }

          // Clean up files in product-media bucket
          if (p.photos && p.photos.length) {
            const filesToRemove = [];
            p.photos.forEach(url => {
              const m = url.match(/\/product-media\/(.+)$/);
              if (m) filesToRemove.push(decodeURIComponent(m[1]));
            });
            if (p.video_url) {
              const mv = p.video_url.match(/\/product-media\/(.+)$/);
              if (mv) filesToRemove.push(decodeURIComponent(mv[1]));
            }
            if (filesToRemove.length) {
              await client.storage.from("product-media").remove(filesToRemove);
            }
          }
        } catch (err) {
          console.warn("Storage cleanup note:", err);
        }
      }

      currentProducts = currentProducts.filter(x => x.id !== id);
      toast("Product deleted successfully");
      renderProductsList(currentProducts);
    };
  });
}

/* ==========================================================================
   IMAGE COMPRESSION & RESIZING (Browser Canvas)
   Max 1200px wide, quality ~0.82 JPEG
   ========================================================================== */
function compressImage(file, maxDimension = 1200, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = e => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(blob => {
          if (blob) resolve(blob);
          else reject(new Error("Image compression failed"));
        }, "image/jpeg", quality);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/* ==========================================================================
   ADD / EDIT PRODUCT MODAL
   ========================================================================== */
function openProductModal(existingProduct = null) {
  const isEdit = Boolean(existingProduct);
  const p = isEdit
    ? JSON.parse(JSON.stringify(existingProduct))
    : {
        id: "",
        name: "",
        nameUr: "",
        cat: "women",
        type: "sneaker",
        price: "",
        sale: "",
        colors: [{ n: "Black", c: "#2D1B2E" }],
        sizes: {},
        photos: [],
        video_url: "",
        hidden: false
      };

  let activePhotos = Array.isArray(p.photos) ? [...p.photos] : (p.img ? [p.img] : []);
  let activeSizes = { ...p.sizes };
  let activeVideo = p.video_url || "";

  const modal = document.createElement("div");
  modal.className = "mbk";

  modal.innerHTML = `
  <form class="mbox" id="prodForm" novalidate>
    <h3>${isEdit ? "Edit Shoe Product" : "Add a New Shoe"}</h3>

    <div class="two">
      <div class="field">
        <label style="font-weight:600;font-size:13px;display:block;margin-bottom:5px">Name (English) *</label>
        <input name="name" value="${esc(p.name)}" required placeholder="e.g. Kanwal Leather Ankle Boot" style="width:100%;height:44px;border-radius:10px;border:1.5px solid var(--line);padding:0 12px">
      </div>
      <div class="field">
        <label style="font-weight:600;font-size:13px;display:block;margin-bottom:5px">Urdu Name (Optional)</label>
        <input name="nameUr" value="${esc(p.nameUr || p.name_ur || "")}" dir="rtl" placeholder="مثال: کنول لیدر اینکل بوٹ" style="width:100%;height:44px;border-radius:10px;border:1.5px solid var(--line);padding:0 12px">
      </div>
      <div class="field">
        <label style="font-weight:600;font-size:13px;display:block;margin-bottom:5px">Collection *</label>
        <select name="cat" id="formCat" style="width:100%;height:44px;border-radius:10px;border:1.5px solid var(--line);padding:0 12px;background:#fff">
          <option value="women" ${p.cat === "women" ? "selected" : ""}>Women (Sizes 35 - 42)</option>
          <option value="men" ${p.cat === "men" ? "selected" : ""}>Men (Sizes 39 - 46)</option>
          <option value="kids" ${p.cat === "kids" ? "selected" : ""}>Kids (Sizes 18 - 34)</option>
        </select>
      </div>
      <div class="field">
        <label style="font-weight:600;font-size:13px;display:block;margin-bottom:5px">Type *</label>
        <select name="type" style="width:100%;height:44px;border-radius:10px;border:1.5px solid var(--line);padding:0 12px;background:#fff">
          ${TYPES.map(t => `<option value="${t}" ${p.type === t ? "selected" : ""}>${t.charAt(0).toUpperCase() + t.slice(1)}</option>`).join("")}
        </select>
      </div>
      <div class="field">
        <label style="font-weight:600;font-size:13px;display:block;margin-bottom:5px">Price (${STORE.currency}) *</label>
        <input name="price" type="number" min="0" value="${p.price}" required placeholder="4500" style="width:100%;height:44px;border-radius:10px;border:1.5px solid var(--line);padding:0 12px">
      </div>
      <div class="field">
        <label style="font-weight:600;font-size:13px;display:block;margin-bottom:5px">Sale Price (Optional, 0 = no sale)</label>
        <input name="sale" type="number" min="0" value="${p.sale || ""}" placeholder="3800" style="width:100%;height:44px;border-radius:10px;border:1.5px solid var(--line);padding:0 12px">
      </div>
    </div>

    <!-- COLOURS -->
    <div style="margin:20px 0 10px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
        <b style="font-size:14px">Available Colours</b>
        <button type="button" class="sbtn g" id="addColBtn" style="min-height:32px;font-size:12px">+ Add Colour</button>
      </div>
      <div id="colsList"></div>
    </div>

    <!-- STOCK PER SIZE -->
    <div style="margin:20px 0 10px">
      <b style="font-size:14px">Stock per Size (EU) <span id="sizesRangeTxt" style="color:var(--muted);font-weight:normal"></span></b>
      <p class="note" style="margin-bottom:10px">Enter the number of pairs in stock for each size. Type <b>0</b> if not available.</p>
      <div class="sgrid" id="sizesGrid"></div>
    </div>

    <!-- PHOTOS -->
    <div style="margin:22px 0 10px">
      <b style="font-size:14px">Product Photos</b>
      <p class="note">Upload photos from computer or phone. Photos are automatically compressed (max 1200px) before upload.</p>
      <div class="photo-grid" id="photoGrid"></div>
      <div style="margin-top:10px;display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <label class="sbtn g" style="cursor:pointer">
          📁 Upload Photos
          <input type="file" id="photoInput" multiple accept="image/*" hidden>
        </label>
        <span id="photoStatus" style="font-size:13px;color:var(--muted)"></span>
      </div>
    </div>

    <!-- VIDEO (OPTIONAL) -->
    <div style="margin:22px 0 10px">
      <b style="font-size:14px">Product Video (Optional)</b>
      <p class="note">Upload a video (10-30s, max 25 MB) OR paste a YouTube video link.</p>

      <div style="display:grid;gap:10px;margin-top:8px">
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <label class="sbtn g" style="cursor:pointer">
            🎥 Upload Video File (Max 25 MB)
            <input type="file" id="videoInput" accept="video/mp4,video/quicktime,video/webm" hidden>
          </label>
          <span style="font-size:13px;color:var(--muted)">OR</span>
          <input type="url" id="ytInput" placeholder="Paste YouTube link: https://youtube.com/watch?v=..." value="${getYouTubeEmbedUrl(activeVideo) ? activeVideo : ""}" style="flex:1;min-width:240px;height:42px;border-radius:10px;border:1.5px solid var(--line);padding:0 12px">
        </div>
        <span id="videoStatus" style="font-size:13px;color:var(--muted)"></span>
        <div id="videoPreviewWrap"></div>
      </div>
    </div>

    <div class="mfoot">
      <button type="button" class="sbtn g" id="cancelModalBtn">Cancel</button>
      <button type="submit" class="sbtn" id="saveProdBtn">${isEdit ? "Save Changes" : "Create Product"}</button>
    </div>
  </form>`;

  document.body.appendChild(modal);

  const form = $("#prodForm", modal);
  const catSelect = $("#formCat", modal);

  // Render Colours
  function renderColours() {
    $("#colsList", modal).innerHTML = p.colors.map((c, i) => `
      <div class="crow">
        <input type="text" data-cn="${i}" value="${esc(c.n)}" placeholder="e.g. Royal Blue">
        <input type="color" data-cc="${i}" value="${/^#[0-9a-f]{6}$/i.test(c.c) ? c.c : "#B8567A"}">
        <button type="button" class="sbtn d" style="min-height:36px;padding:0 10px" data-delcol="${i}">✕</button>
      </div>`).join("");

    $$("[data-cn]", modal).forEach(input => {
      input.oninput = () => { p.colors[Number(input.dataset.cn)].n = input.value; };
    });
    $$("[data-cc]", modal).forEach(input => {
      input.oninput = () => { p.colors[Number(input.dataset.cc)].c = input.value; };
    });
    $$("[data-delcol]", modal).forEach(btn => {
      btn.onclick = () => {
        p.colors.splice(Number(btn.dataset.delcol), 1);
        if (!p.colors.length) p.colors.push({ n: "Default", c: "#B8567A" });
        renderColours();
      };
    });
  }

  $("#addColBtn", modal).onclick = () => {
    p.colors.push({ n: "", c: "#B8567A" });
    renderColours();
  };

  // Render Sizes
  function renderSizes() {
    const cat = catSelect.value;
    const [a, b] = RANGES[cat] || [35, 42];
    $("#sizesRangeTxt", modal).textContent = `(${a} - ${b})`;

    let html = "";
    for (let s = a; s <= b; s++) {
      const val = activeSizes[s] != null ? activeSizes[s] : 0;
      html += `
      <label>
        ${s}
        <input type="number" min="0" data-size="${s}" value="${val}">
      </label>`;
    }
    $("#sizesGrid", modal).innerHTML = html;

    $$("[data-size]", modal).forEach(inp => {
      inp.oninput = () => {
        activeSizes[inp.dataset.size] = Math.max(0, parseInt(inp.value, 10) || 0);
      };
    });
  }

  catSelect.onchange = () => renderSizes();

  // Render Photos
  function renderPhotos() {
    const grid = $("#photoGrid", modal);
    if (!activePhotos.length) {
      grid.innerHTML = `<p style="color:var(--muted);font-size:13px;grid-column:1/-1">No photos added yet.</p>`;
      return;
    }

    grid.innerHTML = activePhotos.map((url, i) => `
      <div class="photo-card">
        ${i === 0 ? `<span class="badge-main">Main</span>` : ""}
        <div class="thumb"><img src="${url}" alt=""></div>
        <div class="photo-actions">
          ${i !== 0 ? `<button type="button" class="sbtn g" data-main="${i}">Main</button>` : `<span></span>`}
          <button type="button" class="sbtn d" data-delphoto="${i}">✕</button>
        </div>
      </div>`).join("");

    $$("[data-main]", modal).forEach(btn => {
      btn.onclick = () => {
        const idx = Number(btn.dataset.main);
        const [chosen] = activePhotos.splice(idx, 1);
        activePhotos.unshift(chosen);
        renderPhotos();
      };
    });

    $$("[data-delphoto]", modal).forEach(btn => {
      btn.onclick = () => {
        const idx = Number(btn.dataset.delphoto);
        activePhotos.splice(idx, 1);
        renderPhotos();
      };
    });
  }

  // Upload Photos with client-side compression
  $("#photoInput", modal).onchange = async e => {
    const files = [...e.target.files];
    if (!files.length) return;

    const status = $("#photoStatus", modal);
    const client = sb();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      status.textContent = `Compressing & uploading ${i + 1} of ${files.length}...`;

      try {
        const compressedBlob = await compressImage(file, 1200, 0.82);
        const filename = `products/${Date.now()}_${Math.random().toString(36).slice(2, 7)}.jpg`;

        if (client) {
          const { error: upErr } = await client.storage
            .from("product-media")
            .upload(filename, compressedBlob, { contentType: "image/jpeg", upsert: true });

          if (upErr) {
            console.error(upErr);
            toast("Upload error: " + upErr.message);
            continue;
          }

          const { data: pubData } = client.storage.from("product-media").getPublicUrl(filename);
          if (pubData && pubData.publicUrl) {
            activePhotos.push(pubData.publicUrl);
          }
        } else {
          // Fallback dataURL
          const reader = new FileReader();
          reader.onload = ev => {
            activePhotos.push(ev.target.result);
            renderPhotos();
          };
          reader.readAsDataURL(compressedBlob);
        }
      } catch (err) {
        console.error("Photo processing error:", err);
        toast("Failed to process photo: " + file.name);
      }
    }

    status.textContent = "Upload complete!";
    setTimeout(() => { status.textContent = ""; }, 2000);
    renderPhotos();
  };

  // Video Management & 25 MB Limit
  function renderVideoPreview() {
    const wrap = $("#videoPreviewWrap", modal);
    const ytUrl = getYouTubeEmbedUrl(activeVideo);

    if (!activeVideo) {
      wrap.innerHTML = "";
      return;
    }

    wrap.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;margin-top:6px">
      <div class="vid-prev">
        ${ytUrl ? `
          <iframe src="${ytUrl}" title="Preview" allowfullscreen></iframe>
        ` : `
          <video controls muted src="${activeVideo}"></video>
        `}
      </div>
      <button type="button" class="sbtn d" id="delVidBtn">Remove Video</button>
    </div>`;

    const delBtn = $("#delVidBtn", wrap);
    if (delBtn) {
      delBtn.onclick = () => {
        activeVideo = "";
        $("#ytInput", modal).value = "";
        renderVideoPreview();
      };
    }
  }

  // Video Upload
  $("#videoInput", modal).onchange = async e => {
    const file = e.target.files[0];
    if (!file) return;

    const MAX_SIZE = 25 * 1024 * 1024; // 25 MB
    if (file.size > MAX_SIZE) {
      alert("Please use a shorter or compressed video, maximum 25 MB");
      toast("Please use a shorter or compressed video, maximum 25 MB");
      e.target.value = "";
      return;
    }

    const status = $("#videoStatus", modal);
    status.textContent = "Uploading video (this may take a few moments)...";

    const client = sb();
    if (client) {
      try {
        const ext = file.name.split(".").pop().toLowerCase() || "mp4";
        const filename = `videos/${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;

        const { error: upErr } = await client.storage
          .from("product-media")
          .upload(filename, file, { contentType: file.type || "video/mp4", upsert: true });

        if (upErr) {
          toast("Video upload failed: " + upErr.message);
          status.textContent = "";
          return;
        }

        const { data: pubData } = client.storage.from("product-media").getPublicUrl(filename);
        if (pubData && pubData.publicUrl) {
          activeVideo = pubData.publicUrl;
          $("#ytInput", modal).value = "";
          status.textContent = "Video uploaded!";
          setTimeout(() => { status.textContent = ""; }, 2000);
          renderVideoPreview();
        }
      } catch (err) {
        toast("Video upload error: " + err.message);
        status.textContent = "";
      }
    } else {
      activeVideo = URL.createObjectURL(file);
      renderVideoPreview();
      status.textContent = "";
    }
  };

  // YouTube Link Input
  $("#ytInput", modal).oninput = e => {
    const val = e.target.value.trim();
    if (val && getYouTubeEmbedUrl(val)) {
      activeVideo = val;
      renderVideoPreview();
    } else if (!val) {
      activeVideo = "";
      renderVideoPreview();
    }
  };

  // Initial Modal setup
  renderColours();
  renderSizes();
  renderPhotos();
  renderVideoPreview();

  $("#cancelModalBtn", modal).onclick = () => modal.remove();

  // Save / Submit
  form.onsubmit = async e => {
    e.preventDefault();
    const name = form.name.value.trim();
    if (!name) { toast("Please enter a shoe name"); return; }
    const price = Number(form.price.value);
    if (!price || price < 0) { toast("Please enter a valid price"); return; }

    const saleVal = form.sale.value ? Number(form.sale.value) : null;
    const cat = catSelect.value;
    const type = form.type.value;
    const nameUr = form.nameUr.value.trim() || null;

    const [a, b] = RANGES[cat] || [35, 42];
    const cleanSizes = {};
    for (let s = a; s <= b; s++) {
      cleanSizes[s] = Number(activeSizes[s] || 0);
    }

    const cleanColours = p.colors
      .filter(c => c.n && c.n.trim())
      .map(c => ({ n: c.n.trim(), c: c.c }));
    if (!cleanColours.length) cleanColours.push({ n: "Default", c: "#B8567A" });

    const saveBtn = $("#saveProdBtn", modal);
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving to Supabase...";

    const record = {
      name,
      name_ur: nameUr,
      collection: cat,
      type,
      price,
      sale_price: saleVal && saleVal > 0 ? saleVal : null,
      colours: cleanColours,
      sizes: cleanSizes,
      photos: activePhotos,
      video_url: activeVideo || null
    };

    const client = sb();
    if (client) {
      try {
        if (isEdit) {
          const { error } = await client.from("products").update(record).eq("id", p.id);
          if (error) throw error;
        } else {
          const { error } = await client.from("products").insert(record);
          if (error) throw error;
        }
      } catch (err) {
        console.error("Save error:", err);
        toast("Failed to save product: " + err.message);
        saveBtn.disabled = false;
        saveBtn.textContent = isEdit ? "Save Changes" : "Create Product";
        return;
      }
    }

    modal.remove();
    toast(isEdit ? "Product updated!" : "New product created!");
    viewProducts();
  };
}

/* ==========================================================================
   ORDERS MANAGEMENT
   ========================================================================== */
const STATUSES = ["pending", "confirmed", "packed", "shipped", "delivered", "cancelled"];

async function fetchAdminOrders() {
  const client = sb();
  if (!client) return [];
  try {
    const { data, error } = await client
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch orders error:", error);
      return [];
    }
    currentOrders = data || [];
    return currentOrders;
  } catch (err) {
    console.error(err);
    return [];
  }
}

async function viewOrders() {
  const container = $("#ac");
  container.innerHTML = `<div class="loading-box"><div class="spinner"></div><p>Loading orders from Supabase...</p></div>`;

  const orders = await fetchAdminOrders();

  container.innerHTML = `
  <div class="ahead">
    <h2>Customer Orders (${orders.length})</h2>
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      <button class="sbtn" id="exportOrdersCsv">Download CSV</button>
      <button class="sbtn g" id="exportOrdersJson">Download JSON</button>
    </div>
  </div>

  <div class="tw">
    <table>
      <thead>
        <tr>
          <th>Order</th>
          <th>Customer</th>
          <th>Items Ordered</th>
          <th>Total</th>
          <th>Status</th>
          <th>WhatsApp Customer</th>
        </tr>
      </thead>
      <tbody>
        ${orders.length ? orders.map(o => {
          const dateStr = o.created_at ? new Date(o.created_at).toLocaleDateString() : "";
          const phoneRaw = String(o.customer.phone || "");
          const waPhone = phoneRaw.replace(/\D/g, "").replace(/^0/, "92");
          const waMsg = `Hello ${o.customer.name}, this is Kanwal Shoes Store regarding your order ${o.order_no} (Status: ${o.status}).`;

          return `
          <tr>
            <td>
              <b>${esc(o.order_no)}</b>
              <br><small style="color:var(--muted)">${dateStr}</small>
              <br><span class="pill" style="margin-top:4px">${o.payment === "cod" ? "Cash on Delivery" : "Bank Transfer"}</span>
            </td>
            <td>
              <b>${esc(o.customer.name)}</b>
              <br><a href="tel:${esc(phoneRaw)}" style="color:var(--rose)">${esc(phoneRaw)}</a>
              <br><small style="color:var(--muted)">${esc(o.customer.city)}, ${esc(o.customer.address)}</small>
            </td>
            <td>
              ${(o.items || []).map(i => `
                <div style="margin-bottom:4px;font-size:13.5px">
                  <b>${esc(i.name)}</b>
                  <span style="color:var(--muted)">&bull; ${esc(i.color)}, Size ${i.size} &bull; &times;${i.qty}</span>
                </div>
              `).join("")}
            </td>
            <td>
              <b>${money(o.total)}</b>
            </td>
            <td>
              <select class="st" data-order-id="${o.id}">
                ${STATUSES.map(s => `<option value="${s}" ${o.status === s ? "selected" : ""}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>`).join("")}
              </select>
            </td>
            <td>
              <a class="sbtn g" style="padding:0 12px;min-height:34px;font-size:13px" target="_blank" rel="noopener" href="https://wa.me/${waPhone}?text=${encodeURIComponent(waMsg)}">
                💬 WhatsApp
              </a>
            </td>
          </tr>`;
        }).join("") : `
          <tr>
            <td colspan="6" style="text-align:center;color:var(--muted);padding:40px">
              No orders placed yet.
            </td>
          </tr>
        `}
      </tbody>
    </table>
  </div>`;

  // Status Change & Restock on Cancel
  $$("[data-order-id]").forEach(sel => {
    sel.onchange = async () => {
      const id = sel.dataset.orderId;
      const newStatus = sel.value;
      const order = currentOrders.find(x => x.id === id);
      const oldStatus = order ? order.status : "pending";

      const client = sb();
      if (!client) return;

      if (newStatus === "cancelled" && oldStatus !== "cancelled") {
        if (!confirm("Cancelling this order will return all its items back into stock. Proceed?")) {
          sel.value = oldStatus;
          return;
        }

        try {
          const { error } = await client.rpc("cancel_order", { p_order_id: id });
          if (error) {
            toast("Cancel error: " + error.message);
            sel.value = oldStatus;
            return;
          }
          if (order) order.status = "cancelled";
          toast("Order cancelled and stock restored!");
          return;
        } catch (err) {
          toast("Error: " + err.message);
          sel.value = oldStatus;
          return;
        }
      }

      // Normal status update
      const { error } = await client.from("orders").update({ status: newStatus }).eq("id", id);
      if (error) {
        toast("Status update error: " + error.message);
        sel.value = oldStatus;
      } else {
        if (order) order.status = newStatus;
        toast("Order status updated to " + newStatus);
      }
    };
  });

  // Export CSV
  $("#exportOrdersCsv").onclick = () => {
    if (!orders.length) { toast("No orders to export"); return; }
    let csv = "Order Number,Date,Customer Name,Phone,City,Address,Total,Payment,Status\n";
    orders.forEach(o => {
      const date = o.created_at ? new Date(o.created_at).toISOString().slice(0, 10) : "";
      csv += `"${o.order_no}","${date}","${o.customer.name}","${o.customer.phone}","${o.customer.city}","${o.customer.address}","${o.total}","${o.payment}","${o.status}"\n`;
    });
    downloadFile(csv, "kanwal-shoes-orders.csv", "text/csv");
  };

  // Export JSON
  $("#exportOrdersJson").onclick = () => {
    if (!orders.length) { toast("No orders to export"); return; }
    downloadFile(JSON.stringify(orders, null, 2), "kanwal-shoes-orders.json", "application/json");
  };
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

/* ==========================================================================
   DASHBOARD TAB
   ========================================================================== */
async function viewDash() {
  const container = $("#ac");
  container.innerHTML = `<div class="loading-box"><div class="spinner"></div><p>Calculating live statistics...</p></div>`;

  const prods = await fetchAllAdminProducts();
  const orders = await fetchAdminOrders();

  const activeOrders = orders.filter(o => o.status !== "cancelled");
  const revenue = activeOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const pendingCount = orders.filter(o => o.status === "pending").length;

  let lowStockCount = 0;
  prods.forEach(p => {
    Object.values(p.sizes || {}).forEach(qty => {
      if (Number(qty) <= 2) lowStockCount++;
    });
  });

  container.innerHTML = `
  <div class="stats">
    <div class="stat"><b>${orders.length}</b><span>Total Orders</span></div>
    <div class="stat"><b style="color:var(--warn)">${pendingCount}</b><span>Pending Orders</span></div>
    <div class="stat"><b style="color:var(--ok)">${money(revenue)}</b><span>Total Revenue</span></div>
    <div class="stat"><b>${prods.length}</b><span>Shoes in Catalog</span></div>
    <div class="stat"><b style="color:var(--bad)">${lowStockCount}</b><span>Sizes Low / Out</span></div>
  </div>

  <div class="ahead"><h2>Backup & Export</h2></div>
  <div style="display:flex;gap:10px;flex-wrap:wrap">
    <button class="sbtn" id="dashExportOrders">Download Orders Backup (CSV)</button>
    <button class="sbtn g" id="dashExportProds">Download Products (JSON)</button>
  </div>
  <p class="note" style="margin-top:16px">
    All products and orders are safely stored in your free Supabase database. You can manage everything live from this panel.
  </p>`;

  $("#dashExportOrders").onclick = () => {
    if (!orders.length) { toast("No orders to export"); return; }
    let csv = "Order Number,Date,Customer Name,Phone,City,Address,Total,Payment,Status\n";
    orders.forEach(o => {
      const date = o.created_at ? new Date(o.created_at).toISOString().slice(0, 10) : "";
      csv += `"${o.order_no}","${date}","${o.customer.name}","${o.customer.phone}","${o.customer.city}","${o.customer.address}","${o.total}","${o.payment}","${o.status}"\n`;
    });
    downloadFile(csv, "kanwal-shoes-orders.csv", "text/csv");
  };

  $("#dashExportProds").onclick = () => {
    downloadFile(JSON.stringify(prods, null, 2), "kanwal-shoes-products.json", "application/json");
  };
}

/* ==========================================================================
   INITIALIZATION
   ========================================================================== */
async function initAdmin() {
  const client = sb();
  if (!client) {
    showLogin();
    return;
  }

  try {
    const { data: { session } } = await client.auth.getSession();
    if (session && session.user) {
      currentUser = session.user;
      showApp();
    } else {
      showLogin();
    }

    client.auth.onAuthStateChange((event, session) => {
      if (session && session.user) {
        currentUser = session.user;
        showApp();
      } else {
        currentUser = null;
        showLogin();
      }
    });
  } catch (err) {
    console.error("Auth init error:", err);
    showLogin();
  }
}

initAdmin();
