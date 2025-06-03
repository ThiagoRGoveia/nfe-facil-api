export abstract class EncryptionPort {
  abstract encrypt(text: string): string;
  abstract decrypt(text: string): string;
}
