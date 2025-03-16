import { fastFetch } from "../src/index.js";

describe("FastFetch Basic Tests", () => {
  const POKE_API = "https://pokeapi.co/api/v2/pokemon/ditto";

  it("makes a basic fetch call successfully", async () => {
    const response = await fastFetch(POKE_API);
    expect(response.ok).toBe(true);

    const data = await response.json();
    expect(data).toHaveProperty("name", "ditto");
  });

  it("deduplicates in-flight requests", async () => {
    const start = Date.now();

    const [res1, res2] = await Promise.all([
      fastFetch(POKE_API),
      fastFetch(POKE_API),
    ]);
    const time = Date.now() - start;

    // Should have same data
    expect((await res1.json()).name).toBe("ditto");
    expect((await res2.clone().json()).name).toBe("ditto");

    // We didn't do extra requests, so hopefully we didn't wait twice
    // Not a perfect check, but indicates we merged calls.
    expect(time).toBeLessThan(2000);
  });
});
