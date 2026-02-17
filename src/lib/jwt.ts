import { jwtVerify } from 'jose';

// Define the expected JWT payload structure
interface JWTPayload {
  sub: string;
  role?: string;
  email?: string;
  app_metadata?: {
    provider?: string;
    [key: string]: unknown;
  };
  user_metadata?: {
    [key: string]: unknown;
  };
  exp?: number;
}

export async function verifySupabaseToken(token: string): Promise<JWTPayload> {
  const secret = process.env.SUPABASE_JWT_SECRET;
  
  if (!secret) {
    throw new Error('SUPABASE_JWT_SECRET is not set');
  }

  try {
    const encodedSecret = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, encodedSecret);
    
    // Basic validation
    if (!payload.sub) {
      throw new Error('Invalid Token: Missing subject');
    }
    
    // Check expiration (jose does this automatically, but extra safety)
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      throw new Error('Token expired');
    }

    return payload as unknown as JWTPayload;
  } catch (err: any) {
    console.error('JWT Verification Failed:', err.message);
    throw new Error('Invalid Token');
  }
}
