import {
  ZodError,
} from "zod";
import nodemailer from "nodemailer";
import { clerkClient } from "@clerk/fastify";

import {
  settingsPreferencesSchema,
  updateSchoolProfileSchema,
  academicYearSchema,
  saveBotCredentialsSchema,
} from "./settings.validation.js";

const parseBody =
  (schema, body) => {
    try {
      return schema.parse(
        body || {}
      );
    } catch (error) {
      if (
        error instanceof
        ZodError
      ) {
        const validationError =
          new Error(
            error.errors[0]
              ?.message ||
              "Validation failed"
          );
        validationError.statusCode = 400;
        throw validationError;
      }

      throw error;
    }
  };

import {
  archiveAcademicYearService,
  createAcademicYearService,
  getAcademicYearsService,
  getSchoolProfileService,
  getSettingsPreferencesService,
  setActiveAcademicYearService,
  updateSettingsPreferencesService,
  updateSchoolProfileService,
} from "./settings.service.js";

import {
  saveBotCredentialsService,
  getBotCredentialsStatusService,
  revokeBotAccessService,
  toggleBotActiveStatusService,
} from "../whatsapp/principalBot/principalBot.credentials.service.js";

export const getSchoolProfileController =
  async (request, reply) => {
    const result =
      await getSchoolProfileService({
        schoolId:
          request.user.schoolId,
      });

    return reply.send({
      success: true,
      data: result,
    });
  };

export const getAcademicYearsController =
  async (request, reply) => {
    const result =
      await getAcademicYearsService({
        schoolId:
          request.user.schoolId,
      });

    return reply.send({
      success: true,
      data: result,
    });
  };

export const getSettingsPreferencesController =
  async (request, reply) => {
    const result =
      await getSettingsPreferencesService({
        schoolId:
          request.user.schoolId,
      });

    return reply.send({
      success: true,
      data: result,
    });
  };

export const updateSettingsPreferencesController =
  async (request, reply) => {
    const parsed =
      parseBody(
        settingsPreferencesSchema,
        request.body
      );

    const result =
      await updateSettingsPreferencesService({
        schoolId:
          request.user.schoolId,
        data:
          parsed,
      });

    return reply.send({
      success: true,
      data: result,
    });
  };

export const createAcademicYearController =
  async (request, reply) => {
    const parsed =
      parseBody(
        academicYearSchema,
        request.body
      );

    const result =
      await createAcademicYearService({
        schoolId:
          request.user.schoolId,
        data:
          parsed,
      });

    return reply
      .code(201)
      .send({
        success: true,
        data: result,
      });
  };

export const setActiveAcademicYearController =
  async (request, reply) => {
    const parsed =
      parseBody(
        academicYearSchema.pick({
          year: true,
        }),
        request.body
      );

    const result =
      await setActiveAcademicYearService({
        schoolId:
          request.user.schoolId,
        year:
          parsed.year,
      });

    return reply.send({
      success: true,
      data: result,
    });
  };

export const promoteAcademicYearController =
  async (request, reply) => {
    const year =
      String(
        request.params.year || ""
      );
    const parsed =
      parseBody(
        academicYearSchema.partial(),
        {
          ...(request.body || {}),
          year,
        }
      );

    const result =
      await createAcademicYearService({
        schoolId:
          request.user.schoolId,
        data:
          parsed,
      });

    return reply.send({
      success: true,
      data: result,
    });
  };

export const archiveAcademicYearController =
  async (request, reply) => {
    const result =
      await archiveAcademicYearService({
        schoolId:
          request.user.schoolId,
        year:
          request.params.year,
        archived:
          Boolean(
            request.body?.archived
          ),
      });

    return reply.send({
      success: true,
      data: result,
    });
  };

export const updateSchoolProfileController =
  async (request, reply) => {
    const parsed =
      parseBody(
        updateSchoolProfileSchema,
        request.body
      );

    const result =
      await updateSchoolProfileService({
        schoolId:
          request.user.schoolId,
        data:
          parsed,
      });

    return reply.send({
      success: true,
      data: result,
    });
  };

export const saveBotCredentialsController =
  async (request, reply) => {
    const parsed = parseBody(
      saveBotCredentialsSchema,
      request.body
    );

    const result = await saveBotCredentialsService({
      schoolId: request.user.schoolId,
      activationCommand: parsed.activationCommand,
      password: parsed.password,
    });

    return reply.code(200).send({
      success: true,
      data: result,
    });
  };

export const getBotCredentialsStatusController =
  async (request, reply) => {
    const result = await getBotCredentialsStatusService({
      schoolId: request.user.schoolId,
    });

    return reply.send({
      success: true,
      data: result,
    });
  };

