import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ApiPath } from "./paths.ts";

describe("P081 ApiPath alignment", () => {
  it("maps loggedInUser to GET /user/", () => {
    assert.equal(ApiPath.loggedInUser, "/user/");
  });

  it("does not point Academy identity at /auth/user", () => {
    assert.notEqual(ApiPath.loggedInUser, "/auth/user");
  });
});
