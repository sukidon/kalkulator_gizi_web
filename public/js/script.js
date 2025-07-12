document.getElementById('form').addEventListener('submit', function (e) {
  e.preventDefault();

  const nama = document.getElementById('nama').value.trim();
  const umur = document.getElementById('umurBulan').value.trim();
  const bb = document.getElementById('bb').value.trim();
  const tb = document.getElementById('tb').value.trim();
  const jk = document.querySelector('input[name="jk"]:checked')?.value;

  if (!nama || !umur || !bb || !tb || !jk) {
    alert("Mohon lengkapi semua data.");
    return;
  }

  const params = new URLSearchParams({
    nama,
    umurBulan: umur,
    bb,
    tb,
    jk
  });

  window.location.href = `hasil.html?${params.toString()}`;
});

