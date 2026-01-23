// 1. IMPORT DATA DARI FILE PUSAT
import { daftarLayanan, daftarVilla } from './data.js';

let keranjang = [];

document.addEventListener('DOMContentLoaded', () => {
    initVilla();
    renderMenu();

    // Event listener untuk filter kategori
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const activeBtn = document.querySelector('.filter-btn.active');
            if (activeBtn) activeBtn.classList.remove('active');
            
            e.target.classList.add('active');
            renderMenu(e.target.dataset.target);
        });
    });
});

// Fungsi pembantu untuk format Rupiah
function formatRupiah(angka) {
    if (typeof angka !== 'number') return angka;
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(angka);
}

// Mengisi dropdown villa
function initVilla() {
    const vs = document.getElementById('villa-name');
    if (!vs) return;
    vs.innerHTML = '<option value="">-- Pilih Lokasi Villa --</option>';
    daftarVilla.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v.nama;
        opt.textContent = v.nama;
        vs.appendChild(opt);
    });
}

// Menampilkan produk ke dalam grid
function renderMenu(filter = 'semua') {
    const box = document.getElementById('menu-box');
    if (!box) return;
    
    box.innerHTML = "";
    const filtered = filter === 'semua' ? daftarLayanan : daftarLayanan.filter(i => i.kategori === filter);

    filtered.forEach(item => {
        const isInfo = item.kategori === 'info';
        const isHabis = item.tersedia === false;
        const displayHarga = typeof item.harga === 'number' ? formatRupiah(item.harga) : item.harga;

        box.innerHTML += `
            <div class="menu-card ${isHabis ? 'out-of-stock' : ''}">
                <div class="menu-img" onclick="window.bukaDetail(${item.id})" style="background-image: url('${item.gambar}')"></div>
                <div class="menu-info">
                    <h3 onclick="window.bukaDetail(${item.id})" style="cursor:pointer">${item.nama}</h3>
                    <p>${item.deskripsi.substring(0, 65)}...</p>
                    <div class="menu-footer">
                        <span class="price">${displayHarga}</span>
                        ${!isInfo && !isHabis ? `
                            <div class="order-controls">
                                <input type="number" id="qty-${item.id}" value="1" min="1" class="qty-input">
                                <button class="btn-wa" style="flex:1" onclick="window.tambahKeKeranjang(${item.id})">TAMBAH</button>
                            </div>
                        ` : `
                            <button class="btn-wa" style="width:100%; background:#666" onclick="window.bukaDetail(${item.id})">
                                ${isHabis ? 'STOK HABIS' : 'LIHAT INFO'}
                            </button>
                        `}
                    </div>
                </div>
            </div>`;
    });
}

/* ==========================================================================
   FUNGSI GLOBAL (WAJIB PAKAI window. AGAR BISA DIPANGGIL ONCLICK HTML)
   ========================================================================== */

// Modal Detail Produk - PERBAIKAN GAMBAR DISINI
window.bukaDetail = function(id) {
    const item = daftarLayanan.find(obj => obj.id === id);
    if (!item) return;

    document.getElementById('detail-nama').innerText = item.nama;
    document.getElementById('detail-harga').innerText = typeof item.harga === 'number' ? formatRupiah(item.harga) : item.harga;
    document.getElementById('detail-deskripsi').innerText = item.deskripsi;
    
    // Pastikan ID detail-img ada dan set background-nya
    const imgContainer = document.getElementById('detail-img');
    if (imgContainer) {
        imgContainer.style.backgroundImage = `url('${item.gambar}')`;
        imgContainer.style.backgroundSize = 'cover';
        imgContainer.style.backgroundPosition = 'center';
    }
    
    const btn = document.getElementById('detail-btn-tambah');
    if (btn) {
        btn.style.display = (item.kategori === 'info' || !item.tersedia) ? 'none' : 'block';
        btn.onclick = () => { 
            window.tambahKeKeranjang(item.id); 
            window.closeDetail(); 
        };
    }
    
    document.getElementById('detail-modal').style.display = 'flex';
}

window.closeDetail = function() { 
    document.getElementById('detail-modal').style.display = 'none'; 
}

