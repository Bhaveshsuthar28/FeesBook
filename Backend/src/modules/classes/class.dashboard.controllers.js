// src/modules/classes/class.dashboard.controller.js

import {
  getClassesDashboardService,
} from "./class.dashboard.service.js";

export const getClassesDashboardController =
  async (
    request,
    reply
  ) => {

    const result =
      await getClassesDashboardService({
        schoolId:
          request.user.schoolId,
      });

    return reply.send({
      success: true,
      data: result,
    });
  };