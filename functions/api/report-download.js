// Cloudflare Pages Function for the homepage report form. Ported from the Vercel function
// (api/report-download.js) with the same checks in the same order; configuration comes from
// the Pages project's environment variables (context.env) instead of process.env.

const clean = (value, maxLength) =>
  typeof value === "string" ? value.trim().slice(0, maxLength) : "";
const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
const sendJson = (status, body, extraHeaders = {}) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store", ...extraHeaders } });
// Constant-time for equal lengths, like crypto.timingSafeEqual, without depending on Node's Buffer.
const timingSafeEqual = (a, b) => {
  const left = new TextEncoder().encode(a.toLowerCase());
  const right = new TextEncoder().encode(b.toLowerCase());
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i++) diff |= left[i] ^ right[i];
  return diff === 0;
};
const allowedOrigin = (request) => {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const parsed = new URL(origin);
    return parsed.protocol === "https:" && parsed.host === new URL(request.url).host;
  } catch { return false; }
};
const parseBody = async (request) => {
  try {
    const parsed = JSON.parse(await request.text());
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch { return null; }
};
const brevo = (env) => async (path, body, method = "POST") => {
  const response = await fetch(`https://api.brevo.com${path}`, {
    method,
    headers: { accept: "application/json", "api-key": env.BREVO_API_KEY, "content-type": "application/json" },
    ...(method === "GET" ? {} : { body: JSON.stringify(body) }),
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { /* keep null */ }
  if (!response.ok) throw new Error(`Brevo ${response.status}`);
  return data;
};

export async function onRequest({ request, env }) {
  if (request.method !== "POST") return sendJson(405, { ok: false, error: "Method not allowed." }, { Allow: "POST" });
  if (!allowedOrigin(request)) return sendJson(403, { ok: false, error: "Invalid request origin." });
  const payload = await parseBody(request);
  if (!payload) return sendJson(400, { ok: false, error: "Invalid submission." });
  if (clean(payload.website, 200)) return sendJson(200, { ok: true });

  const email = clean(payload.email, 254).toLowerCase();
  const airportOrganization = clean(payload.airportOrganization, 160);
  const firstName = clean(payload.firstName, 80);
  const followUpConsent = payload.followUpConsent === true;
  const consentText = clean(payload.consentText, 500);
  const consentVersion = clean(payload.consentVersion, 80);
  const source = clean(payload.source, 120);
  if (!isEmail(email) || !airportOrganization) return sendJson(400, { ok: false, error: "Please provide a valid work email and airport or organization." });

  const testEmail = clean(env.REPORT_TEST_EMAIL || "Omar@tarmacSync.com", 254).toLowerCase();
  const publicDeliveryEnabled = env.REPORT_PUBLIC_DELIVERY_ENABLED === "true";
  if (!publicDeliveryEnabled && !timingSafeEqual(email, testEmail)) return sendJson(403, { ok: false, error: "Report requests are not open yet." });
  if (!env.BREVO_API_KEY || !env.BREVO_REPORT_LIST_ID || !env.BREVO_REPORT_TEMPLATE_ID) return sendJson(503, { ok: false, error: "The report request service is not configured yet." });

  const brevoRequest = brevo(env);
  const reportListId = Number(env.BREVO_REPORT_LIST_ID);
  const weeklyListId = Number(env.BREVO_WEEKLY_LIST_ID);
  const weeklyEnabled = Number.isInteger(weeklyListId) && weeklyListId > 0;

  try {
    const existing = await brevoRequest(`/v3/contacts/${encodeURIComponent(email)}`, null, "GET");
    const alreadyDelivered = Array.isArray(existing?.listIds) && existing.listIds.includes(reportListId);
    if (alreadyDelivered) {
      if (followUpConsent && weeklyEnabled) {
        try {
          await brevoRequest("/v3/contacts", { email, listIds: [weeklyListId], updateEnabled: true });
        } catch (error) {
          console.error("Weekly enrollment failed for returning contact:", error.message);
          return sendJson(502, { ok: false, error: "We could not confirm the report request." });
        }
      }
      return sendJson(200, { ok: true, delivery: "already-delivered", followUpEnrolled: followUpConsent && weeklyEnabled });
    }
  } catch (error) {
    if (!String(error.message).includes("Brevo 404")) {
      console.error("Report delivery lookup failed:", error.message);
      return sendJson(503, { ok: false, error: "The report request service is temporarily unavailable." });
    }
  }

  const attributes = {
    FIRSTNAME: firstName,
    AIRPORT_ORGANIZATION: airportOrganization,
    SIGNUP_SOURCE: source || "airport-infrastructure-delivery-gap",
    REPORT_CONSENT: followUpConsent ? "yes" : "no",
    CONSENT_TIMESTAMP: new Date().toISOString(),
    CONSENT_VERSION: consentVersion || "report-follow-up-v1",
    JOURNEY_STAGE: "report_requested",
  };
  if (followUpConsent && consentText) attributes.CONSENT_TEXT = consentText;

  const listIds = [reportListId];
  if (followUpConsent && weeklyEnabled) listIds.push(weeklyListId);

  try {
    await brevoRequest("/v3/smtp/email", {
      sender: { email: env.BREVO_SENDER_EMAIL || "Omar@tarmacsync.com", name: "Omar Daaboul | TarmacSync" },
      to: [{ email, name: firstName || undefined }],
      templateId: Number(env.BREVO_REPORT_TEMPLATE_ID),
      params: { FIRSTNAME: firstName, AIRPORT_ORGANIZATION: airportOrganization },
      tags: ["airport-infrastructure-delivery-gap", "report-request"],
    });
    await brevoRequest("/v3/contacts", { email, attributes, listIds, updateEnabled: true });
  } catch (error) {
    console.error("Report request processing failed:", error.message);
    return sendJson(502, { ok: false, error: "We could not confirm the report request." });
  }
  return sendJson(200, { ok: true, delivery: "email", followUpEnrolled: followUpConsent && weeklyEnabled });
}
