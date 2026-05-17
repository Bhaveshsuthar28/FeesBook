export async function protectRoute(request,reply) {
    try {
        const auth = await request.auth();

        if (!auth.userId) {
            return reply.status(401).send({
                success: false,
                message: "Unauthorized",
            });
        }

        request.userId = auth.userId;
    } catch (error) {
            return reply.status(401).send({
            success: false,
            message: "Authentication failed",
        });
    }
}