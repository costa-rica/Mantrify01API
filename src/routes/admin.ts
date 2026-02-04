import { Router, Request, Response, NextFunction } from "express";
import { User } from "mantrify01db";
import { authMiddleware } from "../modules/authMiddleware";
import { AppError, ErrorCodes } from "../modules/errorHandler";
import logger from "../modules/logger";

const router = Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Middleware to check if user is admin
const adminMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError(
        ErrorCodes.AUTH_FAILED,
        "Authentication required",
        401
      );
    }

    // Find user and check isAdmin status
    const user = await User.findByPk(userId);

    if (!user) {
      throw new AppError(ErrorCodes.AUTH_FAILED, "User not found", 401);
    }

    const isAdmin = user.get("isAdmin") as boolean;

    if (!isAdmin) {
      throw new AppError(
        ErrorCodes.UNAUTHORIZED_ACCESS,
        "Admin access required",
        403
      );
    }

    next();
  } catch (error: any) {
    if (error instanceof AppError) {
      next(error);
    } else {
      logger.error(`Admin middleware error: ${error.message}`);
      next(
        new AppError(
          ErrorCodes.INTERNAL_ERROR,
          "Failed to verify admin status",
          500,
          error.message
        )
      );
    }
  }
};

// Apply admin middleware to all routes
router.use(adminMiddleware);

// GET /admin/users
router.get(
  "/users",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Query all users excluding password field
      const users = await User.findAll({
        attributes: [
          "id",
          "email",
          "isEmailVerified",
          "emailVerifiedAt",
          "isAdmin",
          "createdAt",
          "updatedAt",
        ],
      });

      logger.info(
        `Admin user ${req.user?.userId} retrieved ${users.length} users`
      );

      res.status(200).json({
        users,
      });
    } catch (error: any) {
      logger.error(`Failed to retrieve users: ${error.message}`);
      next(
        new AppError(
          ErrorCodes.INTERNAL_ERROR,
          "Failed to retrieve users",
          500,
          error.message
        )
      );
    }
  }
);

export default router;
