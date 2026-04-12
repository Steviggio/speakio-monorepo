import { User } from "@repo/types";

export async function getServerProfile(token?: string): Promise<User | null> {
  if (!token) return null;

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/users/me`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        next: { revalidate: 60 },
      },
    );

    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
