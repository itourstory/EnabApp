import { app, ipcMain, protocol  } from 'electron'
const { autoUpdater } = require('electron-updater');

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') app.quit()
})

// Load here all startup windows
require('./mainWindow')

protocol.registerSchemesAsPrivileged([{
  scheme: 'app',
  privileges: {
      standard: true,
      secure: false,
  }
}]);

ipcMain.on('app_version', (event) => {
  event.sender.send('app_version', { version: app.getVersion() });
});

ipcMain.on('restart_app', () => {
  autoUpdater.quitAndInstall();
});




