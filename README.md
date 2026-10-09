# Kanwal Shoes Store

Shoe store website: Women, Men, Kids. English / Urdu popup, size availability check, cart, checkout, WhatsApp order, admin panel.

## Open it
- Quick: double-click `index.html`.
- Better (Antigravity or terminal): `python3 -m http.server 8000` then open http://localhost:8000
- Admin: open `admin.html`. Password: `kanwal2026` (change it in `js/data.js`, line `adminPassword`).

## Where to change things
- Store name, phone, email, address, delivery fee: `js/data.js` (top)
- Size ranges per collection: `RANGES` in `js/data.js`
- Colours: `:root` in `css/style.css`
- Products: Admin > Products (add photos, colours, stock per size)

## Note
Products, stock and orders are saved in the browser (localStorage). Use Admin > Dashboard > Download backup regularly.

## Antigravity prompt (to make it a real online store)
Open this folder in Antigravity and paste:

"Keep the current design, layout and colours exactly as they are. Convert this static site into a MERN app: React frontend, Node/Express API, MongoDB. Move products, stock and orders from localStorage to the database. Add real admin login (JWT), image upload (Cloudinary), order emails to kanwalshoesstore2026@gmail.com, and keep the English/Urdu popup, the category-aware size check (Women 35-42, Men 39-46, Kids 18-34 EU) and the WhatsApp order button. Prepare it for deployment."
