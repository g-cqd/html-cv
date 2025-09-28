function getBrowserLanguage() {
  const userLang = navigator.language || navigator.userLanguage;
  if (userLang.startsWith("fr")) return "fr";
  if (userLang.startsWith("de")) return "de";
  if (userLang.startsWith("ja")) return "ja";
  return "en";
}
function getQueryLang(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}
function setLanguage() {
  const langs = ["en", "fr", "de", "ja"];
  const lang = getQueryLang("lang") ?? getBrowserLanguage();
  if (langs.includes(lang)) {
    document.documentElement.lang = lang;
  } else {
    document.documentElement.lang = "en";
    document.documentElement.lang = "en";
  }
  if (!("queryLocalFonts" in window) && "webkitSpeechRecognition" in window) {
    document.documentElement.classList.add("safari");
  }

  document.head.innerHTML += ((tag, lang) => {
    let selector = `body [lang]:not([lang="${lang}"])`;
    let rule = "display:none!important;";
    return `<${tag}>` + selector + `{${rule}}` + `</${tag}>`;
  })("style", lang);

  document.body
    .querySelectorAll(`[lang]:not([lang="${lang}"])`)
    .forEach((node) => {
      node.remove();
    });
  for (const language of langs) {
    if (language != lang) {
      [...document.body.getElementsByTagName(language)].forEach((node) => {
        node.remove();
      });
    }
  }
}
document.addEventListener("DOMContentLoaded", setLanguage);
