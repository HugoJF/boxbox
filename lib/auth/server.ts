import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"

type Session = typeof auth.$Infer.Session

export async function authenticateRequest(request: Request): Promise<
  | {
      session: Session
    }
  | {
      response: NextResponse
    }
> {
  const session = await auth.api.getSession({
    headers: request.headers,
  })

  if (!session) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }

  return { session }
}
