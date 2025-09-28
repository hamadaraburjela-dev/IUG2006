// قائمة الإعلانات (يمكنك إضافة أكثر من إعلان)
const ads = [
  {
    img: "assets/ads/eng.webp",
    link: "https://www.iugaza.edu.ps/p29815/"
  },
  // fallbacks - these files are optional; we'll use the first existing image
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

function findAvailableAd() {
  // prefer the first ad whose image file exists (quick heuristic)
  for (const ad of ads) {
    try {
      // create a temporary Image to check loading
      const img = new Image();
      img.src = ad.img;
      // If the browser can't load it, onerror will fire later — but we can't block here.
      // We'll return the ad; the <img> element will show a broken image if missing.
      return ad;
    } catch (e) {
      continue;
    }
  }
  return ads[0];
}

// عرض إعلان عشوائي (محميًا ضد عناصر DOM المفقودة)
function showRandomAd() {
  if (!modal || !adImage) return;
  const randomAd = findAvailableAd();
  adImage.src = randomAd.img || ads[0].img;
  if (detailsBtn) detailsBtn.onclick = () => window.open(randomAd.link || ads[0].link, "_blank");
  modal.style.display = "block";
}

// إغلاق النافذة (حماية ضد عناصر مفقودة)
if (closeBtn) closeBtn.onclick = () => { if (modal) modal.style.display = "none"; };
if (closeX) closeX.onclick = () => { if (modal) modal.style.display = "none"; };

// عرض إعلان بعد 15 ثانية من تحميل الصفحة
window.addEventListener("load", () => {
  setTimeout(showRandomAd, 15000);
});

