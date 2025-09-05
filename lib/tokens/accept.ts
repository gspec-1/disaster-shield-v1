import crypto from 'crypto';

const secret = process.env.ACCEPT_TOKEN_SECRET!;

export interface AcceptTokenPayload {
  projectId: string;
  contractorId: string;
  exp: number;
}

export function signAcceptToken(payload: Omit<AcceptTokenPayload, 'exp'>): string {
  const exp = Math.floor(Date.now() / 1000) + (48 * 60 * 60); // 48 hours
  const fullPayload = { ...payload, exp };
  
  const data = JSON.stringify(fullPayload);
  const signature = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('base64url');
  
  return `${Buffer.from(data).toString('base64url')}.${signature}`;
}

export function verifyAcceptToken(token: string): AcceptTokenPayload | null {
  try {
    const [dataB64, signature] = token.split('.');
    if (!dataB64 || !signature) return null;
    
    const data = Buffer.from(dataB64, 'base64url').toString();
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(data)
      .digest('base64url');
    
    if (signature !== expectedSignature) return null;
    
    const payload = JSON.parse(data) as AcceptTokenPayload;
    
    // Check expiration
    if (Date.now() / 1000 > payload.exp) return null;
    
    return payload;
  } catch {
    return null;
  }
}