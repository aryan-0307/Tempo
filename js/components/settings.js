/**
 * Settings & Theme Management Component Module
 * Manages user profile customization, preferences persistence, and 10 handcrafted themes
 */

import { $, on } from '../utils/dom.js';
import { toast } from './toast.js';
import { api } from '../services/api.js';

export const THEMES = [
  {
    id: 'carbon-teal',
    name: 'Carbon & Sage Teal',
    desc: 'Soft graphite surfaces with muted sage teal accents (Default)'
  },
  {
    id: 'midnight-navy',
    name: 'Midnight Navy',
    desc: 'Deep oceanic navy with crisp electric cyan highlights'
  },
  {
    id: 'obsidian-amber',
    name: 'Obsidian Amber',
    desc: 'Dark charcoal canvas with warm radiant amber'
  },
  {
    id: 'forest-emerald',
    name: 'Forest Emerald',
    desc: 'Botanical moss surfaces with vibrant emerald focus'
  },
  {
    id: 'nordic-frost',
    name: 'Nordic Frost',
    desc: 'Cool arctic slate with ice glacier blue accents'
  },
  {
    id: 'sunset-crimson',
    name: 'Sunset Crimson',
    desc: 'Deep plum and twilight graphite with coral rose highlights'
  },
  {
    id: 'cyberpunk-violet',
    name: 'Cyberpunk Violet',
    desc: 'Ultra-deep violet canvas with neon electric purple'
  },
  {
    id: 'monochrome-slate',
    name: 'Monochrome Slate',
    desc: 'Minimalist high-contrast dark graphite with platinum silver'
  },
  {
    id: 'warm-sepia',
    name: 'Warm Sepia',
    desc: 'Roasted espresso tones with caramel and warm cream'
  },
  {
    id: 'paper-light',
    name: 'Paper Light',
    desc: 'Clean, crisp light workspace with architectural ink accents'
  }
];

export class Settings {
  constructor(state) {
    this.state = state;
    this.sectionEl = $('#settings-section');
    this.welcomeSection = $('.welcome-section');
    this.overviewSection = $('.overview-section');
    this.tasksSection = $('.tasks-section');
    this.mainContainer = document.getElementById('main-content') || $('.app-main');
    this.themeGrid = $('#theme-selector-grid');
    this.profileForm = $('#settings-profile-form');
    this.fullNameInput = $('#settings-fullname-input');
    this.usernameInput = $('#settings-username-input');
    this.emailInput = $('#settings-email-input');
    this.titleInput = $('#settings-title-input');
    this.bioInput = $('#settings-bio-input');
    this.avatarPreview = $('#settings-avatar-preview');
    this.avatarName = $('#settings-avatar-name');
    this.avatarEmail = $('#settings-avatar-email');
    this.resetBtn = $('#settings-profile-reset-btn');

    this.currentTheme = 'carbon-teal';
    try {
      this.currentTheme = localStorage.getItem('tempo_theme') || 'carbon-teal';
    } catch {}
  }

  init() {
    this.applyTheme(this.currentTheme, false);
    this.renderThemeCards();
    this.loadProfile();
    this.bindEvents();

    if (this.state) {
      this.state.subscribe(() => this.handleStateChange());
    }
  }

  bindEvents() {
    if (this.profileForm) {
      on(this.profileForm, 'submit', (e) => {
        e.preventDefault();
        this.saveProfile();
      });
    }

    if (this.resetBtn) {
      on(this.resetBtn, 'click', () => {
        this.loadProfile();
        toast.show('Profile changes discarded.');
      });
    }

    // Dynamic typing preview in avatar & preview card
    if (this.fullNameInput) {
      on(this.fullNameInput, 'input', () => {
        const val = this.fullNameInput.value.trim() || 'User';
        if (this.avatarName) this.avatarName.textContent = val;
        if (this.avatarPreview) {
          const initials = val.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
          this.avatarPreview.textContent = initials || 'U';
        }
      });
    }

    if (this.emailInput) {
      on(this.emailInput, 'input', () => {
        if (this.avatarEmail) this.avatarEmail.textContent = this.emailInput.value.trim() || 'user@tempo.dev';
      });
    }
  }

  handleStateChange() {
    if (!this.state) return;
    const isSettings = this.state.activeView === 'settings';

    if (isSettings) {
      if (this.welcomeSection) this.welcomeSection.setAttribute('hidden', '');
      if (this.overviewSection) this.overviewSection.setAttribute('hidden', '');
      if (this.tasksSection) this.tasksSection.setAttribute('hidden', '');
      if (this.sectionEl) this.sectionEl.removeAttribute('hidden');

      // Scroll immediately to top so settings appears directly without scrolling
      if (this.mainContainer) {
        this.mainContainer.scrollTop = 0;
      }
      window.scrollTo(0, 0);
      if (this.sectionEl && typeof this.sectionEl.scrollIntoView === 'function') {
        this.sectionEl.scrollIntoView({ behavior: 'instant', block: 'start' });
      }
    } else {
      if (this.welcomeSection) this.welcomeSection.removeAttribute('hidden');
      if (this.overviewSection) this.overviewSection.removeAttribute('hidden');
      if (this.tasksSection) this.tasksSection.removeAttribute('hidden');
      if (this.sectionEl) this.sectionEl.setAttribute('hidden', '');

      if (this.mainContainer) {
        this.mainContainer.scrollTop = 0;
      }
      window.scrollTo(0, 0);
    }
  }

