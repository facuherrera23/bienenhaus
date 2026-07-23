from __future__ import annotations
from flask import current_app
from extensions import db


class TasacionSync:
    """Dual-write sync for shadow/cutover phases.

    Phase 1 (shadow): tasaciones is source of truth. Writes from AppraisalService
    with tipo='tasacion' also write to tasaciones table for compatibility.
    Phase 2 (cutover): appraisals becomes source of truth. Legacy reads from
    /api/tasaciones still work via shared handler filtering tipo='tasacion'.
    """

    ENABLED = True

    @classmethod
    def _enabled(cls) -> bool:
        return cls.ENABLED and current_app.config.get('DUAL_WRITE_TASACIONES', True)

    @classmethod
    def on_create(cls, appraisal) -> None:
        if not cls._enabled() or appraisal.tipo != 'tasacion':
            return
        # Shadow write to legacy tasaciones table during transition
        # Implementation delegated to migration phase
        pass

    @classmethod
    def on_update(cls, appraisal) -> None:
        if not cls._enabled() or appraisal.tipo != 'tasacion':
            return
        pass

    @classmethod
    def on_delete(cls, appraisal_id: int) -> None:
        if not cls._enabled():
            return
        pass

    sync_create = on_create
    sync_update = on_update
    sync_delete = on_delete