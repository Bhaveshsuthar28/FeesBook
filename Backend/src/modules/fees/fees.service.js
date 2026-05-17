import crypto from "crypto";

import { db }
  from "../../cors/database/DB.Connect.js";

import {
  feeTypesTable,
} from "../../cors/schema/feesType.schema.js";

import {
  classFeesTable,
} from "../../cors/schema/classFee.schema.js";

import {
  eq,
  and,
} from "drizzle-orm";

export const createFeeTypeService =
  async ({
    schoolId,
    data,
  }) => {

    try {

      const feeType = {
        id:
          crypto.randomUUID(),

        schoolId,

        ...data,
      };

      await db
        .insert(feeTypesTable)
        .values(feeType);

      return feeType;

    } catch (error) {

      const message =
        error.message.toLowerCase();

      if (
        message.includes(
          "unique"
        )
      ) {
        throw new Error(
          "Fee already exists"
        );
      }

      throw error;
    }
  };



export const updateFeeTypeService =
  async ({
    schoolId,
    feeTypeId,
    data,
  }) => {

    await db
      .update(feeTypesTable)

      .set(data)

      .where(
        and(
          eq(
            feeTypesTable.id,
            feeTypeId
          ),

          eq(
            feeTypesTable.schoolId,
            schoolId
          )
        )
      );

    return true;
  };


export const assignFeeToClassService =
  async ({
    schoolId,
    data,
  }) => {

    try {

      const classFee = {
        id:
          crypto.randomUUID(),

        schoolId,

        ...data,
      };

      await db
        .insert(classFeesTable)
        .values(classFee);

      return classFee;

    } catch (error) {

      const message =
        error.message.toLowerCase();

      if (
        message.includes(
          "unique"
        )
      ) {
        throw new Error(
          "Fee already assigned to class"
        );
      }

      throw error;
    }
  };


export const updateClassFeeService =
  async ({
    schoolId,
    classFeeId,
    data,
  }) => {

    await db
      .update(classFeesTable)

      .set(data)

      .where(
        and(
          eq(
            classFeesTable.id,
            classFeeId
          ),

          eq(
            classFeesTable.schoolId,
            schoolId
          )
        )
      );

    return true;
  };