  renderThemeCards() {
    if (!this.themeGrid) return;

    this.themeGrid.innerHTML = THEMES.map(t => {
      const isActive = t.id === this.currentTheme;
      return `
        <button type="button" class="theme-card ${isActive ? 'active' : ''}" data-theme-id="${t.id}" role="radio" aria-checked="${isActive}">
          <div class="theme-card-left">
            <div class="theme-swatches" data-theme-preview="${t.id}">
              <span class="theme-swatch swatch-1"></span>
              <span class="theme-swatch swatch-2"></span>
              <span class="theme-swatch swatch-3"></span>
              <span class="theme-swatch swatch-4"></span>
            </div>
            <div class="theme-info">
              <span class="theme-name">${t.name}</span>
              <span class="theme-desc">${t.desc}</span>
            </div>
          </div>
          <span class="theme-badge">Active</span>
        </button>
      `;
    }).join('');

    // Attach click listeners
    const cards = this.themeGrid.querySelectorAll('.theme-card');
    cards.forEach(card => {
      on(card, 'click', () => {
        const themeId = card.getAttribute('data-theme-id');
        if (themeId) {
          this.applyTheme(themeId, true);
        }
      });
    });
  }

  applyTheme(themeId, notifyUser = true) {
    this.currentTheme = themeId;
    document.documentElement.setAttribute('data-theme', themeId);
    try {
      localStorage.setItem('tempo_theme', themeId);
    } catch {}

    // Update active state in UI
    if (this.themeGrid) {
      const cards = this.themeGrid.querySelectorAll('.theme-card');
      cards.forEach(card => {
        const id = card.getAttribute('data-theme-id');
        const isActive = id === themeId;
        card.classList.toggle('active', isActive);
        card.setAttribute('aria-checked', isActive.toString());
      });
    }

    if (notifyUser) {
      const themeObj = THEMES.find(t => t.id === themeId);
      const name = themeObj ? themeObj.name : themeId;
      toast.show(`Applied theme: ${name}`);
    }
  }

  loadProfile() {
    let profile = null;
    try {
      const saved = localStorage.getItem('tempo_user_profile');
      if (saved) profile = JSON.parse(saved);
    } catch {}

    if (!profile) {
      profile = {
        fullName: 'Alex Morgan',
        username: 'alexmorgan',
        email: 'alex@tempo.dev',
        title: 'Product Designer',
        bio: 'Focusing on minimal productivity interfaces and design systems.'
      };
    }

    this.setProfileInputs(profile);

    api.getMe().then(user => {
      if (user) {
        profile.fullName = user.fullName || profile.fullName;
        profile.username = user.username || profile.username;
        profile.email = user.email || profile.email;
        this.setProfileInputs(profile);
      }
    }).catch(() => {});
  }

  setProfileInputs(profile) {
    if (this.fullNameInput) this.fullNameInput.value = profile.fullName || '';
    if (this.usernameInput) this.usernameInput.value = profile.username || '';
    if (this.emailInput) this.emailInput.value = profile.email || '';
    if (this.titleInput) this.titleInput.value = profile.title || '';
    if (this.bioInput) this.bioInput.value = profile.bio || '';

    if (this.avatarName) this.avatarName.textContent = profile.fullName || 'User';
    if (this.avatarEmail) this.avatarEmail.textContent = profile.email || 'user@tempo.dev';
    if (this.avatarPreview) {
      const initials = (profile.fullName || 'U')
        .split(' ')
        .map(p => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
      this.avatarPreview.textContent = initials || 'U';
    }
  }

  saveProfile() {
    const fullName = this.fullNameInput?.value.trim() || 'Alex Morgan';
    const username = this.usernameInput?.value.trim() || 'alexmorgan';
    const email = this.emailInput?.value.trim() || 'alex@tempo.dev';
    const title = this.titleInput?.value.trim() || 'Product Designer';
    const bio = this.bioInput?.value.trim() || '';

    const profile = { fullName, username, email, title, bio };

    try {
      localStorage.setItem('tempo_user_profile', JSON.stringify(profile));
    } catch {}

    // Update sidebar user presentation
    const sidebarName = $('#sidebar-user-name');
    const sidebarRole = $('#sidebar-user-role');
    const sidebarAvatar = $('#sidebar-user-avatar');

    if (sidebarName) sidebarName.textContent = fullName;
    if (sidebarRole) sidebarRole.textContent = email;
    if (sidebarAvatar) {
      const initials = fullName.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
      sidebarAvatar.textContent = initials || 'U';
    }

    toast.show('Profile settings saved successfully!');
  }
}

