import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Responsive Design & Mobile-First Audit Suite', () => {
  const rootDir = process.cwd();

  describe('Tailwind Breakpoint Tokens & CSS Utilities', () => {
    it('should define extended responsive breakpoints including xs, 2xl, and 3xl in tailwind.config.js', () => {
      const configPath = path.join(rootDir, 'tailwind.config.js');
      expect(fs.existsSync(configPath)).toBe(true);
      const content = fs.readFileSync(configPath, 'utf8');

      expect(content).toContain("'xs': '375px'");
      expect(content).toContain("'2xl': '1440px'");
      expect(content).toContain("'3xl': '1920px'");
    });

    it('should include mobile touch target helpers and no-scrollbar utilities in globals.css', () => {
      const cssPath = path.join(rootDir, 'app', 'globals.css');
      expect(fs.existsSync(cssPath)).toBe(true);
      const content = fs.readFileSync(cssPath, 'utf8');

      expect(content).toContain('.touch-target');
      expect(content).toContain('min-height: 44px');
      expect(content).toContain('min-width: 44px');
      expect(content).toContain('.no-scrollbar');
      expect(content).toContain('-webkit-tap-highlight-color: transparent');
    });
  });

  describe('Responsive Header & Mobile Navigation Drawer', () => {
    it('should provide a mobile hamburger toggle button and slide-out drawer in Header.tsx', () => {
      const headerPath = path.join(rootDir, 'components', 'ui', 'Header.tsx');
      expect(fs.existsSync(headerPath)).toBe(true);
      const content = fs.readFileSync(headerPath, 'utf8');

      // Hamburger button with touch target
      expect(content).toContain('lg:hidden');
      expect(content).toContain('min-w-[44px] min-h-[44px]');
      expect(content).toContain('aria-label');
      expect(content).toContain('setIsMobileMenuOpen');

      // Slide-out drawer with backdrop blur and scroll lock
      expect(content).toContain('fixed inset-0 z-50 lg:hidden');
      expect(content).toContain('document.body.style.overflow = \'hidden\'');

      // Embedded drawer features: City selector, Persona switcher, Role portals
      expect(content).toContain('Operational Portals');
      expect(content).toContain('Switch Demo Persona');
      expect(content).toContain('Municipal Jurisdiction City');
    });
  });

  describe('Interactive OpenStreetMap Components Responsiveness', () => {
    it('should support mobile view mode switching, responsive height, and mobile preview cards in CivicMap.tsx', () => {
      const mapPath = path.join(rootDir, 'components', 'map', 'CivicMap.tsx');
      expect(fs.existsSync(mapPath)).toBe(true);
      const content = fs.readFileSync(mapPath, 'utf8');

      // View mode switcher accessible on mobile
      expect(content).toContain("setViewMode('map')");
      expect(content).toContain("setViewMode('list')");

      // Responsive layout: flex-col on mobile, md:flex-row on desktop
      expect(content).toContain('flex flex-col md:flex-row overflow-hidden');

      // Responsive map canvas min-height
      expect(content).toContain('min-h-[350px] sm:min-h-[420px] md:min-h-[480px]');

      // Floating preview card with responsive mobile bounds and scroll
      expect(content).toContain('bottom-2 left-2 right-2 sm:bottom-4 sm:left-auto sm:right-4 sm:w-96');
      expect(content).toContain('max-h-[75vh] overflow-y-auto');
    });

    it('should provide responsive touch controls with comfortable hit areas in MapControls.tsx', () => {
      const controlsPath = path.join(rootDir, 'components', 'map', 'MapControls.tsx');
      expect(fs.existsSync(controlsPath)).toBe(true);
      const content = fs.readFileSync(controlsPath, 'utf8');

      expect(content).toContain('min-w-[38px] min-h-[38px]');
      expect(content).toContain('p-2.5 sm:p-2');
    });

    it('should provide responsive coordinates confirmation, GPS buttons, and fluid height in LocationPicker.tsx', () => {
      const pickerPath = path.join(rootDir, 'components', 'map', 'LocationPicker.tsx');
      expect(fs.existsSync(pickerPath)).toBe(true);
      const content = fs.readFileSync(pickerPath, 'utf8');

      // Responsive map canvas
      expect(content).toContain('h-[340px] sm:h-[420px]');

      // Full-width confirmation button on mobile with 44px touch target
      expect(content).toContain('w-full md:w-auto min-h-[44px]');
      expect(content).toContain('break-words line-clamp-2');
    });
  });

  describe('Role-Based Dashboards Mobile Usability', () => {
    it('Field Worker Dashboard should have touch-friendly task cards, dispatch map, and completion modal', () => {
      const workerPath = path.join(rootDir, 'app', 'worker', 'dashboard', 'page.tsx');
      expect(fs.existsSync(workerPath)).toBe(true);
      const content = fs.readFileSync(workerPath, 'utf8');

      expect(content).toContain('min-h-[44px]');
      expect(content).toContain('h-[400px] sm:h-[500px] lg:h-[600px]');
      expect(content).toContain('flex flex-col xs:flex-row xs:items-center justify-between');
      expect(content).toContain('max-h-[90vh] overflow-y-auto');
    });

    it('Citizen Dashboard should feature horizontal scrollable tabs and responsive card actions', () => {
      const citizenPath = path.join(rootDir, 'app', 'citizen', 'dashboard', 'page.tsx');
      expect(fs.existsSync(citizenPath)).toBe(true);
      const content = fs.readFileSync(citizenPath, 'utf8');

      expect(content).toContain('overflow-x-auto no-scrollbar');
      expect(content).toContain('w-full sm:w-auto min-h-[44px]');
      expect(content).toContain('h-[400px] sm:h-[500px] lg:h-[600px]');
    });

    it('Agency Officer Dashboard should feature scrollable tabs, stacked action buttons, and responsive merge actions', () => {
      const officerPath = path.join(rootDir, 'app', 'officer', 'dashboard', 'page.tsx');
      expect(fs.existsSync(officerPath)).toBe(true);
      const content = fs.readFileSync(officerPath, 'utf8');

      expect(content).toContain('overflow-x-auto no-scrollbar');
      expect(content).toContain('min-h-[44px]');
      expect(content).toContain('h-[400px] sm:h-[500px] lg:h-[600px]');
    });

    it('Supervisor Oversight Dashboard should feature a 2-col to 4-col KPI grid and responsive review modal', () => {
      const oversightPath = path.join(rootDir, 'app', 'oversight', 'dashboard', 'page.tsx');
      expect(fs.existsSync(oversightPath)).toBe(true);
      const content = fs.readFileSync(oversightPath, 'utf8');

      expect(content).toContain('grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6');
      expect(content).toContain('min-h-[44px]');
      expect(content).toContain('h-[400px] sm:h-[500px] lg:h-[600px]');
    });

    it('Admin Dashboard should feature scrollable tabs, 2-col overview grid, and responsive maps', () => {
      const adminPath = path.join(rootDir, 'app', 'admin', 'page.tsx');
      expect(fs.existsSync(adminPath)).toBe(true);
      const content = fs.readFileSync(adminPath, 'utf8');

      expect(content).toContain('overflow-x-auto no-scrollbar');
      expect(content).toContain('grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4');
      expect(content).toContain('h-[400px] sm:h-[520px] lg:h-[650px]');
      expect(content).toContain('w-full sm:w-auto');
      expect(content).toContain('min-h-[44px]');
    });
  });

  describe('Innovation & Public Modules Responsiveness', () => {
    it('Evidence Review Modal should stack photos vertically on mobile with responsive touch actions', () => {
      const modalPath = path.join(rootDir, 'components', 'verification', 'EvidenceReviewModal.tsx');
      expect(fs.existsSync(modalPath)).toBe(true);
      const content = fs.readFileSync(modalPath, 'utf8');

      expect(content).toContain('h-48 sm:h-64');
      expect(content).toContain('min-h-[44px]');
      expect(content).toContain('flex flex-col sm:flex-row items-stretch sm:items-center justify-between');
    });

    it('Infrastructure Failure DNA Profile should have a responsive 5 KPI grid and fluid map height', () => {
      const profilePath = path.join(rootDir, 'app', 'infrastructure', '[id]', 'page.tsx');
      expect(fs.existsSync(profilePath)).toBe(true);
      const content = fs.readFileSync(profilePath, 'utf8');

      expect(content).toContain('grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4');
      expect(content).toContain('h-[320px] sm:h-[380px]');
    });

    it('MultiStepReportForm wizard should provide responsive step navigation on mobile devices', () => {
      const formPath = path.join(rootDir, 'components', 'reporting', 'MultiStepReportForm.tsx');
      expect(fs.existsSync(formPath)).toBe(true);
      const content = fs.readFileSync(formPath, 'utf8');

      expect(content).toContain('min-h-[44px]');
      expect(content).toContain('flex flex-col-reverse xs:flex-row items-stretch xs:items-center justify-between');
    });
  });
});
