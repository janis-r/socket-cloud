/**
 * String id identifying access rights
 */
export type AccessRightsConstant = "all";

export const accessRightsConstantValidator = (value: unknown): value is AccessRightsConstant => value === "all";
