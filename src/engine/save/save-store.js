/**
 * Versioned localStorage save store with checksum-based corruption recovery.
 *
 * Schema:
 *   { version: 1, schemaHash: 'super-v1', payload: {...}, payloadChecksum: '...' }
 *
 * On load: parse + validate. If parse fails or checksum mismatches, back up
 * the corrupted blob to `super:save:backup`, log a warning, and return defaults.
 */

const CURRENT_VERSION = 1;
const SCHEMA_HASH = 'super-v1';
const PRIMARY_KEY = 'super:save';
const BACKUP_KEY = 'super:save:backup';

const QUALITY_VALUES = new Set(['low', 'medium', 'high', 'ultra']);
const BACKEND_VALUES = new Set(['auto', 'webgl2']);

const DEFAULTS = Object.freeze({
  settings: Object.freeze({
    quality: 'high',
    mouseSensitivity: 1.0,
    // Default-muted: the player can turn music up via the pause-menu slider
    // if they want it, but a fresh session is silent by design. The user
    // explicitly asked for "if anything please mute it".
    musicVolume: 0,
    backend: 'auto',
  }),
  progress: Object.freeze({
    districtsVisited: 1,
    threatsDestroyed: 0,
    carsThrown: 0,
    playTimeSeconds: 0,
  }),
});

function checksum(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i += 1) {
    h = ((h << 5) + h) ^ str.charCodeAt(i);
  }
  return (h >>> 0).toString(16);
}

function cloneDefaults(flags = {}) {
  return {
    settings: { ...DEFAULTS.settings },
    progress: { ...DEFAULTS.progress },
    ...flags,
  };
}

function clonePayload(payload) {
  return {
    settings: { ...payload.settings },
    progress: { ...payload.progress },
  };
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function isNonNegativeNumber(value) {
  return isFiniteNumber(value) && value >= 0;
}

function isValidPayload(payload) {
  if (!isPlainObject(payload) || !isPlainObject(payload.settings) || !isPlainObject(payload.progress)) {
    return false;
  }

  const { settings, progress } = payload;
  return (
    QUALITY_VALUES.has(settings.quality)
    && BACKEND_VALUES.has(settings.backend)
    && isFiniteNumber(settings.mouseSensitivity)
    && settings.mouseSensitivity > 0
    && isFiniteNumber(settings.musicVolume)
    && settings.musicVolume >= 0
    && settings.musicVolume <= 1
    && isFiniteNumber(progress.districtsVisited)
    && progress.districtsVisited >= 1
    && isNonNegativeNumber(progress.threatsDestroyed)
    && isNonNegativeNumber(progress.carsThrown)
    && isNonNegativeNumber(progress.playTimeSeconds)
  );
}

export function createSaveStore() {
  return {
    load() {
      let raw = '';

      try {
        raw = localStorage.getItem(PRIMARY_KEY);
        if (!raw) return cloneDefaults({ _isDefault: true });

        const blob = JSON.parse(raw);
        if (!blob || blob.version !== CURRENT_VERSION || blob.schemaHash !== SCHEMA_HASH) {
          return this._recover(raw, 'version mismatch');
        }

        const payloadStr = JSON.stringify(blob.payload);
        if (typeof payloadStr !== 'string' || checksum(payloadStr) !== blob.payloadChecksum) {
          return this._recover(raw, 'checksum mismatch');
        }

        if (!isValidPayload(blob.payload)) {
          return this._recover(raw, 'payload validation failed');
        }

        return clonePayload(blob.payload);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return this._recover(raw, `parse error: ${message}`);
      }
    },
    save(payload) {
      try {
        const payloadStr = JSON.stringify(payload);
        const blob = {
          version: CURRENT_VERSION,
          schemaHash: SCHEMA_HASH,
          payload,
          payloadChecksum: checksum(payloadStr),
        };
        localStorage.setItem(PRIMARY_KEY, JSON.stringify(blob));
        return true;
      } catch (err) {
        console.warn('[save] localStorage save failed', err);
        return false;
      }
    },
    _recover(rawBad, reason) {
      this._backupAndReset(rawBad, reason);
      return cloneDefaults({ _isDefault: true, _recoveredFromCorruption: true });
    },
    _backupAndReset(rawBad, reason) {
      try {
        localStorage.setItem(BACKUP_KEY, rawBad);
        console.warn(`[save] save corruption detected (${reason}); backed up to super:save:backup`);
      } catch (e) {
        // localStorage quota exhausted maybe - non-fatal.
      }
    },
    DEFAULTS,
  };
}
