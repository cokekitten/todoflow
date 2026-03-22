import { NextRequest, NextResponse } from "next/server";

import { createTag, getAllTags } from "@/server/tags";

export async function GET() {
  return NextResponse.json(getAllTags());
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { name?: string; color?: string };

  if (!body.name || body.name.trim() === "") {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const tag = createTag({ name: body.name.trim(), color: body.color });
  return NextResponse.json(tag, { status: 201 });
}
