// Pilihan domisili saat mendaftar: kecamatan → kelurahan (Kota Surabaya), lalu RW dan RT.
// CATATAN: daftar kecamatan/kelurahan ini data contoh yang disusun manual dan BELUM divalidasi
// terhadap master wilayah resmi. Rentang RW/RT juga contoh. Ganti dengan master resmi sebelum operasional.
const RAW =
  "Asemrowo:Asemrowo,Genting Kalianak,Tambak Sarioso|Benowo:Kandangan,Romokalisari,Sememi,Tambak Osowilangon|Bubutan:Alun-alun Contong,Bubutan,Gundih,Jepara,Tembok Dukuh|Bulak:Bulak,Kedung Cowek,Kenjeran,Komplek Kenjeran|Dukuh Pakis:Dukuh Kupang,Dukuh Pakis,Gunung Sari,Pradah Kalikendal|Gayungan:Dukuh Menanggal,Gayungan,Ketintang,Menanggal|Genteng:Embong Kaliasin,Genteng,Kapasari,Ketabang,Peneleh|Gubeng:Airlangga,Baratajaya,Gubeng,Kertajaya,Mojo,Pucang Sewu|Gunung Anyar:Gunung Anyar,Gunung Anyar Tambak,Rungkut Menanggal,Rungkut Tengah|Jambangan:Jambangan,Karah,Kebonsari,Pagesangan|Karang Pilang:Karang Pilang,Kebraon,Kedurus,Warugunung|Kenjeran:Bulak Banteng,Sidotopo Wetan,Tambak Wedi,Tanah Kali Kedinding|Krembangan:Dupak,Kemayoran,Krembangan Selatan,Morokrembangan,Perak Barat|Lakarsantri:Bangkingan,Jeruk,Lakarsantri,Lidah Kulon,Lidah Wetan,Sumur Welut|Mulyorejo:Dukuh Sutorejo,Kalijudan,Kalisari,Kejawan Putih Tambak,Manyar Sabrangan,Mulyorejo|Pabean Cantian:Bongkaran,Krembangan Utara,Nyamplungan,Perak Timur,Perak Utara|Pakal:Babat Jerawat,Benowo,Pakal,Sumberejo|Rungkut:Kali Rungkut,Kedung Baruk,Medokan Ayu,Penjaringan Sari,Rungkut Kidul,Wonorejo|Sambikerep:Bringin,Lontar,Made,Sambikerep|Sawahan:Banyu Urip,Kupang Krajan,Pakis,Petemon,Putat Jaya,Sawahan|Semampir:Ampel,Pegirian,Sidotopo,Ujung,Wonokusumo|Simokerto:Kapasan,Sidodadi,Simokerto,Simolawang,Tambak Rejo|Sukolilo:Gebang Putih,Keputih,Klampis Ngasem,Medokan Semampir,Menur Pumpungan,Nginden Jangkungan,Semolowaru|Sukomanunggal:Putat Gede,Simomulyo,Simomulyo Baru,Sono Kwijenan,Sukomanunggal,Tanjungsari|Tambaksari:Gading,Kapas Madya Baru,Pacarkeling,Pacarkembang,Ploso,Rangkah,Tambaksari|Tandes:Balongsari,Banjar Sugihan,Karang Poh,Manukan Kulon,Manukan Wetan,Tandes|Tegalsari:Dr. Sutomo,Kedungdoro,Keputran,Tegalsari,Wonorejo|Tenggilis Mejoyo:Kendangsari,Kutisari,Panjang Jiwo,Prapen,Tenggilis Mejoyo|Wiyung:Babatan,Balas Klumprik,Jajar Tunggal,Wiyung|Wonocolo:Bendul Merisi,Jemur Wonosari,Margorejo,Sidosermo,Siwalankerto|Wonokromo:Darmo,Jagir,Ngagel,Ngagelrejo,Sawunggaling,Wonokromo";

/** @type {Readonly<Record<string, readonly string[]>>} */
export const KECAMATAN_KELURAHAN = Object.freeze(
  Object.fromEntries(
    RAW.split("|").map((row) => {
      const [kecamatan, kelurahan] = row.split(":");
      return [kecamatan, Object.freeze(kelurahan.split(","))];
    }),
  ),
);

export const RW_MAX = 20;
export const RT_MAX = 15;

/** @param {number} n */
export const twoDigits = (n) => String(n).padStart(2, "0");
