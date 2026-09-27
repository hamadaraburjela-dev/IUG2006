/**
 * IEEEXtreme 20.0 Gaza Registration
 * نسخة سريعة + تأكيد حفظ حقيقي + بدون إظهار تفاصيل التخزين للمستخدم
 *
 * الفكرة:
 * 1) إرسال سريع POST no-cors.
 * 2) تأكيد الحفظ عبر status check باستخدام JSONP.
 * 3) إعادة محاولة تلقائية بنفس submissionId إذا تأخر الحفظ.
 * 4) منع التكرار من جهة السيرفر.
 */

const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzuyHHi9ruAO-nkWgb985OFnuZZWnWAqcQOgY5-ioBrB4FaRbBWIEJdsQkCarq0x_Nk/exec";

const menuBtn = document.getElementById("menuBtn");
const navLinks = document.getElementById("navLinks");
const form = document.getElementById("registrationForm");
const submitBtn = document.getElementById("submitBtn");
const statusText = document.getElementById("statusText");
const modal = document.getElementById("successModal");
const closeModal = document.getElementById("closeModal");
const okModal = document.getElementById("okModal");
const gender = document.getElementById("gender");
const femaleSection = document.getElementById("femaleSection");
const clientTimestamp = document.getElementById("clientTimestamp");

form?.setAttribute("novalidate", "novalidate");

menuBtn?.addEventListener("click", () => navLinks?.classList.toggle("open"));
document.querySelectorAll(".links a").forEach(a => a.addEventListener("click", () => navLinks?.classList.remove("open")));

function toggleFemaleSection() {
  if (!gender || !femaleSection) return;
  femaleSection.style.display = gender.value === "أنثى" ? "block" : "none";
}
gender?.addEventListener("change", toggleFemaleSection);
toggleFemaleSection();

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add("visible");
  });
}, { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach(el => observer.observe(el));

function serviceReady() {
  return WEB_APP_URL && !WEB_APP_URL.includes("PASTE_YOUR") && WEB_APP_URL.startsWith("https://script.google.com/macros/s/") && WEB_APP_URL.includes("/exec");
}

function jsonp(action, params = {}, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    if (!serviceReady()) {
      reject(new Error("service-not-ready"));
      return;
    }

    const callbackName = "__reg_cb_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
    const url = new URL(WEB_APP_URL);
    url.searchParams.set("action", action);
    url.searchParams.set("callback", callbackName);
    url.searchParams.set("_", Date.now().toString());

    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value ?? "");
    });

    const script = document.createElement("script");
    let done = false;

    const cleanup = () => {
      done = true;
      delete window[callbackName];
      script.remove();
      clearTimeout(timer);
    };

    window[callbackName] = (data) => {
      if (done) return;
      cleanup();
      resolve(data || {});
    };

    script.onerror = () => {
      if (done) return;
      cleanup();
      reject(new Error("jsonp-error"));
    };

    const timer = setTimeout(() => {
      if (done) return;
      cleanup();
      reject(new Error("jsonp-timeout"));
    }, timeoutMs);

    script.src = url.toString();
    document.body.appendChild(script);
  });
}

function warmupRegistrationService() {
  if (!serviceReady()) return;
  setTimeout(() => {
    jsonp("ping", {}, 5000).catch(() => {});
  }, 900);
}
window.addEventListener("load", warmupRegistrationService);

function modalParts() {
  return {
    icon: modal?.querySelector(".check"),
    title: modal?.querySelector("h2"),
    text: modal?.querySelector("p"),
    close: closeModal,
    ok: okModal
  };
}

function showModal(type, title, htmlMessage, options = {}) {
  if (!modal) {
    alert(title + "\n" + htmlMessage.replace(/<[^>]*>?/gm, ""));
    return;
  }

  const parts = modalParts();

  if (parts.icon) {
    parts.icon.textContent = type === "loading" ? "…" : type === "error" ? "!" : "✓";
    parts.icon.style.background = type === "error"
      ? "linear-gradient(135deg,#ff6b6b,#ffd166)"
      : type === "loading"
        ? "linear-gradient(135deg,#ffd166,#00a6ff)"
        : "linear-gradient(135deg,#00e6c3,#00a6ff)";
  }

  if (parts.title) parts.title.textContent = title;
  if (parts.text) parts.text.innerHTML = htmlMessage;

  const canClose = options.canClose !== false;
  if (parts.close) parts.close.style.display = canClose ? "block" : "none";
  if (parts.ok) parts.ok.style.display = canClose ? "inline-flex" : "none";

  modal.classList.add("show");
}

function closeSuccess() {
  modal?.classList.remove("show");
}
closeModal?.addEventListener("click", closeSuccess);
okModal?.addEventListener("click", closeSuccess);
modal?.addEventListener("click", e => {
  if (e.target === modal && closeModal?.style.display !== "none") closeSuccess();
});

function isVisible(element) {
  return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
}

function getQuestionTitle(input) {
  const label = input.closest("label");
  if (label) {
    const clone = label.cloneNode(true);
    clone.querySelectorAll("input,select,textarea,button").forEach(el => el.remove());
    const text = clone.textContent.replace(/\s+/g, " ").trim();
    if (text) return text;
  }

  const section = input.closest(".form-section");
  const h3 = section?.querySelector("h3")?.textContent?.trim();
  return h3 || input.name || "سؤال مطلوب";
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, match => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[match]));
}

