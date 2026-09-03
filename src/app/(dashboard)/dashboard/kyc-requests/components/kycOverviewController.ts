import type {
  Response,
} from "express";

import type {
  AuthRequest,
} from "../middlewares/authMiddleware.js";

import {
  KYC,
} from "../models/KYC.js";

import {
  KYCAIReview,
} from "../models/KYCAIReview.js";

const startOfToday =
  () => {
    const now =
      new Date();

    return new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0
    );
  };

export const getAdminKycOverviewController =
  async (
    _req:
      AuthRequest,
    res:
      Response
  ):
    Promise<void> => {
    try {
      const today =
        startOfToday();

      const [
        pending,
        underReview,
        verified,
        rejected,
        approvedToday,
        rejectedToday,
        totalSubmitted,
        highRisk,
        aiReviewed,
        needsManualReview,
        verifiedDurations,
      ] =
        await Promise.all([
          KYC.countDocuments({
            status:
              "pending",
          }),

          KYC.countDocuments({
            status:
              "under_review",
          }),

          KYC.countDocuments({
            status:
              "verified",
          }),

          KYC.countDocuments({
            status:
              "rejected",
          }),

          KYC.countDocuments({
            status:
              "verified",
            verifiedAt: {
              $gte:
                today,
            },
          }),

          /*
           * The current KYC schema has verifiedAt but no rejectedAt.
           * updatedAt is therefore used only as a same-day operational
           * count for records whose current status is rejected.
           */
          KYC.countDocuments({
            status:
              "rejected",
            updatedAt: {
              $gte:
                today,
            },
          }),

          KYC.countDocuments({
            status: {
              $ne:
                "not_started",
            },
          }),

          KYCAIReview.countDocuments({
            status:
              "completed",
            riskLevel: {
              $in: [
                "High",
                "Critical",
              ],
            },
          }),

          KYCAIReview.countDocuments({
            status:
              "completed",
          }),

          KYCAIReview.countDocuments({
            status:
              "completed",
            recommendation:
              "manual_review",
          }),

          KYC.find({
            status:
              "verified",

            submittedAt: {
              $type:
                "date",
            },

            verifiedAt: {
              $type:
                "date",
            },
          })
            .select(
              "submittedAt verifiedAt"
            )
            .sort({
              verifiedAt:
                -1,
            })
            .limit(
              250
            )
            .lean(),
        ]);

      const durations =
        verifiedDurations
          .map(
            (
              item:
                any
            ) => {
              const start =
                item.submittedAt instanceof
                Date
                  ? item.submittedAt.getTime()
                  : Number.NaN;

              const end =
                item.verifiedAt instanceof
                Date
                  ? item.verifiedAt.getTime()
                  : Number.NaN;

              if (
                !Number.isFinite(
                  start
                ) ||
                !Number.isFinite(
                  end
                ) ||
                end <
                  start
              ) {
                return null;
              }

              return (
                end -
                start
              ) /
                (
                  60 *
                  1000
                );
            }
          )
          .filter(
            (
              value
            ):
              value is
                number =>
              typeof value ===
                "number" &&
              Number.isFinite(
                value
              )
          );

      const averageReviewMinutes =
        durations.length >
        0
          ? Number(
              (
                durations.reduce(
                  (
                    total,
                    value
                  ) =>
                    total +
                    value,
                  0
                ) /
                durations.length
              ).toFixed(
                2
              )
            )
          : null;

      res.setHeader(
        "Cache-Control",
        "no-store"
      );

      res.status(
        200
      ).json({
        success:
          true,

        overview: {
          pending,
          underReview,
          approvedToday,
          rejectedToday,
          highRisk,
          averageReviewMinutes,
          totalSubmitted,
          verified,
          rejected,
          aiReviewed,
          needsManualReview,
        },
      });
    } catch (
      error
    ) {
      console.error(
        "GET ADMIN KYC OVERVIEW ERROR:",
        error
      );

      res.status(
        500
      ).json({
        success:
          false,

        message:
          "Unable to load KYC overview.",
      });
    }
  };