window.tambahKeKeranjang = function(id) {
    const item = daftarLayanan.find(obj => obj.id === id);
    const qtyInput = document.getElementById(`qty-${id}`);
    const qty = parseInt(qtyInput?.value || 1);

    const idx = keranjang.findIndex(k => k.id === id);
    if (idx > -1) {
        keranjang[idx].qty += qty;
    } else {
        keranjang.push({ ...item, qty });
    }

    if(qtyInput) qtyInput.value = 1;
    updateFloatingButton();
    alert(`✅ ${item.nama} berhasil ditambah!`);
}

function updateFloatingButton() {
    const count = keranjang.reduce((s, i) => s + i.qty, 0);
    const btn = document.getElementById('floating-cart');
    if (!btn) return;
    btn.style.display = count > 0 ? 'flex' : 'none';
    btn.innerHTML = `🛒 Lihat Keranjang (${count})`;
}

window.toggleModal = function() {
    const m = document.getElementById('cart-modal');
    if (!m) return;
    const isHidden = (m.style.display === 'none' || m.style.display === '');
    m.style.display = isHidden ? 'flex' : 'none';
    if (isHidden) renderCartItems();
}

function renderCartItems() {
    const list = document.getElementById('cart-items-list');
    const totalDisp = document.getElementById('cart-total-price');
    if (!list) return;

    list.innerHTML = "";
    let total = 0;

    if (keranjang.length === 0) {
        list.innerHTML = "<p style='text-align:center; padding:20px; color:#aaa;'>Keranjang kosong.</p>";
        totalDisp.innerText = "";
        return;
    }

    keranjang.forEach((item, i) => {
        const sub = item.harga * item.qty;
        total += sub;
        list.innerHTML += `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:15px 0; border-bottom:1px solid #f0f0f0;">
                <div style="flex:1;">
                    <div style="font-weight:600; font-size:14px;">${item.nama}</div>
                    <div style="font-size:13px; color:var(--forest-green); font-weight:600;">${formatRupiah(sub)}</div>
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                    <div style="display:flex; align-items:center; background:#f0f0f0; border-radius:8px; padding:2px;">
                        <button onclick="window.updateQty(${i}, -1)" style="border:none; background:none; padding:5px 10px; cursor:pointer;">-</button>
                        <span style="min-width:20px; text-align:center; font-weight:600;">${item.qty}</span>
                        <button onclick="window.updateQty(${i}, 1)" style="border:none; background:none; padding:5px 10px; cursor:pointer;">+</button>
                    </div>
                    <button onclick="window.hapusItem(${i})" style="border:none; background:none; cursor:pointer;">🗑️</button>
                </div>
            </div>`;
    });
    totalDisp.innerText = `Total Estimasi: ${formatRupiah(total)}`;
}

window.updateQty = function(index, change) {
    keranjang[index].qty += change;
    if (keranjang[index].qty <= 0) {
        if (confirm(`Hapus ${keranjang[index].nama}?`)) {
            keranjang.splice(index, 1);
        } else {
            keranjang[index].qty = 1;
        }
    }
    renderCartItems();
    updateFloatingButton();
    if (keranjang.length === 0) window.toggleModal();
}

window.hapusItem = function(i) {
    keranjang.splice(i, 1);
    renderCartItems();
    updateFloatingButton();
    if (keranjang.length === 0) window.toggleModal();
}

window.sendWA = function() {
    const villa = document.getElementById('villa-name').value;
    const nama = document.getElementById('customer-name').value.trim();
    const catatanGlobal = document.getElementById('global-note').value.trim() || "Tidak ada catatan.";

    if (!villa || !nama) {
        alert("⚠️ Mohon lengkapi Nama dan Lokasi Villa!");
        return;
    }

    let rincian = "";
    let grandTotal = 0;
    keranjang.forEach((item, i) => {
        grandTotal += (item.harga * item.qty);
        rincian += `${i + 1}. ${item.nama} (x${item.qty})\n`;
    });

    const orderID = `AS.${Math.random().toString(36).substring(2,5).toUpperCase()}`;
    const pesan = `🏨 PESANAN BARU - ATAP SINGGAH\n🆔 Order ID: ${orderID}\n👤 Pemesan: ${nama}\n📍 Lokasi: villa ${villa}\n------------------------------------------\n\nDaftar Pesanan:\n${rincian}\n📝 Catatan: _${catatanGlobal}_\n\n💵 Total Estimasi: ${formatRupiah(grandTotal)}\n\n------------------------------------------`;

    window.open(`https://wa.me/628984940766?text=${encodeURIComponent(pesan)}`, '_blank');
}