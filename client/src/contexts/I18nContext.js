import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';

const dictionaries = {
  pl: {
    common: {
      appName: 'Ofertownik',
      loading: 'Ładowanie...'
    },
    nav: {
      dashboard: 'Dashboard',
      projects: 'Projekty',
      portfolio: 'Portfolio',
      employees: 'Pracownicy',
      logout: 'Wyloguj'
    },
    layout: {
      tagline: 'Przegląd i zarządzanie ofertami',
      languageTitle: 'Język ofert'
    },
    dashboard: {
      header: 'Dashboard',
      subheader: 'Przegląd projektów i statystyk',
      allProjects: 'Wszystkie projekty',
      activeProjects: 'Aktywne projekty',
      projectsValue: 'Wartość projektów',
      offersGenerated: 'Oferty wygenerowane',
      quickActions: 'Szybkie akcje',
      actionNew: 'Nowy projekt',
      actionNewDesc: 'Utwórz nowy projekt i ofertę',
      actionBrowse: 'Przeglądaj projekty',
      actionBrowseDesc: 'Zobacz wszystkie projekty',
      actionPortfolio: 'Zarządzaj portfolio',
      actionPortfolioDesc: 'Edytuj portfolio projektów',
      recentActivity: 'Ostatnia aktywność',
      welcome: 'Witamy w Ofertowniku!',
      getStarted: 'Rozpocznij pracę z systemem zarządzania ofertami',
      now: 'Teraz'
    },
    projects: {
      header: 'Projekty',
      subheader: 'Zarządzaj projektami i ofertami',
      searchLabel: 'Wyszukaj',
      searchPlaceholder: 'Nazwa projektu, klient...',
      statusLabel: 'Status',
      offerTypeLabel: 'Typ oferty',
      allOption: 'Wszystkie',
      clearFilters: 'Wyczyść filtry',
      newProject: 'Nowy projekt',
      status: {
        draft: 'Szkic',
        active: 'Aktywny',
        accepted: 'Zaakceptowany',
        completed: 'Zakończony',
        cancelled: 'Anulowany'
      },
      emptyTitle: 'Brak projektów',
      emptyHintFiltered: 'Spróbuj zmienić filtry wyszukiwania.',
      emptyHint: 'Rozpocznij od utworzenia pierwszego projektu.',
      createFirst: 'Utwórz projekt',
      shownCount: 'Pokazano {{start}} do {{end}} z {{total}} wyników',
      prev: 'Poprzednia',
      next: 'Następna'
    }
  },
  en: {
    common: {
      appName: 'Offer Manager',
      loading: 'Loading...'
    },
    nav: {
      dashboard: 'Dashboard',
      projects: 'Projects',
      portfolio: 'Portfolio',
      employees: 'Employees',
      logout: 'Log out'
    },
    layout: {
      tagline: 'Overview and offer management',
      languageTitle: 'Offer language'
    },
    dashboard: {
      header: 'Dashboard',
      subheader: 'Overview of projects and stats',
      allProjects: 'All projects',
      activeProjects: 'Active projects',
      projectsValue: 'Projects value',
      offersGenerated: 'Offers generated',
      quickActions: 'Quick actions',
      actionNew: 'New project',
      actionNewDesc: 'Create a new project and offer',
      actionBrowse: 'Browse projects',
      actionBrowseDesc: 'See all projects',
      actionPortfolio: 'Manage portfolio',
      actionPortfolioDesc: 'Edit project portfolio',
      recentActivity: 'Recent activity',
      welcome: 'Welcome to Offer Manager!',
      getStarted: 'Get started managing your offers',
      now: 'Now'
    },
    projects: {
      header: 'Projects',
      subheader: 'Manage projects and offers',
      searchLabel: 'Search',
      searchPlaceholder: 'Project name, client...',
      statusLabel: 'Status',
      offerTypeLabel: 'Offer type',
      allOption: 'All',
      clearFilters: 'Clear filters',
      newProject: 'New project',
      status: {
        draft: 'Draft',
        active: 'Active',
        accepted: 'Accepted',
        completed: 'Completed',
        cancelled: 'Cancelled'
      },
      emptyTitle: 'No projects',
      emptyHintFiltered: 'Try adjusting your filters.',
      emptyHint: 'Start by creating your first project.',
      createFirst: 'Create project',
      shownCount: 'Showing {{start}} to {{end}} of {{total}} results',
      prev: 'Previous',
      next: 'Next'
    }
  }
};

const I18nContext = createContext({ lang: 'pl', setLang: () => {}, t: (k) => k });

export const I18nProvider = ({ children }) => {
  const [lang, setLang] = useState(() => localStorage.getItem('ofertownik_lang') || 'pl');

  useEffect(() => {
    localStorage.setItem('ofertownik_lang', lang);
  }, [lang]);

  const t = useMemo(() => {
    const dict = dictionaries[lang] || dictionaries.pl;
    return (key) => {
      if (!key) return '';
      const parts = key.split('.');
      let cur = dict;
      for (const p of parts) {
        if (cur && Object.prototype.hasOwnProperty.call(cur, p)) {
          cur = cur[p];
        } else {
          return key;
        }
      }
      return typeof cur === 'string' ? cur : key;
    };
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, t]);
  return (
    <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);


