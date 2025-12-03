import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "all";

    const where: any = {};
    if (filter !== "all") {
      where.status = filter;
    }

    const submissions = await prisma.submission.findMany({
      where,
      include: {
        osmNodes: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Convert BigInt to string for JSON serialization
    const serialized = submissions.map((sub) => ({
      ...sub,
      duplicateOsmId: (sub as any).duplicateOsmId?.toString(),
      duplicateOsmType: (sub as any).duplicateOsmType,
      osmNodes: sub.osmNodes.map((node) => ({
        ...node,
        osmId: node.osmId.toString(),
        changesetId: node.changesetId?.toString(),
      })),
    }));

    return NextResponse.json(serialized);
  } catch (error: any) {
    console.error("Error fetching submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}

