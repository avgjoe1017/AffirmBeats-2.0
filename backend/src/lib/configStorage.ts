/**
 * Configuration Storage
 * 
 * Stores system configuration in a JSON file for persistence.
 * In production, consider using a database table instead.
 */

import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import { logger } from "./logger";

interface SystemConfig {
  matching: {
    exactMatchThreshold: number;
    pooledMatchThreshold: number;
  };
  costs: {
    dailyAlert: number;
    monthlyBudget: number;
    maxCostPerSession: number;
  };
  generation: {
    alwaysGenerateFirst: boolean;
    proUserGenerationRate: number;
    freeUserGenerationRate: number;
  };
}

const DEFAULT_CONFIG: SystemConfig = {
  matching: {
    exactMatchThreshold: 0.75,
    pooledMatchThreshold: 0.65,
  },
  costs: {
    dailyAlert: 50.0,
    monthlyBudget: 500.0,
    maxCostPerSession: 0.25,
  },
  generation: {
    alwaysGenerateFirst: false,
    proUserGenerationRate: 0.6,
    freeUserGenerationRate: 0.2,
  },
};

let configCache: SystemConfig | null = null;

/**
 * Get the config file path
 */
function getConfigPath(): string {
  // Get backend directory
  let backendDir: string;
  if (typeof import.meta !== "undefined" && "dir" in import.meta && import.meta.dir) {
    backendDir = join(import.meta.dir, "..");
  } else if (typeof __dirname !== "undefined") {
    backendDir = join(__dirname, "..");
  } else {
    backendDir = process.cwd();
  }
  return join(backendDir, "config.json");
}

/**
 * Load configuration from file
 */
export async function loadConfig(): Promise<SystemConfig> {
  // Return cached config if available
  if (configCache) {
    return configCache;
  }

  try {
    const configPath = getConfigPath();
    const content = await readFile(configPath, "utf-8");
    const config = JSON.parse(content) as SystemConfig;
    configCache = config;
    logger.debug("Configuration loaded from file", { path: configPath });
    return config;
  } catch (error) {
    // File doesn't exist or is invalid, return defaults
    logger.debug("Config file not found, using defaults", {
      error: error instanceof Error ? error.message : String(error),
    });
    configCache = DEFAULT_CONFIG;
    return DEFAULT_CONFIG;
  }
}

/**
 * Save configuration to file
 */
export async function saveConfig(config: Partial<SystemConfig>): Promise<SystemConfig> {
  const current = await loadConfig();
  const updated = {
    ...current,
    ...config,
    matching: { ...current.matching, ...config.matching },
    costs: { ...current.costs, ...config.costs },
    generation: { ...current.generation, ...config.generation },
  };

  try {
    const configPath = getConfigPath();
    await writeFile(configPath, JSON.stringify(updated, null, 2), "utf-8");
    configCache = updated;
    logger.info("Configuration saved", { path: configPath });
    return updated;
  } catch (error) {
    logger.error("Failed to save configuration", error);
    throw new Error("Failed to save configuration");
  }
}

/**
 * Get default configuration
 */
export function getDefaultConfig(): SystemConfig {
  return { ...DEFAULT_CONFIG };
}

