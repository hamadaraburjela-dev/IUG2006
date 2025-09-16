// قائمة الإعلانات (يمكنك إضافة أكثر من إعلان)
const ads = [
  {
    img: "assets/ads/eng.webp",
    link: "https://www.iugaza.edu.ps/p29815/"
  },
  {
    img: "assets/ads/ad2.webp",
    link: "https://example.com/ad2"
  },
  {
    img: "assets/ads/ad3.webp",
    link: "https://example.com/ad3"
  }
];

const modal = document.getElementById("adModal");
const adImage = document.getElementById("adImage");
const detailsBtn = document.getElementById("detailsBtn");
const closeBtn = document.getElementById("closeBtn");
const closeX = document.querySelector(".close");

// عرض إعلان عشوائي
function showRandomAd() {
  const randomAd = ads[Math.floor(Math.random() * ads.length)];
  adImage.src = randomAd.img;
  detailsBtn.onclick = () => window.open(randomAd.link, "_blank");
  modal.style.display = "block";
}

// إغلاق النافذة
closeBtn.onclick = () => modal.style.display = "none";
closeX.onclick = () => modal.style.display = "none";

// عرض إعلان بعد 15 ثانية من تحميل الصفحة
window.addEventListener("load", () => {
  setTimeout(showRandomAd, 15000);
});
