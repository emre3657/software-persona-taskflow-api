import { createHash, randomBytes, randomUUID } from "node:crypto";

import type {
  GeneratedRefreshToken,
  RefreshTokenService,
} from "../../application/ports/refresh-token-service.js";

export class CryptoRefreshTokenService implements RefreshTokenService {
  constructor(private readonly tokenSizeInBytes = 64) {}

  generate(): GeneratedRefreshToken {
    const rawToken = randomBytes(this.tokenSizeInBytes).toString("hex");

    return {
      rawToken,
      tokenHash: this.hash(rawToken),
    };
  }

  generateFamilyId(): string {
    return randomUUID();
  }

  hash(rawToken: string): string {
    return createHash("sha256").update(rawToken, "utf8").digest("hex");
  }
}
