import { NativeModules, Platform, NativeEventEmitter, EmitterSubscription } from 'react-native';

type Status = {
  running: boolean;
  blocklistSize: number;
  mode?: 'full-tunnel' | 'dns-only';
};

type NativeModuleShape = {
  enable(): Promise<boolean>;
  disable(): Promise<boolean>;
  applyBlocklist(domains: string[]): Promise<boolean>;
  status(): Promise<Status>;
  openPrivateDnsSettings?(): Promise<boolean>;
  openSystemSettings?(): Promise<boolean>;
  authorizationStatus?(): Promise<'approved'|'denied'|'notDetermined'|'unknown'|'unavailable'>;
};

const LINKING_ERROR =
  "CraveOffProtection native module not found. Ensure you've run `npx expo prebuild` with the plugin, and built a dev client via EAS.";

const Native: NativeModuleShape | undefined =
  (Platform.OS === 'android' || Platform.OS === 'ios')
    ? (NativeModules.CraveOffProtection as NativeModuleShape)
    : undefined;

const emitter = Platform.OS === 'android' ? new NativeEventEmitter(NativeModules.CraveOffProtection) : undefined;

export const CraveOffProtection = {
  enable: async (): Promise<boolean> => {
    if (!Native) throw new Error(LINKING_ERROR);
    return Native.enable();
  },
  authorizationStatus: async (): Promise<'approved'|'denied'|'notDetermined'|'unknown'|'unavailable'> => {
    if (!Native || !Native.authorizationStatus) return 'unavailable';
    return Native.authorizationStatus();
  },
  disable: async (): Promise<boolean> => {
    if (!Native) throw new Error(LINKING_ERROR);
    return Native.disable();
  },
  applyBlocklist: async (domains: string[]): Promise<boolean> => {
    if (!Native) throw new Error(LINKING_ERROR);
    return Native.applyBlocklist(domains);
  },
  status: async (): Promise<Status> => {
    if (!Native) throw new Error(LINKING_ERROR);
    return Native.status();
  },
  openPrivateDnsSettings: async (): Promise<boolean> => {
    if (!Native || !Native.openPrivateDnsSettings) return false;
    return Native.openPrivateDnsSettings();
  },
  openSystemSettings: async (): Promise<boolean> => {
    if (!Native || !Native.openSystemSettings) return false;
    return Native.openSystemSettings();
  },
  addListener: (cb: (evt: { type: string }) => void): EmitterSubscription | undefined => {
    if (!emitter) return undefined;
    return emitter.addListener('CraveOffProtectionEvent', cb);
  },
  removeAllListeners: (): void => {
    emitter?.removeAllListeners('CraveOffProtectionEvent');
  },
  testResolve: async (qname: string): Promise<'BLOCKED'|'SAFESEARCH'|'FORWARDED'> => {
    if (!Native) throw new Error(LINKING_ERROR);
    // Only available in debug; in release it will throw
    // @ts-expect-error - method exists in debug builds
    return Native.testResolve(qname);
  }
};

export default CraveOffProtection;


