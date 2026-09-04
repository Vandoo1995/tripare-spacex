import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

export function isConnected(state: NetInfoState): boolean {
  if (state.isConnected === false) return false;
  if (state.isInternetReachable === false) return false;
  return true;
}

export function subscribeNetwork(onChange: (online: boolean) => void): () => void {
  return NetInfo.addEventListener((state) => {
    onChange(isConnected(state));
  });
}

export async function readNetwork(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return isConnected(state);
}