export const revokeBotAccessController =
  async (request, reply) => {
    await revokeBotAccessService({
      schoolId: request.user.schoolId,
    });

    return reply.send({
      success: true,
      message: "Bot access revoked. You can re-link a new phone number by sending the activation command again.",
    });
  };

export const sendSupportEmailController =
  async (request, reply) => {
    const { question } = request.body || {};
    if (!question || !question.trim()) {
      const error = new Error("Question or problem description is required.");
      error.statusCode = 400;
      throw error;
    }

    const schoolId = request.user.schoolId;
    const schoolProfile = await getSchoolProfileService({ schoolId });

    let principalName = schoolProfile?.name || "N/A";
    let principalEmail = schoolProfile?.email || "N/A";

    try {
      const clerkUser = await clerkClient.users.getUser(schoolId);
      if (clerkUser) {
        if (clerkUser.firstName || clerkUser.lastName) {
          principalName = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim();
        }
        if (clerkUser.emailAddresses && clerkUser.emailAddresses[0]) {
          principalEmail = clerkUser.emailAddresses[0].emailAddress;
        }
      }
    } catch (clerkErr) {
      request.log.error(clerkErr, "Failed to retrieve user info from Clerk");
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      replyTo: principalEmail !== "N/A" ? principalEmail : undefined,
      subject: `FeesBook Support Request: ${schoolProfile?.schoolName || "Unknown School"}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f9; color: #333333; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); border: 1px solid #e1e4e8; }
            .header { background: linear-gradient(135deg, #041C4A 0%, #0c347d 100%); padding: 30px 20px; text-align: center; color: #ffffff; }
            .logo-text { font-size: 24px; font-weight: 800; tracking: -0.5px; }
            .logo-fees { color: #3b82f6; }
            .logo-book { color: #f97316; }
            .content { padding: 30px; }
            .ticket-title { font-size: 18px; font-weight: 700; color: #041C4A; margin-bottom: 20px; border-bottom: 2px solid #e1e4e8; padding-bottom: 10px; }
            .label { font-size: 12px; font-weight: 800; color: #4f46e5; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px; }
            .problem-card { background-color: #fffaf0; border-left: 4px solid #f97316; padding: 20px; border-radius: 8px; margin-bottom: 25px; line-height: 1.6; font-size: 14px; font-weight: 600; color: #2d3748; }
            .info-grid { background-color: #f8fafc; border-radius: 8px; padding: 20px; border: 1px solid #edf2f7; }
            .info-row { display: flex; margin-bottom: 12px; font-size: 14px; border-bottom: 1px solid #edf2f7; padding-bottom: 8px; }
            .info-row:last-child { margin-bottom: 0; border-bottom: none; padding-bottom: 0; }
            .info-label { width: 140px; font-weight: 700; color: #718096; }
            .info-val { font-weight: 600; color: #1a202c; }
            .footer { background-color: #f7fafc; padding: 20px; text-align: center; font-size: 12px; color: #a0aec0; border-top: 1px solid #edf2f7; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo-text"><span class="logo-fees">Fees</span><span class="logo-book">Book</span> Support</div>
            </div>
            <div class="content">
              <div class="ticket-title">New Support Ticket Raised</div>
              
              <div class="label">User Problem / Inquiry</div>
              <div class="problem-card">
                ${question.replace(/\n/g, '<br/>')}
              </div>
              
              <div class="label">School & Principal Details</div>
              <div class="info-grid">
                <div class="info-row">
                  <div class="info-label">School Name</div>
                  <div class="info-val">${schoolProfile?.schoolName || "N/A"}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Principal Name</div>
                  <div class="info-val">${principalName}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Principal Email</div>
                  <div class="info-val">${principalEmail}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Mobile Number</div>
                  <div class="info-val">${schoolProfile?.mobile || "N/A"}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Address</div>
                  <div class="info-val">
                    ${[schoolProfile?.address, schoolProfile?.city, schoolProfile?.state, schoolProfile?.district, schoolProfile?.pinCode]
                      .filter(Boolean)
                      .join(", ") || "N/A"}
                  </div>
                </div>
              </div>
            </div>
            <div class="footer">
              This automated message was sent via FeesBook Settings Support Module.
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);

    return reply.send({
      success: true,
      message: "Your support request has been submitted successfully.",
    });
  };

export const toggleBotActiveStatusController =
  async (request, reply) => {
    const { isActive } = request.body || {};
    console.log(`[toggleBotActiveStatusController] schoolId=${request.user.schoolId}, isActive=${isActive}`);
    const result = await toggleBotActiveStatusService({
      schoolId: request.user.schoolId,
      isActive: Boolean(isActive),
    });
    console.log(`[toggleBotActiveStatusController] result=${result}`);

    return reply.send({
      success: true,
      data: result,
    });
  };
