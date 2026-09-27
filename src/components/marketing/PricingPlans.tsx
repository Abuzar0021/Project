"use client";

/**
 * Plan cards with the yearly and monthly toggle. Plan buttons go to sign up,
 * or to Settings when already signed in, carrying the plan and period.
 */

import { useState } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { PLANS, YEARLY_SAVING, type Period } from "@/lib/plans";
import styles from "./Pricing.module.css";

export function PricingPlans({ signedIn }: { signedIn: boolean }) {
  const [period, setPeriod] = useState<Period>("yearly");
  const base = signedIn ? "/app/settings" : "/signup";

  return (
    <>
      <div className={styles.toggle} role="group" aria-label="Billing period">
        <button
          type="button"
          aria-pressed={period === "yearly"}
          onClick={() => setPeriod("yearly")}
        >
          Yearly<span className={styles.save}>{YEARLY_SAVING}</span>
        </button>
        <button
          type="button"
          aria-pressed={period === "monthly"}
          onClick={() => setPeriod("monthly")}
        >
          Monthly
        </button>
      </div>

      <div className={styles.plans}>
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`${styles.plan} ${plan.highlight ? styles.highlight : ""}`}
          >
            <h2 className={styles.name}>
              {plan.name}
              {plan.tag ? <span className={styles.tag}>{plan.tag}</span> : null}
            </h2>
            <div className={styles.price}>
              <b>${plan.price[period]}</b>
              {plan.unit ? <span>{plan.unit}</span> : null}
            </div>
            <p className={styles.desc}>{plan.description}</p>
            <ButtonLink
              variant={plan.highlight ? "primary" : "outline"}
              block
              href={`${base}?plan=${plan.id}&period=${period}`}
            >
              {plan.cta}
            </ButtonLink>
            <ul className={styles.features}>
              {plan.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
}
