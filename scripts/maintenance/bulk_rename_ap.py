"""
bulk_rename_ap.py — Rename 156 ap_* classes to semantic names.

Usage: python scripts/maintenance/bulk_rename_ap.py
"""
import re, sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
CSS = REPO / 'frontend/css/admin/12-appraisals.css'
JS  = REPO / 'frontend/js/admin-appraisals.js'
MAP_PATH = REPO / 'frontend/tests/_rename_analysis.py'

# ── Rename Map (ap_oldname → ap-newname) ────────────────────────────
RENAMES = {
    # ap_background (19)
    'ap_background': 'ap-surface-accent',
    'ap_background_1': 'ap-delete-btn-bg',
    'ap_background_2': 'ap-map-container',
    'ap_background_3': 'ap-detail-card',
    'ap_background_4': 'ap-progress-track',
    'ap_background_5': 'ap-hero-card',
    'ap_background_6': 'ap-label-chip',
    'ap_background_7': 'ap-progress-fill',
    'ap_background_8': 'ap-info-card',
    'ap_background_9': 'ap-section-card',
    'ap_background_10': 'ap-chip-card',
    'ap_background_11': 'ap-tag-row',
    'ap_background_12': 'ap-compact-card',
    'ap_background_13': 'ap-compact-card-center',
    'ap_background_14': 'ap-badge-muted',
    'ap_background_15': 'ap-expandable-section',
    'ap_background_16': 'ap-chip-card-center',
    'ap_background_17': 'ap-modal-surface',
    'ap_background_18': 'ap-modal-close-btn',

    # ap_align_items (10)
    'ap_align_items': 'ap-flex-row-between',
    'ap_align_items_1': 'ap-flex-row-center-sm',
    'ap_align_items_2': 'ap-flex-row-divider',
    'ap_align_items_3': 'ap-actions-bar-right',
    'ap_align_items_4': 'ap-flex-row-tag',
    'ap_align_items_5': 'ap-flex-row-between-sm',
    'ap_align_items_6': 'ap-flex-row-between-md',
    'ap_align_items_7': 'ap-flex-row-list-item',
    'ap_align_items_8': 'ap-flex-row-gap-sm',
    'ap_align_items_9': 'ap-modal-header-row',

    # ap_border_bottom (9)
    'ap_border_bottom': 'ap-table-row',
    'ap_border_bottom_1': 'ap-table-cell-left',
    'ap_border_bottom_2': 'ap-table-cell-muted',
    'ap_border_bottom_3': 'ap-table-cell-dim',
    'ap_border_bottom_4': 'ap-table-cell-accent',
    'ap_border_bottom_5': 'ap-table-cell-bold',
    'ap_border_bottom_6': 'ap-table-cell-soft',
    'ap_border_bottom_7': 'ap-divider-wide',
    'ap_border_bottom_8': 'ap-divider-narrow',

    # ap_border_* (5)
    'ap_border_collapse': 'ap-table-full',
    'ap_border_radius': 'ap-avatar-round',
    'ap_border_top': 'ap-divider-light',
    'ap_border_top_1': 'ap-flex-wrap',
    'ap_border_top_2': 'ap-modal-footer',

    # ap_color (74)
    'ap_color': 'ap-btn-text-light',
    'ap_color_1': 'ap-label-small',
    'ap_color_2': 'ap-label-dim',
    'ap_color_3': 'ap-link-accent',
    'ap_color_4': 'ap-value-small',
    'ap_color_5': 'ap-hint-text',
    'ap_color_6': 'ap-body-text',
    'ap_color_7': 'ap-error-emphasis',
    'ap_color_8': 'ap-label-inline',
    'ap_color_9': 'ap-link-underlined',
    'ap_color_10': 'ap-link-hover',
    'ap_color_11': 'ap-empty-state',
    'ap_color_12': 'ap-warning-label',
    'ap_color_13': 'ap-text-dark',
    'ap_color_14': 'ap-text-medium',
    'ap_color_15': 'ap-brand-right',
    'ap_color_16': 'ap-brand-label',
    'ap_color_17': 'ap-empty-state-lg',
    'ap_color_18': 'ap-metric-number',
    'ap_color_19': 'ap-overline',
    'ap_color_20': 'ap-icon-col',
    'ap_color_21': 'ap-number-col',
    'ap_color_22': 'ap-section-label',
    'ap_color_23': 'ap-label-muted',
    'ap_color_24': 'ap-value-xl',
    'ap_color_25': 'ap-value-lg',
    'ap_color_26': 'ap-value-md',
    'ap_color_27': 'ap-empty-row',
    'ap_color_28': 'ap-empty-card',
    'ap_color_29': 'ap-overline-compact',
    'ap_color_30': 'ap-inline-hint',
    'ap_color_31': 'ap-inline-note',
    'ap_color_32': 'ap-meta-right',
    'ap_color_33': 'ap-section-overline',
    'ap_color_34': 'ap-empty-row-light',
    'ap_color_35': 'ap-icon-col-muted',
    'ap_color_36': 'ap-number-col-muted',
    'ap_color_37': 'ap-overline-accent',
    'ap_color_38': 'ap-text-muted-light',
    'ap_color_39': 'ap-value-xl-light',
    'ap_color_40': 'ap-value-lg-light',
    'ap_color_41': 'ap-value-md-light',
    'ap_color_42': 'ap-overline-card',
    'ap_color_43': 'ap-empty-card-sm',
    'ap_color_44': 'ap-label-nowrap',
    'ap_color_45': 'ap-text-secondary',
    'ap_color_46': 'ap-label-dim-sm',
    'ap_color_47': 'ap-text-fill',
    'ap_color_48': 'ap-btn-text-emphasis',
    'ap_color_49': 'ap-overline-tight',
    'ap_color_50': 'ap-label-soft',
    'ap_color_51': 'ap-link-accent-sm',
    'ap_color_52': 'ap-overline-section',
    'ap_color_53': 'ap-btn-text-white',
    'ap_color_54': 'ap-text-accent',
    'ap_color_55': 'ap-text-dim',
    'ap_color_56': 'ap-text-soft',
    'ap_color_57': 'ap-overline-tiny',
    'ap_color_58': 'ap-label-with-space',
    'ap_color_59': 'ap-label-compact',
    'ap_color_60': 'ap-hint-tiny',
    'ap_color_61': 'ap-overline-strong',
    'ap_color_62': 'ap-overline-section-sm',
    'ap_color_63': 'ap-overline-micro',
    'ap_color_64': 'ap-value-md-emphasis',
    'ap_color_65': 'ap-value-md-accent',
    'ap_color_66': 'ap-error-text',
    'ap_color_67': 'ap-warning-text',
    'ap_color_68': 'ap-hero-title',
    'ap_color_69': 'ap-link-accent-bold',
    'ap_color_70': 'ap-footnote-italic',
    'ap_color_71': 'ap-text-muted-base',
    'ap_color_72': 'ap-footnote-italic-sm',
    'ap_color_73': 'ap-footnote-spaced',

    # ap_display (12)
    'ap_display': 'ap-flex-wrap-sm',
    'ap_display_1': 'ap-two-col-grid',
    'ap_display_2': 'ap-auto-grid',
    'ap_display_3': 'ap-flex-row-tight',
    'ap_display_4': 'ap-four-col-grid',
    'ap_display_5': 'ap-two-col-grid-md',
    'ap_display_6': 'ap-flex-col',
    'ap_display_7': 'ap-two-col-grid-sm',
    'ap_display_8': 'ap-hidden',
    'ap_display_9': 'ap-two-col-grid-wide',
    'ap_display_10': 'ap-three-col-grid',
    'ap_display_11': 'ap-flex-row-sm',

    # ap_flex (3)
    'ap_flex': 'ap-flex-1-min',
    'ap_flex_1': 'ap-flex-1',
    'ap_flex_shrink': 'ap-flex-shrink-right',

    # ap_font_size (11)
    'ap_font_size': 'ap-badge-sm',
    'ap_font_size_1': 'ap-btn-compact',
    'ap_font_size_2': 'ap-text-base',
    'ap_font_size_3': 'ap-text-block',
    'ap_font_size_4': 'ap-input-full',
    'ap_font_size_5': 'ap-text-sm',
    'ap_font_size_6': 'ap-btn-icon-sm',
    'ap_font_size_7': 'ap-badge-tiny',
    'ap_font_size_8': 'ap-badge-compact',
    'ap_font_size_9': 'ap-btn-nowrap',
    'ap_font_size_10': 'ap-hint-sm',

    # ap_font_weight (1)
    'ap_font_weight': 'ap-label-right',

    # ap_grid_column (1)
    'ap_grid_column': 'ap-full-width',

    # ap_margin (8)
    'ap_margin_bottom': 'ap-stack-sm',
    'ap_margin_bottom_1': 'ap-stack-md',
    'ap_margin_bottom_2': 'ap-stack-base',
    'ap_margin_top': 'ap-stack-lg',
    'ap_margin_top_1': 'ap-stack-xl',
    'ap_margin_top_2': 'ap-stack-top-base',
    'ap_margin_top_3': 'ap-stack-top-sm',
    'ap_margin_top_4': 'ap-stack-top-xs',

    # Others (3)
    'ap_max_height': 'ap-scroll-area',
    'ap_overflow_y': 'ap-scroll-content',
    'ap_text_align': 'ap-text-right',
}

