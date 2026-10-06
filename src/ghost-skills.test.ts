import { describe, it, expect } from "vitest";
import { buildGhostSkills } from "./ghost-skills";
import type { LibrarySkillInfo } from "./library-core";
import type { SkillInfo } from "./utils/types";

function makeLibrarySkill(
  dirName: string,
  over: Partial<LibrarySkillInfo> = {},
): LibrarySkillInfo {
  return {
    dirName,
    name: dirName,
    version: "1.0.0",
    source: "local:/tmp/src",
    sourceType: "local",
    commitHash: "",
    ref: null,
    skillPath: dirName,
    libraryPath: `/lib/skills/${dirName}`,
    installedAt: "2026-01-01T00:00:00.000Z",
    missing: false,
    ...over,
  };
}

function makeInstalled(dirName: string): SkillInfo {
  return {
    name: dirName,
    version: "1.0.0",
    description: "",
    creator: "",
    license: "",
    compatibility: "",
    allowedTools: [],
    dirName,
    path: `/installed/${dirName}`,
    originalPath: `/installed/${dirName}`,
    location: "global",
    scope: "global",
    provider: "claude",
    providerLabel: "Claude",
    isSymlink: false,
    symlinkTarget: null,
    realPath: `/installed/${dirName}`,
  };
}

describe("buildGhostSkills", () => {
  const library = [
    makeLibrarySkill("alpha"),
    makeLibrarySkill("beta"),
    makeLibrarySkill("gamma"),
  ];

  it("returns the library-minus-installed difference for project scope", () => {
    const ghosts = buildGhostSkills(library, [makeInstalled("beta")], "project");
    expect(ghosts.map((g) => g.dirName)).toEqual(["alpha", "gamma"]);
    for (const g of ghosts) {
      expect(g.isGhost).toBe(true);
      expect(g.scope).toBe("project");
      expect(g.provider).toBe("library");
    }
  });

  it("returns the difference for global scope independently", () => {
    const ghosts = buildGhostSkills(library, [makeInstalled("alpha")], "global");
    expect(ghosts.map((g) => g.dirName)).toEqual(["beta", "gamma"]);
    expect(ghosts.every((g) => g.scope === "global")).toBe(true);
  });

  it("matches installed names case-insensitively", () => {
    const ghosts = buildGhostSkills(library, [makeInstalled("BETA")], "project");
    expect(ghosts.map((g) => g.dirName)).toEqual(["alpha", "gamma"]);
  });

  it("generates no ghosts in the both scope", () => {
    expect(buildGhostSkills(library, [], "both")).toEqual([]);
  });

  it("ghosts reference the library path so activation can use them", () => {
    const ghosts = buildGhostSkills(library, [], "project");
    expect(ghosts[0].path).toBe("/lib/skills/alpha");
    expect(ghosts[0].realPath).toBe("/lib/skills/alpha");
  });

  it("returns an empty list when nothing is in the library", () => {
    expect(buildGhostSkills([], [makeInstalled("beta")], "project")).toEqual([]);
  });
});
