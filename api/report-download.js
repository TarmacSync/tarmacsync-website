const crypto = require("node:crypto");

const clean = (value, maxLength) =>
  typeof value === "string" ? value.trim().slice(0, maxLength) : "";
const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
const sendJson = (response, status, body) => {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  return response.status(status).json(body);
};
const timingSafeEqual = (a, b) => {
  const left = Buffer.from(a.toLowerCase());
  const right = Buffer.from(b.toLowerCase());
  return left.length === right.length && crypto.timingSafeEqual(left, right);
};
const allowedOrigin = (request) => {
  const origin = request.headers.origin;
  const host = request.headers["x-forwarded-host"] || request.headers.host;
  if (!origin) return true;
  try {
    const parsed = new URL(origin);
    return parsed.protocol === "https:" && parsed.host === host;
  } catch { return false; }
};
const parseBody = (request) => {
  if (request.body && typeof request.body === "object" && !Array.isArray(request.body)) return request.body;
  if (typeof request.body === "string") {
    try {
      const parsed = JSON.parse(request.body);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
    } catch { return null; }
  }
  return null;
};
const brevoRequest = async (path, body, method = "POST") => {
  const response = await fetch(`https://api.brevo.com${path}`, {
    method,
    headers: { accept: "application/json", "api-key": process.env.BREVO_API_KEY, "content-type": "application/json" },
    ...(method === "GET" ? {} : { body: JSON.stringify(body) }),
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { /* keep null */ }
  if (!response.ok) throw new Error(`Brevo ${response.status}`);
  return data;
};
const reportListId = () => Number(process.env.BREVO_REPORT_LIST_ID);

module.exports = async function reportDownload(request, response) {
  if (request.method !== "POST") { response.setHeader("Allow", "POST"); return sendJson(response, 405, { ok: false, error: "Method not allowed." }); }
  if (!allowedOrigin(request)) return sendJson(response, 403, { ok: false, error: "Invalid request origin." });
  const payload = parseBody(request);
  if (!payload) return sendJson(response, 400, { ok: false, error: "Invalid submission." });
  if (clean(payload.website, 200)) return sendJson(response, 200, { ok: true });

  const email = clean(payload.email, 254).toLowerCase();
  const airportOrganization = clean(payload.airportOrganization, 160);
  const firstName = clean(payload.firstName, 80);
  const followUpConsent = payload.followUpConsent === true;
  const consentText = clean(payload.consentText, 500);
  const consentVersion = clean(payload.consentVersion, 80);
  const source = clean(payload.source, 120);
  if (!isEmail(email) || !airportOrganization) return sendJson(response, 400, { ok: false, error: "Please provide a valid work email and airport or organization." });

  const testEmail = clean(process.env.REPORT_TEST_EMAIL || "Omar@tarmacSync.com", 254).toLowerCase();
  const publicDeliveryEnabled = process.env.REPORT_PUBLIC_DELIVERY_ENABLED === "true";
  if (!publicDeliveryEnabled && !timingSafeEqual(email, testEmail)) return sendJson(response, 403, { ok: false, error: "Report requests are not open yet." });
  if (!process.env.BREVO_API_KEY || !process.env.BREVO_REPORT_LIST_ID || !process.env.BREVO_REPORT_TEMPLATE_ID) return sendJson(response, 503, { ok: false, error: "The report request service is not configured yet." });

  let alreadyDelivered = false;
  try {
    const existing = await brevoRequest(`/v3/contacts/${encodeURIComponent(email)}`, null, "GET");
    alreadyDelivered = Array.isArray(existing?.listIds) && existing.listIds.includes(reportListId());
    if (alreadyDelivered) return sendJson(response, 200, { ok: true, delivery: "already-delivered", followUpEnrolled: false });
  } catch (error) {
    if (!String(error.message).includes("Brevo 404")) {
      console.error("Report delivery lookup failed:", error.message);
      return sendJson(response, 503, { ok: false, error: "The report request service is temporarily unavailable." });
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

  try {
    await brevoRequest("/v3/smtp/email", {
      sender: { email: process.env.BREVO_SENDER_EMAIL || "Omar@tarmacsync.com", name: "Omar Daaboul | TarmacSync" },
      to: [{ email, name: firstName || undefined }],
      templateId: Number(process.env.BREVO_REPORT_TEMPLATE_ID),
      params: { FIRSTNAME: firstName, AIRPORT_ORGANIZATION: airportOrganization },
      tags: ["airport-infrastructure-delivery-gap", "report-request"],
    });
    await brevoRequest("/v3/contacts", { email, attributes, listIds: [reportListId()], updateEnabled: true });
  } catch (error) {
    console.error("Report request processing failed:", error.message);
    return sendJson(response, 502, { ok: false, error: "We could not confirm the report request." });
  }
  return sendJson(response, 200, { ok: true, delivery: "email", followUpEnrolled: followUpConsent });
};
