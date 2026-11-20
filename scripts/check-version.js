#!/usr/bin/env node
/**
 * Verifica que el tag vX.Y.Z coincide con las versiones declaradas en
 * package.json y en el instalador de Inno Setup.
 * Se usa desde el workflow de release antes de publicar nada.
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const tag = process.argv[2] || process.env.GITHUB_REF_NAME || '';
const match = /^v(\d+\.\d+\.\d+)$/.exec(tag);

if (!match) {
  console.error(`Tag inválido: "${tag || '(vacío)'}". El formato debe ser vX.Y.Z (ej. v2.0.1).`);
  process.exit(1);
}

const version = match[1];
const errors = [];

function read(relativePath) {
  try {
    return fs.readFileSync(path.join(root, relativePath), 'utf-8');
  } catch (err) {
    errors.push(`No se pudo leer ${relativePath}: ${err.message}`);
    return '';
  }
}

let packageVersion = null;
try {
  packageVersion = JSON.parse(read('package.json')).version;
} catch (err) {
  errors.push(`package.json inválido: ${err.message}`);
}
if (packageVersion !== version) {
  errors.push(`package.json tiene ${packageVersion}, se esperaba ${version}.`);
}

const installer = read(path.join('packaging', 'windows', 'instalador.iss'));
function installerValue(key) {
  const found = new RegExp(`^${key}=(.+)$`, 'm').exec(installer);
  return found ? found[1].trim() : null;
}

const expectedInstallerValues = [
  ['AppVersion', version],
  ['VersionInfoProductVersion', version],
  ['VersionInfoVersion', `${version}.0`],
];
for (const [key, expected] of expectedInstallerValues) {
  const actual = installerValue(key);
  if (actual !== expected) {
    errors.push(`instalador.iss: ${key}=${actual || '(ausente)'}, se esperaba ${expected}.`);
  }
}

const windowsProjects = [
  path.join('clients', 'windows', 'launcher', 'ReporteLauncher.csproj'),
  path.join('clients', 'windows', 'tray', 'ReporteTray.csproj'),
  path.join('clients', 'windows', 'configuracion', 'ReporteConfiguracion.csproj'),
  path.join('clients', 'windows', 'control', 'ReporteControl.csproj'),
];
for (const project of windowsProjects) {
  const content = read(project);
  const found = /<Version>([^<]+)<\/Version>/.exec(content);
  const actual = found ? found[1].trim() : null;
  if (actual !== version) {
    errors.push(`${project}: <Version>${actual || '(ausente)'}</Version>, se esperaba ${version}.`);
  }
}

if (errors.length) {
  console.error('Validación de versión fallida:');
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log(`Versión ${version} consistente en tag, package.json e instalador.`);
