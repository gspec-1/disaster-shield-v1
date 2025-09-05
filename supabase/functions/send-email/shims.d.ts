// Type shims so TS/ESLint in the Node tooling can type-check this Deno edge function.

// Minimal Deno global used in this function
declare const Deno: {
  env: {
    get(name: string): string | undefined
  }
  serve: (handler: (req: Request) => Promise<Response> | Response) => void
};

// Shim the Resend import style used by Deno (npm: specifier)
declare module 'npm:resend@4.0.1' {
  export class Resend {
    constructor(apiKey: string)
    emails: {
      send(input: any): Promise<{ data?: any; error?: any }>
    }
  }
}


