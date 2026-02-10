const THEME_STORAGE_KEY = 'dtubonge_theme';
const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
const theme = savedTheme || 'teal';
document.documentElement.dataset.theme = theme;
