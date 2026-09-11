import { NextResponse } from "next/server";

// Simple in-memory sliding window IP rate limiter (5 requests per 60s per IP)
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  
  // Filter out timestamps older than window
  const validTimestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    rateLimitMap.set(ip, validTimestamps);
    return true;
  }

  validTimestamps.push(now);
  rateLimitMap.set(ip, validTimestamps);
  return false;
}

export async function POST(request: Request) {
  // Extract client IP address
  const clientIp =
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1";

  if (isRateLimited(clientIp)) {
    return NextResponse.json(
      { error: "Too many AI generation requests. Please wait a minute before trying again." },
      { status: 429 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request payload" }, { status: 400 });
  }

  const backendUrl = process.env.AGENT_API_URL || "http://127.0.0.1:8000";
  const targetEndpoint = `${backendUrl}/api/v1/generate-itinerary`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

  try {
    const res = await fetch(targetEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.status === 422) {
      const errData = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: errData.detail || "Invalid or off-topic travel request." },
        { status: 422 }
      );
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: "AI suggestions are temporarily unavailable." },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === "AbortError") {
      return NextResponse.json(
        { error: "AI generation request timed out. Please try again." },
        { status: 504 }
      );
    }

    // Graceful degradation 502 response
    return NextResponse.json(
      { error: "AI suggestions are temporarily unavailable." },
      { status: 502 }
    );
  }
}
