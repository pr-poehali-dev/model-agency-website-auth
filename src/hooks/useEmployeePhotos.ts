import { useEffect, useState } from 'react';
import funcUrls from '../../backend/func2url.json';

const AUTH_URL = (funcUrls as Record<string, string>)['auth'];

type PhotoMap = Record<string, string>;

let cache: PhotoMap | null = null;
let inflight: Promise<PhotoMap> | null = null;
const subscribers = new Set<(map: PhotoMap) => void>();

const fetchPhotos = (): Promise<PhotoMap> => {
  if (cache) return Promise.resolve(cache);
  if (inflight) return inflight;
  const token = localStorage.getItem('authToken') || '';
  inflight = fetch(AUTH_URL, {
    method: 'GET',
    headers: { 'X-Auth-Token': token },
  })
    .then((r) => (r.ok ? r.json() : []))
    .then((users) => {
      const map: PhotoMap = {};
      if (Array.isArray(users)) {
        for (const u of users) {
          if (u?.email && u?.photoUrl) {
            map[String(u.email).toLowerCase()] = u.photoUrl;
          }
        }
      }
      cache = map;
      subscribers.forEach((s) => s(map));
      return map;
    })
    .catch(() => {
      const empty: PhotoMap = {};
      cache = empty;
      return empty;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
};

export const getEmployeePhoto = (email?: string | null): string | undefined => {
  if (!email || !cache) return undefined;
  return cache[email.toLowerCase()];
};

export const useEmployeePhoto = (email?: string | null): string | undefined => {
  const [photo, setPhoto] = useState<string | undefined>(() => getEmployeePhoto(email));

  useEffect(() => {
    if (!email) {
      setPhoto(undefined);
      return;
    }
    let active = true;
    fetchPhotos().then((map) => {
      if (active) setPhoto(map[email.toLowerCase()]);
    });
    const handler = (map: PhotoMap) => {
      if (active) setPhoto(map[email.toLowerCase()]);
    };
    subscribers.add(handler);
    return () => {
      active = false;
      subscribers.delete(handler);
    };
  }, [email]);

  return photo;
};

export const refreshEmployeePhotos = () => {
  cache = null;
  return fetchPhotos();
};
