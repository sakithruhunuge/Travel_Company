import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";

export const dynamic = 'force-dynamic';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const userId = params.id;
        if (!userId) {
            return new NextResponse(null, { status: 400 });
        }

        await dbConnect();
        
        const user = await User.findById(userId).select("image");
        if (!user || !user.image) {
            return new NextResponse(null, { status: 404 });
        }

        // If the image is a base64 data URL, extract the content type and buffer
        if (user.image.startsWith("data:image/")) {
            const matches = user.image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (matches?.length !== 3) {
                return new NextResponse(null, { status: 400 });
            }

            const contentType = matches[1];
            const buffer = Buffer.from(matches[2], "base64");

            return new NextResponse(buffer, {
                headers: {
                    "Content-Type": contentType,
                    "Cache-Control": "public, max-age=3600",
                },
            });
        }

        // If it's a regular URL, redirect to it
        return NextResponse.redirect(user.image);
    } catch (error) {
        console.error(error);
        return new NextResponse(null, { status: 500 });
    }
}
