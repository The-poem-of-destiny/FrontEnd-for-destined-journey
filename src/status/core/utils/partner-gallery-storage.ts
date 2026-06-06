import { getAllowedPartnerGalleryItems, PartnerGalleryItem } from './partner-gallery';

const PartnerGalleryDatabaseName = 'status-partner-gallery-db';
const PartnerGalleryStoreName = 'partner-galleries';
const PartnerGalleryDatabaseVersion = 1;

export interface PartnerGalleryRecord {
  key: string;
  owner_type: 'partner';
  owner_name: string;
  scope_key: string;
  items: PartnerGalleryItem[];
  updated_at: number;
}

const buildPartnerGalleryKey = (scope_key: string, owner_name: string) => {
  return `${scope_key}::partner::${owner_name}`;
};

const openPartnerGalleryDatabase = async (): Promise<IDBDatabase> => {
  return await new Promise((resolve, reject) => {
    const request = indexedDB.open(PartnerGalleryDatabaseName, PartnerGalleryDatabaseVersion);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(PartnerGalleryStoreName)) {
        const store = database.createObjectStore(PartnerGalleryStoreName, { keyPath: 'key' });
        store.createIndex('scope_key', 'scope_key', { unique: false });
        store.createIndex('owner_type', 'owner_type', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const readRequest = <T>(request: IDBRequest<T>): Promise<T> => {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const withPartnerGalleryStore = async <T>(
  mode: IDBTransactionMode,
  handler: (store: IDBObjectStore) => Promise<T>,
): Promise<T> => {
  const database = await openPartnerGalleryDatabase();

  try {
    const transaction = database.transaction(PartnerGalleryStoreName, mode);
    const store = transaction.objectStore(PartnerGalleryStoreName);
    const result = await handler(store);

    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });

    return result;
  } finally {
    database.close();
  }
};

const normalizePartnerGalleryRecord = (
  record: PartnerGalleryRecord | undefined,
): PartnerGalleryRecord | null => {
  if (!record) {
    return null;
  }

  return {
    ...record,
    items: getAllowedPartnerGalleryItems(record.items),
  };
};

export const getPartnerGalleryRecordsByScopeKey = async (
  scope_key: string,
): Promise<PartnerGalleryRecord[]> => {
  return await withPartnerGalleryStore('readonly', async store => {
    const records = await readRequest(store.index('scope_key').getAll(scope_key));
    return ((records as PartnerGalleryRecord[] | undefined) ?? [])
      .map(normalizePartnerGalleryRecord)
      .filter((record): record is PartnerGalleryRecord => Boolean(record));
  });
};

export const savePartnerGalleryItems = async (
  scope_key: string,
  owner_name: string,
  items: PartnerGalleryItem[],
): Promise<PartnerGalleryRecord> => {
  const next_record: PartnerGalleryRecord = {
    key: buildPartnerGalleryKey(scope_key, owner_name),
    owner_type: 'partner',
    owner_name,
    scope_key,
    items: getAllowedPartnerGalleryItems(items),
    updated_at: Date.now(),
  };

  return await withPartnerGalleryStore('readwrite', async store => {
    await readRequest(store.put(next_record));
    return next_record;
  });
};

export const removePartnerGalleryRecord = async (
  scope_key: string,
  owner_name: string,
): Promise<void> => {
  await withPartnerGalleryStore('readwrite', async store => {
    await readRequest(store.delete(buildPartnerGalleryKey(scope_key, owner_name)));
  });
};
