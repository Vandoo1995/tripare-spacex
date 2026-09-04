export type RootTabParamList = {
  LaunchesTab: undefined;
  MapTab: undefined;
  BookmarksTab: undefined;
};

export type LaunchesStackParamList = {
  LaunchList: undefined;
  LaunchDetails: { launchId: string };
};

export type MapStackParamList = {
  Heatmap: undefined;
  LaunchDetails: { launchId: string };
};

export type BookmarksStackParamList = {
  BookmarkList: undefined;
  LaunchDetails: { launchId: string };
};
