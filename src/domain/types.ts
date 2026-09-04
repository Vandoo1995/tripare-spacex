export type LaunchStatus = 'success' | 'failure' | 'upcoming';

export type LaunchFailure = {
  time: number | null;
  altitude: number | null;
  reason: string | null;
};

export type Launch = {
  id: string;
  name: string;
  dateUtc: string;
  dateUnix: number;
  success: boolean | null;
  upcoming: boolean;
  rocketId: string | null;
  launchpadId: string | null;
  details: string | null;
  flightNumber: number;
  payloadIds: string[];
  patchSmall: string | null;
  patchLarge: string | null;
  flickr: string[];
  webcast: string | null;
  youtubeId: string | null;
  wikipedia: string | null;
  article: string | null;
  failures: LaunchFailure[];
};

export type Launchpad = {
  id: string;
  name: string;
  fullName: string;
  locality: string | null;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
  launchAttempts: number;
  launchSuccesses: number;
  status: string | null;
  details: string | null;
  imageUrl: string | null;
};

export type Rocket = {
  id: string;
  name: string;
  type: string | null;
};

export type Payload = {
  id: string;
  name: string;
  type: string | null;
  massKg: number | null;
};

export type Bookmark = {
  launchId: string;
  notes: string;
  createdAt: number;
};

export type DatePreset = 'last_30_days' | 'last_year' | 'all_time';
export type SortKey = 'date_desc' | 'date_asc' | 'name_asc' | 'name_desc';
export type FilterMode = 'AND' | 'OR';

export type LaunchFilters = {
  search: string;
  datePreset: DatePreset;
  statuses: LaunchStatus[];
  rocketIds: string[];
  launchpadIds: string[];
  sort: SortKey;
  filterMode: FilterMode;
};

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';
