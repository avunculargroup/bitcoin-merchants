import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

export async function GET(request: NextRequest) {
  try {
    // Check if DATABASE_URL is set
    const hasDatabaseUrl = !!env.databaseUrl;
    
    // Try to connect to the database
    let connectionTest = null;
    let error = null;
    
    try {
      // Simple query to test connection
      connectionTest = await prisma.$queryRaw`SELECT 1 as test`;
    } catch (dbError: any) {
      error = {
        message: dbError.message,
        code: dbError.code,
        meta: dbError.meta,
      };
    }
    
    // Get database URL info (masked for security)
    const dbUrlInfo = env.databaseUrl ? {
      hasUrl: true,
      // Show first part of connection string for debugging (without password)
      urlPreview: env.databaseUrl.split('@')[1] || 'masked',
      urlLength: env.databaseUrl.length,
    } : {
      hasUrl: false,
    };
    
    return NextResponse.json({
      success: connectionTest !== null,
      hasDatabaseUrl,
      dbUrlInfo,
      connectionTest,
      error,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 });
  }
}

