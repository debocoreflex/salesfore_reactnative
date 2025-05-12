// SmartStoreObserver.ts
import { smartstore } from 'react-native-force';
import mitt, { Emitter } from 'mitt';
type Events = {
  users_updated: void;
};

const SmartStoreEvents: Emitter<Events> = mitt<Events>();


const SOUP_NAME = 'Users';
const EVENT_KEY = 'users_updated';

export const SmartStoreObserver = {
  EVENT_KEY,

  upsert: (entries: any[]) => {
    smartstore.upsertSoupEntries(
      true,
      SOUP_NAME,
      entries,
      () => SmartStoreEvents.emit(EVENT_KEY),
      (e) => console.error('SmartStore upsert error', e)
    );
  },

  remove: (entryIds: string[]) => {
    smartstore.removeFromSoup(
      true,
      SOUP_NAME,
      entryIds,
      () => SmartStoreEvents.emit(EVENT_KEY),
      (e) => console.error('SmartStore delete error', e)
    );
  },

  subscribe: (listener: () => void) => {
    SmartStoreEvents.on(EVENT_KEY, listener);
    return () => SmartStoreEvents.off(EVENT_KEY, listener);
  },
};
