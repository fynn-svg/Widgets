// Setzt Icon und Versionsinfos der EXE ohne Wine (reines JavaScript)
const fs = require('fs');
const path = require('path');
module.exports = async (context) => {
  if (context.electronPlatformName !== 'win32') return;
  const ResEdit = await import('resedit');
  const { NtExecutable, NtExecutableResource, Resource, Data } = ResEdit.default || ResEdit;
  const exe = path.join(context.appOutDir, context.packager.appInfo.productFilename + '.exe');
  const exeData = fs.readFileSync(exe);
  const ntExe = NtExecutable.from(exeData, { ignoreCert: true });
  const res = NtExecutableResource.from(ntExe);
  const iconFile = Data.IconFile.from(fs.readFileSync(path.join(__dirname, 'icon.ico')));
  const groups = Resource.IconGroupEntry.fromEntries(res.entries);
  const groupId = groups.length ? groups[0].id : 1;
  const lang = groups.length ? groups[0].lang : 1033;
  Resource.IconGroupEntry.replaceIconsForResource(res.entries, groupId, lang, iconFile.icons.map(i => i.data));
  const vi = Resource.VersionInfo.fromEntries(res.entries)[0];
  if (vi) {
    const l = vi.getAllLanguagesForStringValues()[0] || { lang: 1033, codepage: 1200 };
    vi.setStringValues(l, {
      FileDescription: 'Jafy Widgets', ProductName: 'Jafy Widgets',
      CompanyName: 'Arsenii & Fynn', OriginalFilename: 'Jafy Widgets.exe', InternalName: 'Jafy Widgets',
      LegalCopyright: '',
    });
    const [a, b, c] = String(require('../package.json').version).split('.').map((n) => parseInt(n, 10) || 0);
    vi.setFileVersion(a, b, c, 0, l.lang);
    vi.setProductVersion(a, b, c, 0, l.lang);
    vi.outputToResourceEntries(res.entries);
  }
  res.outputResource(ntExe);
  fs.writeFileSync(exe, Buffer.from(ntExe.generate()));
  console.log('  • icon + version info set via resedit');
};
