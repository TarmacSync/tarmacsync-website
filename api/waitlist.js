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
  const organization = clean(payload.organization, 160);
  const role = clean(payload.role, 120);
  const challenge = clean(payload.challenge, 2000);

  if (!isEmail(email) || !organization || !role) {
    return sendJson(response, 400, {
      ok: false,
      error: "Please complete every field with a valid work email.",
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

  const message = [
    "New TarmacSync waitlist submission",
    "",
    `Work email: ${email}`,
    `Airport / organization: ${organization}`,
    `Role: ${role}`,
    ...(challenge ? ["", "Anything else:", challenge] : []),
  ].join("\n");

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
        subject: `TarmacSync waitlist — ${organization}`,
        text: message,
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

  // Zoho CRM: create lead via MCP (best-effort, non-blocking)
  const ZOHO_MCP_URL = process.env.ZOHO_MCP_URL;

  if (ZOHO_MCP_URL) {
    try {
      const name = email.split("@")[0];
      const mcpRes = await fetch(ZOHO_MCP_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "tools/call",
          params: {
            name: "create_record",
            arguments: {
              module: "Leads",
              data: {
                Email: email,
                Last_Name: name,
                Company: organization,
                Title: role,
                Description: challenge || "",
                Lead_Source: "TarmacSync Website",
              },
            },
          },
          id: 1,
        }),
      });

      if (!mcpRes.ok) {
        console.error("Zoho MCP create lead failed:", await mcpRes.text());
      }
    } catch (error) {
      console.error("Zoho MCP integration error:", error);
    }
  }

  return sendJson(response, 200, { ok: true });
};
