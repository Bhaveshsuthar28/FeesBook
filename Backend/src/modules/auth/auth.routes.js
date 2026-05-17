import { protectRoute } from "./auth.middleware.js";
import { getCurrentPrincipal } from "./auth.service.js";

export default async function authRoutes(app) {
    app.get(
        "/me",

        {preHandler: protectRoute,},

        async (request, reply) => {
            const principal =await getCurrentPrincipal(request.userId);

            return reply.send({
                success: true,
                data: principal,
            });
        }
    );
}