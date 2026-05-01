import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/cpagrip-wall?id=<OFFERWALL_ID>&u=<USER_ID>
 *
 * Returns a full HTML page that embeds the CPAGrip offerwall script tag
 * directly (at parse time, not dynamically injected), so document.write()
 * works correctly.
 *
 * Because this page is served from janarewards.xyz (our own domain) there is
 * no X-Frame-Options problem when we iframe it.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const id = searchParams.get("id");
  const u  = searchParams.get("u");

  if (!id || !u) {
    return new NextResponse("Missing id or u", { status: 400 });
  }

  // The CPAGrip script URL
  const scriptSrc = `https://singingfiles.com/show.php?l=1&id=${encodeURIComponent(id)}&u=${encodeURIComponent(u)}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CPAGrip Offers</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #fff; font-family: sans-serif; }
  </style>
</head>
<body>
  <script src="${scriptSrc}"></script>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // Allow this page to be iframed by our own site
      "X-Frame-Options": "SAMEORIGIN",
      // No CSP restrictions needed — same origin iframe
      "Cache-Control": "no-store",
    },
  });
}
