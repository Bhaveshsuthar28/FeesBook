// src/modules/classes/class.dashboard.controller.js

import {
  getClassesDashboardService,
} from "./class.dashboard.service.js";

import {
  getDashboardInsightsService,
} from "./class.dashboard.insights.service.js";

export const getClassesDashboardInsightsController =
  async (
    request,
    reply
  ) => {

    const result =
      await getDashboardInsightsService({
        schoolId:
          request.user.schoolId,
      });

    return reply.send({
      success: true,
      data: result,
    });
  };

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