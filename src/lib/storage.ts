// Stubbed object storage — wire to real S3 before production
export async function putPrivateObject(
  key: string,
  body: Buffer,
  contentType: string
) {
  console.log(`[STUB] Storing object: ${key} (${contentType})`);
  // TODO: wire to S3 / GCS / Azure Blob Storage
  return key;
}

export async function getSignedDownloadUrl(
  key: string,
  expiresIn: number = 3600
) {
  console.log(`[STUB] Generating signed URL for: ${key}`);
  // TODO: wire to real storage provider
  return `https://storage.example.com/${key}?expires=${Date.now() + expiresIn * 1000}`;
}

export async function scanForMalware(key: string) {
  console.log(`[STUB] Scanning for malware: ${key}`);
  // TODO: wire to ClamAV or scanning API
  return "CLEAN";
}
