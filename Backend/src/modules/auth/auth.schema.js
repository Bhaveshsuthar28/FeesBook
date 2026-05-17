import {sqliteTable , integer , text} from "drizzle-orm/sqlite-core"

export const principals = sqliteTable("principals", {
    id: integer("id").primaryKey({
        autoIncrement: true,
    }),

    clerkId: text("clerk_id")
        .notNull()
        .unique(),

    email: text("email").notNull(),

    name: text("name").notNull(),

    photo: text("photo"),

    schoolName: text("school_name"),

    address : text("school_address"),

    mobile: text("mobile"),

    isProfileComplete: integer(
        "is_profile_complete",
        {
            mode: "boolean",
        }
    ).default(false),

    createdAt: integer("created_at", {
        mode: "timestamp",
    }).$defaultFn(() => new Date()),
});