/* ============================================================
   LOCATOR FINDER — Content Script v2.0
   Draggable panel, clean architecture, visible log
   ============================================================ */

(() => {
    'use strict';

    // Prevent double-injection
    if (window.__locatorFinderActive) {
        const panel = document.getElementById('__lf-panel');
        if (panel) panel.classList.toggle('__lf-hidden');
        return;
    }
    window.__locatorFinderActive = true;

    // ── Extension ID ──
    const EXT_ID = chrome.runtime?.id || 'unknown';

    /* ═══════════════════════════════════════════════════════════
       1. PANEL HTML
       ═══════════════════════════════════════════════════════════ */

    const PANEL_HTML = `
    <div id="__lf-panel" class="__lf-panel" data-locator-finder>

      <!-- Header / Drag Handle -->
      <div class="__lf-header" id="__lf-drag-handle">
        <div class="__lf-header-left">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <span class="__lf-title">Locator Finder</span>
          <span class="__lf-drag-hint">⠀⠀⠀ drag</span>
          <span class="__lf-resize-hint">Ctrl+Scroll to resize</span>
        </div>
        <div class="__lf-header-right">
          <button id="__lf-btn-theme" class="__lf-icon-btn" title="Toggle theme">🌙</button>
          <button id="__lf-btn-close" class="__lf-icon-btn" title="Close panel">✕</button>
        </div>
      </div>

      <!-- Toolbar -->
      <div class="__lf-toolbar">
        <button id="__lf-btn-inspect" class="__lf-btn __lf-btn-primary">🎯 Inspect</button>
        <button id="__lf-btn-list-all" class="__lf-btn __lf-btn-outline">📃 List All</button>
        <select id="__lf-sel-framework">
          <option value="selenium-java">Selenium (Java)</option>
          <option value="selenium-python">Selenium (Python)</option>
          <option value="selenium-csharp">Selenium (C#)</option>
          <option value="selenium-js">Selenium (JS)</option>
          <option value="playwright-js" selected>Playwright (JS/TS)</option>
          <option value="playwright-python">Playwright (Python)</option>
          <option value="playwright-java">Playwright (Java)</option>
          <option value="cypress">Cypress</option>
          <option value="webdriverio">WebDriverIO</option>
        </select>
      </div>

      <!-- Element Info -->
      <div id="__lf-element-info" class="__lf-section __lf-hidden">
        <div class="__lf-section-label">Selected Element</div>
        <div id="__lf-el-tag" class="__lf-code-block"></div>
        <div id="__lf-el-meta" class="__lf-meta-chips"></div>
      </div>

      <!-- Locator List (single element) -->
      <div id="__lf-locator-section" class="__lf-section __lf-hidden">
        <div class="__lf-section-header">
          <span class="__lf-section-label">Locators</span>
          <span id="__lf-count" class="__lf-badge">0</span>
        </div>
        <div id="__lf-locators" class="__lf-locator-list"></div>
      </div>

      <!-- Scan Results -->
      <div id="__lf-scan-section" class="__lf-section __lf-hidden">
        <div class="__lf-section-header">
          <span class="__lf-section-label">All Page Elements</span>
          <span id="__lf-scan-count" class="__lf-badge">0</span>
        </div>
        <div class="__lf-scan-actions">
          <button id="__lf-scan-copy" class="__lf-btn __lf-btn-outline __lf-btn-sm">📋 Copy All</button>
          <button id="__lf-scan-json" class="__lf-btn __lf-btn-outline __lf-btn-sm">📥 JSON</button>
          <button id="__lf-scan-csv" class="__lf-btn __lf-btn-outline __lf-btn-sm">📥 CSV</button>
          <button id="__lf-scan-close" class="__lf-btn __lf-btn-outline __lf-btn-sm">✕ Close</button>
        </div>
        <div id="__lf-scan-list" class="__lf-scan-list"></div>
      </div>

      <!-- Empty State -->
      <div id="__lf-empty" class="__lf-empty">
        <div style="opacity:0.3;font-size:36px">🎯</div>
        <p>Click <b>Inspect</b> to pick one element,<br>or <b>List All</b> to scan the entire page</p>
        <p style="font-size:11px;opacity:0.5">Shortcut: Alt+Shift+L</p>
        <p style="font-size:10px;opacity:0.35;font-family:'JetBrains Mono',monospace">ID: ${EXT_ID}</p>
      </div>

      <!-- Actions Bar -->
      <div class="__lf-actions">
        <button id="__lf-btn-copy-all" class="__lf-btn __lf-btn-outline" disabled>📋 Copy All</button>
        <div style="flex:1"></div>
        <button id="__lf-btn-export" class="__lf-btn __lf-btn-accent">📥 Export Page</button>
      </div>

      <!-- Log Panel -->
      <div class="__lf-log-section" id="__lf-log-section">
        <div class="__lf-log-header" id="__lf-log-toggle">
          <span class="__lf-log-title">📋 Activity Log</span>
          <button class="__lf-log-clear" id="__lf-log-clear">Clear</button>
        </div>
        <div class="__lf-log-list" id="__lf-log-list"></div>
      </div>

      <!-- Toast -->
      <div id="__lf-toast" class="__lf-toast __lf-hidden"></div>
    </div>
  `;

    // Inject panel
    const wrapper = document.createElement('div');
    wrapper.innerHTML = PANEL_HTML;
    document.body.appendChild(wrapper.firstElementChild);

    /* ═══════════════════════════════════════════════════════════
       2. DOM REFERENCES
       ═══════════════════════════════════════════════════════════ */

    const $ = (id) => document.getElementById(id);

    const panel = $('__lf-panel');
    const dragHandle = $('__lf-drag-handle');
    const btnInspect = $('__lf-btn-inspect');
    const btnListAll = $('__lf-btn-list-all');
    const btnClose = $('__lf-btn-close');
    const btnTheme = $('__lf-btn-theme');
    const btnCopyAll = $('__lf-btn-copy-all');
    const btnExport = $('__lf-btn-export');
    const selFramework = $('__lf-sel-framework');
    const elInfo = $('__lf-element-info');
    const elTag = $('__lf-el-tag');
    const elMeta = $('__lf-el-meta');
    const locatorSection = $('__lf-locator-section');
    const locatorsDiv = $('__lf-locators');
    const locatorCount = $('__lf-count');
    const emptyState = $('__lf-empty');
    const toast = $('__lf-toast');
    const scanSection = $('__lf-scan-section');
    const scanList = $('__lf-scan-list');
    const scanCount = $('__lf-scan-count');
    const logList = $('__lf-log-list');

    /* ═══════════════════════════════════════════════════════════
       3. STATE
       ═══════════════════════════════════════════════════════════ */

    let inspecting = false;
    let hoveredEl = null;
    let selectedEl = null;
    let currentLocators = [];
    let darkMode = true;
    let scanResults = [];

    /* ═══════════════════════════════════════════════════════════
       4. DRAG-TO-MOVE
       ═══════════════════════════════════════════════════════════ */

    let isDragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    function onDragStart(e) {
        // Don't drag if clicking a button
        if (e.target.closest('button')) return;

        isDragging = true;
        const rect = panel.getBoundingClientRect();
        dragOffsetX = e.clientX - rect.left;
        dragOffsetY = e.clientY - rect.top;

        panel.classList.add('__lf-dragging');
        // Remove right/top auto-position and switch to explicit coords
        panel.style.right = 'auto';
        panel.style.bottom = 'auto';
        panel.style.left = rect.left + 'px';
        panel.style.top = rect.top + 'px';

        e.preventDefault();
        log('info', 'Panel drag started');
    }

    function onDragMove(e) {
        if (!isDragging) return;
        e.preventDefault();

        let newX = e.clientX - dragOffsetX;
        let newY = e.clientY - dragOffsetY;

        // Keep panel within viewport
        const w = panel.offsetWidth;
        const h = panel.offsetHeight;
        newX = Math.max(0, Math.min(window.innerWidth - w, newX));
        newY = Math.max(0, Math.min(window.innerHeight - h, newY));

        panel.style.left = newX + 'px';
        panel.style.top = newY + 'px';
    }

    function onDragEnd() {
        if (!isDragging) return;
        isDragging = false;
        panel.classList.remove('__lf-dragging');
    }

    dragHandle.addEventListener('mousedown', onDragStart);
    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', onDragEnd);

    /* ═══════════════════════════════════════════════════════════
       4b. SCROLL-TO-RESIZE
       ═══════════════════════════════════════════════════════════ */

    let currentScale = 1;
    const MIN_SCALE = 0.6;
    const MAX_SCALE = 1.6;
    const SCALE_STEP = 0.05;

    panel.addEventListener('wheel', (e) => {
        // Only resize when Ctrl is held
        if (!e.ctrlKey) return;

        e.preventDefault();
        e.stopPropagation();

        const delta = e.deltaY > 0 ? -SCALE_STEP : SCALE_STEP;
        currentScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, currentScale + delta));

        panel.style.setProperty('--scale', currentScale.toFixed(2));

        const pct = Math.round(currentScale * 100);
        log('info', `Panel size: ${pct}%`);
    }, { passive: false });

    /* ═══════════════════════════════════════════════════════════
       5. LOGGING
       ═══════════════════════════════════════════════════════════ */

    function log(level, msg) {
        const now = new Date();
        const time = now.toLocaleTimeString('en-US', { hour12: false });
        const entry = document.createElement('div');
        entry.className = `__lf-log-entry __lf-log-${level}`;
        entry.innerHTML = `<span class="__lf-log-time">${time}</span>${htmlEsc(msg)}`;
        logList.appendChild(entry);
        logList.scrollTop = logList.scrollHeight;

        // Keep max 50 entries
        while (logList.children.length > 50) {
            logList.removeChild(logList.firstChild);
        }
    }

    $('__lf-log-clear').addEventListener('click', (e) => {
        e.stopPropagation();
        logList.innerHTML = '';
    });

    // Toggle log expansion on header click
    $('__lf-log-toggle').addEventListener('click', (e) => {
        // Ignore if clicking the clear button
        if (e.target.closest('.__lf-log-clear')) return;
        const section = $('__lf-log-section');
        section.classList.toggle('__lf-log-expanded');
    });

    log('info', `Locator Finder v2.0 loaded — ID: ${EXT_ID}`);

    /* ═══════════════════════════════════════════════════════════
       6. LOCATOR GENERATION ENGINE
       ═══════════════════════════════════════════════════════════ */

    function generateLocators(el) {
        if (!el || el.nodeType !== 1) return [];
        const locators = [];
        const tag = el.tagName.toLowerCase();
        const type = el.getAttribute('type') || '';

        // data-testid & friends
        const testAttrs = ['data-testid', 'data-test', 'data-cy', 'data-test-id', 'data-automation-id', 'data-qa'];
        for (const attr of testAttrs) {
            const v = el.getAttribute(attr);
            if (v) locators.push(makeLocator('data-testid', `[${attr}="${v}"]`, el, { selectorAttr: attr, selectorVal: v }));
        }

        // ID
        if (el.id && !el.id.match(/^[0-9]|react|ember|ng-|:r[0-9]/)) {
            const unique = safeQSACount(`#${CSS.escape(el.id)}`) === 1;
            locators.push(makeLocator('id', el.id, el, { unique }));
        }

        // Name
        const nameVal = el.getAttribute('name');
        if (nameVal) {
            const cnt = safeQSACount(`[name="${CSS.escape(nameVal)}"]`);
            locators.push(makeLocator('name', nameVal, el, { matchCount: cnt }));
        }

        // ARIA label
        const ariaLabel = el.getAttribute('aria-label');
        if (ariaLabel) locators.push(makeLocator('aria-label', ariaLabel, el));

        // aria-labelledby
        const labelledBy = el.getAttribute('aria-labelledby');
        if (labelledBy) {
            const labelEl = document.getElementById(labelledBy);
            if (labelEl) locators.push(makeLocator('aria-label', labelEl.textContent.trim(), el));
        }

        // Role
        const role = el.getAttribute('role') || implicitRole(el);
        if (role) locators.push(makeLocator('role', role, el, { text: directText(el) }));

        // Placeholder
        const ph = el.getAttribute('placeholder');
        if (ph) locators.push(makeLocator('placeholder', ph, el));

        // Associated <label>
        if (el.id) {
            const label = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
            if (label?.textContent.trim()) {
                locators.push(makeLocator('aria-label', label.textContent.trim(), el, { viaLabel: true }));
            }
        }

        // CSS (class-based)
        if (el.classList?.length > 0) {
            const classes = [...el.classList].filter(c => !c.startsWith('__lf') && c.length < 60);
            if (classes.length > 0 && classes.length <= 4) {
                const sel = `${tag}.${classes.join('.')}`;
                const cnt = safeQSACount(sel);
                if (cnt > 0) locators.push(makeLocator('css', sel, el, { matchCount: cnt }));
            }
        }

        // CSS (attribute-based)
        for (const attr of ['type', 'placeholder', 'href', 'title', 'value', 'for', 'autocomplete']) {
            const v = el.getAttribute(attr);
            if (v && v.length > 0 && v.length < 100) {
                const sel = `${tag}[${attr}="${cssEsc(v)}"]`;
                const cnt = safeQSACount(sel);
                if (cnt > 0 && cnt <= 5) locators.push(makeLocator('css', sel, el, { matchCount: cnt }));
            }
        }

        // <select> dropdown
        if (tag === 'select') {
            if (nameVal) locators.push(makeLocator('css', `select[name="${cssEsc(nameVal)}"]`, el, { matchCount: 1 }));
            const firstOpt = el.querySelector('option:first-child');
            if (firstOpt?.textContent.trim()) {
                locators.push(makeLocator('xpath', `//select[option[text()='${xpEsc(firstOpt.textContent.trim())}']]`, el));
            }
        }

        // date/time/color/range inputs
        if (tag === 'input' && ['date', 'time', 'datetime-local', 'month', 'week', 'color', 'range'].includes(type)) {
            locators.push(makeLocator('css', `input[type="${type}"]`, el, { matchCount: safeQSACount(`input[type="${type}"]`) }));
            if (nameVal) locators.push(makeLocator('css', `input[type="${type}"][name="${cssEsc(nameVal)}"]`, el, { matchCount: 1 }));
        }

        // contenteditable
        if (el.getAttribute('contenteditable') === 'true') {
            locators.push(makeLocator('css', '[contenteditable="true"]', el, { matchCount: safeQSACount('[contenteditable="true"]') }));
        }

        // ARIA roles for complex widgets
        const ariaRole = el.getAttribute('role');
        const complexRoles = ['listbox', 'combobox', 'menu', 'menubar', 'tree', 'tablist', 'dialog', 'alertdialog', 'slider', 'spinbutton', 'grid', 'treegrid'];
        if (complexRoles.includes(ariaRole)) {
            locators.push(makeLocator('css', `[role="${ariaRole}"]`, el, { matchCount: safeQSACount(`[role="${ariaRole}"]`) }));
            if (ariaLabel) locators.push(makeLocator('css', `[role="${ariaRole}"][aria-label="${cssEsc(ariaLabel)}"]`, el, { matchCount: 1 }));
        }

        // aria-controls
        const ariaControls = el.getAttribute('aria-controls');
        if (ariaControls) locators.push(makeLocator('css', `[aria-controls="${cssEsc(ariaControls)}"]`, el, { matchCount: 1 }));

        // XPath by ID
        if (el.id && !el.id.match(/^[0-9]|react|ember|ng-|:r[0-9]/)) {
            locators.push(makeLocator('xpath', `//${tag}[@id='${el.id}']`, el));
        }

        // XPath by name
        if (nameVal) locators.push(makeLocator('xpath', `//${tag}[@name='${nameVal}']`, el));

        // Text-based
        const txt = directText(el);
        if (txt && txt.length > 0 && txt.length < 80) {
            locators.push(makeLocator('text', txt, el));
            if (tag === 'a') locators.push(makeLocator('linkText', txt, el));
        }

        // XPath contains text
        if (txt && txt.length >= 3 && txt.length < 80) {
            locators.push(makeLocator('xpath', `//${tag}[contains(text(),'${xpEsc(txt.slice(0, 40))}')]`, el));
        }

        // Absolute XPath (fallback)
        locators.push(makeLocator('xpath-abs', absoluteXPath(el), el));

        // Deduplicate & sort by quality
        const seen = new Set();
        const unique = [];
        for (const loc of locators) {
            const key = loc.type + '::' + loc.value;
            if (!seen.has(key)) { seen.add(key); unique.push(loc); }
        }
        unique.sort((a, b) => b.quality.score - a.quality.score);
        return unique;
    }

    /* ═══════════════════════════════════════════════════════════
       7. QUALITY SCORING
       ═══════════════════════════════════════════════════════════ */

    function scoreLocator(type, value, el, meta = {}) {
        let score, reason;

        const SCORES = {
            'data-testid': { s: 100, r: 'Data test attribute — most reliable' },
            'aria-label': { s: 90, r: 'ARIA label — semantic & accessible' },
            'role': { s: 88, r: 'ARIA role — semantic locator' },
            'placeholder': { s: 75, r: 'Placeholder — fairly reliable' },
            'text': { s: 50, r: 'Text content — may change' },
            'linkText': { s: 50, r: 'Link text' },
            'xpath-abs': { s: 15, r: 'Absolute XPath — very brittle!' },
        };

        if (SCORES[type]) {
            score = SCORES[type].s;
            reason = SCORES[type].r;
        } else if (type === 'id') {
            score = meta.unique !== false ? 95 : 55;
            reason = meta.unique !== false ? 'Unique ID — highly reliable' : 'Non-unique ID';
        } else if (type === 'name') {
            score = meta.matchCount === 1 ? 80 : 55;
            reason = meta.matchCount === 1 ? 'Unique name attribute' : 'Name (not unique)';
        } else if (type === 'css') {
            if (value.includes('[data-testid') || value.includes('[data-test') || value.includes('[data-cy')) {
                score = 95; reason = 'CSS with test ID';
            } else if (value.includes('[aria-controls')) {
                score = 82; reason = 'CSS via aria-controls';
            } else if (value.includes('[role=') && value.includes('[aria-label')) {
                score = 85; reason = 'CSS role + aria-label';
            } else if (value.includes('[role=')) {
                score = 72; reason = 'CSS by ARIA role';
            } else if (meta.matchCount === 1) {
                score = 75; reason = 'Unique CSS selector';
            } else if (value.split('.').length <= 2) {
                score = 65; reason = 'Simple CSS selector';
            } else {
                score = 50; reason = 'CSS selector (may be fragile)';
            }
        } else if (type === 'xpath') {
            if (value.includes("@id=")) { score = 85; reason = 'XPath by ID'; }
            else if (value.includes("@name=")) { score = 70; reason = 'XPath by name'; }
            else if (value.includes("text()")) { score = 50; reason = 'XPath by text'; }
            else if (value.includes("option[")) { score = 60; reason = 'XPath by option text'; }
            else { score = 60; reason = 'Relative XPath'; }
        } else {
            score = 30; reason = 'Generic locator';
        }

        // Adjust for aria-label via label association
        if (type === 'aria-label' && meta.viaLabel) {
            score = 85; reason = 'Label association — reliable';
        }

        // Penalize multiple matches
        if (meta.matchCount > 1 && type !== 'name') {
            score = Math.max(score - 20, 5);
            reason += ` (${meta.matchCount} matches)`;
        }

        const rating = score >= 85 ? 'BEST' : score >= 65 ? 'GOOD' : score >= 40 ? 'OK' : 'AVOID';
        return { score, rating, reason };
    }

    /* ═══════════════════════════════════════════════════════════
       8. FRAMEWORK CODE GENERATION
       ═══════════════════════════════════════════════════════════ */

    function frameworkCode(type, value, meta = {}) {
        const codes = {};
        let css = value;
        if (type === 'id') css = `#${value}`;
        if (type === 'name') css = `[name="${value}"]`;
        if (type === 'placeholder') css = `[placeholder="${value}"]`;

        const testIdVal = meta.selectorVal || value.replace(/.*="/, '').replace(/".*/, '');

        // Selenium Java
        const sjMap = {
            'id': `driver.findElement(By.id("${value}"))`,
            'name': `driver.findElement(By.name("${value}"))`,
            'data-testid': `driver.findElement(By.cssSelector("${value}"))`,
            'css': `driver.findElement(By.cssSelector("${value}"))`,
            'placeholder': `driver.findElement(By.cssSelector("${css}"))`,
            'xpath': `driver.findElement(By.xpath("${value}"))`,
            'xpath-abs': `driver.findElement(By.xpath("${value}"))`,
            'linkText': `driver.findElement(By.linkText("${value}"))`,
            'text': `driver.findElement(By.xpath("//*[text()='${value}']"))`,
            'aria-label': `driver.findElement(By.cssSelector("[aria-label='${value}']"))`,
            'role': `driver.findElement(By.cssSelector("[role='${value}']"))`,
        };
        if (sjMap[type]) codes['selenium-java'] = sjMap[type];

        // Selenium Python
        const spMap = {
            'id': `driver.find_element(By.ID, "${value}")`,
            'name': `driver.find_element(By.NAME, "${value}")`,
            'data-testid': `driver.find_element(By.CSS_SELECTOR, "${value}")`,
            'css': `driver.find_element(By.CSS_SELECTOR, "${value}")`,
            'placeholder': `driver.find_element(By.CSS_SELECTOR, "${css}")`,
            'xpath': `driver.find_element(By.XPATH, "${value}")`,
            'xpath-abs': `driver.find_element(By.XPATH, "${value}")`,
            'linkText': `driver.find_element(By.LINK_TEXT, "${value}")`,
            'text': `driver.find_element(By.XPATH, "//*[text()='${value}']")`,
            'aria-label': `driver.find_element(By.CSS_SELECTOR, "[aria-label='${value}']")`,
            'role': `driver.find_element(By.CSS_SELECTOR, "[role='${value}']")`,
        };
        if (spMap[type]) codes['selenium-python'] = spMap[type];

        // Selenium C#
        const scMap = {
            'id': `driver.FindElement(By.Id("${value}"))`,
            'name': `driver.FindElement(By.Name("${value}"))`,
            'xpath': `driver.FindElement(By.XPath("${value}"))`,
            'xpath-abs': `driver.FindElement(By.XPath("${value}"))`,
            'linkText': `driver.FindElement(By.LinkText("${value}"))`,
        };
        codes['selenium-csharp'] = scMap[type] || `driver.FindElement(By.CssSelector("${css}"))`;

        // Selenium JS
        const sjsMap = {
            'id': `await driver.findElement(By.id('${value}'))`,
            'name': `await driver.findElement(By.name('${value}'))`,
            'xpath': `await driver.findElement(By.xpath('${value}'))`,
            'xpath-abs': `await driver.findElement(By.xpath('${value}'))`,
        };
        codes['selenium-js'] = sjsMap[type] || `await driver.findElement(By.css('${css}'))`;

        // Playwright JS/TS
        const pwMap = {
            'data-testid': `page.getByTestId('${testIdVal}')`,
            'id': `page.locator('#${value}')`,
            'aria-label': `page.getByLabel('${value}')`,
            'placeholder': `page.getByPlaceholder('${value}')`,
            'text': `page.getByText('${value}')`,
            'linkText': `page.getByRole('link', { name: '${value}' })`,
            'name': `page.locator('[name="${value}"]')`,
            'css': `page.locator('${value}')`,
            'xpath': `page.locator('xpath=${value}')`,
            'xpath-abs': `page.locator('xpath=${value}')`,
        };
        if (type === 'role') {
            codes['playwright-js'] = meta.text
                ? `page.getByRole('${value}', { name: '${meta.text}' })`
                : `page.getByRole('${value}')`;
        } else {
            codes['playwright-js'] = pwMap[type] || `page.locator('${css}')`;
        }

        // Playwright Python
        const ppMap = {
            'data-testid': `page.get_by_test_id("${testIdVal}")`,
            'aria-label': `page.get_by_label("${value}")`,
            'placeholder': `page.get_by_placeholder("${value}")`,
            'text': `page.get_by_text("${value}")`,
        };
        if (type === 'role') {
            codes['playwright-python'] = meta.text
                ? `page.get_by_role("${value}", name="${meta.text}")`
                : `page.get_by_role("${value}")`;
        } else {
            codes['playwright-python'] = ppMap[type] || `page.locator("${css || value}")`;
        }

        // Playwright Java
        if (type === 'data-testid') codes['playwright-java'] = `page.getByTestId("${testIdVal}")`;
        else if (type === 'role') {
            codes['playwright-java'] = meta.text
                ? `page.getByRole(AriaRole.${value.toUpperCase()}, new Page.GetByRoleOptions().setName("${meta.text}"))`
                : `page.getByRole(AriaRole.${value.toUpperCase()})`;
        } else if (type === 'aria-label') codes['playwright-java'] = `page.getByLabel("${value}")`;
        else if (type === 'placeholder') codes['playwright-java'] = `page.getByPlaceholder("${value}")`;
        else codes['playwright-java'] = `page.locator("${css || value}")`;

        // Cypress
        const cyMap = {
            'data-testid': `cy.get('[data-testid="${testIdVal}"]')`,
            'id': `cy.get('#${value}')`,
            'text': `cy.contains('${value}')`,
            'xpath': `cy.xpath('${value}')`,
            'xpath-abs': `cy.xpath('${value}')`,
        };
        codes['cypress'] = cyMap[type] || `cy.get('${css}')`;

        // WebDriverIO
        const wdMap = {
            'id': `await $('#${value}')`,
            'xpath': `await $('${value}')`,
            'xpath-abs': `await $('${value}')`,
            'text': `await $('*=${value}')`,
            'linkText': `await $('*=${value}')`,
        };
        codes['webdriverio'] = wdMap[type] || `await $('${css}')`;

        return codes;
    }

    /* ═══════════════════════════════════════════════════════════
       9. HELPERS
       ═══════════════════════════════════════════════════════════ */

    function makeLocator(type, value, el, meta = {}) {
        const quality = scoreLocator(type, value, el, meta);
        const codes = frameworkCode(type, value, meta);
        const matchCount = meta.matchCount ?? countMatches(type, value);
        return { type, value, quality, codes, matchCount };
    }

    function countMatches(type, value) {
        try {
            if (type === 'xpath' || type === 'xpath-abs') {
                const r = document.evaluate(value, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                return r.snapshotLength;
            }
            if (type === 'id') return safeQSACount(`#${CSS.escape(value)}`);
            if (type === 'name') return safeQSACount(`[name="${CSS.escape(value)}"]`);
            if (['css', 'data-testid', 'placeholder'].includes(type)) return safeQSACount(value);
        } catch { /* ignore */ }
        return -1;
    }

    function directText(el) {
        let t = '';
        for (const n of el.childNodes) { if (n.nodeType === 3) t += n.textContent; }
        return t.trim();
    }

    function isVisible(el) {
        if (!el.offsetParent && el.tagName !== 'BODY' && el.tagName !== 'HTML') return false;
        const s = getComputedStyle(el);
        return s.display !== 'none' && s.visibility !== 'hidden' && s.opacity !== '0';
    }

    function isOwn(el) { return el?.closest?.('[data-locator-finder]'); }

    function implicitRole(el) {
        const tag = el.tagName.toLowerCase();
        const type = el.getAttribute('type');
        const map = {
            button: 'button', a: 'link', select: 'combobox', textarea: 'textbox',
            nav: 'navigation', main: 'main', header: 'banner', footer: 'contentinfo',
            form: 'form', details: 'group', summary: 'button', option: 'option',
            dialog: 'dialog', meter: 'meter', progress: 'progressbar',
        };
        if (tag === 'input') {
            return ({
                checkbox: 'checkbox', radio: 'radio', submit: 'button', search: 'searchbox',
                text: 'textbox', email: 'textbox', password: 'textbox', number: 'spinbutton',
                range: 'slider', tel: 'textbox', url: 'textbox', date: 'textbox',
                time: 'textbox', 'datetime-local': 'textbox', month: 'textbox', week: 'textbox',
                color: 'textbox', file: 'button',
            })[type] || 'textbox';
        }
        return map[tag] || null;
    }

    function absoluteXPath(el) {
        const parts = [];
        let cur = el;
        while (cur && cur.nodeType === 1) {
            let idx = 1, sib = cur.previousElementSibling;
            while (sib) { if (sib.tagName === cur.tagName) idx++; sib = sib.previousElementSibling; }
            parts.unshift(`${cur.tagName.toLowerCase()}[${idx}]`);
            cur = cur.parentElement;
        }
        return '/' + parts.join('/');
    }

    function safeQSACount(s) { try { return document.querySelectorAll(s).length; } catch { return 0; } }
    function cssEsc(s) { return s.replace(/"/g, '\\"'); }
    function xpEsc(s) { return s.replace(/'/g, "\\'"); }
    function csvEsc(s) { return String(s || '').replace(/"/g, '""'); }
    function htmlEsc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

    function copyText(text) {
        navigator.clipboard.writeText(text).catch(() => {
            const ta = document.createElement('textarea');
            ta.value = text; ta.style.cssText = 'position:fixed;opacity:0';
            document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
        });
    }

    function downloadFile(content, filename, mime) {
        const blob = new Blob([content], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = filename; a.click();
        URL.revokeObjectURL(url);
    }

    function showToast(msg) {
        toast.textContent = msg;
        toast.classList.remove('__lf-hidden');
        clearTimeout(toast._t);
        toast._t = setTimeout(() => toast.classList.add('__lf-hidden'), 2000);
    }

    /* ═══════════════════════════════════════════════════════════
       10. INSPECT MODE
       ═══════════════════════════════════════════════════════════ */

    function startInspecting() {
        inspecting = true;
        btnInspect.textContent = '🔴 Stop';
        btnInspect.classList.add('__lf-active');
        document.addEventListener('mouseover', onHover, true);
        document.addEventListener('mouseout', onOut, true);
        document.addEventListener('click', onPick, true);
        document.addEventListener('keydown', onEsc, true);
        log('info', 'Inspect mode ON');
    }

    function stopInspecting() {
        inspecting = false;
        btnInspect.textContent = '🎯 Inspect';
        btnInspect.classList.remove('__lf-active');
        clearHighlight();
        document.removeEventListener('mouseover', onHover, true);
        document.removeEventListener('mouseout', onOut, true);
        document.removeEventListener('click', onPick, true);
        document.removeEventListener('keydown', onEsc, true);
    }

    function onHover(e) {
        const t = e.target;
        if (isOwn(t) || t === hoveredEl) return;
        clearHighlight();
        hoveredEl = t;
        t.classList.add('__lf-highlight');
    }

    function onOut() {
        if (hoveredEl) hoveredEl.classList.remove('__lf-highlight');
        hoveredEl = null;
    }

    function onPick(e) {
        const el = e.target;
        if (isOwn(el)) return;
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        selectElement(el);
    }

    function onEsc(e) { if (e.key === 'Escape') stopInspecting(); }

    function selectElement(el) {
        clearHighlight();
        clearSelection();
        selectedEl = el;
        el.classList.add('__lf-selected');
        scanSection.classList.add('__lf-hidden');
        currentLocators = generateLocators(el);
        showElementInfo(el);
        renderLocators();
        stopInspecting();
        log('info', `Selected <${el.tagName.toLowerCase()}> — ${currentLocators.length} locators`);
    }

    function clearHighlight() {
        if (hoveredEl) hoveredEl.classList.remove('__lf-highlight');
        document.querySelectorAll('.__lf-highlight').forEach(e => e.classList.remove('__lf-highlight'));
    }

    function clearSelection() {
        if (selectedEl) selectedEl.classList.remove('__lf-selected');
        document.querySelectorAll('.__lf-selected').forEach(e => e.classList.remove('__lf-selected'));
        selectedEl = null;
    }

    /* ═══════════════════════════════════════════════════════════
       11. UI RENDERING
       ═══════════════════════════════════════════════════════════ */

    function showElementInfo(el) {
        const rect = el.getBoundingClientRect();
        const tag = el.tagName.toLowerCase();
        const type = el.getAttribute('type') || '';

        let tagStr = `<${tag}`;
        if (el.id) tagStr += ` id="${el.id}"`;
        const cls = (typeof el.className === 'string') ? el.className.replace(/__lf[^\s]*/g, '').trim() : '';
        if (cls) tagStr += ` class="${cls.split(' ').slice(0, 3).join(' ')}"`;
        if (type) tagStr += ` type="${type}"`;
        if (el.getAttribute('role')) tagStr += ` role="${el.getAttribute('role')}"`;
        tagStr += '>';
        const txt = directText(el);
        if (txt) tagStr += txt.slice(0, 50) + (txt.length > 50 ? '…' : '');
        tagStr += `</${tag}>`;
        elTag.textContent = tagStr;

        const chips = [`<span class="__lf-chip">${tag}</span>`];
        if (type) chips.push(`<span class="__lf-chip">${type}</span>`);
        if (el.getAttribute('role')) chips.push(`<span class="__lf-chip">role: ${el.getAttribute('role')}</span>`);
        if (isVisible(el)) chips.push('<span class="__lf-chip">👁 Visible</span>');
        chips.push(`<span class="__lf-chip">${Math.round(rect.width)}×${Math.round(rect.height)}</span>`);
        elMeta.innerHTML = chips.join('');

        elInfo.classList.remove('__lf-hidden');
        locatorSection.classList.remove('__lf-hidden');
        emptyState.classList.add('__lf-hidden');
        btnCopyAll.disabled = false;
    }

    function renderLocators() {
        const fw = selFramework.value;
        locatorsDiv.innerHTML = '';
        locatorCount.textContent = currentLocators.length;

        for (const loc of currentLocators) {
            const code = loc.codes[fw] || loc.codes['selenium-java'] || loc.value;
            const q = loc.quality.rating.toLowerCase();

            const matchIcon = loc.matchCount === 1 ? '✓' : loc.matchCount > 1 ? '⚠' : loc.matchCount === 0 ? '✗' : '…';
            const matchCls = loc.matchCount === 1 ? '__lf-valid' : loc.matchCount > 1 ? '__lf-warn' : '__lf-err';

            const item = document.createElement('div');
            item.className = '__lf-locator-item';
            item.innerHTML = `
                <div class="__lf-loc-header">
                  <span class="__lf-dot __lf-${q}"></span>
                  <span class="__lf-rating __lf-${q}">${loc.quality.rating}</span>
                  <span class="__lf-type">${loc.type}</span>
                  <button class="__lf-copy-btn" title="Copy code">📋</button>
                </div>
                <div class="__lf-loc-code" title="Click to copy">${htmlEsc(code)}</div>
                <div class="__lf-loc-footer">
                  <span class="${matchCls}">${matchIcon} ${loc.matchCount >= 0 ? loc.matchCount + ' match' + (loc.matchCount !== 1 ? 'es' : '') : ''}</span>
                  <span class="__lf-reason">${htmlEsc(loc.quality.reason)}</span>
                </div>
            `;

            const copyHandler = () => { copyText(code); showToast('Copied!'); log('info', `Copied ${loc.type} locator`); };
            item.querySelector('.__lf-copy-btn').addEventListener('click', copyHandler);
            item.querySelector('.__lf-loc-code').addEventListener('click', copyHandler);
            locatorsDiv.appendChild(item);
        }
    }

    /* ═══════════════════════════════════════════════════════════
       12. LIST ALL (Page Scan)
       ═══════════════════════════════════════════════════════════ */

    const SCAN_SELECTOR = [
        'a', 'button', 'input', 'textarea', 'select', 'option',
        '[role="button"]', '[role="link"]', '[role="tab"]', '[role="menuitem"]',
        '[role="option"]', '[role="checkbox"]', '[role="radio"]', '[role="switch"]',
        '[role="slider"]', '[role="spinbutton"]', '[role="combobox"]', '[role="listbox"]',
        '[role="menu"]', '[role="dialog"]', '[role="alertdialog"]',
        '[type="submit"]', '[type="reset"]',
        '[contenteditable="true"]',
        'label', 'h1', 'h2', 'h3', 'img[alt]',
        'details', 'summary',
    ].join(', ');

    function scanAllElements() {
        showToast('Scanning page…');
        btnListAll.disabled = true;
        log('info', 'Scanning all page elements…');

        setTimeout(() => {
            const elements = [...document.querySelectorAll(SCAN_SELECTOR)];
            scanResults = [];

            for (const el of elements) {
                if (!isVisible(el) || isOwn(el)) continue;
                const locators = generateLocators(el);
                scanResults.push({
                    el,
                    tag: el.tagName.toLowerCase(),
                    id: el.id || '',
                    text: directText(el).slice(0, 60),
                    type: el.getAttribute('type') || el.getAttribute('role') || '',
                    locators,
                    bestLocator: locators[0],
                });
            }

            renderScanResults();
            btnListAll.disabled = false;
            log('info', `Scan complete — ${scanResults.length} elements found`);
        }, 50);
    }

    function renderScanResults() {
        const fw = selFramework.value;
        scanList.innerHTML = '';
        scanCount.textContent = scanResults.length;

        elInfo.classList.add('__lf-hidden');
        locatorSection.classList.add('__lf-hidden');
        emptyState.classList.add('__lf-hidden');
        scanSection.classList.remove('__lf-hidden');

        for (const r of scanResults) {
            const bestCode = r.bestLocator ? (r.bestLocator.codes[fw] || r.bestLocator.value) : '—';
            const q = r.bestLocator ? r.bestLocator.quality.rating.toLowerCase() : 'avoid';

            const row = document.createElement('div');
            row.className = '__lf-scan-row';
            row.innerHTML = `
                <div class="__lf-scan-row-header">
                    <span class="__lf-dot __lf-${q}"></span>
                    <span class="__lf-scan-tag">&lt;${r.tag}&gt;${r.type ? ' [' + r.type + ']' : ''}</span>
                    <span class="__lf-scan-text">${htmlEsc(r.text || r.id || '(no text)')}</span>
                    <span class="__lf-scan-num">${r.locators.length} loc</span>
                    <button class="__lf-copy-btn" title="Copy best locator">📋</button>
                    <button class="__lf-scan-expand" title="Show all locators">▸</button>
                </div>
                <div class="__lf-scan-best-code">${htmlEsc(bestCode)}</div>
                <div class="__lf-scan-detail __lf-hidden"></div>
            `;

            row.querySelector('.__lf-copy-btn').addEventListener('click', () => {
                copyText(bestCode); showToast('Copied!');
            });

            const expandBtn = row.querySelector('.__lf-scan-expand');
            const detailDiv = row.querySelector('.__lf-scan-detail');
            expandBtn.addEventListener('click', () => {
                const open = !detailDiv.classList.contains('__lf-hidden');
                detailDiv.classList.toggle('__lf-hidden');
                expandBtn.textContent = open ? '▸' : '▾';
                if (!open && detailDiv.childElementCount === 0) {
                    for (const loc of r.locators) {
                        const code = loc.codes[fw] || loc.value;
                        const lq = loc.quality.rating.toLowerCase();
                        const d = document.createElement('div');
                        d.className = '__lf-scan-detail-row';
                        d.innerHTML = `
                            <span class="__lf-dot __lf-${lq}"></span>
                            <span class="__lf-rating __lf-${lq}">${loc.quality.rating}</span>
                            <span class="__lf-type">${loc.type}</span>
                            <button class="__lf-copy-btn" title="Copy">📋</button>
                            <div class="__lf-loc-code">${htmlEsc(code)}</div>
                        `;
                        d.querySelector('.__lf-copy-btn').addEventListener('click', () => { copyText(code); showToast('Copied!'); });
                        d.querySelector('.__lf-loc-code').addEventListener('click', () => { copyText(code); showToast('Copied!'); });
                        detailDiv.appendChild(d);
                    }
                }
            });

            row.querySelector('.__lf-scan-row-header').addEventListener('click', (e) => {
                if (e.target.closest('button')) return;
                clearSelection();
                r.el.classList.add('__lf-selected');
                r.el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                selectedEl = r.el;
            });

            scanList.appendChild(row);
        }

        showToast(`Found ${scanResults.length} elements`);
    }

    function closeScanView() {
        scanSection.classList.add('__lf-hidden');
        emptyState.classList.remove('__lf-hidden');
        clearSelection();
        scanResults = [];
    }

    /* ═══════════════════════════════════════════════════════════
       13. EXPORT
       ═══════════════════════════════════════════════════════════ */

    function buildExportData(format) {
        const fw = selFramework.value;
        const data = scanResults.map(r => ({
            element: { tag: r.tag, id: r.id, text: r.text, type: r.type },
            locators: r.locators.map(l => ({
                type: l.type, value: l.value, quality: l.quality.rating,
                score: l.quality.score, code: l.codes[fw] || l.value, matches: l.matchCount,
            }))
        }));

        const ts = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');

        if (format === 'csv') {
            const rows = [['Element', 'ID', 'Text', 'Type', 'Locator Type', 'Value', 'Quality', 'Code', 'Matches']];
            for (const r of data) {
                for (const l of r.locators) {
                    rows.push([r.element.tag, r.element.id, csvEsc(r.element.text), r.element.type,
                    l.type, csvEsc(l.value), l.quality, csvEsc(l.code), l.matches]);
                }
            }
            const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
            downloadFile(csv, `locators_${ts}.csv`, 'text/csv');
        } else {
            downloadFile(JSON.stringify(data, null, 2), `locators_${ts}.json`, 'application/json');
        }

        showToast(`Exported ${data.length} elements as ${format.toUpperCase()}!`);
        log('info', `Exported ${data.length} elements as ${format.toUpperCase()}`);
    }

    function exportPage() {
        if (scanResults.length === 0) {
            showToast('Scanning page…');
            setTimeout(() => {
                const elements = [...document.querySelectorAll(SCAN_SELECTOR)];
                scanResults = [];
                for (const el of elements) {
                    if (!isVisible(el) || isOwn(el)) continue;
                    const locators = generateLocators(el);
                    scanResults.push({
                        el, tag: el.tagName.toLowerCase(),
                        id: el.id || '', text: directText(el).slice(0, 60),
                        type: el.getAttribute('type') || el.getAttribute('role') || '',
                        locators, bestLocator: locators[0],
                    });
                }
                buildExportData('json');
            }, 50);
        } else {
            buildExportData('json');
        }
    }

    /* ═══════════════════════════════════════════════════════════
       14. EVENT BINDINGS
       ═══════════════════════════════════════════════════════════ */

    btnInspect.addEventListener('click', () => inspecting ? stopInspecting() : startInspecting());
    btnListAll.addEventListener('click', scanAllElements);

    btnClose.addEventListener('click', () => {
        panel.classList.add('__lf-hidden');
        stopInspecting();
        clearSelection();
        closeScanView();
        log('info', 'Panel closed');
    });

    btnTheme.addEventListener('click', () => {
        darkMode = !darkMode;
        panel.classList.toggle('__lf-light', !darkMode);
        btnTheme.textContent = darkMode ? '🌙' : '☀️';
        log('info', `Theme: ${darkMode ? 'dark' : 'light'}`);
    });

    selFramework.addEventListener('change', () => {
        if (currentLocators.length) renderLocators();
        if (!scanSection.classList.contains('__lf-hidden')) renderScanResults();
        log('info', `Framework: ${selFramework.value}`);
    });

    btnCopyAll.addEventListener('click', () => {
        if (!currentLocators.length) return;
        const fw = selFramework.value;
        const text = currentLocators.map(l => {
            const code = l.codes[fw] || l.value;
            return `// [${l.quality.rating}] ${l.type}\n${code}`;
        }).join('\n\n');
        copyText(text);
        showToast('All locators copied!');
        log('info', 'Copied all locators');
    });

    btnExport.addEventListener('click', exportPage);

    $('__lf-scan-copy').addEventListener('click', () => {
        if (!scanResults.length) return;
        const fw = selFramework.value;
        const text = scanResults.map(r => {
            const best = r.bestLocator;
            const code = best ? (best.codes[fw] || best.value) : '';
            return `// <${r.tag}> ${r.text || r.id}\n${code}`;
        }).join('\n\n');
        copyText(text);
        showToast('All locators copied!');
    });

    $('__lf-scan-json').addEventListener('click', () => buildExportData('json'));
    $('__lf-scan-csv').addEventListener('click', () => buildExportData('csv'));
    $('__lf-scan-close').addEventListener('click', closeScanView);

    // Listen for toggle from background
    chrome.runtime.onMessage.addListener((msg) => {
        if (msg.action === 'toggle-panel') {
            panel.classList.toggle('__lf-hidden');
            if (panel.classList.contains('__lf-hidden')) {
                stopInspecting();
                clearSelection();
            }
        }
    });

})();
