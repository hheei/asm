import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, mkdir, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { buildGhostSkills } from "./ghost-skills";
import type { LibrarySkillInfo } from "./library-core";
import type { SkillInfo } from "./utils/types";

let libraryDir: string;

beforeEach(async () => {
  libraryDir = await mkdtemp(join(tmpdir(), "asm-ghost-"));
});

afterEach(async () => {
  await rm(libraryDir, { recursive: true, force: true });
});

async function makeLibrarySkill(
  dirName: string,
  over: Partial<LibrarySkillInfo> = {},
  skillMd = `---
name: ${dirName}
version: 1.0.0
description: Library copy of ${dirName}.
effort: low
metadata:
  creator: lib-author
---`,
): Promise<LibrarySkillInfo> {
  const libraryPath = join(libraryDir, dirName);
  await mkdir(libraryPath, { recursive: true });
  await writeFile(join(libraryPath, "SKILL.md"), skillMd);
  return {
    dirName,
    name: dirName,
    version: "1.0.0",
    source: "local:/tmp/src",
    sourceType: "local",
    commitHash: "",
    ref: null,
    skillPath: dirName,
    libraryPath,
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
  it("returns the library-minus-installed difference for project scope", async () => {
    const library = [
      await makeLibrarySkill("alpha"),
      await makeLibrarySkill("beta"),
      await makeLibrarySkill("gamma"),
    ];
    const ghosts = await buildGhostSkills(
      library,
      [makeInstalled("beta")],
      "project",
    );
    expect(ghosts.map((g) => g.dirName)).toEqual(["alpha", "gamma"]);
    for (const g of ghosts) {
      expect(g.isGhost).toBe(true);
      expect(g.scope).toBe("project");
      expect(g.provider).toBe("library");
    }
  });

  it("returns the difference for global scope independently", async () => {
    const library = [
      await makeLibrarySkill("alpha"),
      await makeLibrarySkill("beta"),
    ];
    const ghosts = await buildGhostSkills(
      library,
      [makeInstalled("alpha")],
      "global",
    );
    expect(ghosts.map((g) => g.dirName)).toEqual(["beta"]);
    expect(ghosts.every((g) => g.scope === "global")).toBe(true);
  });

  it("matches installed names case-insensitively", async () => {
    const library = [await makeLibrarySkill("beta")];
    const ghosts = await buildGhostSkills(library, [makeInstalled("BETA")], "project");
    expect(ghosts).toEqual([]);
  });

  it("generates no ghosts in the both scope", async () => {
    const library = [await makeLibrarySkill("alpha")];
    expect(await buildGhostSkills(library, [], "both")).toEqual([]);
  });

  it("enriches display fields from the library copy's SKILL.md", async () => {
    const library = [await makeLibrarySkill("alpha")];
    const ghosts = await buildGhostSkills(library, [], "project");
    expect(ghosts[0].description).toBe("Library copy of alpha.");
    expect(ghosts[0].creator).toBe("lib-author");
    expect(ghosts[0].effort).toBe("low");
    expect(typeof ghosts[0].tokenCount).toBe("number");
    expect(ghosts[0].tokenCount).toBeGreaterThan(0);
  });

  it("keeps blank display fields when SKILL.md is unreadable", async () => {
    const entry = await makeLibrarySkill("alpha");
    const library = [
      { ...entry, libraryPath: join(libraryDir, "vanished") },
    ];
    const ghosts = await buildGhostSkills(library, [], "project");
    expect(ghosts.map((g) => g.dirName)).toEqual(["alpha"]);
    expect(ghosts[0].description).toBe("");
    expect(ghosts[0].tokenCount).toBeUndefined();
  });

  it("skips entries whose library directory is missing", async () => {
    const library = [await makeLibrarySkill("alpha", { missing: true })];
    const ghosts = await buildGhostSkills(library, [], "project");
    expect(ghosts).toEqual([]);
  });

  it("ghosts reference the library path so activation can use them", async () => {
    const library = [await makeLibrarySkill("alpha")];
    const ghosts = await buildGhostSkills(library, [], "project");
    expect(ghosts[0].path).toBe(library[0].libraryPath);
    expect(ghosts[0].realPath).toBe(library[0].libraryPath);
  });

  it("returns an empty list when nothing is in the library", async () => {
    expect(await buildGhostSkills([], [makeInstalled("beta")], "project")).toEqual([]);
  });
});
