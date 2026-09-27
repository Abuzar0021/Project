"use client";

/**
 * Command bar, built on cmdk for filtering and keyboard behavior. Commands
 * are grouped under small headings; disabled ones show why.
 */

import { Command as Cmdk } from "cmdk";
import type { Command } from "./AppContext";
import styles from "./CommandMenu.module.css";

interface CommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commands: Command[];
}

export function CommandMenu({
  open,
  onOpenChange,
  commands,
}: CommandMenuProps) {
  const groups = [...new Set(commands.map((c) => c.group))];

  return (
    <Cmdk.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Command bar"
      overlayClassName={styles.veil}
      contentClassName={styles.panel}
    >
      <Cmdk.Input
        className={styles.input}
        placeholder="Type a command or search"
      />
      <Cmdk.List className={styles.list}>
        <Cmdk.Empty className={styles.empty}>No matching commands.</Cmdk.Empty>
        {groups.map((group) => (
          <Cmdk.Group key={group} heading={group} className={styles.group}>
            {commands
              .filter((c) => c.group === group)
              .map((c) => (
                <Cmdk.Item
                  key={c.id}
                  value={`${c.label} ${c.id}`}
                  disabled={c.disabled}
                  className={styles.item}
                  onSelect={() => {
                    onOpenChange(false);
                    c.run();
                  }}
                >
                  {c.label}
                  {c.hint ? (
                    <span className={styles.hint}>{c.hint}</span>
                  ) : null}
                </Cmdk.Item>
              ))}
          </Cmdk.Group>
        ))}
      </Cmdk.List>
    </Cmdk.Dialog>
  );
}
