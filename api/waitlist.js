const sendJson = (response, status, body) => {
  response.setHeader("Cache-Control", "no-store");
  return response.status(status).json(body);
};

module.exports = function legacyWaitlistDisabled(_request, response) {
  return sendJson(response, 410, { ok: false, error: "This form is no longer available." });
};
