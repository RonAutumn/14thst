import { NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

const PASSWORD_FILE = path.join(process.cwd(), "data", "settings", "password.json")

export async function POST(request: Request) {
  try {
    const { currentPassword, newPassword } = await request.json()

    // Ensure the settings directory exists
    await fs.mkdir(path.join(process.cwd(), "data", "settings"), { recursive: true })

    // Read current password
    let storedPassword
    try {
      const data = await fs.readFile(PASSWORD_FILE, "utf-8")
      storedPassword = JSON.parse(data).password
    } catch (error) {
      // If file doesn't exist, use the default environment variable password
      storedPassword = process.env.NEXT_PUBLIC_SITE_PASSWORD
    }

    // Verify current password
    if (currentPassword !== storedPassword) {
      return new NextResponse(JSON.stringify({ error: "Current password is incorrect" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Save new password
    await fs.writeFile(
      PASSWORD_FILE,
      JSON.stringify({ password: newPassword }, null, 2)
    )

    return new NextResponse(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Error updating password:", error)
    return new NextResponse(JSON.stringify({ error: "Failed to update password" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
} 