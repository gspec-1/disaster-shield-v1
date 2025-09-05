// Secure token generation for contractor accept/decline links
// Note: In production, use proper cryptographic libraries

export interface AcceptTokenPayload {
  projectId: string;
  contractorId: string;
  action: 'accept' | 'decline';
  exp: number;
}

// Simple HMAC-like token generation (for demo purposes)
function simpleHash(data: string, secret: string): string {
  console.log('Generating hash for data length:', data.length);
  let hash = 0;
  const combined = data + secret;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

export function generateAcceptToken(payload: Omit<AcceptTokenPayload, 'exp'>): string {
  const exp = Math.floor(Date.now() / 1000) + (48 * 60 * 60); // 48 hours
  const fullPayload = { ...payload, exp };
  
  const data = JSON.stringify(fullPayload);
  const secret = 'your-secret-key'; // In production, use environment variable
  const signature = simpleHash(data, secret);
  
  console.log('Generated token payload:', fullPayload);
  const token = `${btoa(data)}.${signature}`;
  console.log('Token length:', token.length);
  
  return token;
}

export function verifyAcceptToken(token: string): AcceptTokenPayload | null {
  try {
    console.log('Verifying token:', token);
    const [dataB64, signature] = token.split('.');
    console.log('Token parts:', { dataB64: !!dataB64, signature: !!signature });
    if (!dataB64 || !signature) {
      console.error('Token format is invalid - missing parts');
      return null;
    }
    
    let data;
    try {
      data = atob(dataB64);
      console.log('Decoded base64 data length:', data.length);
    } catch (e) {
      console.error('Base64 decoding failed:', e);
      return null;
    }
    
    const secret = 'your-secret-key'; // Same secret as generation
    const expectedSignature = simpleHash(data, secret);
    
    console.log('Signature check:', { 
      actual: signature, 
      expected: expectedSignature, 
      match: signature === expectedSignature 
    });
    
    if (signature !== expectedSignature) {
      console.error('Signature mismatch');
      return null;
    }
    
    let payload;
    try {
      payload = JSON.parse(data) as AcceptTokenPayload;
      console.log('Parsed payload:', payload);
    } catch (e) {
      console.error('JSON parsing failed:', e);
      return null;
    }
    
    // Check expiration
    const now = Date.now() / 1000;
    console.log('Expiration check:', { expiration: payload.exp, now, valid: now < payload.exp });
    if (now > payload.exp) {
      console.error('Token expired');
      return null;
    }
    
    return payload;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}