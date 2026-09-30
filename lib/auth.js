import { jwtVerify, SignJWT } from "jose";

function getSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is missing from .env.local");
  }

  return new TextEncoder().encode(secret);
}

export async function createAuthToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifyAuthToken(token) {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(
      token,
      getSecret()
    );

    return payload;
  } catch {
    return null;
  }
}