function validateRequiredFields() {
  const missing = [];
  const invalidEmails = [];
  const invalidPhones = [];

  form.querySelectorAll("[required]").forEach(field => {
    if (field.type === "hidden" || !isVisible(field)) return;

    if (field.type === "checkbox") {
      if (!field.checked) missing.push(getQuestionTitle(field));
      return;
    }

    const value = String(field.value || "").trim();
    if (!value) {
      missing.push(getQuestionTitle(field));
      return;
    }

    if (field.type === "email" && !field.checkValidity()) {
      invalidEmails.push(getQuestionTitle(field));
    }

    if (field.type === "tel" && value && !/^[0-9+\-\s]{8,20}$/.test(value)) {
      invalidPhones.push(getQuestionTitle(field));
    }
  });

  if (document.querySelectorAll('input[name="languages"]:checked').length === 0) {
    missing.push("لغات البرمجة التي تستطيع استخدامها");
  }

  if (document.querySelectorAll('input[name="topics"]:checked').length === 0) {
    missing.push("المواضيع التي لديك معرفة بها");
  }

  return { missing, invalidEmails, invalidPhones };
}

function showValidationErrors(errors) {
  const parts = [];

  if (errors.missing.length) {
    parts.push(`<b>الأسئلة الناقصة:</b><ul>${errors.missing.map(x => `<li>${escapeHtml(x)}</li>`).join("")}</ul>`);
  }

  if (errors.invalidEmails.length) {
    parts.push(`<b>بريد إلكتروني غير صحيح:</b><ul>${errors.invalidEmails.map(x => `<li>${escapeHtml(x)}</li>`).join("")}</ul>`);
  }

  if (errors.invalidPhones.length) {
    parts.push(`<b>رقم جوال غير صحيح:</b><ul>${errors.invalidPhones.map(x => `<li>${escapeHtml(x)}</li>`).join("")}</ul>`);
  }

  showModal(
    "error",
    "يوجد بيانات ناقصة أو غير صحيحة",
    parts.join("<br>") + "<br><b>يرجى إكمال البيانات ثم إعادة الإرسال.</b>"
  );

  const firstInvalid = Array.from(form.querySelectorAll("[required]")).find(field => {
    if (field.type === "hidden" || !isVisible(field)) return false;
    if (field.type === "checkbox") return !field.checked;
    return !String(field.value || "").trim() || !field.checkValidity();
  });

  firstInvalid?.scrollIntoView({ behavior: "smooth", block: "center" });
  setTimeout(() => firstInvalid?.focus?.(), 350);
}

function collectData(formEl) {
  const fd = new FormData(formEl);
  const data = {};
  for (const [key, value] of fd.entries()) {
    data[key] = data[key] ? data[key] + ", " + value : value;
  }
  return data;
}

function createSubmissionId() {
  const rand = Math.random().toString(36).slice(2);
  return "sub_" + Date.now() + "_" + rand;
}

async function postNoCors(data) {
  const fd = new FormData();
  fd.append("action", "register");

  Object.entries(data).forEach(([key, value]) => {
    fd.append(key, value ?? "");
  });

  await fetch(WEB_APP_URL, {
    method: "POST",
    mode: "no-cors",
    body: fd,
    keepalive: false
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitUntilSaved(submissionId) {
  const delays = [600, 900, 1300, 1800, 2400, 3200, 4200];

  for (let i = 0; i < delays.length; i++) {
    await sleep(delays[i]);

    try {
      const res = await jsonp("status", { submissionId }, 7000);
      if (res && res.saved) return res;
    } catch (err) {
      // نكمل المحاولات بدون إظهار خطأ للمستخدم
    }
  }

  throw new Error("not-confirmed");
}

async function submitFastConfirmed(data) {
  data.submissionId = data.submissionId || createSubmissionId();

  await postNoCors(data);

  try {
    return await waitUntilSaved(data.submissionId);
  } catch (firstError) {
    if (statusText) statusText.textContent = "ما زال الإرسال قيد المعالجة...";
    await postNoCors(data); // retry بنفس رقم الطلب، والسيرفر يمنع التكرار
    return await waitUntilSaved(data.submissionId);
  }
}

form?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const errors = validateRequiredFields();
  if (errors.missing.length || errors.invalidEmails.length || errors.invalidPhones.length) {
    showValidationErrors(errors);
    return;
  }

  if (!serviceReady()) {
    showModal(
      "error",
      "النظام غير جاهز للإرسال",
      "لم يتم ربط نظام الإرسال بعد. يرجى التواصل مع مسؤول الموقع."
    );
    return;
  }

  if (clientTimestamp) clientTimestamp.value = new Date().toISOString();

  submitBtn.disabled = true;
  submitBtn.textContent = "جاري الإرسال...";
  if (statusText) statusText.textContent = "جاري إرسال الطلب...";

  showModal(
    "loading",
    "جاري إرسال البيانات",
    "يرجى الانتظار قليلًا، يتم الآن إرسال طلب التسجيل.",
    { canClose: false }
  );

  try {
    const data = collectData(form);
    await submitFastConfirmed(data);

    form.reset();
    toggleFemaleSection();

    showModal(
      "success",
      "تم استلام طلبك بنجاح",
      "تم إرسال طلب التسجيل بنجاح. سيتم مراجعة البيانات والتواصل مع المقبولين لاحقًا."
    );

    if (statusText) statusText.textContent = "تم إرسال الطلب بنجاح.";
  } catch (err) {
    console.error(err);
    showModal(
      "error",
      "لم يتم إرسال الطلب",
      "تعذر تأكيد إرسال الطلب حاليًا. يرجى التأكد من الاتصال بالإنترنت ثم المحاولة مرة أخرى."
    );

    if (statusText) statusText.textContent = "فشل الإرسال. يرجى المحاولة مرة أخرى.";
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "إرسال طلب التسجيل";
  }
});
