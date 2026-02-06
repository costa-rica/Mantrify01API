import {
  User,
  Mantra,
  ContractUsersMantras,
  ContractUserMantraListen,
  ElevenLabsFiles,
  Queue,
  SoundFiles,
  ContractMantrasElevenLabsFiles,
  ContractMantrasSoundFiles,
} from "mantrify01db";
import logger from "../logger";

/**
 * Get all database tables/models
 */
export function getAllTables(): Array<{ name: string; model: any }> {
  return [
    { name: "Users", model: User },
    { name: "Mantras", model: Mantra },
    { name: "ContractUsersMantras", model: ContractUsersMantras },
    { name: "ContractUserMantraListen", model: ContractUserMantraListen },
    { name: "ElevenLabsFiles", model: ElevenLabsFiles },
    { name: "Queue", model: Queue },
    { name: "SoundFiles", model: SoundFiles },
    { name: "ContractMantrasElevenLabsFiles", model: ContractMantrasElevenLabsFiles },
    { name: "ContractMantrasSoundFiles", model: ContractMantrasSoundFiles },
  ];
}

/**
 * Export a single table to CSV
 * This is a placeholder - will be implemented in Phase 2
 */
export async function exportTableToCSV(
  tableName: string,
  outputPath: string,
): Promise<void> {
  logger.info(`Exporting table ${tableName} to ${outputPath}`);
  // Implementation in Phase 2
}

/**
 * Create full database backup
 * This is a placeholder - will be implemented in Phase 2
 */
export async function createBackup(backupDir: string): Promise<void> {
  logger.info(`Creating backup in ${backupDir}`);
  // Implementation in Phase 2
}
