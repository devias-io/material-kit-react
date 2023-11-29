export {};

// Here we declare the members of the process.env object, so that we
// can use them in our application code in a type-safe manner.
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_REALIZZA_BACKEND_PORT: string;
    }
  }
}
