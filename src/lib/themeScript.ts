/** Script inline exécuté avant la peinture pour appliquer thème et animations sans flash. */
export const PREFS_KEY = 'liratsu:prefs'

export type ThemeMode = 'auto' | 'light' | 'dark'

export const themeInitScript = (defaultTheme: ThemeMode) =>
  `(function(){try{var p=JSON.parse(localStorage.getItem('${PREFS_KEY}')||'{}');var m=p.theme||'${defaultTheme}';var d=m==='dark'||(m==='auto'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light';if(p.motion===false)document.documentElement.dataset.motion='reduce';}catch(e){}})();`
