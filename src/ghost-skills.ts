import type { LibrarySkillInfo } from "./library-core";
import type { Scope, SkillInfo } from "./utils/types";

/**
 * Library ghosts: skills present in the ASM library but not installed in the
 * listed scope. The library is the SSOT inventory — ghosts are the set
 * difference between the library and the scope's installed names.
 */
export function buildGhostSkills(
  library: LibrarySkillInfo[],
  installed: SkillInfo[],
  scope: Scope,
): SkillInfo[] {
  if (scope === "both") return [];
  const installedNames = new Set(installed.map((s) => s.dirName.toLowerCase()));
  return library
    .filter((lib) => !installedNames.has(lib.dirName.toLowerCase()))
    .map((lib) => ({
      name: lib.name,
      version: lib.version,
      description: "",
      creator: "",
      license: "",
      compatibility: "",
      allowedTools: [],
      dirName: lib.dirName,
      path: lib.libraryPath,
      originalPath: lib.libraryPath,
      location: "library",
      scope,
      provider: "library",
      providerLabel: "Library",
      isSymlink: false,
      symlinkTarget: null,
      realPath: lib.libraryPath,
      isGhost: true,
    }));
}
