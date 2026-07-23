const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });

const clean = (value, maxLength) =>
  typeof value === "string" ? value.trim().slice(0, maxLength) : "";

const isEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;

export async function onRequestPost({ request, env }) {
  const requestOrigin = new URL(request.url).origin;
  const origin = request.headers.get("Origin");

  if (origin && origin !== requestOrigin) {
    return json({ ok: false, error: "Invalid request origin." }, 403);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid submission." }, 400);
  }

  // Honeypot fields should remain empty for real visitors.
  if (clean(payload.website, 200)) {
    return json({ ok: true });
  }

  const email = clean(payload.email, 254);
  const organization = clean(payload.organization, 160);
  const role = clean(payload.role, 120);
  const challenge = clean(payload.challenge, 2000);

  if (!isEmail(email) || !organization || !role || !challenge) {
    return json(
      { ok: false, error: "Please complete every field with a valid work email." },
      400,
    );
  }

  if (!env.RESEND_API_KEY || !env.WAITLIST_FROM_EMAIL || !env.WAITLIST_TO_EMAIL) {
    console.error("Waitlist email environment variables are not configured.");
    return json(
      { ok: false, error: "The waitlist is temporarily unavailable. Please try again later." },
      503,
    );
  }

  const message = [
    "New TarmacSync waitlist submission",
    "",
    `Work email: ${email}`,
    `Airport / organization: ${organization}`,
    `Role: ${role}`,
    "",
    "Biggest project or procurement challenge:",
    challenge,
  ].join("\n");

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.WAITLIST_FROM_EMAIL,
      to: [env.WAITLIST_TO_EMAIL],
      reply_to: email,
      subject: `TarmacSync waitlist — ${organization}`,
      text: message,
    }),
  });

  if (!resendResponse.ok) {
    console.error("Resend rejected waitlist submission:", await resendResponse.text());
    return json(
      { ok: false, error: "We could not send your submission. Please try again." },
      502,
    );
  }

  return json({ ok: true });
}

export function onRequest() {
  return json({ ok: false, error: "Method not allowed." }, 405);
}
