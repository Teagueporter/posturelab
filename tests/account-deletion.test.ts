import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const actionSource = readFileSync(path.join(process.cwd(), "src/app/account/actions.ts"), "utf8");

describe("cloud account deletion action", () => {
  it("fails closed when subscription lookup fails before deleting account data", () => {
    expect(actionSource).toContain("error: subscriptionError");
    expect(actionSource).toContain('throw new Error("Unable to read subscription before account deletion")');
  });

  it("removes scan images before deleting the Supabase Auth user", () => {
    const removeImagesIndex = actionSource.indexOf('service.storage.from("scan-images").remove(imagePaths)');
    const deleteUserIndex = actionSource.indexOf("service.auth.admin.deleteUser(user.id)");

    expect(removeImagesIndex).toBeGreaterThan(-1);
    expect(deleteUserIndex).toBeGreaterThan(removeImagesIndex);
  });

  it("fails closed when scan image cleanup or Auth deletion fails", () => {
    expect(actionSource).toContain("error: removeError");
    expect(actionSource).toContain('throw new Error("Unable to remove scan images before account deletion")');
    expect(actionSource).toContain("error: deleteUserError");
    expect(actionSource).toContain('throw new Error("Unable to delete Supabase Auth user")');
  });

  it("fails closed when storage listing fails before image removal", () => {
    expect(actionSource).toContain("error: folderError");
    expect(actionSource).toContain('throw new Error("Unable to list scan image folders before account deletion")');
    expect(actionSource).toContain("error: filesError");
    expect(actionSource).toContain('throw new Error("Unable to list scan image files before account deletion")');
  });
});
