"""
fix_dup_classes.py — Merge duplicated `class=""` attributes in admin JS files.

The auto-migration script added a second `class="ap_xxx"` attribute instead of
merging into the existing one. Browsers ignore the second class attribute.

Fixes: class="A" [any attrs] class="B" → class="A B" [any attrs]
"""
import re, sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
JS_DIR = REPO / 'frontend' / 'js'
FILES = [
    'admin-appraisals.js',
    'admin-crud.js',
    'admin-portals.js',
]

def fix_dup_classes(content):
    """Merge duplicate class="" attributes within the same HTML tag.

    Pattern: class="X" ... class="Y" → class="X Y" ...
    The [^>]* ensures we stay within the same element (can't cross a >).
    """
    return re.sub(
        r'class="([^"]*)"([^>]*)class="([^"]*)"',
        r'class="\1 \3"\2',
        content
    )

def main():
    total_fixes = 0
    for fname in FILES:
        fpath = JS_DIR / fname
        if not fpath.exists():
            print(f"  [!] Not found: {fpath.name}")
            continue
        before = fpath.read_text(encoding='utf-8')
        after = fix_dup_classes(before)
        fixes = (before != after)
        if fixes:
            count_before = len(re.findall(r'class="[^"]*"[^>]*class="', before))
            count_after = len(re.findall(r'class="[^"]*"[^>]*class="', after))
            fpath.write_text(after, encoding='utf-8')
            fixed = count_before - count_after
            total_fixes += fixed
            print(f"  [{fname}] Fixed {fixed} duplicate class attributes "
                  f"(before={count_before}, after={count_after})")
        else:
            print(f"  [{fname}] No duplicates found")

    print(f"\n  Total: {total_fixes} duplicates fixed across {len(FILES)} files")
    return 0 if total_fixes > 0 else 1

if __name__ == '__main__':
    sys.exit(main())
