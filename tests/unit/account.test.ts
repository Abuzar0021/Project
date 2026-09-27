import { describe, it, expect, beforeEach } from "vitest";
import {
  currentAccount,
  deleteAccount,
  emailError,
  findAccount,
  initials,
  logIn,
  logOut,
  signUp,
  updateAccount,
  workspaceName,
} from "@/lib/account";
import { listDrafts, seedDrafts } from "@/lib/drafts";

beforeEach(() => {
  localStorage.clear();
  document.cookie = "margin_session=; Max-Age=0; Path=/";
});

describe("accounts", () => {
  it("signs up, starts a session and defaults to a Pro trial", () => {
    const account = signUp({ name: " Mira Tan ", email: "Mira@Northwind.co" });
    expect(account.email).toBe("mira@northwind.co");
    expect(account.name).toBe("Mira Tan");
    expect(account.plan).toBe("pro");
    expect(account.trialEndsAt).not.toBeNull();
    expect(currentAccount()?.email).toBe("mira@northwind.co");
    expect(document.cookie).toContain("margin_session=1");
  });

  it("starts the Free plan without a trial", () => {
    expect(
      signUp({ name: "A", email: "a@b.co", plan: "free" }).trialEndsAt,
    ).toBeNull();
  });

  it("logs out and back in with the same email", () => {
    signUp({ name: "Mira", email: "mira@northwind.co" });
    logOut();
    expect(currentAccount()).toBeNull();
    expect(logIn("MIRA@northwind.co")?.name).toBe("Mira");
    expect(logIn("nobody@northwind.co")).toBeNull();
  });

  it("updates settings and mirrors the theme to a cookie", () => {
    signUp({ name: "Mira", email: "mira@northwind.co" });
    expect(updateAccount({ theme: "light" })?.theme).toBe("light");
    expect(document.cookie).toContain("margin_theme=light");
  });

  it("deletes the account and its drafts", () => {
    signUp({ name: "Mira", email: "mira@northwind.co" });
    seedDrafts("mira@northwind.co");
    deleteAccount();
    expect(findAccount("mira@northwind.co")).toBeNull();
    expect(listDrafts("mira@northwind.co")).toHaveLength(0);
    expect(currentAccount()).toBeNull();
  });
});

describe("helpers", () => {
  it("explains a bad email in plain words", () => {
    expect(emailError("")).toBe("Enter your email address.");
    expect(emailError("mira@")).toBe(
      "Enter an email address like name@company.com",
    );
    expect(emailError("mira@northwind.co")).toBeNull();
  });

  it("names the workspace after a company domain", () => {
    expect(workspaceName("mira@northwind.co")).toBe("Northwind");
    expect(workspaceName("mira@gmail.com")).toBe("Personal");
  });

  it("makes initials", () => {
    expect(initials("Mira Tan")).toBe("MT");
    expect(initials("Cher")).toBe("C");
  });
});
