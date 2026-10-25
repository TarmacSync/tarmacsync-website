export function onRequest() {
  return Response.json(
    { ok: false, error: "This form is no longer available." },
    { status: 410, headers: { "Cache-Control": "no-store" } },
  );
}
