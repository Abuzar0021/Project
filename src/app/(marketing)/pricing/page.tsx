/**
 * Pricing page: plan cards with a billing toggle, a comparison table and common questions.
 * Everything shown comes from lib/plans.ts.
 */

import type { Metadata } from "next";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/account";
import { COMPARE, FAQ, PLANS } from "@/lib/plans";
import { PricingPlans } from "@/components/marketing/PricingPlans";
import site from "@/components/marketing/site.module.css";
import styles from "@/components/marketing/Pricing.module.css";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Start free. Upgrade when Margin has learned enough of your voice to be worth it.",
};

export default async function PricingPage() {
  const signedIn = (await cookies()).has(SESSION_COOKIE);

  return (
    <>
      <section className={`${site.wrap} ${styles.top}`}>
        <h1 className={site.d1}>Pricing</h1>
        <p className={`${site.lead} ${styles.intro}`}>
          Start free. Upgrade when Margin has learned enough of your voice to be
          worth it.
        </p>
      </section>

      <section className={site.wrap} aria-label="Plans">
        <PricingPlans signedIn={signedIn} />

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Compare plans</th>
                {PLANS.map((plan) => (
                  <th key={plan.id} scope="col">
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARE.map((group) => [
                <tr key={group.name} className={styles.group}>
                  <th scope="rowgroup" colSpan={4}>
                    {group.name}
                  </th>
                </tr>,
                ...group.rows.map((row) => (
                  <tr key={`${group.name}-${row.label}`}>
                    <th scope="row">{row.label}</th>
                    {row.values.map((value, i) => (
                      <td
                        key={i}
                        className={value === "No" ? styles.no : styles.yes}
                      >
                        {value}
                      </td>
                    ))}
                  </tr>
                )),
              ])}
            </tbody>
          </table>
        </div>
      </section>

      <section className={`${site.wrap} ${site.section} ${styles.faqSection}`}>
        <h2 className={site.d2}>Questions</h2>
        <div className={styles.faq}>
          {FAQ.map((item) => (
            <div key={item.q}>
              <h3 className={styles.q}>{item.q}</h3>
              <p className={styles.a}>{item.a}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
