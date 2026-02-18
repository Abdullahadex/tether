self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {
    title: "Tether",
    body: "Your partner sent a nudge! ❤️",
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = {
        title: parsed?.title ?? data.title,
        body: parsed?.body ?? data.body,
      };
    } catch {
      const textBody = event.data.text();
      if (textBody) data.body = textBody;
    }
  }

  const options = {
    body: data.body,
    tag: "nudge",
    renotify: true,
    vibrate: [200, 100, 200],
    data: { url: "/" },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow("/");
    }),
  );
});
