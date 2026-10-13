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

function getSanitizedClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const rawIp = forwarded ? forwarded.split(",")[0].trim() : (request.headers.get("x-real-ip") || "127.0.0.1");
  // Validate IPv4 or IPv6 format to prevent header injection / spoofing
  const ipv4Regex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
  const ipv6Regex = /^[0-9a-fA-F:]+$/;
  if (ipv4Regex.test(rawIp) || ipv6Regex.test(rawIp)) {
    return rawIp;
  }
  return "127.0.0.1";
}

export async function POST(request: Request) {
  // Enforce payload size limit (max 64KB)
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 64 * 1024) {
    return NextResponse.json({ error: "Payload exceeds maximum allowed size (64KB)." }, { status: 413 });
  }

  // Extract and validate client IP address
  const clientIp = getSanitizedClientIp(request);

  if (isRateLimited(clientIp)) {
    return NextResponse.json(
      { error: "Too many AI generation requests. Please wait a minute before trying again." },
      { status: 429 }
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request payload" }, { status: 400 });
  }

function scrubPiiFromPrompt(input: string): string {
  if (!input || typeof input !== "string") return input;
  let text = input;
  // Redact email addresses
  text = text.replace(/[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g, "[REDACTED_EMAIL]");
  // Redact phone numbers (+94... or international formatted numbers)
  text = text.replace(/(?:\+\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g, "[REDACTED_PHONE]");
  // Redact Sri Lankan NIC or passport style patterns
  text = text.replace(/\b\d{9}[vVxX]\b|\b\d{12}\b|\b[A-Z]\d{7,8}\b/g, "[REDACTED_ID]");
  return text;
}

  // Validate request field boundaries and scrub unnecessary PII
  if (body && typeof body === "object") {
    if (typeof body.prompt === "string") {
      const trimmed = body.prompt.length > 2000 ? body.prompt.slice(0, 2000) : body.prompt;
      body.prompt = scrubPiiFromPrompt(trimmed);
    }
    if (typeof body.user_prompt === "string") {
      const trimmed = body.user_prompt.length > 2000 ? body.user_prompt.slice(0, 2000) : body.user_prompt;
      body.user_prompt = scrubPiiFromPrompt(trimmed);
    }
    if (body.duration_days) {
      const dur = Number(body.duration_days);
      body.duration_days = isNaN(dur) ? 3 : Math.min(30, Math.max(1, dur));
    }
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
