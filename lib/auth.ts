import { SignJWT, jwtVerify } from 'jose';

// Polyfill for TextEncoder if it's missing (though Node 18+ has it)
if (typeof global.TextEncoder === 'undefined') {
    const { TextEncoder } = require('util');
    global.TextEncoder = TextEncoder;
}

const getSecretKey = () => {
    const secret = process.env.JWT_SECRET || 'your-secret-key-at-least-32-chars-long';
    if (secret.length < 32) { // JOSE requires at least 32 chars for HS256 with TextEncoder? Actually it's good practice.
        return 'your-secret-key-at-least-32-chars-long-fallback-key';
    }
    return secret;
}

const SECRET_KEY = new TextEncoder().encode(getSecretKey());

export async function signToken(payload: any) {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('30d')
        .sign(SECRET_KEY);
}

export async function verifyToken(token: string) {
    try {
        const { payload } = await jwtVerify(token, SECRET_KEY);
        return payload;
    } catch (error) {
        console.error("Token verification failed:", error);
        return null;
    }
}
