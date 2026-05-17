import { describe, it, expect } from "vitest";
import { getPlatformConfig } from "@/lib/platforms";

describe("setup do vitest", () => {
  it("executa o runner", () => {
    expect(1 + 1).toBe(2);
  });

  it("resolve o alias @ para a raiz do projeto", () => {
    expect(getPlatformConfig("pc").key).toBe("pc");
  });
});
