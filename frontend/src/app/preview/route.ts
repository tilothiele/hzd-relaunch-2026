import { draftMode } from "next/headers";
import { redirect } from "next/navigation";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get("secret");
    const slug = searchParams.get("slug");

    if (secret !== process.env.STRAPI_PREVIEW_SECRET) {
        return new Response("Invalid token", { status: 401 });
    }

    (await draftMode()).enable()

    redirect(slug ? `/pages/${slug}` : "/");
}
