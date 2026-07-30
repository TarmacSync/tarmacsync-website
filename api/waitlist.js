const clean = (value, maxLength) =>
  typeof value === "string" ? value.trim().slice(0, maxLength) : "";

const escapeHtml = (value) =>
  String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const isEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;

const sendJson = (response, status, body) => {
  response.setHeader("Cache-Control", "no-store");
  return response.status(status).json(body);
};

module.exports = async function waitlist(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return sendJson(response, 405, { ok: false, error: "Method not allowed." });
  }

  const origin = request.headers.origin;
  const forwardedHost = request.headers["x-forwarded-host"];
  const host = forwardedHost || request.headers.host;

  if (origin) {
    try {
      if (new URL(origin).host !== host) {
        return sendJson(response, 403, { ok: false, error: "Invalid request origin." });
      }
    } catch {
      return sendJson(response, 403, { ok: false, error: "Invalid request origin." });
    }
  }

  let payload = request.body;
  if (typeof payload === "string") {
    try {
      payload = JSON.parse(payload);
    } catch {
      return sendJson(response, 400, { ok: false, error: "Invalid submission." });
    }
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return sendJson(response, 400, { ok: false, error: "Invalid submission." });
  }

  // Honeypot fields should remain empty for real visitors.
  if (clean(payload.website, 200)) {
    return sendJson(response, 200, { ok: true });
  }

  const email = clean(payload.email, 254);
  const fullName = clean(payload.full_name, 160);
  const organization = clean(payload.organization, 160);
  const role = clean(payload.role, 120);
  const airportType = clean(payload.airport_type, 100);
  const state = clean(payload.state, 2);
  const project = clean(payload.project, 2000);
  const timing = clean(payload.timing, 50);
  const utmSource = clean(payload.utm_source, 200);
  const utmMedium = clean(payload.utm_medium, 200);
  const utmCampaign = clean(payload.utm_campaign, 200);

  if (!isEmail(email) || !fullName || !organization || !role) {
    return sendJson(response, 400, {
      ok: false,
      error: "Please complete every required field with a valid work email.",
    });
  }

  // Rate limiting: block rapid resubmissions (in-memory, per-function-instance)
  const submissionKey = `${email}:${organization}`.toLowerCase();
  if (global._submissionCache && global._submissionCache[submissionKey] && Date.now() - global._submissionCache[submissionKey] < 60000) {
    return sendJson(response, 429, { ok: false, error: "Please wait before submitting again." });
  }
  if (!global._submissionCache) global._submissionCache = {};
  global._submissionCache[submissionKey] = Date.now();

  const { RESEND_API_KEY, WAITLIST_FROM_EMAIL, WAITLIST_TO_EMAIL } = process.env;
  if (!RESEND_API_KEY || !WAITLIST_FROM_EMAIL || !WAITLIST_TO_EMAIL) {
    console.error("Waitlist email environment variables are not configured.");
    return sendJson(response, 503, {
      ok: false,
      error: "The waitlist is temporarily unavailable. Please try again later.",
    });
  }

  const text = [
    "New Co-Founding Airport Program application",
    "",
    `Name: ${fullName}`,
    `Work email: ${email}`,
    `Airport / organization: ${organization}`,
    `Role: ${role}`,
    ...(airportType ? [`Airport type: ${airportType}`] : []),
    ...(state ? [`State: ${state}`] : []),
    ...(timing ? [`Timing: ${timing}`] : []),
    ...(utmSource ? [`UTM source: ${utmSource}`] : []),
    ...(utmMedium ? [`UTM medium: ${utmMedium}`] : []),
    ...(utmCampaign ? [`UTM campaign: ${utmCampaign}`] : []),
    ...(project ? ["", "Project:", project] : []),
  ].join("\n");

  const htmlRows = [
    { label: "Name", value: fullName },
    { label: "Email", value: `<a href="mailto:${email}" style="color:#0a0a0d;text-decoration:none;">${email}</a>`, raw: true },
    { label: "Airport", value: organization },
    { label: "Role", value: role },
    ...(airportType ? [{ label: "Airport type", value: airportType }] : []),
    ...(state ? [{ label: "State", value: state }] : []),
    ...(timing ? [{ label: "Timing", value: timing }] : []),
    ...(utmSource ? [{ label: "UTM source", value: utmSource }] : []),
    ...(utmMedium ? [{ label: "UTM medium", value: utmMedium }] : []),
    ...(utmCampaign ? [{ label: "UTM campaign", value: utmCampaign }] : []),
    ...(project ? [{ label: "Project", value: project }] : []),
  ];

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f7;padding:40px 0;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.06);">
  <tr>
    <td style="padding:32px 36px 20px;border-bottom:1px solid #eee;">
      <img src="https://www.tarmacsync.com/assets/tarmacsync-logo.png" alt="TarmacSync" width="160" height="36" style="display:block;border:0;">
    </td>
  </tr>
  <tr>
    <td style="padding:28px 36px 12px;">
      <p style="margin:0;font-size:20px;font-weight:700;color:#0a0a0d;line-height:1.3;">Co-Founding Airport Program application</p>
    </td>
  </tr>
  <tr>
    <td style="padding:6px 36px 28px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        ${htmlRows.map(r => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #f0f0f3;font-size:12px;font-weight:600;text-transform:uppercase;color:#999;width:100px;">${r.label}</td>
          <td style="padding:10px 0;border-bottom:1px solid #f0f0f3;font-size:15px;color:#0a0a0d;line-height:1.5;">${r.raw ? r.value : String(r.value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</td>
        </tr>`).join("")}
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:20px 36px 32px;border-top:1px solid #eee;">
      <p style="margin:0;font-size:13px;color:#999;line-height:1.5;">Reply directly to this email to respond to ${escapeHtml(fullName)}.</p>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  try {
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: WAITLIST_FROM_EMAIL,
        to: [WAITLIST_TO_EMAIL],
        reply_to: email,
        subject: `Co-Founding Airport Program — ${organization}`,
        text,
        html,
      }),
    });

    if (!resendResponse.ok) {
      console.error("Resend rejected waitlist submission:", await resendResponse.text());
      return sendJson(response, 502, {
        ok: false,
        error: "We could not send your submission. Please try again.",
      });
    }
  } catch (error) {
    console.error("Waitlist delivery failed:", error);
    return sendJson(response, 502, {
      ok: false,
      error: "We could not send your submission. Please try again.",
    });
  }

  // Send confirmation email to the applicant (best-effort, non-blocking)
  const CONFIRMATION_FROM_EMAIL = process.env.CONFIRMATION_FROM_EMAIL || "hello@tarmacsync.com";

  const confirmationText = [
    `Hi ${fullName},`,
    "",
    "Thank you for applying to the TarmacSync Founding Airport Partner Program. Your application has been received.",
    "",
    "What happens next:",
    "",
    "1. We'll review your application personally, usually within one business day.",
    "2. If your airport looks like a strong fit, Omar will reach out to schedule a 20-minute call.",
    "3. On the call, we'll walk through your first project and show you how Pathfinder would approach it — no slide deck, just the product.",
    "",
    "We're selecting two founding airports and expect to finalize selections shortly after conversations wrap up.",
    "",
    "If you have any questions before then, just reply to this email.",
    "",
    "— Omar Daaboul, A.A.E.",
    "Founder, TarmacSync",
    "",
    "TarmacSync, Inc.",
    "https://www.tarmacsync.com",
  ].join("\n");

  const confirmationHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f7;padding:40px 0;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.06);">
  <tr>
    <td style="padding:32px 36px 20px;border-bottom:1px solid #eee;">
      <img src="https://www.tarmacsync.com/assets/tarmacsync-logo.png" alt="TarmacSync" width="160" height="36" style="display:block;border:0;">
    </td>
  </tr>
  <tr>
    <td style="padding:28px 36px 12px;">
      <p style="margin:0;font-size:20px;font-weight:700;color:#0a0a0d;line-height:1.3;">Application received — thank you</p>
    </td>
  </tr>
  <tr>
    <td style="padding:6px 36px 0;font-size:15px;color:#3a3a42;line-height:1.65;">
      <p style="margin:0 0 14px;">Hi ${escapeHtml(fullName)},</p>
      <p style="margin:0 0 14px;">Thank you for applying to the TarmacSync Founding Airport Partner Program. Your application has been received.</p>
    </td>
  </tr>
  <tr>
    <td style="padding:16px 36px 12px;">
      <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#0a0a0d;">What happens next</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <tr>
          <td style="padding:10px 14px;border-bottom:1px solid #f0f0f3;font-size:13px;font-weight:600;color:#999;width:22px;vertical-align:top;">1.</td>
          <td style="padding:10px 0;border-bottom:1px solid #f0f0f3;font-size:14px;color:#3a3a42;line-height:1.5;">We'll review your application personally, usually within one business day.</td>
        </tr>
        <tr>
          <td style="padding:10px 14px;border-bottom:1px solid #f0f0f3;font-size:13px;font-weight:600;color:#999;width:22px;vertical-align:top;">2.</td>
          <td style="padding:10px 0;border-bottom:1px solid #f0f0f3;font-size:14px;color:#3a3a42;line-height:1.5;">If your airport looks like a strong fit, Omar will reach out to schedule a 20-minute call.</td>
        </tr>
        <tr>
          <td style="padding:10px 14px;font-size:13px;font-weight:600;color:#999;width:22px;vertical-align:top;">3.</td>
          <td style="padding:10px 0;font-size:14px;color:#3a3a42;line-height:1.5;">On the call, we'll walk through your first project and show you how Pathfinder would approach it — no slide deck, just the product.</td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:16px 36px 28px;font-size:14px;color:#3a3a42;line-height:1.65;">
      <p style="margin:0;">We're selecting two founding airports and expect to finalize selections shortly after conversations wrap up.</p>
      <p style="margin:14px 0 0;">If you have any questions before then, just reply to this email.</p>
    </td>
  </tr>
  <tr>
    <td style="padding:20px 36px 32px;border-top:1px solid #eee;">
      <p style="margin:0;font-size:14px;font-weight:600;color:#0a0a0d;">Omar Daaboul, A.A.E.</p>
      <p style="margin:4px 0 12px;font-size:13px;color:#999;">Founder, TarmacSync</p>
      <p style="margin:0;font-size:12px;color:#aaa;line-height:1.5;">TarmacSync, Inc.<br><a href="https://www.tarmacsync.com" style="color:#999;">tarmacsync.com</a></p>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: CONFIRMATION_FROM_EMAIL,
        to: [email],
        subject: "We received your application — TarmacSync",
        text: confirmationText,
        html: confirmationHtml,
      }),
    });
  } catch (error) {
    console.error("Confirmation email failed:", error);
  }

  // Zoho CRM: Web-to-Lead form (best-effort, non-blocking)
  const ZOHO_XNQSJSDP = process.env.ZOHO_XNQSJSDP || "";
  const ZOHO_XMIWTLD = process.env.ZOHO_XMIWTLD || "";

  if (ZOHO_XNQSJSDP && ZOHO_XMIWTLD) {
    try {
      const [firstName, ...lastNameParts] = fullName.split(" ");
      const lastName = lastNameParts.length ? lastNameParts.join(" ") : firstName;

      const zohoDesc = [
        project ? `Project: ${project}` : "",
        airportType ? `Airport type: ${airportType}` : "",
        timing ? `Timing: ${timing}` : "",
        utmSource ? `UTM source: ${utmSource}` : "",
        utmMedium ? `UTM medium: ${utmMedium}` : "",
        utmCampaign ? `UTM campaign: ${utmCampaign}` : "",
      ].filter(Boolean).join("\n");

      const zohoFields = {
        xnQsjsdp: ZOHO_XNQSJSDP,
        xmIwtLD: ZOHO_XMIWTLD,
        actionType: "TGVhZHM=",
        returnURL: "null",
        Email: email,
        "First Name": firstName,
        "Last Name": lastName,
        Company: organization,
        Designation: role,
        Description: zohoDesc || "",
      };

      if (state) zohoFields.State = state;

      const zohoRes = await fetch("https://crm.zoho.com/crm/WebToLeadForm", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(zohoFields),
      });

      if (!zohoRes.ok) {
        console.error("Zoho Web-to-Lead failed:", await zohoRes.text());
      }
    } catch (error) {
      console.error("Zoho Web-to-Lead error:", error);
    }
  }

  return sendJson(response, 200, { ok: true });
};
