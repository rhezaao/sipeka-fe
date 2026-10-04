import { MockSipekaRepository } from "./mock-repository";
import { HttpSipekaRepository } from "./http-repository";
import type { SipekaRepository } from "./contracts";

export function createRepository(): SipekaRepository {
  if (process.env.NEXT_PUBLIC_DATA_SOURCE === "http") {
    if (!process.env.NEXT_PUBLIC_API_BASE_URL) throw new Error("NEXT_PUBLIC_API_BASE_URL wajib diisi untuk mode http");
    return new HttpSipekaRepository(process.env.NEXT_PUBLIC_API_BASE_URL);
  }
  return new MockSipekaRepository();
}
