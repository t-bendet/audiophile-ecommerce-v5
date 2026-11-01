import { describe, expect, it } from "vitest";
import { scorePassword } from "../src/features/auth/utils/password-strength";

// The meter is advisory and sits beside the domain rule of 8 to 20 characters.
// Its one hard promise is honesty: a common or too-short password is never
// presented as Strong, whatever else it contains.

describe("scorePassword", () => {
  it("rates an empty password Weak and asks for length first", () => {
    expect(scorePassword("")).toEqual({
      score: 0,
      label: "Weak",
      hint: "Use at least 8 characters",
    });
  });

  it("rates a short password Weak even when it meets every other rule", () => {
    const strength = scorePassword("Ab1!xyz");

    expect(strength.label).not.toBe("Strong");
    expect(strength.hint).toBe("Use at least 8 characters");
  });

  it("gives exactly 8 lowercase characters one point", () => {
    expect(scorePassword("abcdefgh")).toEqual({
      score: 1,
      label: "Weak",
      hint: "Use 12 or more characters",
    });
  });

  it("rates 12 mixed-case characters Good", () => {
    expect(scorePassword("abcdefGHIJKL")).toEqual({
      score: 3,
      label: "Good",
      hint: "Add a number",
    });
  });

  it("caps a password that meets every rule at Strong with no hint", () => {
    expect(scorePassword("Str0ng!Passw0rd")).toEqual({
      score: 4,
      label: "Strong",
      hint: null,
    });
  });

  it("drops the hint once the score reaches Strong without a symbol", () => {
    expect(scorePassword("Str0ngPassw0rd")).toEqual({
      score: 4,
      label: "Strong",
      hint: null,
    });
  });

  it("never rates a common password above Weak, whatever its case", () => {
    for (const password of ["password", "PASSWORD", "12345678", "Qwerty123"]) {
      const strength = scorePassword(password);

      expect(strength.score).toBeLessThanOrEqual(1);
      expect(strength.label).toBe("Weak");
      expect(strength.hint).toBe("Avoid common passwords");
    }
  });

  it("never rates a single repeated character above Weak", () => {
    expect(scorePassword("aaaaaaaaaaaa")).toEqual({
      score: 1,
      label: "Weak",
      hint: "Avoid repeating a single character",
    });
  });

  it("names the first unmet rule in order", () => {
    expect(scorePassword("abcdefghijkl").hint).toBe("Mix upper and lower case");
    expect(scorePassword("abcdefghijkL").hint).toBe("Add a number");
    expect(scorePassword("abcdefghijk1").hint).toBe("Mix upper and lower case");
    expect(scorePassword("abcdefg1L").hint).toBe("Use 12 or more characters");
  });

  it("rewards each of length, case, digit and symbol", () => {
    const scores = ["abcdefgh", "abcdefgH", "abcdefg1H", "abcdefg1H!"].map(
      (password) => scorePassword(password).score,
    );

    expect(scores).toEqual([1, 2, 3, 4]);
  });
});
