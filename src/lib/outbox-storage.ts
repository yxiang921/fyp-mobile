import { Directory, File, Paths } from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import nacl from 'tweetnacl';

const directory = new Directory(Paths.document, 'report-outbox');
let keyPromise: Promise<Uint8Array> | undefined;
function key() {
  return keyPromise ??= (async () => {
    let hex = await SecureStore.getItemAsync('outbox-encryption-key');
    if (!hex) {
      hex = Array.from(Crypto.getRandomBytes(32), b => b.toString(16).padStart(2, '0')).join('');
      await SecureStore.setItemAsync('outbox-encryption-key', hex, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
    }
    return Uint8Array.from(hex.match(/../g)!, b => parseInt(b,16));
  })();
}
export async function readEntries(): Promise<string[]> {
  if (!directory.exists) return [];
  const secret = await key();
  return Promise.all(directory.list().filter((entry): entry is File => entry instanceof File && entry.name.endsWith('.box')).map(async file => {
    const bytes = await file.bytes();
    const decoded = nacl.secretbox.open(bytes.slice(24), bytes.slice(0,24), secret);
    if (!decoded) throw new Error('Could not decrypt saved report.');
    return new TextDecoder().decode(decoded);
  }));
}
export async function saveEntry(id: string, json: string) {
  directory.create({ intermediates: true, idempotent: true });
  const nonce = Crypto.getRandomBytes(24);
  const encrypted = nacl.secretbox(new TextEncoder().encode(json), nonce, await key());
  const bytes = new Uint8Array(24+encrypted.length); bytes.set(nonce); bytes.set(encrypted,24);
  const file = new File(directory, `${id}.box`);
  file.write(bytes);
}
export async function removeEntry(id: string) { const file = new File(directory, `${id}.box`); if(file.exists) file.delete(); }
export async function readAttachment(uri: string): Promise<string> { return new File(uri).base64(); }
export async function attachmentForUpload(base64: string, name: string, type: string) {
  const file = new File(Paths.cache, `upload-${Crypto.randomUUID()}-${name.replace(/[^a-zA-Z0-9.]/g,'_')}`);
  file.write(base64, { encoding: 'base64' });
  return { value: { uri: file.uri, name, type } as unknown as Blob, cleanup: () => { if (file.exists) file.delete(); } };
}
