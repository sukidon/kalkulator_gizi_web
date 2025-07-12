(async function () {
  const params = new URLSearchParams(window.location.search);
  const nama = params.get('nama');
  const alamat = params.get('alamat');
  const umur = parseInt(params.get('umurBulan'));
  const bb = parseFloat(params.get('bb'));
  const tb = parseFloat(params.get('tb'));
  const jk = params.get('jk');
  const hasil = document.getElementById('hasil');
  const biodata = document.getElementById('biodata');

  if (!nama || isNaN(umur) || isNaN(bb) || isNaN(tb) || !jk) {
    hasil.innerHTML = `<div class="bg-red-100 p-3 rounded text-red-700">Data tidak valid. Silakan kembali ke halaman sebelumnya.</div>`;
    return;
  }

  const now = new Date();
  const waktu = now.toLocaleString('id-ID', {
    dateStyle: 'full',
    timeStyle: 'short',
  });

  biodata.innerHTML = `
    <p><strong>Nama:</strong> ${nama}</p>
    <p><strong>Alamat:</strong> ${alamat || '-'}</p>
    <p><strong>Usia:</strong> ${umur} bulan</p>
    <p><strong>Berat Badan:</strong> ${bb} kg</p>
    <p><strong>Tinggi Badan:</strong> ${tb} cm</p>
    <p><strong>Waktu Pemeriksaan:</strong> ${waktu}</p>
  `;

  const bahanAnjuran = {
    "BB/U": {
      saran: `
        <strong>Bahan Makanan yang Dianjurkan:</strong>
        <ul class="list-disc pl-5">
          <li>Daging merah, ayam, ikan, telur, tempe, tahu</li>
          <li>Nasi, kentang, roti gandum, ubi jalar</li>
          <li>Alpukat, minyak zaitun, minyak ikan</li>
          <li>Buah dan sayuran segar</li>
          <li>Kaldu sapi/ayam, bubur kacang hijau, puding susu</li>
        </ul>
        <strong>Yang Dihindari:</strong>
        <ul class="list-disc pl-5">
          <li>Makanan cepat saji, permen, minuman manis</li>
          <li>Gorengan, makanan olahan</li>
          <li>Jeli, keripik, sosis, makanan rendah nutrisi</li>
        </ul>
      `,
      gambar: 'data/BB_U.png'
    },
    "TB/U": {
      saran: `
        <strong>Bahan Makanan yang Dianjurkan:</strong>
        <ul class="list-disc pl-5">
          <li>Daging tanpa lemak, ikan, telur, susu, tempe</li>
          <li>Buah-buahan, sayuran, makanan padat kalori</li>
          <li>Makanan tinggi zat besi</li>
        </ul>
        <strong>Yang Dihindari:</strong>
        <ul class="list-disc pl-5">
          <li>Makanan tinggi garam, gula, lemak</li>
          <li>Gorengan, makanan olahan</li>
          <li>Minuman berkafein</li>
        </ul>
      `,
      gambar: 'data/TB_U.png'
    },
    "BB/TB": {
      saran: `
        <strong>Bahan Makanan yang Dianjurkan:</strong>
        <ul class="list-disc pl-5">
          <li>Nasi, kentang, ubi jalar, roti gandum</li>
          <li>Protein: daging, ayam, ikan, tempe, tahu</li>
          <li>Lemak sehat, buah dan sayur segar</li>
          <li>Susu, yogurt, keju</li>
        </ul>
        <strong>Yang Dihindari:</strong>
        <ul class="list-disc pl-5">
          <li>Makanan cepat saji, makanan manis dan asin</li>
          <li>Makanan ringan kemasan, potongan besar</li>
        </ul>
      `,
      gambar: 'data/BB_TB.png'
    }
  };

  try {
    const [bbu, tbu, bbtb] = await Promise.all([
      ambilData(`/api/bbu/${jk}`),
      ambilData(`/api/tbu/${jk}`),
      ambilData(`/api/bbtb/${jk}/${umur}`)
    ]);

    hasil.innerHTML += tampilkanHasil("BB/U", bb, bbu[umur], "chartBBU", bbu, umur, bahanAnjuran["BB/U"]);
    hasil.innerHTML += tampilkanHasil("TB/U", tb, tbu[umur], "chartTBU", tbu, umur, bahanAnjuran["TB/U"]);
    hasil.innerHTML += tampilkanHasil("BB/TB", bb, bbtb[Math.round(tb)], "chartBBTB", bbtb, Math.round(tb), bahanAnjuran["BB/TB"]);

    tampilkanPosterEdukasi(umur);
  
  } catch (err) {
    console.error(err);
    hasil.innerHTML = `<div class="bg-red-100 p-3 rounded text-red-700">Gagal mengambil data. Coba ulangi atau cek koneksi.</div>`;
  }

  function tampilkanHasil(judul, nilai, ref, chartId, chartData, kunci, referensi) {
    if (!ref) return `<div class="p-2 bg-yellow-100 rounded">${judul}: Data tidak tersedia</div>`;
    const z = ((nilai - ref.median) / ((ref.plus1SD - ref.median) || 1)).toFixed(2);
    const status = interpretasiZ(judul, parseFloat(z));
    const min = ref.minus2SD;
    const max = ref.plus1SD;
    let rekom = "";

    if (judul === "BB/U") rekom = `Rekomendasi berat badan normal: ${min} – ${max} kg`;
    if (judul === "TB/U") rekom = `Rekomendasi tinggi badan normal: ${min} – ${max} cm`;
    if (judul === "BB/TB") rekom = `Rekomendasi berat badan ideal: ${min} – ${max} kg`;

    const html = `
      <div class="p-4 bg-green-100 border border-green-300 rounded space-y-2">
        <h3 class="font-bold text-lg">${judul}</h3>
        <p>Z-score: <code>${z}</code></p>
        <p>Status: <strong>${status}</strong></p>
        <p class="italic text-sm text-gray-700">${rekom}</p>
        <canvas id="${chartId}" class="w-full h-60"></canvas>
        <div class="bg-white p-3 rounded mt-2 text-sm">${referensi.saran}</div>
        <img src="${referensi.gambar}" alt="Menu Gizi ${judul}" class="w-full mt-4 border rounded shadow">
      </div>
    `;

    setTimeout(() => buatGrafik(chartId, chartData, judul, nilai, kunci), 10);
    return html;
  }

  function interpretasiZ(jenis, z) {
    if (jenis === "BB/U") {
      if (z < -3) return "Berat badan sangat kurang 🟥";
      if (z < -2) return "Berat badan kurang 🟨";
      if (z <= 1) return "Berat badan normal 🟩";
      return "Risiko berat badan lebih 🟨";
    }
    if (jenis === "TB/U") {
      if (z < -3) return "Sangat pendek 🟥";
      if (z < -2) return "Pendek 🟨";
      if (z <= 3) return "Normal 🟩";
      return "Tinggi 🟦";
    }
    if (jenis === "BB/TB") {
      if (z < -3) return "Gizi buruk 🟥";
      if (z < -2) return "Gizi kurang 🟨";
      if (z <= 1) return "Gizi baik (normal) 🟩";
      if (z <= 2) return "Risiko gizi lebih 🟨";
      if (z <= 3) return "Gizi lebih 🟧";
      return "Obesitas 🟥";
    }
    return "Tidak Diketahui";
  }

  async function ambilData(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Gagal mengambil data dari " + url);
    return await res.json();
  }

  function buatGrafik(id, dataset, jenis, nilaiAnak, kunci) {
    const warna = {
      "-3": "#e11d48", "-2": "#facc15", "0": "#22c55e", "2": "#facc15", "3": "#e11d48"
    };

    const labels = Object.keys(dataset).map(Number);
    const zKeys = {
      "-3": "minus3SD",
      "-2": "minus2SD",
      "0": "median",
      "2": "plus2SD",
      "3": "plus3SD"
    };

    const datasets = Object.keys(zKeys).map(z => ({
      label: `Z${z}`,
      borderColor: warna[z],
      borderWidth: 1.5,
      fill: false,
      data: labels.map(k => dataset[k] ? dataset[k][zKeys[z]] : null),
    }));

    datasets.push({
      label: "Anak Anda",
      borderColor: "#3b82f6",
      backgroundColor: "#3b82f6",
      data: labels.map(k => k === kunci ? nilaiAnak : null),
      pointRadius: 5,
      showLine: false
    });

    new Chart(document.getElementById(id), {
      type: "line",
      data: { labels, datasets },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top' }
        }
      }
    });
  }
})();

function tampilkanPosterEdukasi(umur) {
  let poster = "";
  if (umur >= 6 && umur <= 8) poster = "6-8bulan.jpg";
  else if (umur >= 9 && umur <= 11) poster = "9-11bulan.jpg";
  else if (umur >= 12 && umur <= 23) poster = "12-23bulan.jpg";
  else if (umur >= 24 && umur <= 60) poster = "24-60bulan.jpg";
  else return;

  hasil.innerHTML += `
    <div class="mt-6 text-center">
      <h3 class="font-semibold text-lg mb-2">Panduan Gizi Isi Piringku Kemenkes</h3>
      <img src="data/${poster}" alt="Poster Edukasi ${umur} bulan" class="w-full max-w-lg mx-auto rounded shadow" />
    </div>
  `;
}
