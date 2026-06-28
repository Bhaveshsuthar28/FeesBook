import {sqliteTable , integer , text, index} from "drizzle-orm/sqlite-core"

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

    city: text("city"),

    state: text("state"),

    district: text("district"),

    pinCode: text("pin_code"),

    logoUrl: text("logo_url"),

    logoFileId: text("logo_file_id"),

    principalSignatureUrl:
        text("principal_signature_url"),

    principalSignatureFileId:
        text("principal_signature_file_id"),

    stampUrl: text("stamp_url"),

    stampFileId: text("stamp_file_id"),

    activeAcademicYear:
        text("active_academic_year"),

    latitude: integer("latitude"),

    longitude: integer("longitude"),

    receiptPrefix:
        text("receipt_prefix"),

    receiptQr: integer("receipt_qr", {
        mode: "boolean",
    }),

    receiptSignature:
        integer("receipt_signature", {
            mode: "boolean",
        }),

    receiptStamp: integer("receipt_stamp", {
        mode: "boolean",
    }),

    receiptFooter:
        text("receipt_footer"),

    paymentModes:
        text("payment_modes"),

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
}, (table) => ({
    clerkIdIdx: index("idx_principals_clerk_id").on(table.clerkId),
}));
