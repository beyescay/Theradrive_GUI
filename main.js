const electron = require('electron');
const app = electron.app;  // Module to control application life.
const BrowserWindow = electron.BrowserWindow;  // Module to create native browser window.
var serialport = require("serialport");
var SerialPort = serialport.SerialPort;
var theradrivePortName = process.argv[2];

// Serial port setup
var theradrivePort = null;
var theradrivePortOpen = false;

// Path setup

var X1 = Math.random();
var X2 = Math.random();
var X3 = Math.random();
var X4 = Math.random();

var t = 0;
var dt = 0.005;
var k = 2;
var a = 0.5;
var b =57.32;

var trajDim = 1;
var update_ms = 7;

// TODO: fix process error on window close!
var timerHandle = null;

function update_traj(k, a) {
  if (t<2.5){
     var val = b*0.004*a * (Math.sin(a*t+2*Math.PI*X1)+Math.sin(2*a*t+2*Math.PI*X2)+Math.sin(3*a*t+2*Math.PI*X3)+Math.sin(4*a*t+2*Math.PI*X4));
  }
  else{
     var val = b*a * (Math.sin(a*t+2*Math.PI*X1)+Math.sin(2*a*t+2*Math.PI*X2)+Math.sin(3*a*t+2*Math.PI*X3)+Math.sin(4*a*t+2*Math.PI*X4));
  }

  t += dt;
  theradrivePort.write(val.toString() + '\n');
  //console.log(val.toString() + '\n');
  if (mainWindow.webContents) {
    mainWindow.webContents.send('new-traj-data', val.toString());
  }

  return;
}

// serial port callbacks
function showPortOpen() {
  theradrivePortOpen = true;
  console.log('port open. Data rate: ' + theradrivePort.options.baudRate);
}

function transmitLatestData(data) {
  //console.log(data);
  if (mainWindow.webContents) {
    mainWindow.webContents.send('cursor', data);
  }
}

function showPortClose() {
  console.log('port closed.');
}

function showError(error) {
  console.log('Serial port error: ' + error);
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow = null;

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  app.quit();
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function() {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 1000, height: 600});
  //mainWindow.maximize();
  mainWindow.setFullScreen(true);

  // and load the index.html of the app.
  mainWindow.loadURL('file://' + __dirname + '/index.html');

  // Open the DevTools.
  //mainWindow.webContents.openDevTools();

  mainWindow.webContents.on('did-finish-load', function() {
    var i;
    for (i=0; i<trajDim; i++) {
      update_traj(k, a);
    }
    mainWindow.webContents.send('ready-to-draw', true);
    setInterval(update_traj, update_ms, k, a);
  });

  // Emitted when the window is closed.
  mainWindow.webContents.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    theradrivePort.close();
    mainWindow = null;
  });

  theradrivePort = new SerialPort(theradrivePortName, {
    baudRate: 115200,
    parser: serialport.parsers.readline("\r\n")
  });

  theradrivePort.on('open', showPortOpen);
  theradrivePort.on('data', transmitLatestData);
  theradrivePort.on('close', showPortClose);
  theradrivePort.on('error', showError);
  console.log('all added')
});
