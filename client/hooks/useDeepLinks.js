import { useEffect, useRef } from 'react';
import { Linking } from 'react-native';
import { handleDeepLink } from '../services/deepLinks';

/**
 * Hook to handle deep links inside the app.
 * Pass a NavigationContainerRef (not .current).
 */
const useDeepLinks = (navigationRef) => {
  useEffect(() => {
    const getNav = () => navigationRef?.current;

    const sub = Linking.addEventListener('url', ({ url }) => {
      const nav = getNav();
      if (url && nav) handleDeepLink(url, nav);
    });

    Linking.getInitialURL().then((url) => {
      if (url) {
        setTimeout(() => {
          const nav = getNav();
          if (nav) handleDeepLink(url, nav);
        }, 500);
      }
    });

    return () => sub?.remove();
  }, []);
};

// Keep named export for backward compat
export const useDeepLinkHandler = useDeepLinks;
export default useDeepLinks;
