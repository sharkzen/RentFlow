import { startMoveOutWorker } from "./workers/moveOutWorker";
import logger from "@/utils/logger";

const bootstrapWorker = async () => {
  logger.info("🚀 Starting RentFlow Background Workers...");
  startMoveOutWorker();
};

process.on("SIGTERM", () => {
  logger.info("Shutting down workers...");
  process.exit(0);
});

bootstrapWorker();
