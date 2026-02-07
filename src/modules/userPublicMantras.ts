import { ContractUsersMantras, Mantra } from "mantrify01db";
import { Op } from "sequelize";

/**
 * Check if a user has any public mantras
 *
 * @param userId - The user ID to check
 * @returns Promise<boolean> - true if user has at least one public mantra, false otherwise
 */
export async function checkUserHasPublicMantras(
  userId: number
): Promise<boolean> {
  // Find all mantra IDs connected to this user
  const userMantras = await ContractUsersMantras.findAll({
    where: { userId },
    attributes: ["mantraId"],
  });

  // If user has no mantras, return false
  if (userMantras.length === 0) {
    return false;
  }

  // Extract mantra IDs
  const mantraIds = userMantras.map(
    (contract) => contract.get("mantraId") as number
  );

  // Check if any of these mantras have visibility='public'
  const publicMantraCount = await Mantra.count({
    where: {
      id: {
        [Op.in]: mantraIds,
      },
      visibility: "public",
    },
  });

  return publicMantraCount > 0;
}
