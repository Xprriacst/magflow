const { app, BrowserWindow } = require('electron');
console.log('app:', typeof app);
console.log('BrowserWindow:', typeof BrowserWindow);

if (app) {
  app.whenReady().then(() => {
    console.log('Electron ready!');
    const win = new BrowserWindow({ width: 400, height: 300 });
    win.loadURL('data:text/html,<h1>Hello Electron!</h1>');
  });
}
