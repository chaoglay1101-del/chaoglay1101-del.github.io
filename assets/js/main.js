/* ==========================================================================
   Personal website — interaction layer
   Progressive enhancement only: every page works without JavaScript.
   ========================================================================== */

(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.add("js");

  var STORE_KEY = {
    theme: "personal-site-theme",
    lang: "personal-site-lang"
  };

  var entries = [];
  var warned = {};
  var currentLang = "en";

  function readStore(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function writeStore(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      /* Storage can be unavailable (private mode, file://). Ignore. */
    }
  }

  /* --- Translations ------------------------------------------------------ */

  function dictionary(lang) {
    var packs = window.SITE_I18N || {};
    return packs[lang] || {};
  }

  function lookup(key, lang) {
    var pack = dictionary(lang);
    if (Object.prototype.hasOwnProperty.call(pack, key)) {
      return pack[key];
    }
    if (lang !== "en" && !warned[key]) {
      warned[key] = true;
      if (window.console && console.warn) {
        console.warn("[i18n] missing translation key: " + key);
      }
    }
    return null;
  }

  function collectEntry(element, kind, key, attribute) {
    var original;
    if (kind === "attribute") {
      original = element.getAttribute(attribute);
    } else if (kind === "html") {
      original = element.innerHTML;
    } else {
      original = element.textContent;
    }
    entries.push({
      element: element,
      kind: kind,
      key: key,
      attribute: attribute,
      original: original
    });
  }

  function collectTranslations() {
    var nodes = document.querySelectorAll("[data-i18n], [data-i18n-html], [data-i18n-meta], [data-i18n-attr]");
    Array.prototype.forEach.call(nodes, function (node) {
      var textKey = node.getAttribute("data-i18n");
      var htmlKey = node.getAttribute("data-i18n-html");
      var metaKey = node.getAttribute("data-i18n-meta");
      var attrSpec = node.getAttribute("data-i18n-attr");

      if (textKey) {
        collectEntry(node, "text", textKey);
      }
      if (htmlKey) {
        collectEntry(node, "html", htmlKey);
      }
      if (metaKey) {
        collectEntry(node, "attribute", metaKey, "content");
      }
      if (attrSpec) {
        attrSpec.split(",").forEach(function (pair) {
          var parts = pair.split(":");
          if (parts.length === 2) {
            collectEntry(node, "attribute", parts[1].trim(), parts[0].trim());
          }
        });
      }
    });
  }

  function setEntryValue(entry, value) {
    if (entry.kind === "attribute") {
      entry.element.setAttribute(entry.attribute, value);
    } else if (entry.kind === "html") {
      entry.element.innerHTML = value;
    } else {
      entry.element.textContent = value;
    }
  }

  function applyLanguage(lang, persist) {
    currentLang = lang === "zh" ? "zh" : "en";
    root.setAttribute("lang", currentLang === "zh" ? "zh-Hant-TW" : "en");

    entries.forEach(function (entry) {
      var translated = currentLang === "en" ? null : lookup(entry.key, currentLang);
      setEntryValue(entry, translated === null ? entry.original : translated);
    });

    if (langToggle) {
      var ariaLabel = currentLang === "zh" ? "Switch this page to English" : "將本頁切換為繁體中文";
      langToggle.textContent = currentLang === "zh" ? "EN" : "中文";
      langToggle.setAttribute("lang", currentLang === "zh" ? "en" : "zh-Hant-TW");
      langToggle.setAttribute("aria-label", ariaLabel);
      langToggle.setAttribute("title", ariaLabel);
    }

    // The theme button label is language-dependent as well as theme-dependent.
    setThemeLabel(root.getAttribute("data-theme"));

    if (persist) {
      writeStore(STORE_KEY.lang, currentLang);
    }
  }

  /* --- Theme ------------------------------------------------------------ */

  function systemPrefersDark() {
    return Boolean(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
  }

  /* The theme button describes the theme it switches to, so its label depends on
     both the active theme and the active language. English copy lives in the
     data-label-* attributes, which also serve as the no-JavaScript fallback;
     Chinese comes from the ui.themeDark / ui.themeLight keys in i18n.js. */
  function setThemeLabel(theme) {
    if (!themeToggle) {
      return;
    }
    var isDark = theme === "dark";
    var label = lookup(isDark ? "ui.themeLight" : "ui.themeDark", currentLang);
    if (!label) {
      label = themeToggle.getAttribute(isDark ? "data-label-light" : "data-label-dark");
    }
    if (label) {
      themeToggle.setAttribute("aria-label", label);
      themeToggle.setAttribute("title", label);
    }
  }

  function applyTheme(theme, persist) {
    root.setAttribute("data-theme", theme);
    if (themeToggle) {
      themeToggle.setAttribute("aria-pressed", String(theme === "dark"));
      themeToggle.textContent = theme === "dark" ? "\u2600" : "\u263E";
      setThemeLabel(theme);
    }
    if (persist) {
      writeStore(STORE_KEY.theme, theme);
    }
  }

  /* --- Element hooks ---------------------------------------------------- */

  var themeToggle = document.querySelector("[data-action='toggle-theme']");
  var langToggle = document.querySelector("[data-action='toggle-lang']");
  var navToggle = document.querySelector("[data-action='toggle-nav']");

  collectTranslations();

  var storedTheme = readStore(STORE_KEY.theme);
  var initialTheme = storedTheme === "dark" || storedTheme === "light"
    ? storedTheme
    : (systemPrefersDark() ? "dark" : "light");
  applyTheme(initialTheme, false);

  var storedLang = readStore(STORE_KEY.lang);
  applyLanguage(storedLang === "zh" ? "zh" : "en", false);

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      applyTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark", true);
    });
  }

  if (langToggle) {
    langToggle.addEventListener("click", function () {
      applyLanguage(currentLang === "zh" ? "en" : "zh", true);
    });
  }

  if (navToggle) {
    var primaryNav = document.getElementById(navToggle.getAttribute("aria-controls"));
    navToggle.addEventListener("click", function () {
      var isOpen = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", String(!isOpen));
      if (primaryNav) {
        primaryNav.classList.toggle("is-open", !isOpen);
      }
    });
    if (primaryNav) {
      primaryNav.addEventListener("click", function (event) {
        if (event.target.closest("a")) {
          navToggle.setAttribute("aria-expanded", "false");
          primaryNav.classList.remove("is-open");
        }
      });
    }
  }

  Array.prototype.forEach.call(document.querySelectorAll("[data-action='print']"), function (button) {
    button.addEventListener("click", function () {
      window.print();
    });
  });

  Array.prototype.forEach.call(document.querySelectorAll("[data-current-year]"), function (node) {
    node.textContent = String(new Date().getFullYear());
  });
})();
