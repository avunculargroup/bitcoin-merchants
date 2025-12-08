import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const logs = await prisma.adminPublishLog.findMany({
    where: { submissionId: id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    latestStatus: logs[0]?.status ?? null,
    logs: logs.map((log) => ({
      id: log.id,
      submissionId: log.submissionId,
      status: log.status,
      trigger: log.trigger,
      nostrEventId: log.nostrEventId,
      relays: log.relays,
      relayStatuses: log.relayStatuses ?? [],
      retryCount: log.retryCount,
      lastError: log.lastError,
      publishedAt: log.publishedAt?.toISOString() ?? null,
      createdAt: log.createdAt.toISOString(),
      updatedAt: log.updatedAt.toISOString(),
    })),
  });
}
