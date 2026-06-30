import {
  isLocked,
  getSession,
  refreshSession,
  destroySession,
  authenticateSession,
  incrementFailedAttempts,
  createPendingSession,
} from "./principalBot.session.service.js";
import {
  verifyBotPassword,
  isPhoneNumberBound,
  bindPhoneNumberService,
  findSchoolByActivationCommand,
} from "./principalBot.credentials.service.js";
import { getSchoolProfileService } from "../../settings/settings.service.js";

/**
 * @file principalBot.auth.middleware.js
 * @description Authentication middleware and state machine for the WhatsApp Principal Bot.
 *
 * State Machine Flow:
 * 1. [No Session / Idle]:
 *    - An incoming message is normalized (trimmed, lowercase) and compared against principalBotCredentials.
 *    - If messageText matches an activationCommand, createPendingSession() is called (step: "awaiting_password", TTL: 5 min).
 *    - Prompt returned: "🔐 Enter your bot password to continue."
 *    - If no match, we return { reply: null } to stay silent.
 *
 * 2. [Awaiting Password]:
 *    - The next message is treated as a password attempt.
 *    - Checked against verifyBotPassword() in the database.
 *    - IF VALID:
 *        - Session is updated to "logged_in" (TTL: 10 min).
 *        - Verify if the phoneNumber is bound or first-time (isPhoneNumberBound).
 *          - If bound/first-time: Binds the phone number (bindPhoneNumberService) and welcomes the principal.
 *          - If bound to another number: Destroys the session and alerts the user of unauthorized access.
 *    - IF INVALID:
 *        - incrementFailedAttempts() is called.
 *        - If attempts remain, prompts: "❌ Incorrect password. X attempt(s) remaining."
 *        - If attempts reach 3, locks the session (step: "locked", TTL: 15 min).
 *
 * 3. [Logged In / Authenticated]:
 *    - Any message extends the sliding 10-minute session (refreshSession).
 *    - Returns { authenticated: true, schoolId, isCommand: true } so the controller can forward to the command processor.
 *
 * 4. [Locked]:
 *    - If isLocked() is true, immediately rejects: "🔒 Too many failed attempts. Try again in 15 minutes."
 */

/**
 * Processes incoming WhatsApp messages to handle authentication state transitions.
 *
 * @param {Object} params
 * @param {string} params.phoneNumber - Sender's WhatsApp phone number
 * @param {string} params.messageText - Incoming message text
 * @returns {Promise<Object>} Object containing either { reply } or { authenticated: true, schoolId, isCommand: true }
 */
export async function handleIncomingMessage({ phoneNumber, messageText }) {
  try {
    // STEP 1 — Check if locked
    const locked = await isLocked({ phoneNumber });
    if (locked) {
      return {
        reply: "🔒 Too many failed attempts. Try again in 15 minutes.",
      };
    }

    // STEP 2 — Check for existing session
    const session = await getSession({ phoneNumber });

    if (session) {
      // User is already authenticated
      if (session.authenticated === true) {
        await refreshSession({ phoneNumber });
        return {
          authenticated: true,
          schoolId: session.schoolId,
          isCommand: true,
        };
      }

      // User is mid-login (awaiting password)
      if (session.step === "awaiting_password") {
        const passwordAttempt = (messageText || "").trim();
        const verification = await verifyBotPassword({
          schoolId: session.schoolId,
          password: passwordAttempt,
        });

        if (verification.valid) {
          // Check phone binding authorization before finalizing login
          const isPhoneAllowed = await isPhoneNumberBound({
            schoolId: session.schoolId,
            phoneNumber,
          });

          if (!isPhoneAllowed) {
            await destroySession({ phoneNumber });
            return {
              reply:
                "❌ This phone number is not authorized for this school's bot. Contact your school to revoke and rebind access.",
            };
          }

          // Authorize session and bind phone number
          await authenticateSession({ phoneNumber });
          await bindPhoneNumberService({
            schoolId: session.schoolId,
            phoneNumber,
          });

          // Fetch school details for welcome reply
          const schoolProfile = await getSchoolProfileService({
            schoolId: session.schoolId,
          });
          const schoolName = schoolProfile?.schoolName || "your school";

          return {
            reply: `✅ Logged in as Principal of ${schoolName}.\nSession active for 10 minutes.\nType 'help' to see available commands.`,
          };
        }

        // Handle wrong password/lockouts
        if (verification.reason === "wrong_password") {
          const newFailedAttempts = await incrementFailedAttempts({
            phoneNumber,
          });
          const attemptsRemaining = Math.max(0, 3 - newFailedAttempts);

          if (attemptsRemaining > 0) {
            return {
              reply: `❌ Incorrect password. ${attemptsRemaining} attempt(s) remaining.`,
            };
          } else {
            return {
              reply:
                "🔒 Too many failed attempts. Account locked for 15 minutes.",
            };
          }
        }

        if (verification.reason === "locked") {
          return {
            reply: "🔒 This account is temporarily locked. Try again later.",
          };
        }

        return {
          reply:
            "❌ Verification failed. Please check your credentials or try again later.",
        };
      }
    }

    // STEP 3 — No session exists, check for activation command
    const commandCandidate = (messageText || "").trim().toLowerCase();
    const credentials = await findSchoolByActivationCommand({
      activationCommand: commandCandidate,
    });

    if (credentials) {
      if (!credentials.isActive) {
        return {
          reply: null,
        };
      }
      await createPendingSession({
        phoneNumber,
        schoolId: credentials.schoolId,
      });
      return {
        reply: "🔐 Enter your bot password to continue.",
      };
    }

    // Silent fail if unrecognized message and no active session
    return {
      reply: null,
    };
  } catch (error) {
    console.error(
      `[PrincipalBot Auth] Error processing message from ${phoneNumber}:`,
      error
    );
    return {
      reply: "Something went wrong. Please try again.",
    };
  }
}

/**
 * Destroys the bot session for a phone number.
 *
 * @param {Object} params
 * @param {string} params.phoneNumber - Phone number requesting logout
 * @returns {Promise<Object>} Object containing the reply response
 */
export async function logoutCommand({ phoneNumber }) {
  try {
    await destroySession({ phoneNumber });
  } catch (error) {
    console.error(
      `[PrincipalBot Auth] Error logging out ${phoneNumber}:`,
      error
    );
  }
  return {
    reply: "👋 Logged out successfully.",
  };
}
