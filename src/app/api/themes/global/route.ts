import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import { connectDB } from "@/libs/mongodb";
import Theme from "@/models/theme";
import type { ThemeFlags } from "@/lib/theme/types";

export async function GET() {
  try {
    await connectDB();

    const theme = await (Theme as any).findById("global");

    if (!theme) {
      const fallback = await import("../../../../../config/themes.json");
      return NextResponse.json(fallback.default);
    }

    const flags: ThemeFlags = {
      activeSeasonalTheme: theme.activeSeasonalTheme,
      enabled: theme.enabled,
      dateRanges: theme.dateRanges,
    };

    return NextResponse.json(flags);
  } catch (error) {
    console.error("Error fetching theme flags:", error);
    const fallback = await import("../../../../../config/themes.json");
    return NextResponse.json(fallback.default);
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

    return NextResponse.json(flags);
  } catch (error) {
    console.error("Error updating theme flags:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
