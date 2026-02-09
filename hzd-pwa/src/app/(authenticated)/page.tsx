import { cookies } from "next/headers";

export default async function Home() {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get("user");
  const user = userCookie ? JSON.parse(userCookie.value) : null;
  const strapiUrl = process.env.STRAPI_BASE_URL;

  return (
    <div className="flex flex-col items-center justify-center gap-8 py-8">
      <h1 className="text-4xl font-bold text-center">
        Willkommen, {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName} (${user.username})` : user?.username || "Gast"}!
      </h1>
      <p>
        Backend URL: <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-semibold">{strapiUrl}</code>
      </p>
    </div>
  );
}
