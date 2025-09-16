async function sendRegistration(data) {
  let delay = 200;
  const maxRetries = 6;

  for (let i = 0; i < maxRetries; i++) {
    const res = await fetch("/api/register-proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "register", ...data }),
    });

    const json = await res.json();

    if (json.result === "success") {
      return json;
    }
    if (json.result === "busy") {
      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
      continue;
    }
    throw new Error(json.message || "Unknown error");
  }
  throw new Error("فشل التسجيل بعد عدة محاولات.");
}
