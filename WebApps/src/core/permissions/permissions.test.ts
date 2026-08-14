import { describe, expect, it } from "vitest";

import {
  PERMISSIONS,
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
} from "./permissions";

/**
 * The predicate is pure — a function over a string array, no React, no
 * session, no I/O — which is why it earns a direct suite rather than being
 * exercised only through a rendered screen. The no-implication rule below is
 * the whole reason: it is the assertion most likely to be broken later by
 * someone adding a convenience, and it is far cheaper to pin exhaustively here
 * than through the UI.
 *
 * Every check in this file is a UX guard. The backend rebuilds authorization
 * from the database on every request and refuses independently.
 */
describe("hasPermission", () => {
  const user = (permissions: string[]) => ({ permissions });

  it("is true for a code the user holds", () => {
    expect(hasPermission(user(["AUDIT_VIEW"]), "AUDIT_VIEW")).toBe(true);
  });

  it("is false for a code the user does not hold", () => {
    expect(hasPermission(user(["AUDIT_VIEW"]), "MASTER_VIEW")).toBe(false);
  });

  describe("fails closed", () => {
    it("treats an undefined user as holding nothing", () => {
      expect(hasPermission(undefined, "AUDIT_VIEW")).toBe(false);
    });

    it("treats a null user as holding nothing", () => {
      expect(hasPermission(null, "AUDIT_VIEW")).toBe(false);
    });

    it("treats an empty permission list as holding nothing", () => {
      expect(hasPermission(user([]), "AUDIT_VIEW")).toBe(false);
    });
  });

  /**
   * The backend's catalogue is explicit that no permission implies another,
   * and `SYSTEM_ADMIN` has no bypass — it can do everything only because the
   * seed grants it every code. A client-side hierarchy would disagree with the
   * server, and always in the direction of offering something it will refuse.
   */
  describe("no implication", () => {
    it("does not let a shared prefix grant a sibling", () => {
      expect(hasPermission(user(["STOCK_VIEW"]), "STOCK_ADJUST")).toBe(false);
      expect(hasPermission(user(["EXCHANGE_VIEW"]), "EXCHANGE_CANCEL")).toBe(false);
      expect(hasPermission(user(["MASTER_VIEW"]), "MASTER_EDIT")).toBe(false);
      expect(hasPermission(user(["CONFIRMATION_APPROVE"]), "CONFIRMATION_REJECT")).toBe(false);
    });

    it("does not treat a role code as a permission", () => {
      expect(hasPermission(user(["SYSTEM_ADMIN"]), "AUDIT_VIEW")).toBe(false);
    });

    it("grants nothing extra to a user holding every other code", () => {
      const everythingElse = Object.values(PERMISSIONS).filter(
        (code) => code !== PERMISSIONS.AUDIT_VIEW,
      );

      expect(hasPermission(user(everythingElse), PERMISSIONS.AUDIT_VIEW)).toBe(false);
    });

    it("matches the whole code, not a substring of it", () => {
      expect(hasPermission(user(["VIEW"]), "AUDIT_VIEW")).toBe(false);
      expect(hasPermission(user(["AUDIT_VIEW_ALL"]), "AUDIT_VIEW")).toBe(false);
    });

    it("is case sensitive, like the server's string comparison", () => {
      expect(hasPermission(user(["audit_view"]), "AUDIT_VIEW")).toBe(false);
    });
  });

  // Adding a permission server-side must never break the client.
  it("matches a code the client does not know about", () => {
    expect(hasPermission(user(["SOME_FUTURE_CODE"]), "SOME_FUTURE_CODE")).toBe(true);
    expect(hasPermission(user(["SOME_FUTURE_CODE"]), "AUDIT_VIEW")).toBe(false);
  });
});

describe("hasAllPermissions", () => {
  const user = (permissions: string[]) => ({ permissions });

  it("requires every code", () => {
    expect(hasAllPermissions(user(["A", "B"]), ["A", "B"])).toBe(true);
    expect(hasAllPermissions(user(["A"]), ["A", "B"])).toBe(false);
  });

  it("is false for an absent user", () => {
    expect(hasAllPermissions(undefined, ["A"])).toBe(false);
  });

  // No requirement is trivially satisfied — an ungated screen needs no ceremony.
  it("is true when nothing is required", () => {
    expect(hasAllPermissions(user([]), [])).toBe(true);
  });
});

describe("hasAnyPermission", () => {
  const user = (permissions: string[]) => ({ permissions });

  it("requires one code", () => {
    expect(hasAnyPermission(user(["B"]), ["A", "B"])).toBe(true);
    expect(hasAnyPermission(user(["C"]), ["A", "B"])).toBe(false);
  });

  it("is false for an absent user", () => {
    expect(hasAnyPermission(undefined, ["A"])).toBe(false);
  });

  // The mirror of hasAllPermissions([]): asking for one of nothing gets nothing.
  it("is false when nothing is offered", () => {
    expect(hasAnyPermission(user(["A"]), [])).toBe(false);
  });
});
