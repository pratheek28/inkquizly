/* eslint-env serviceworker */

self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    self.skipWaiting();
  });
  
  self.addEventListener('activate', (event) => {
    console.log('Service Worker activated...');
  });
  
  self.addEventListener('push', (event) => {
    const options = {
      body: event.data ? event.data.text() : 'No body content',
      icon: './logo192.png',
      badge: './badge.png',
    };
  
    event.waitUntil(
      self.registration.showNotification('Study Reminder!', options)
    );
  });
  
  self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    // Handle notification click actions here
    event.waitUntil(
      clients.openWindow('https://www.inkquizly.tech') // Open your app or a specific URL
    );
  });
  self.__WB_MANIFEST;
  
