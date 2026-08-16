import { compare as comparePassword, hash as hashPassword } from "bcryptjs";

import type { PasswordHasher } from "../../application/ports/password-hasher.js";

export class BcryptPasswordHasher implements PasswordHasher {
  constructor(private readonly saltRounds = 12) {}

  hash(password: string): Promise<string> {
    return hashPassword(password, this.saltRounds);
  }

  compare(password: string, passwordHash: string): Promise<boolean> {
    return comparePassword(password, passwordHash);
  }
}
