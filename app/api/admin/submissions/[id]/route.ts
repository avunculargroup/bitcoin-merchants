import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        osmNodes: true,
      },
    });

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // Convert BigInt to string for JSON serialization
    const serialized = {
      ...submission,
      duplicateOsmId: (submission as any).duplicateOsmId?.toString(),
      duplicateOsmType: (submission as any).duplicateOsmType,
      osmNodes: submission.osmNodes.map((node) => ({
        ...node,
        osmId: node.osmId.toString(),
        changesetId: node.changesetId?.toString(),
      })),
    };

    return NextResponse.json(serialized);
  } catch (error: any) {
    console.error("Error fetching submission:", error);
    return NextResponse.json(
      { error: "Failed to fetch submission" },
      { status: 500 }
    );
  }
}

