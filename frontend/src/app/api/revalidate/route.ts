// app/api/revalidate/route.ts
import { revalidateTag, revalidatePath } from "next/cache";

export async function POST(req: Request) {
    const { tag, path, secret } = await req.json();

    //    if (secret !== process.env.REVALIDATE_SECRET) {
    //        return new Response("Unauthorized", { status: 401 });
    //    }

    //    if (tag) revalidateTag(tag);

    console.log(`Revalidating path=${path}`);

    if (path) revalidatePath(path);

    return Response.json({ revalidated: true });
}
