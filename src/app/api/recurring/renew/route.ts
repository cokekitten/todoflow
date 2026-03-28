import { NextResponse } from "next/server";

import { renewTemplates } from "@/server/recurring";

export async function POST() {
  const renewed = renewTemplates();
  return NextResponse.json({ ok: true, renewed });
}
