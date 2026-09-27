import Link from "next/link";
import type { ReactNode } from "react";
import { LogoMark } from "@/components/ui/Logo";
import { PlusIcon } from "./icons";
import styles from "./Sidebar.module.css";

export interface SidebarItem {
  key: string;
  label: string;
  count?: string;
  href?: string;
  current?: boolean;
}

interface SidebarProps {
  workspace: string;
  userName: string;
  initials: string;
  primary: SidebarItem[];
  recent: SidebarItem[];
  tags: SidebarItem[];
  settingsHref?: string;
  onSearch: () => void;
  onNewDraft?: () => void;
  onLogout?: () => void;
  onNavigate?: () => void;
}

function Item({
  item,
  dot,
  onNavigate,
}: {
  item: SidebarItem;
  dot?: boolean;
  onNavigate?: () => void;
}) {
  const body: ReactNode = (
    <>
      {dot ? <span className={styles.dot} /> : null}
      <span className={styles.label}>{item.label}</span>
      {item.count ? <span className={styles.count}>{item.count}</span> : null}
    </>
  );
  const className = `${styles.item} ${item.current ? styles.current : ""}`;
  if (item.href) {
    return (
      <Link
        href={item.href}
        className={className}
        aria-current={item.current ? "page" : undefined}
        onClick={onNavigate}
      >
        {body}
      </Link>
    );
  }
  return (
    <button type="button" className={className}>
      {body}
    </button>
  );
}

export function Sidebar(props: SidebarProps) {
  const {
    workspace,
    userName,
    initials,
    primary,
    recent,
    tags,
    onSearch,
    onNewDraft,
    onLogout,
    onNavigate,
  } = props;

  const user = (
    <>
      <span className={styles.avatar} aria-hidden="true">
        {initials}
      </span>
      <span className={styles.label}>{userName}</span>
    </>
  );

  return (
    <nav className={styles.side} aria-label="Drafts">
      <div className={styles.workspace}>
        <LogoMark size={16} />
        <span className={styles.label}>{workspace}</span>
      </div>

      <button type="button" className={styles.search} onClick={onSearch}>
        <span>Search or jump to</span>
        <kbd className={styles.kbd}>&#8984;K</kbd>
      </button>

      <div className={styles.group}>
        {primary.map((item) => (
          <Item key={item.key} item={item} dot onNavigate={onNavigate} />
        ))}
      </div>

      <div className={styles.group}>
        <div className={styles.groupHead}>
          <span>Recent</span>
          {onNewDraft ? (
            <button
              type="button"
              className={styles.add}
              onClick={onNewDraft}
              aria-label="New draft"
              title="New draft"
            >
              <PlusIcon />
            </button>
          ) : null}
        </div>
        {recent.map((item) => (
          <Item key={item.key} item={item} onNavigate={onNavigate} />
        ))}
      </div>

      {tags.length > 0 ? (
        <div className={styles.group}>
          <div className={styles.groupHead}>
            <span>Tags</span>
          </div>
          {tags.map((item) => (
            <Item key={item.key} item={item} onNavigate={onNavigate} />
          ))}
        </div>
      ) : null}

      <div className={styles.user}>
        {props.settingsHref ? (
          <Link
            href={props.settingsHref}
            className={styles.userLink}
            onClick={onNavigate}
          >
            {user}
          </Link>
        ) : (
          <span className={styles.userLink}>{user}</span>
        )}
        {onLogout ? (
          <button type="button" className={styles.logout} onClick={onLogout}>
            Log out
          </button>
        ) : null}
      </div>
    </nav>
  );
}
