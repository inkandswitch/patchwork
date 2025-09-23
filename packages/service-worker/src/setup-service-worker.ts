export default async function setupServiceWorker(): Promise<ServiceWorker> {
  return navigator.serviceWorker
    .register("/service-worker.js")
    .then((registration) => {
      // If the service worker is still installing, we wait until it is activated
      const installing = registration.installing;
      if (installing) {
        console.log("%c spawing new service worker", "color: pink");
        return new Promise((resolve) => {
          installing.onstatechange = (event) => {
            const serviceWorker = event.target as ServiceWorker;
            if (serviceWorker.state === "activated") {
              resolve(serviceWorker);
            }
          };
        });
      }

      // otherwise return the active service worker
      // TODO: JAH strict fix... docs suggest there are more states than just installing and active
      return registration.active!;
    });
}
