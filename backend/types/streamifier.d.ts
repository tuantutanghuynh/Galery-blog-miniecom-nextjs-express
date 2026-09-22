declare module 'streamifier' {
  import { Readable } from 'stream';

  interface Streamifier {
    createReadStream(buffer: Buffer | Uint8Array, options?: unknown): Readable;
  }

  const streamifier: Streamifier;
  export default streamifier;
}
