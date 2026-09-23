import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  resolveContinueUrl,
  resolvePostAuthUrl,
} from "./continue.util.ts";

const env = {
  learnUrl: "http://localhost:5402",
  websiteUrl: "http://localhost:3020",
  adminUrl: "http://localhost:5403",
  environment: "local",
};

describe("P021 continue allowlist", () => {
  it("allows Learn and Website origins", () => {
    assert.equal(
      resolveContinueUrl(
        "http://localhost:5402/courses/growth-engineering",
        env,
      ),
      "http://localhost:5402/courses/growth-engineering",
    );
    assert.equal(
      resolveContinueUrl("http://localhost:3020/programs", env),
      "http://localhost:3020/programs",
    );
    assert.equal(
      resolveContinueUrl("http://localhost:5403/scholarships", env),
      "http://localhost:5403/scholarships",
    );
  });

  it("rejects javascript:, data:, and foreign origins", () => {
    assert.equal(resolveContinueUrl("javascript:alert(1)", env), "/my-account");
    assert.equal(resolveContinueUrl("data:text/html,hi", env), "/my-account");
    assert.equal(
      resolveContinueUrl("https://evil.example/phish", env),
      "/my-account",
    );
  });

  it("fails closed when production-like origins are missing", () => {
    assert.equal(
      resolveContinueUrl("http://localhost:5402/", {
        environment: "production",
      }),
      "/my-account",
    );
  });
});

describe("P080 post-auth next", () => {
  it("honours allowlisted next from the query string", () => {
    assert.equal(
      resolvePostAuthUrl(
        "?next=http://localhost:5402/programs/ai-education",
        env,
      ),
      "http://localhost:5402/programs/ai-education",
    );
  });

  it("falls back to /my-account for a bad next", () => {
    assert.equal(
      resolvePostAuthUrl("?next=https://evil.example/phish", env),
      "/my-account",
    );
  });
});
