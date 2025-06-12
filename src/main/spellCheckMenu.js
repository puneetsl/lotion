const log = require('electron-log').scope('SpellCheckMenu');
const reduxStore = require('./store/store');
const Store = require('electron-store');

const localStore = new Store();
const DICTIONARIES = [
  { code: 'en-US', label: 'English (US)' },
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'de-DE', label: 'German' },
  { code: 'fr-FR', label: 'French' },
  { code: 'es-ES', label: 'Spanish' },
  { code: 'pt-BR', label: 'Portuguese (Brazil)' },
  { code: 'ru-RU', label: 'Russian' }
];

function setSpellCheckDictionaries(dictionaries, appController) {
  reduxStore.dispatch({ type: 'app/setDictionaries', payload: dictionaries });
  localStore.set('spellCheckDictionaries', dictionaries);
  log.info(`Spell check dictionaries set to: ${dictionaries.join(', ')}`);
  // Update all open windows (just in case)
  const allWindows = appController.windowControllers;
  if (allWindows && typeof allWindows.forEach === 'function') {
    allWindows.forEach((wc) => {
      const win = wc.getInternalBrowserWindow && wc.getInternalBrowserWindow();
      if (win && win.webContents && win.webContents.session) {
        win.webContents.session.setSpellCheckerLanguages(dictionaries);
      }
    });
  }
}

function toggleSpellCheckDictionary(lang, appController) {
  let current = reduxStore.getState().app.dictionaries;
  let next;
  if (current.includes(lang)) {
    next = current.filter(l => l !== lang);
    if (next.length === 0) next = ['en-US']; // Always keep at least one
  } else {
    next = [...current, lang];
  }
  setSpellCheckDictionaries(next, appController);
}

function getSpellCheckMenu(appController) {
  const selected = reduxStore.getState().app.dictionaries;
  return {
    label: 'Spell Check Dictionary',
    submenu: DICTIONARIES.map(dict => ({
      label: dict.label,
      type: 'checkbox',
      checked: selected.includes(dict.code),
      click: () => toggleSpellCheckDictionary(dict.code, appController)
    }))
  };
}

module.exports = {
  getSpellCheckMenu,
  setSpellCheckDictionaries,
  toggleSpellCheckDictionary,
  DICTIONARIES
};
