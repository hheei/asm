import React, { useMemo } from "react";
import { Box, Text } from "ink";
import { TextInput } from "@inkjs/ui";
import { theme } from "../utils/colors";
import type { SkillInfo, Scope, SortBy, AppConfig } from "../utils/types";

const SORT_OPTIONS: SortBy[] = ["name", "version", "location"];

function buildScopeDescription(config: AppConfig): string {
  const labels = config.providers.filter((p) => p.enabled).map((p) => p.label);
  if (labels.length <= 3) return labels.join(", ");
  return labels.slice(0, 2).join(", ") + ` +${labels.length - 2}`;
}

function buildSortLabel(by: SortBy): string {
  return (
    "(s) Sort: " + SORT_OPTIONS.map((o) => (o === by ? `[${o}]` : o)).join("  ")
  );
}

export interface DashboardHeaderProps {
  config: AppConfig;
  skills: SkillInfo[];
  duplicateCount: number;
  sort: SortBy;
  scope: Scope;
  searchMode: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: (value: string) => void;
}

export function DashboardHeader({
  config,
  skills,
  duplicateCount,
  sort,
  scope,
  searchMode,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
}: DashboardHeaderProps) {
  const stats = useMemo(() => {
    const uniqueNames = new Set<string>();
    const providerNames = new Set<string>();
    let globalCount = 0;
    let projectCount = 0;
    let symlinks = 0;

    for (const s of skills) {
      uniqueNames.add(s.dirName);
      providerNames.add(s.provider);
      if (s.scope === "global") globalCount++;
      else if (s.scope === "project") projectCount++;
      if (s.isSymlink) symlinks++;
    }

    return {
      total: skills.length,
      unique: uniqueNames.size,
      globalCount,
      projectCount,
      symlinks,
      providers: providerNames.size,
    };
  }, [skills]);

  const scopeDesc = buildScopeDescription(config);

  return (
    <Box flexDirection="column">
      <Box>
        <Text color={theme.accent} bold>
          agent-skill-manager
        </Text>
      </Box>

      <Box
        flexDirection="row"
        borderStyle="round"
        borderColor={theme.border}
        paddingX={1}
        gap={3}
      >
        <Text color={theme.fg}>
          Total: {stats.total} ({stats.unique} unique)
        </Text>
        <Text color={theme.cyan}>Global: {stats.globalCount}</Text>
        <Text color={theme.green}>Project: {stats.projectCount}</Text>
        <Text color={theme.yellow}>Symlinks: {stats.symlinks}</Text>
        <Text color={theme.accentAlt}>Tools: {stats.providers}</Text>
        <Text color={theme.orange}>Dupes: {duplicateCount}</Text>
        <Text color={theme.border}>│</Text>
        <Text color={theme.fgDim}>{buildSortLabel(sort)}</Text>
      </Box>

      <Box flexDirection="row" paddingX={1}>
        <ScopeTab label="Global" active={scope === "global"} />
        <Text> </Text>
        <ScopeTab label="Project" active={scope === "project"} />
        <Text> </Text>
        <ScopeTab label="Both" active={scope === "both"} />
        <Text color={theme.fgDim}> — {scopeDesc}</Text>
      </Box>

      <Box
        borderStyle="round"
        borderColor={searchMode ? theme.accent : theme.border}
        paddingX={1}
      >
        {searchMode ? (
          <TextInput
            placeholder="type to search..."
            defaultValue={searchQuery}
            onChange={onSearchChange}
            onSubmit={onSearchSubmit}
          />
        ) : (
          <Text color={searchQuery ? theme.fg : theme.fgDim}>
            {searchQuery || "press / to search..."}
          </Text>
        )}
      </Box>
    </Box>
  );
}

function ScopeTab({ label, active }: { label: string; active: boolean }) {
  return (
    <Text
      color={active ? theme.accent : theme.fgDim}
      inverse={active}
      bold={active}
    >
      {" "}
      {label}{" "}
    </Text>
  );
}

export interface DashboardFooterProps {
  feedback?: string | null;
  refreshFeedback?: boolean;
  linkFeedback?: boolean;
  scanning: boolean;
  hasScanned: boolean;
}

export function DashboardFooter({
  feedback,
  refreshFeedback,
  linkFeedback,
  scanning,
  hasScanned,
}: DashboardFooterProps) {
  const text = feedback
    ? ` ✓ ${feedback}`
    : linkFeedback
      ? " ✓ Linked!"
      : refreshFeedback
        ? " ✓ Updated!"
        : "";
  return (
    <Text color={theme.fgDim}>
      {" "}
      ↑/↓ <Text color={theme.accent}>Navigate</Text>
      {" · "}
      Enter <Text color={theme.accent}>View</Text>
      {" · "}d <Text color={theme.accent}>Uninstall</Text>
      {" · "}l <Text color={theme.accent}>Link</Text>
      {" · "}a <Text color={theme.accent}>Audit</Text>
      {" · "}/ <Text color={theme.accent}>Filter</Text>
      {" · "}
      Tab <Text color={theme.accent}>Scope</Text>
      {" · "}s <Text color={theme.accent}>Sort</Text>
      {" · "}r <Text color={theme.accent}>Refresh</Text>
      {" · "}c <Text color={theme.accent}>Config</Text>
      {" · "}q <Text color={theme.accent}>Quit</Text>
      {" · "}? <Text color={theme.accent}>Help</Text>{" "}
      {scanning && !hasScanned && (
        <Text color={theme.yellow}> (Scanning...)</Text>
      )}
      {text && <Text color={theme.green}> {text}</Text>}
    </Text>
  );
}
