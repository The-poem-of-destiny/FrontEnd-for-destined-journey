const AvatarDatabaseName = 'status-avatar-db';
const AvatarStoreName = 'avatars';
const AvatarDatabaseVersion = 1;

export type AvatarOwnerType = 'player' | 'partner';

export type AvatarSourceType = 'upload' | 'url' | 'removed';

export interface AvatarRecord {
  key: string;
  owner_type: AvatarOwnerType;
  owner_name: string;
  scope_key: string;
  source_type: AvatarSourceType;
  value: string;
  updated_at: number;
}

const buildAvatarKey = (scope_key: string, owner_type: AvatarOwnerType, owner_name: string) => {
  return `${scope_key}::${owner_type}::${owner_name}`;
};

const openAvatarDatabase = async (): Promise<IDBDatabase> => {
  return await new Promise((resolve, reject) => {
    const request = indexedDB.open(AvatarDatabaseName, AvatarDatabaseVersion);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(AvatarStoreName)) {
        const store = database.createObjectStore(AvatarStoreName, { keyPath: 'key' });
        store.createIndex('scope_key', 'scope_key', { unique: false });
        store.createIndex('owner_type', 'owner_type', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const withStore = async <T>(
  mode: IDBTransactionMode,
  handler: (store: IDBObjectStore) => Promise<T>,
): Promise<T> => {
  const database = await openAvatarDatabase();

  try {
    const transaction = database.transaction(AvatarStoreName, mode);
    const store = transaction.objectStore(AvatarStoreName);
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

const readRequest = <T>(request: IDBRequest<T>): Promise<T> => {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getAvatarScopeKey = () => {
  const character_name =
    typeof getCurrentCharacterName === 'function'
      ? getCurrentCharacterName() || 'unknown-character'
      : 'unknown-character';

  return `status:${character_name}`;
};

export const getAvatarRecord = async (
  scope_key: string,
  owner_type: AvatarOwnerType,
  owner_name: string,
): Promise<AvatarRecord | null> => {
  return await withStore('readonly', async store => {
    const record = await readRequest(store.get(buildAvatarKey(scope_key, owner_type, owner_name)));
    return (record as AvatarRecord | undefined) ?? null;
  });
};

export const saveAvatarRecord = async (
  avatar_record: Omit<AvatarRecord, 'key' | 'updated_at'>,
): Promise<AvatarRecord> => {
  const next_record: AvatarRecord = {
    ...avatar_record,
    key: buildAvatarKey(
      avatar_record.scope_key,
      avatar_record.owner_type,
      avatar_record.owner_name,
    ),
    updated_at: Date.now(),
  };

  return await withStore('readwrite', async store => {
    await readRequest(store.put(next_record));
    return next_record;
  });
};

export const removeAvatarRecord = async (
  scope_key: string,
  owner_type: AvatarOwnerType,
  owner_name: string,
): Promise<void> => {
  await withStore('readwrite', async store => {
    await readRequest(store.delete(buildAvatarKey(scope_key, owner_type, owner_name)));
  });
};

export const markAvatarAsRemoved = async (
  scope_key: string,
  owner_type: AvatarOwnerType,
  owner_name: string,
): Promise<AvatarRecord> => {
  return await saveAvatarRecord({
    scope_key,
    owner_type,
    owner_name,
    source_type: 'removed',
    value: '',
  });
};

export const isAvatarRemovedRecord = (avatar_record: AvatarRecord | null | undefined) => {
  return avatar_record?.source_type === 'removed';
};

export interface AvatarActionStateOptions {
  current_url?: string;
  custom_url?: string;
  default_url?: string;
  removed?: boolean;
}

export const getAvatarActionState = ({
  current_url = '',
  custom_url = '',
  default_url = '',
  removed = false,
}: AvatarActionStateOptions) => {
  const hasCurrentAvatar = Boolean(_.trim(current_url));
  const hasCustomAvatar = Boolean(_.trim(custom_url));
  const hasDefaultAvatar = Boolean(_.trim(default_url));

  return {
    canExport: hasCurrentAvatar,
    canDelete: hasCustomAvatar,
    canReset: hasDefaultAvatar || removed || hasCustomAvatar,
  };
};

export const exportAvatarFile = async (file_name: string, value: string): Promise<void> => {
  const response = await fetch(value);
  const blob = await response.blob();
  const object_url = URL.createObjectURL(blob);

  try {
    const anchor = document.createElement('a');
    anchor.href = object_url;
    anchor.download = file_name;
    anchor.click();
  } finally {
    URL.revokeObjectURL(object_url);
  }
};

export const readAvatarFileAsDataUrl = async (file: File): Promise<string> => {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
};
