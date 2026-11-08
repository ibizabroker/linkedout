const blocklistBrand: unique symbol = Symbol('Blocklist');
const companyKeyBrand: unique symbol = Symbol('CompanyKey');

export type CompanyKey = string & { readonly [companyKeyBrand]: typeof companyKeyBrand };

export type BlockedCompany = {
  readonly name: string;
  readonly blockedAt: number;
};

export type Blocklist = {
  readonly [blocklistBrand]: typeof blocklistBrand;
  readonly entries: readonly BlockedCompany[];
};

export type StoredBlocklistRead =
  | { readonly status: 'ready'; readonly list: Blocklist }
  | { readonly status: 'unreadable' };

export function companyKey(name: string): CompanyKey {
  return name.trim().replace(/\s+/g, ' ').toLowerCase() as CompanyKey;
}

export function emptyBlocklist(): Blocklist {
  return blocklist([]);
}

export function withBlocked(list: Blocklist, name: string, now: number): Blocklist {
  if (companyKey(name) === '' || isBlocked(list, name)) {
    return list;
  }
  return blocklist([{ name: name.trim(), blockedAt: now }, ...list.entries]);
}

export function withoutBlocked(list: Blocklist, name: string): Blocklist {
  const key = companyKey(name);
  return blocklist(list.entries.filter((entry) => companyKey(entry.name) !== key));
}

export function isBlocked(list: Blocklist, name: string): boolean {
  const key = companyKey(name);
  return list.entries.some((entry) => companyKey(entry.name) === key);
}

export function parseStoredBlocklist(raw: unknown): StoredBlocklistRead {
  if (raw === undefined) {
    return { status: 'ready', list: emptyBlocklist() };
  }
  if (!isRecord(raw) || raw.version !== 1 || !Array.isArray(raw.entries)) {
    return { status: 'unreadable' };
  }

  const entries: BlockedCompany[] = [];
  for (const entry of raw.entries) {
    if (
      !isRecord(entry) ||
      typeof entry.name !== 'string' ||
      companyKey(entry.name) === '' ||
      typeof entry.blockedAt !== 'number' ||
      !Number.isFinite(entry.blockedAt)
    ) {
      return { status: 'unreadable' };
    }
    entries.push({ name: entry.name, blockedAt: entry.blockedAt });
  }

  return { status: 'ready', list: blocklist(entries) };
}

export function serializeBlocklist(list: Blocklist): {
  readonly version: 1;
  readonly entries: readonly BlockedCompany[];
} {
  return { version: 1, entries: list.entries };
}

function blocklist(entries: readonly BlockedCompany[]): Blocklist {
  const seen = new Set<CompanyKey>();
  const unique: BlockedCompany[] = [];
  for (const entry of [...entries].sort((a, b) => b.blockedAt - a.blockedAt)) {
    const key = companyKey(entry.name);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push({ name: entry.name, blockedAt: entry.blockedAt });
    }
  }
  return { [blocklistBrand]: blocklistBrand, entries: Object.freeze(unique) };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
