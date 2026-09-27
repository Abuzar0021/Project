import styles from "@/components/auth/Auth.module.css";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="site">
      <main className={styles.page}>{children}</main>
    </div>
  );
}
