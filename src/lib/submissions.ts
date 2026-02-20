import { db } from "./db";
import { SubmissionStatus } from "@prisma/client";

// Custom error class for submission errors
export class SubmissionError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "SubmissionError";
  }
}

export type Submission = {
  id: string;
  imageUrl: string;
  sourceUrl: string;
  creatorName: string;
  creatorUrl: string | null;
  title: string | null;
  description: string | null;
  submitterNote: string | null;
  submitterIp: string;
  status: SubmissionStatus;
  reviewedAt: Date | null;
  reviewNote: string | null;
  momentId: string | null;
  createdAt: Date;
};

export type CreateSubmissionInput = {
  imageUrl: string;
  sourceUrl: string;
  creatorName: string;
  creatorUrl?: string | null;
  title?: string | null;
  description?: string | null;
  submitterNote?: string | null;
  submitterIp: string;
  honeypot?: string | null;
};

/**
 * Create a new submission
 */
export async function createSubmission(
  input: CreateSubmissionInput
): Promise<Submission> {
  try {
    const submission = await db.submission.create({
      data: {
        imageUrl: input.imageUrl,
        sourceUrl: input.sourceUrl,
        creatorName: input.creatorName,
        creatorUrl: input.creatorUrl || null,
        title: input.title || null,
        description: input.description || null,
        submitterNote: input.submitterNote || null,
        submitterIp: input.submitterIp,
        honeypot: input.honeypot || null,
        status: "PENDING",
      },
    });

    return submission;
  } catch (error) {
    throw new SubmissionError("Failed to create submission", error);
  }
}

/**
 * Get all submissions, optionally filtered by status
 */
export async function getSubmissions(options?: {
  status?: SubmissionStatus;
}): Promise<Submission[]> {
  try {
    const where = options?.status ? { status: options.status } : {};

    const submissions = await db.submission.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return submissions;
  } catch (error) {
    throw new SubmissionError("Failed to fetch submissions", error);
  }
}

/**
 * Get a single submission by ID
 */
export async function getSubmissionById(id: string): Promise<Submission | null> {
  try {
    const submission = await db.submission.findUnique({
      where: { id },
    });

    return submission;
  } catch (error) {
    throw new SubmissionError(`Failed to fetch submission: ${id}`, error);
  }
}

/**
 * Count pending submissions (for admin badge)
 */
export async function getPendingSubmissionCount(): Promise<number> {
  try {
    return await db.submission.count({
      where: { status: "PENDING" },
    });
  } catch (error) {
    throw new SubmissionError("Failed to count pending submissions", error);
  }
}

/**
 * Approve a submission and create a moment from it
 */
export async function approveSubmission(
  id: string,
  momentData: {
    slug: string;
    title: string;
    category: string;
    description: string;
    tags: string[];
    dominantColor: string;
    year?: number | null;
    yearApproximate?: boolean;
  }
): Promise<{ submission: Submission; momentId: string }> {
  try {
    const submission = await db.submission.findUnique({
      where: { id },
    });

    if (!submission) {
      throw new SubmissionError(`Submission not found: ${id}`);
    }

    if (submission.status !== "PENDING") {
      throw new SubmissionError(`Submission already ${submission.status.toLowerCase()}`);
    }

    // Create the moment and update submission in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create the moment
      const moment = await tx.moment.create({
        data: {
          slug: momentData.slug,
          title: momentData.title,
          category: momentData.category,
          description: momentData.description,
          tags: JSON.stringify(momentData.tags),
          dominantColor: momentData.dominantColor,
          year: momentData.year ?? null,
          yearApproximate: momentData.yearApproximate ?? false,
          imageUrl: submission.imageUrl,
          sourceUrl: submission.sourceUrl,
          creatorName: submission.creatorName,
          creatorUrl: submission.creatorUrl,
        },
      });

      // Update submission to approved
      const updatedSubmission = await tx.submission.update({
        where: { id },
        data: {
          status: "APPROVED",
          reviewedAt: new Date(),
          momentId: moment.id,
        },
      });

      return { submission: updatedSubmission, momentId: moment.id };
    });

    return result;
  } catch (error) {
    if (error instanceof SubmissionError) throw error;
    throw new SubmissionError(`Failed to approve submission: ${id}`, error);
  }
}

/**
 * Reject a submission
 */
export async function rejectSubmission(
  id: string,
  reviewNote?: string
): Promise<Submission> {
  try {
    const submission = await db.submission.findUnique({
      where: { id },
    });

    if (!submission) {
      throw new SubmissionError(`Submission not found: ${id}`);
    }

    if (submission.status !== "PENDING") {
      throw new SubmissionError(`Submission already ${submission.status.toLowerCase()}`);
    }

    const updated = await db.submission.update({
      where: { id },
      data: {
        status: "REJECTED",
        reviewedAt: new Date(),
        reviewNote: reviewNote || null,
      },
    });

    return updated;
  } catch (error) {
    if (error instanceof SubmissionError) throw error;
    throw new SubmissionError(`Failed to reject submission: ${id}`, error);
  }
}

/**
 * Delete a submission (used after rejection)
 */
export async function deleteSubmission(id: string): Promise<void> {
  try {
    await db.submission.delete({
      where: { id },
    });
  } catch (error) {
    throw new SubmissionError(`Failed to delete submission: ${id}`, error);
  }
}
