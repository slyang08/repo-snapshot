import fs from "fs";
import path from "path";
import { parse } from "smol-toml";

export function parseTomlConfig(tomlConfigFile = ".repo-snapshot.toml"): any {
  const tomlConfigPath = path.resolve(tomlConfigFile);

  if (!fs.existsSync(tomlConfigPath)) return {};
  else {
    console.info("Found config file:", tomlConfigPath);
  
    const doc = fs.readFileSync(tomlConfigPath, "utf-8");
    
    try {
      return parse(doc);
    } catch {
      throw new Error("Failed to parse config file");
    }
  }

}
