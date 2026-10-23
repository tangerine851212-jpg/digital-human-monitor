import { ZodError } from "zod";

import { ingestAnalyticsBatch } from "@/lib/analytics/server";
import { TRACK_API_PATH } from "@/lib/site";

export const dynamic = "force-dynamic";

const responseHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, authorization",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Cache-Control": "no-store",
};

export async function GET() {
  return Response.json(
    {
      ok: true,
      endpoint: TRACK_API_PATH,
      message: "Analytics ingestion endpoint is ready.",
    },
    { headers: responseHeaders },
  );
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: responseHeaders,
  });
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const result = await ingestAnalyticsBatch(payload, request.headers);

    return Response.json(
      {
        ok: true,
        accepted: result.accepted,
        sessionKey: result.sessionKey,
      },
      { headers: responseHeaders },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        {
          ok: false,
          error: "INVALID_ANALYTICS_PAYLOAD",
          issues: error.issues,
        },
        { status: 400, headers: responseHeaders },
      );
    }

    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "UNKNOWN_ERROR",
      },
      { status: 500, headers: responseHeaders },
    );
  }
}