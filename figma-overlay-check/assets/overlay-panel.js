// Stable Figma overlay control-panel preset.
// This file is injected verbatim into .figma-overlay-check/__figma_overlay__.ts.

function mountFigmaOverlayPanel(options) {
  if (typeof document === 'undefined') return null;
  if (!options || !(options.overlayImage instanceof HTMLElement)) {
    throw new Error('mountFigmaOverlayPanel requires an overlayImage element');
  }
  if (document.querySelector('[data-figma-overlay-panel-host]')) return null;

  const frameWidth = Number(options.frameWidth);
  const frameHeight = Number(options.frameHeight);
  const overlayImage = options.overlayImage;
  let mode = options.initialMode || 'opacity';
  let opacity = Number.isFinite(Number(options.initialOpacity)) ? Number(options.initialOpacity) : 0.5;
  let dragged = false;
  let dragState = null;

  const host = document.createElement('div');
  host.setAttribute('data-figma-overlay-panel-host', '');
  document.body.appendChild(host);
  const shadow = host.attachShadow({ mode: 'open' });

  shadow.innerHTML = `
    <style>
      :host {
        all: initial;
        position: fixed;
        inset: 0;
        z-index: 2147483647;
        pointer-events: none;
        font-family: Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      *, *::before, *::after { box-sizing: border-box; }
      button, input { font: inherit; }
      button { cursor: pointer; }
      button:disabled { cursor: not-allowed; opacity: .58; }
      [hidden] { display: none !important; }
      .panel {
        position: fixed;
        right: max(12px, env(safe-area-inset-right));
        bottom: max(12px, env(safe-area-inset-bottom));
        width: min(300px, calc(100vw - 24px));
        max-height: calc(100vh - 24px);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        color: #f5f5f7;
        background: rgba(29, 29, 31, .96);
        border: 1px solid #55565a;
        border-radius: 12px;
        box-shadow: 0 16px 44px rgba(0, 0, 0, .32);
        pointer-events: auto;
        color-scheme: dark;
      }
      .header {
        min-height: 44px;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 10px 6px 12px;
        border-bottom: 1px solid #3a3b3f;
        user-select: none;
        touch-action: none;
        cursor: grab;
      }
      .header:active { cursor: grabbing; }
      .title {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        color: #fff;
        font-size: 16px;
        font-weight: 650;
        line-height: 1.2;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .collapse {
        width: 32px;
        height: 32px;
        flex: 0 0 32px;
        display: grid;
        place-items: center;
        padding: 0;
        color: #fff;
        background: #333438;
        border: 0;
        border-radius: 9px;
        font-size: 18px;
        line-height: 1;
      }
      .collapse:hover { background: #414247; }
      .body {
        min-height: 0;
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 12px;
        overflow-y: auto;
        overscroll-behavior: contain;
      }
      .modes {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }
      .mode {
        min-width: 0;
        height: 34px;
        padding: 0 8px;
        overflow: hidden;
        color: #f1f1f3;
        background: #2b2c30;
        border: 1px solid #505156;
        border-radius: 9px;
        font-size: 13px;
        line-height: 1;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .mode:hover { background: #34353a; }
      .mode.active {
        background: #414371;
        border-color: #9297e3;
      }
      .mode.wide { grid-column: 1 / -1; }
      .label-row, .metric {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 12px;
        color: #dedee2;
        font-size: 13px;
        line-height: 1.35;
      }
      .label-row { margin-top: 2px; }
      .value, .metric dd {
        margin: 0;
        color: #f5f5f7;
        font-variant-numeric: tabular-nums;
        text-align: right;
      }
      .range {
        width: 100%;
        height: 20px;
        margin: -2px 0 0;
        accent-color: #147df5;
      }
      .metrics {
        display: grid;
        gap: 4px;
        margin: 0;
      }
      .metric dt, .metric dd { margin: 0; }
      .metric dt { color: #d3d3d7; }
      .separator {
        height: 1px;
        margin: 2px 0 4px;
        background: #3a3b3f;
      }
      .delete {
        width: 100%;
        height: 36px;
        padding: 0 12px;
        color: #fff;
        background: #e5252a;
        border: 1px solid #f04b50;
        border-radius: 9px;
        font-size: 14px;
        font-weight: 700;
      }
      .delete:hover { background: #f02a30; }
      .confirm {
        display: grid;
        gap: 8px;
        padding: 10px;
        background: #292a2e;
        border: 1px solid #4d4e53;
        border-radius: 9px;
      }
      .confirm-message, .status {
        margin: 0;
        color: #e8e8eb;
        font-size: 12px;
        line-height: 1.4;
      }
      .status.error { color: #ff9ea2; }
      .confirm-actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }
      .cancel, .confirm-delete {
        height: 34px;
        padding: 0 8px;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 650;
      }
      .cancel {
        color: #f5f5f7;
        background: #35363b;
        border: 1px solid #57585e;
      }
      .confirm-delete {
        color: #fff;
        background: #e5252a;
        border: 1px solid #f04b50;
      }
      .edge-handle {
        position: fixed;
        height: 44px;
        padding: 0;
        background: #202126;
        border: 1px solid #55565a;
        box-shadow: 0 8px 24px rgba(0, 0, 0, .3);
        pointer-events: auto;
      }
      .edge-handle:hover { background: #303137; }
      @media (prefers-reduced-motion: no-preference) {
        .mode, .collapse, .delete, .edge-handle { transition: background-color 120ms ease, border-color 120ms ease; }
      }
    </style>
    <section class="panel" role="dialog" aria-label="Figma overlay controls">
      <header class="header">
        <div class="title"></div>
        <button class="collapse" type="button" aria-label="Collapse overlay panel" title="Collapse overlay panel">−</button>
      </header>
      <div class="body">
        <div class="modes" role="group" aria-label="Overlay display mode">
          <button class="mode" type="button" data-mode="hidden">Hide Image</button>
          <button class="mode" type="button" data-mode="opacity">Opacity Overlay</button>
          <button class="mode wide" type="button" data-mode="difference">Show Image</button>
        </div>
        <div class="label-row"><span>Opacity</span><span class="value opacity-value"></span></div>
        <input class="range" type="range" min="0" max="1" step="0.01" aria-label="Overlay opacity">
        <dl class="metrics">
          <div class="metric"><dt>Canvas</dt><dd data-metric="canvas">—</dd></div>
          <div class="metric"><dt>Width Δ</dt><dd data-metric="width">—</dd></div>
          <div class="metric"><dt>Left Δ</dt><dd data-metric="left">—</dd></div>
          <div class="metric"><dt>Top Δ</dt><dd data-metric="top">—</dd></div>
        </dl>
        <div class="separator"></div>
        <button class="delete" type="button">Delete Overlay</button>
        <div class="confirm" hidden>
          <p class="confirm-message">Delete local overlay files and remove the page import? UI fixes will be kept.</p>
          <div class="confirm-actions">
            <button class="cancel" type="button">Cancel</button>
            <button class="confirm-delete" type="button">Delete Overlay</button>
          </div>
        </div>
        <p class="status" role="status" aria-live="polite" hidden></p>
      </div>
    </section>
    <button class="edge-handle" type="button" aria-label="Expand overlay panel" title="Expand overlay panel" hidden></button>
  `;

  const panel = shadow.querySelector('.panel');
  const header = shadow.querySelector('.header');
  const title = shadow.querySelector('.title');
  const collapseButton = shadow.querySelector('.collapse');
  const handle = shadow.querySelector('.edge-handle');
  const range = shadow.querySelector('.range');
  const opacityValue = shadow.querySelector('.opacity-value');
  const modeButtons = [...shadow.querySelectorAll('[data-mode]')];
  const deleteButton = shadow.querySelector('.delete');
  const confirmation = shadow.querySelector('.confirm');
  const cancelButton = shadow.querySelector('.cancel');
  const confirmDeleteButton = shadow.querySelector('.confirm-delete');
  const status = shadow.querySelector('.status');

  title.textContent = `Figma Overlay ${frameWidth}×${frameHeight}`;
  range.value = String(Math.min(1, Math.max(0, opacity)));

  function showStatus(message, isError = false) {
    status.textContent = message;
    status.classList.toggle('error', isError);
    status.hidden = !message;
  }

  function applyMode(nextMode) {
    mode = ['hidden', 'opacity', 'difference'].includes(nextMode) ? nextMode : 'opacity';
    modeButtons.forEach((button) => button.classList.toggle('active', button.dataset.mode === mode));
    overlayImage.style.display = mode === 'hidden' ? 'none' : 'block';
    overlayImage.style.opacity = mode === 'opacity' ? String(opacity) : '1';
    overlayImage.style.mixBlendMode = mode === 'difference' ? 'difference' : 'normal';
    if (typeof options.onModeChange === 'function') options.onModeChange(mode, opacity);
  }

  function applyOpacity(nextOpacity) {
    opacity = Math.min(1, Math.max(0, Number(nextOpacity)));
    range.value = String(opacity);
    opacityValue.textContent = opacity.toFixed(2);
    if (mode === 'opacity') overlayImage.style.opacity = String(opacity);
    if (typeof options.onOpacityChange === 'function') options.onOpacityChange(opacity, mode);
  }

  function formatDelta(value) {
    return Number.isFinite(Number(value)) ? `${Number(value).toFixed(2)}px` : '—';
  }

  function updateMetrics() {
    const geometry = typeof options.getGeometry === 'function' ? options.getGeometry() : null;
    shadow.querySelector('[data-metric="canvas"]').textContent = geometry?.canvas || '—';
    shadow.querySelector('[data-metric="width"]').textContent = formatDelta(geometry?.widthDelta);
    shadow.querySelector('[data-metric="left"]').textContent = formatDelta(geometry?.leftDelta);
    shadow.querySelector('[data-metric="top"]').textContent = formatDelta(geometry?.topDelta);
  }

  function clampPanel() {
    if (!dragged || panel.hidden) return;
    const rect = panel.getBoundingClientRect();
    const left = Math.min(Math.max(0, rect.left), Math.max(0, window.innerWidth - rect.width));
    const top = Math.min(Math.max(0, rect.top), Math.max(0, window.innerHeight - rect.height));
    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
  }

  function collapsePanel() {
    const rect = panel.getBoundingClientRect();
    const attachLeft = rect.left + rect.width / 2 < window.innerWidth / 2;
    const scrollbarWidth = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
    const visibleWidth = attachLeft ? 24 : Math.max(24, scrollbarWidth + 16);
    const top = Math.min(Math.max(0, rect.top), Math.max(0, window.innerHeight - 44));
    handle.style.width = `${visibleWidth}px`;
    handle.style.top = `${top}px`;
    handle.style.left = attachLeft ? '0' : 'auto';
    handle.style.right = attachLeft ? 'auto' : '0';
    handle.style.borderRadius = attachLeft ? '0 12px 12px 0' : '12px 0 0 12px';
    panel.hidden = true;
    handle.hidden = false;
  }

  function restorePanel() {
    handle.hidden = true;
    panel.hidden = false;
    clampPanel();
  }

  modeButtons.forEach((button) => button.addEventListener('click', () => applyMode(button.dataset.mode)));
  range.addEventListener('input', () => applyOpacity(range.value));
  collapseButton.addEventListener('click', collapsePanel);
  handle.addEventListener('click', restorePanel);

  header.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || event.target.closest('button, input')) return;
    const rect = panel.getBoundingClientRect();
    dragged = true;
    dragState = { pointerId: event.pointerId, offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top };
    panel.style.right = 'auto';
    panel.style.bottom = 'auto';
    panel.style.left = `${rect.left}px`;
    panel.style.top = `${rect.top}px`;
    header.setPointerCapture(event.pointerId);
  });

  header.addEventListener('pointermove', (event) => {
    if (!dragState || dragState.pointerId !== event.pointerId) return;
    const rect = panel.getBoundingClientRect();
    const left = Math.min(Math.max(0, event.clientX - dragState.offsetX), Math.max(0, window.innerWidth - rect.width));
    const top = Math.min(Math.max(0, event.clientY - dragState.offsetY), Math.max(0, window.innerHeight - rect.height));
    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
  });

  function endDrag(event) {
    if (!dragState || dragState.pointerId !== event.pointerId) return;
    if (header.hasPointerCapture(event.pointerId)) header.releasePointerCapture(event.pointerId);
    dragState = null;
  }
  header.addEventListener('pointerup', endDrag);
  header.addEventListener('pointercancel', endDrag);

  deleteButton.addEventListener('click', () => {
    showStatus('');
    deleteButton.hidden = true;
    confirmation.hidden = false;
  });

  cancelButton.addEventListener('click', () => {
    confirmation.hidden = true;
    deleteButton.hidden = false;
    showStatus('');
  });

  confirmDeleteButton.addEventListener('click', async () => {
    if (!options.cleanupEndpoint || !options.cleanupToken) {
      showStatus('Cleanup unavailable. Ask AI to restart cleanup.', true);
      return;
    }
    cancelButton.disabled = true;
    confirmDeleteButton.disabled = true;
    confirmDeleteButton.textContent = 'Deleting…';
    showStatus('Deleting…');
    try {
      const response = await fetch(options.cleanupEndpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${options.cleanupToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ confirm: 'DELETE_FIGMA_OVERLAY' }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.error || `Cleanup failed (${response.status})`);
      showStatus('Overlay deleted. Reloading…');
      window.setTimeout(() => window.location.reload(), 120);
    } catch (error) {
      showStatus(error instanceof Error ? error.message : String(error), true);
      cancelButton.disabled = false;
      confirmDeleteButton.disabled = false;
      confirmDeleteButton.textContent = 'Delete Overlay';
    }
  });

  window.addEventListener('resize', clampPanel);
  const metricTimer = window.setInterval(updateMetrics, 250);
  applyOpacity(opacity);
  applyMode(mode);
  updateMetrics();

  return {
    destroy() {
      window.clearInterval(metricTimer);
      window.removeEventListener('resize', clampPanel);
      host.remove();
    },
    setMode: applyMode,
    setOpacity: applyOpacity,
    updateMetrics,
  };
}
