import {
  getAuth,
} from "@clerk/fastify";

const attachUserFromAuth =
  (request, userId) => {
    request.userId = userId;
    request.user = {
      clerkUserId: userId,
      schoolId: userId,
    };
  };

export const requireAuthenticatedUser =
  async (request, reply) => {
    if (
      request.method ===
      "OPTIONS"
    ) {
      return true;
    }

    try {
      const {
        isAuthenticated,
        userId,
      } = getAuth(request, {
        acceptsToken: "session_token",
      });

      if (
        !isAuthenticated ||
        !userId
      ) {
        reply.status(401).send({
          success: false,
          message: "Unauthorized",
        });
        return false;
      }

      attachUserFromAuth(
        request,
        userId
      );

      return true;
    } catch (error) {
      request.log.error(
        {
          err: error,
        },
        "Auth verification failed"
      );

      reply.status(401).send({
        success: false,
        message:
          "Authentication failed",
      });
      return false;
    }
  };

export async function protectRoute(
  request,
  reply
) {
  const authenticated =
    await requireAuthenticatedUser(
      request,
      reply
    );

  if (!authenticated) {
    return reply;
  }
}
