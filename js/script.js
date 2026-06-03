// 1. IMPORT DATA DARI FILE PUSAT

import { daftarLayanan, daftarVilla } from './data.js';

let keranjang = [];
// Variabel global penanda status operasional (true = buka, false = tutup)
let isStoreOpen = true; 

document.addEventListener('DOMContentLoaded', () => {
    checkOperationalHours(); // Wajib dijalankan SEBELUM renderMenu agar status tombol akurat
    initVilla();
    renderMenu();
    initSplashScreen(); // <-- SEKARANG AMAN, FUNGSI SUDAH TERSEDIA DI BAWAH
    
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

/* ==========================================================================
   FUNGSI ANIMASI SPLASH SCREEN (MENGHILANGKAN LOADING)
   ========================================================================== */
function initSplashScreen() {
    const splash = document.getElementById('splash-screen');
    if (!splash) return;
    setTimeout(() => {
        splash.style.opacity = '0';
        splash.style.transition = 'opacity 0.5s ease';
        setTimeout(() => splash.style.display = 'none', 500);
    }, 1500); // Durasi loading dibuat cepat (1 detik) agar nyaman saat develop & testing
}

// Logika Validasi Jam Operasional & Manajemen State Warna
function checkOperationalHours() {
    const statusElement = document.getElementById('operational-status');
    const floatingCart = document.getElementById('floating-cart');
    if (!statusElement) return;

    const now = new Date();
    const currentHour = now.getHours();
    
    const openHour = 8;   // Jam Buka (08:00)
    const closeHour = 22; // Jam Tutup (22:00)

    if (currentHour >= openHour && currentHour < closeHour) {
        isStoreOpen = true;
        statusElement.innerHTML = `Layanan: <strong>0857-1468-7424</strong> • <span style="color: #2c5d63; font-weight: 700;">🟢 BUKA</span>`;
        if (floatingCart) floatingCart.classList.remove('store-closed');
    } else {
        isStoreOpen = false;
        statusElement.innerHTML = `Layanan: <strong>0857-1468-7424</strong> • <span style="color: #e63946; font-weight: 700;">🔴 TUTUP</span>`;
        if (floatingCart) floatingCart.classList.add('store-closed');
    }
}

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

// Menampilkan produk ke dalam grid dengan pengecekan waktu operasional
function renderMenu(filter = 'semua') {
    const box = document.getElementById('menu-box');
    if (!box) return;
    
    box.innerHTML = "";
    const filtered = filter === 'semua' ? daftarLayanan : daftarLayanan.filter(i => i.kategori === filter);

    filtered.forEach(item => {
        const isInfo = item.kategori === 'info';
        const isHabis = item.tersedia === false;
        const displayHarga = typeof item.harga === 'number' ? formatRupiah(item.harga) : item.harga;

        let actionButtonHtml = "";

        // Alur penentuan tombol aksi berdasarkan kondisi toko & produk
        if (isInfo) {
            actionButtonHtml = `
                <button class="btn-wa" style="width:100%; background:#666" onclick="window.bukaDetail(${item.id})">
                    LIHAT INFO
                </button>`;
        } else if (isHabis) {
            actionButtonHtml = `
                <button class="btn-wa" style="width:100%; background:#666" disabled>
                    STOK HABIS
                </button>`;
        } else if (!isStoreOpen) {
            // Jika toko tutup, sembunyikan input qty dan buat tombol menjadi disabled merah
            actionButtonHtml = `
                <div class="order-controls">
                    <button class="btn-wa" style="width:100%; flex:1; background:#e63946; cursor:not-allowed;" disabled>
                        TUTUP
                    </button>
                </div>`;
        } else {
            // Kondisi normal saat toko buka
            actionButtonHtml = `
                <div class="order-controls">
                    <input type="number" id="qty-${item.id}" value="1" min="1" class="qty-input">
                    <button class="btn-wa" style="flex:1" onclick="window.tambahKeKeranjang(${item.id})">TAMBAH</button>
                </div>`;
        }

        box.innerHTML += `
            <div class="menu-card ${isHabis ? 'out-of-stock' : ''}">
                <div class="menu-img" onclick="window.bukaDetail(${item.id})" style="background-image: url('${item.gambar}')"></div>
                <div class="menu-info">
                    <h3 onclick="window.bukaDetail(${item.id})" style="cursor:pointer">${item.nama}</h3>
                    <p>${item.deskripsi.substring(0, 65)}...</p>
                    <div class="menu-footer">
                        <span class="price">${displayHarga}</span>
                        ${actionButtonHtml}
                    </div>
                </div>
            </div>`;
    });
}

/* ==========================================================================
   FUNGSI GLOBAL (WAJIB PAKAI window. AGAR BISA DIPANGGIL ONCLICK HTML)
   ========================================================================== */

// Modal Detail Produk dengan kontrol validasi toko tutup
window.bukaDetail = function(id) {
    const item = daftarLayanan.find(obj => obj.id === id);
    if (!item) return;

    document.getElementById('detail-nama').innerText = item.nama;
    document.getElementById('detail-harga').innerText = typeof item.harga === 'number' ? formatRupiah(item.harga) : item.harga;
    document.getElementById('detail-deskripsi').innerText = item.deskripsi;
    
    const imgContainer = document.getElementById('detail-img');
    if (imgContainer) {
        imgContainer.style.backgroundImage = `url('${item.gambar}')`;
        imgContainer.style.backgroundSize = 'cover';
        imgContainer.style.backgroundPosition = 'center';
    }
    
    const btn = document.getElementById('detail-btn-tambah');
    if (btn) {
        if (item.kategori === 'info' || !item.tersedia) {
            btn.style.display = 'none';
        } else if (!isStoreOpen) {
            // Blokir tombol tambah di dalam modal jika waktu operasional habis
            btn.style.display = 'block';
            btn.style.background = '#e63946';
            btn.innerText = 'LAYANAN SEDANG TUTUP';
            btn.style.cursor = 'not-allowed';
            btn.disabled = true;
        } else {
            // Kembalikan ke struktur normal jika toko buka
            btn.style.display = 'block';
            btn.style.background = 'var(--wa-color)';
            btn.innerText = 'TAMBAH KE KERANJANG';
            btn.style.cursor = 'pointer';
            btn.disabled = false;
            btn.onclick = () => { 
                window.tambahKeKeranjang(item.id); 
                window.closeDetail(); 
            };
        }
    }
    
    document.getElementById('detail-modal').style.display = 'flex';
}

window.closeDetail = function() { 
    document.getElementById('detail-modal').style.display = 'none'; 
}

// Menambahkan item ke keranjang belanja dengan proteksi lapis ganda
window.tambahKeKeranjang = function(id) {
    // Proteksi sistem jika ada user nakal tembus via console inspect element
    if (!isStoreOpen) {
        alert("⚠️ Maaf, Atap Singgah sudah tutup. Silakan lakukan pemesanan esok hari pada jam 08:00.");
        return;
    }

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
    
    // Tombol melayang hanya muncul jika ada item di dalam keranjang
    if (count > 0) {
        btn.style.display = 'flex';
        btn.innerHTML = `🛒 Lihat Keranjang (${count})`;
        
        // Atur warna background tombol melayang berdasarkan status operasional toko
        if (!isStoreOpen) {
            btn.classList.add('store-closed');
        } else {
            btn.classList.remove('store-closed');
        }
    } else {
        btn.style.display = 'none';
    }
}

window.toggleModal = function() {
    if (!isStoreOpen) {
        alert("⚠️ Maaf, Atap Singgah sudah tutup. Silakan lakukan pemesanan esok hari pada jam 08:00.");
        return;
    }
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
    // Validasi tambahan saat pengguna menekan kirim di dalam modal keranjang
    if (!isStoreOpen) {
        alert("⚠️ Maaf, pemesanan gagal dikirim karena waktu operasional Atap Singgah sudah berakhir (TUTUP).");
        return;
    }

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
    const pesan = `🏨 PESANAN BARU - ATAP SINGGAH\n🆔 Order ID: ${orderID}\n👤 Pemesan: ${nama}\n📍 Lokasi: Villa ${villa}\n------------------------------------------\n\nDaftar Pesanan:\n${rincian}\n📝 Catatan: _${catatanGlobal}_\n\n💵 Total Estimasi: ${formatRupiah(grandTotal)}\n\n------------------------------------------`;

    window.open(`https://wa.me/6285714687424?text=${encodeURIComponent(pesan)}`, '_blank');
}