// قائمة الإعلانات بصيغة webp
const ads = [
  {
    img: "assets/ads/eng.webp",  // صورة الإعلان
    link: "https://www.iugaza.edu.ps/p29815/" // رابط التفاصيل
  }
  // يمكنك إضافة إعلانات أخرى بنفس التنسيق
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

// عرض الإعلان بعد 15 ثانية مثلاً
window.addEventListener("load", () => {
  setTimeout(showRandomAd, 15000);
});
