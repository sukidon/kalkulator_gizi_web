const express = require('express');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Tampilkan halaman pembuka intro.html saat akses /
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'intro.html'));
});

app.use(express.static('public'));

// Fungsi baca BB/TB
function bacaBBTB(jk, umur) {
  const rentang = umur <= 24 ? '0-24' : '24-60';
  const jenis = jk === 'laki' ? 'laki_laki' : 'perempuan';
  const file = `BB_TB_${jenis}_${rentang}.xlsx`;
  const filePath = path.join(__dirname, 'public', 'data', file);

  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️ File tidak ditemukan: ${filePath}`);
    return null;
  }

  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json(sheet);

  const hasil = {};
  jsonData.forEach(row => {
    const tinggi = Math.round(
      row['tinggibadan(cm)'] || row['tinggi'] || row['TB'] || row['tinggi_badan']
    );
    hasil[tinggi] = {
      minus3SD: row.minus3SD,
      minus2SD: row.minus2SD,
      minus1SD: row.minus1SD,
      median: row.median,
      plus1SD: row.plus1SD,
      plus2SD: row.plus2SD,
      plus3SD: row.plus3SD
    };
  });

  return hasil;
}

// Fungsi baca BB/U dan TB/U
function bacaFileBBUorTBU(filename) {
  const filePath = path.join(__dirname, 'public', 'data', filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️ File tidak ditemukan: ${filePath}`);
    return null;
  }

  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json(sheet);

  const hasil = {};
  jsonData.forEach(row => {
    const umur = parseInt(row.umur || row.usia || row['umur(bulan)']);
    hasil[umur] = {
      minus3SD: row.minus3SD,
      minus2SD: row.minus2SD,
      minus1SD: row.minus1SD,
      median: row.median,
      plus1SD: row.plus1SD,
      plus2SD: row.plus2SD,
      plus3SD: row.plus3SD
    };
  });

  return hasil;
}

// Endpoint BB/U
app.get('/api/bbu/:jk', (req, res) => {
  try {
    const file = req.params.jk === 'laki' ? 'BB_U_laki_laki.xlsx' : 'BB_U_perempuan.xlsx';
    const data = bacaFileBBUorTBU(file);
    if (!data) return res.status(404).json({ error: 'File data BB/U tidak ditemukan' });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal membaca BB/U' });
  }
});

// Endpoint TB/U
app.get('/api/tbu/:jk', (req, res) => {
  try {
    const file = req.params.jk === 'laki' ? 'TB_U_laki_laki.xlsx' : 'TB_U_perempuan.xlsx';
    const data = bacaFileBBUorTBU(file);
    if (!data) return res.status(404).json({ error: 'File data TB/U tidak ditemukan' });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal membaca TB/U' });
  }
});

// Endpoint BB/TB
app.get('/api/bbtb/:jk/:umur', (req, res) => {
  const { jk, umur } = req.params;
  try {
    const data = bacaBBTB(jk, parseInt(umur));
    if (!data) return res.status(404).json({ error: 'File data BB/TB tidak ditemukan' });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal membaca BB/TB' });
  }
});

// Jalankan server
app.listen(PORT, () => {
  console.log(`✅ Server aktif di http://localhost:${PORT}`);
});
