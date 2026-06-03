import fs from "fs";
import path from "path";

const LOG_FILE = path.join(process.cwd(), "error.log");
const ANKA_DEBUG_MODE = true;

export function logErrorToFile(errorMessage) {
  if (!ANKA_DEBUG_MODE) return;

  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${errorMessage}\n`;

  fs.appendFileSync(LOG_FILE, logEntry);
}