def rename_in_file(filepath, description):
    """Replace old class names with new using word-boundary-aware regex."""
    content = filepath.read_text(encoding='utf-8')
    original = content
    total = 0

    # Sort by old name length descending to avoid partial matches
    for old, new in sorted(RENAMES.items(), key=lambda x: -len(x[0])):
        # Replace ap_xxx when NOT part of a longer identifier (no \w chars adjacent)
        # Handles: CSS .ap_xxx, JS "ap_xxx", 'ap_xxx', template strings, class lists
        content, n = re.subn(rf'(?<!\w){old}(?!\w)', new, content)
        total += n

    changed = (content != original)
    if changed:
        filepath.write_text(content, encoding='utf-8')
        print(f"  [OK] {description}: {total} replacements")
    else:
        print(f"  [?] {description}: no changes detected (already renamed?)")
    return changed

def rename_css():
    """CSS rename: replace .ap_xxx with .ap-newname in class DEFINITIONS only.
    We use the general file rename which handles .oldname → .newname."""
    return rename_in_file(CSS, "CSS (12-appraisals.css)")

def rename_js():
    """JS rename: replace 'ap_xxx' with 'ap-newname' in string literals."""
    return rename_in_file(JS, "JS (admin-appraisals.js)")

def validate():
    """Ensure no old ap_* names remain in CSS or JS (excluding cascade overrides)."""
    css_content = CSS.read_text(encoding='utf-8')
    js_content = JS.read_text(encoding='utf-8')

    remaining = []
    for old in RENAMES:
        if re.search(rf'(?<!\w){old}(?!\w)', css_content):
            remaining.append(('CSS', old))
        if re.search(rf'(?<!\w){old}(?!\w)', js_content):
            remaining.append(('JS', old))

    if remaining:
        print(f"\n  [!] {len(remaining)} old names still present:")
        for src, name in remaining[:10]:
            print(f"      {src}: {name}")
        if len(remaining) > 10:
            print(f"      ... and {len(remaining)-10} more")
        return False
    return True

def count_in_file(filepath):
    """Count occurrences of old vs new names in a file."""
    content = filepath.read_text(encoding='utf-8')
    old_count = sum(content.count(old) for old in RENAMES)
    new_count = sum(content.count(new) for new in RENAMES.values())
    return old_count, new_count

def main():
    print("=" * 60)
    print("  BULK RENAME: 156 ap_* -> semantic classes")
    print("=" * 60)
    print()

    css_changed = rename_css()
    js_changed = rename_js()

    print()
    if css_changed or js_changed:
        print("  Validating...")
        if validate():
            print("  [OK] All old names replaced")
        else:
            print("  [WARN] Some names remain (may be cascade overrides)")
    else:
        print("  [!] Nothing changed — already renamed?")

    old_css, new_css = count_in_file(CSS)
    old_js, new_js = count_in_file(JS)
    print(f"\n  CSS: {old_css} old refs -> {new_css} new refs (estimated)")
    print(f"  JS:  {old_js} old refs -> {new_js} new refs (estimated)")
    print("\n  Done. Run build + tests next.")

if __name__ == '__main__':
    main()
