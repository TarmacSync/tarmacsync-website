const clean = (value, maxLength) =>
  typeof value === "string" ? value.trim().slice(0, maxLength) : "";

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
  const challenge = clean(payload.challenge, 2000);
  const utmSource = clean(payload.utm_source, 200);
  const utmMedium = clean(payload.utm_medium, 200);
  const utmCampaign = clean(payload.utm_campaign, 200);

  if (!isEmail(email) || !fullName || !organization || !role) {
    return sendJson(response, 400, {
      ok: false,
      error: "Please complete every required field with a valid work email.",
    });
  }

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
    ...(challenge ? ["", "Additional:", challenge] : []),
  ].join("\n");

  const htmlRows = [
    { label: "Name", value: fullName },
    { label: "Email", value: `<a href="mailto:${email}" style="color:#0a0a0d;text-decoration:none;">${email}</a>` },
    { label: "Airport", value: organization },
    { label: "Role", value: role },
    ...(airportType ? [{ label: "Airport type", value: airportType }] : []),
    ...(state ? [{ label: "State", value: state }] : []),
    ...(timing ? [{ label: "Timing", value: timing }] : []),
    ...(utmSource ? [{ label: "UTM source", value: utmSource }] : []),
    ...(utmMedium ? [{ label: "UTM medium", value: utmMedium }] : []),
    ...(utmCampaign ? [{ label: "UTM campaign", value: utmCampaign }] : []),
    ...(project ? [{ label: "Project", value: project }] : []),
    ...(challenge ? [{ label: "Additional", value: challenge }] : []),
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
          <td style="padding:10px 0;border-bottom:1px solid #f0f0f3;font-size:15px;color:#0a0a0d;line-height:1.5;">${String(r.value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</td>
        </tr>`).join("")}
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:20px 36px 32px;border-top:1px solid #eee;">
      <p style="margin:0;font-size:13px;color:#999;line-height:1.5;">Reply directly to this email to respond to ${fullName}.</p>
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

  // Zoho CRM: Web-to-Lead form (best-effort, non-blocking)
  try {
    const zohoDesc = [project, challenge].filter(Boolean).join("\n\n");
    const zohoRes = await fetch("https://crm.zoho.eu/crm/WebToLeadForm", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        xnQsjsdp: "e091d8eaa0fe1b69c3e1a5547d81fdcd9b47d9ef45267c13221333de0d367284",
        xmIwtLD: "3bd3e83dfe1622648148e810de9c67746d4db06b5b00c06e0d9d161be017effe1e87e615f6b759107f07f027e7ad60b8",
        actionType: "TGVhZHM=",
        returnURL: "null",
        Email: email,
        "Last Name": fullName,
        Company: organization,
        Designation: role,
        Description: zohoDesc || "",
      }),
    });

    if (!zohoRes.ok) {
      console.error("Zoho Web-to-Lead failed:", await zohoRes.text());
    }
  } catch (error) {
    console.error("Zoho Web-to-Lead error:", error);
  }

  return sendJson(response, 200, { ok: true });
};
