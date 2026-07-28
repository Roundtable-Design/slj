import { z } from "zod";

export const emailSchema = z.string().trim().email().max(320);

export const noteBodySchema = z.string().max(10_000);

export const blockIdSchema = z.string().trim().min(1).max(200);

export const sectionIdSchema = z.string().trim().min(1).max(200);

export const chapterIdSchema = z.string().trim().min(1).max(200);

export const groupNameSchema = z.string().trim().min(1).max(200);

export const inviteCodeSchema = z.string().trim().min(1).max(64);

export const sharedNotesSchema = z.string().max(50_000);

export const startDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .optional()
  .nullable();
