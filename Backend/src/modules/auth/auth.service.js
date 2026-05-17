import { eq } from "drizzle-orm";
import { clerkClient } from "@clerk/fastify";
import { db } from "../../cors/database/DB.Connect.js";
import { principals } from "./auth.schema.js";
import { checkProfileCompletion } from "../../cors/utils/profile.js";



export async function getCurrentPrincipal(userId) {
    const existingPrincipal = await db
            .select()
            .from(principals)
            .where(
            eq(principals.clerkId, userId)
        );

    if (existingPrincipal[0]) {
        const principal = existingPrincipal[0];

        return {
            ...principal,

            isProfileComplete : checkProfileCompletion(principal)

        }
    }

    const user =
            await clerkClient.users.getUser(
            userId
        );

    const newPrincipal = await db
            .insert(principals)
            .values({
            clerkId: user.id,

            email:
                user.emailAddresses[0]
                .emailAddress,

            name: `${user.firstName || ""} ${
                user.lastName || ""
            }`,

            photo: user.imageUrl,

            mobile : null,

            schoolName : null,
        })
        .returning();

    return {
        ...newPrincipal[0],

        isProfileComplete: false,
    };
}