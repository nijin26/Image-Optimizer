 //handle setupevents as quickly as possible
 const setupEvents = require('./installers/setupEvents')
 if (setupEvents.handleSquirrelEvent()) {
    // squirrel event handled and app will exit in 1000ms, so don't do anything else
    return;
 }

const path = require('path')
const os = require('os')
const { app, BrowserWindow, Menu, ipcMain, shell} = require("electron");
const imagemin = require('imagemin')
const imageminMozJpeg = require('imagemin-mozjpeg')
const imageminPngquant = require('imagemin-pngquant')
const slash = require('slash')
const log = require('electron-log')


process.env.NODE_ENV = 'dev'

const isDev = process.env.NODE_ENV !== 'production' ? true : false
const isMac = process.platform === 'darwin' ? true : false

let mainWindow;
let aboutWindow;

const createMainWindow = () => {
  mainWindow = new BrowserWindow({
    title: "Image Shrink",
    width: 500,
    height:650,
    icon:`${__dirname}/assets/icons/Icon_256x256.png`,
    resizable: isDev,
    webPreferences:{
        nodeIntegration: true
    }
  });

  mainWindow.loadFile(`${__dirname}/app/index.html`);
};

const createAboutWindow = () => {
    aboutWindow = new BrowserWindow({
      title: "Image Shrink",
      width: 400,
      height:550,
      icon:`${__dirname}/assets/icons/Icon_256x256.png`,
      resizable: false,
    });
  
    aboutWindow.loadFile(`${__dirname}/app/about.html`);
  };

app.on("ready", () => {
    createMainWindow()

    const mainMenu = Menu.buildFromTemplate(menu)
    Menu.setApplicationMenu(mainMenu)
    mainWindow.on('closed', () => mainWindow = null)

    // globalShortcut.register('CmdOrCtrl+R', () => mainWindow.reload())
    // globalShortcut.register(isMac ? 'Command+Alt+I' : 'Ctrl+Shift+I', () => mainWindow.toggleDevTools())

});

const menu = [

    ...(isMac ? [{
        label: app.name,
        click: createAboutWindow
    
    }] : []),

    {
        label: "File",
        submenu: [
            {
                label: 'Quit',
                // accelerator: isMac ? 'Command+W' : "Ctrl+W",
                accelerator: 'CmdOrCtrl+W',
                click: () => app.quit()
            }
        ]
    },
    ...(!isMac ? [{
        label:'About',
        click: () => createAboutWindow()
    }] : []),
    
    ...(isDev ? [{
        label:'Developer',
        submenu:[
            {role:'reload'},
            {role:'forcereload'},
            {type:'separator'},
            {role:'toggledevtools'},
        ]
    }] : [])
]

ipcMain.on('image:minimize', (e, options) => {
     options.dest = path.join(os.homedir(),'Image_Optimizer')
     optimizeImage(options)
})

async function optimizeImage({imgPath,quality,dest}) {
try{

    const pngQuality = quality/100

    const files = await imagemin([slash(imgPath)], {
        destination: dest,
        plugins: [
            imageminMozJpeg({quality}),
            imageminPngquant({
                quality:[pngQuality,pngQuality]
            })
        ]
    })
    log.info(files)
    shell.openPath(dest)

    mainWindow.webContents.send('image:done')
} catch(e){
  
    log.error(err)
}
}

app.on('window-all-closed', () => {
    if(!isMac) {
        app.quit()
    }
})

app.on('activate', () => {
    if(BrowserWindow.getAllWindows().length === 0) {
        createMainWindow()
    }
})