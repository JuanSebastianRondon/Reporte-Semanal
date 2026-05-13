import { activeWindow } from 'active-win';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, 'data.json');

function loadData() {
  if (fs.existsSync(DATA_FILE)) {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  }
  return { apps: {}, totalSeconds: 0 };
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

async function track() {
  console.log(' Tracker iniciado...');

  setInterval(async () => {
    const win = await activeWindow();
    if (!win) return;

    const data = loadData();
    const appName = win.owner.name;

    if (!data.apps[appName]) {
      data.apps[appName] = 0;
    }

    data.apps[appName] += 5;
    data.totalSeconds += 5;

    saveData(data);
    console.log(` ${appName} → ${Math.round(data.apps[appName] / 60)} min`);
  }, 5000);
}

track();