import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import { connectDB } from "@/libs/mongodb";
import Theme from "@/models/theme";
import type { ThemeFlags } from "@/lib/theme/types";

// Cache for theme data - revalidate every 5 minutes
let themeCache: { data: ThemeFlags; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET() {
  try {
    // Check if we have valid cached data
    const now = Date.now();
    if (themeCache && now - themeCache.timestamp < CACHE_TTL) {
      return NextResponse.json(themeCache.data, {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      });
    }

    await connectDB();

    const theme = await (Theme as any).findById("global");

    if (!theme) {
      const fallback = await import("../../../../../config/themes.json");
      return NextResponse.json(fallback.default, {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      });
    }

    const flags: ThemeFlags = {
      activeSeasonalTheme: theme.activeSeasonalTheme,
      enabled: theme.enabled,
      dateRanges: theme.dateRanges,
    };

    // Update cache
    themeCache = { data: flags, timestamp: now };

    return NextResponse.json(flags, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {

    const fallback = await import("../../../../../config/themes.json");
    return NextResponse.json(fallback.default, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.rol !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { activeSeasonalTheme, enabled, dateRanges } = body;

    if (
      !["none", "halloween", "christmas", "newyear"].includes(
        activeSeasonalTheme
      )
    ) {
      return NextResponse.json(
        { error: "Invalid seasonal theme" },
        { status: 400 }
      );
    }

    const updateData = {
      activeSeasonalTheme,
      enabled: Boolean(enabled),
      dateRanges: dateRanges || [],
    };

    const theme = await (Theme as any).findByIdAndUpdate("global", updateData, {
      upsert: true,
      new: true,
    });

    const flags: ThemeFlags = {
      activeSeasonalTheme: theme.activeSeasonalTheme,
      enabled: theme.enabled,
      dateRanges: theme.dateRanges,
    };

    // Invalidate cache when theme is updated
    themeCache = { data: flags, timestamp: Date.now() };

    return NextResponse.json(flags);
  } catch (error) {

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
