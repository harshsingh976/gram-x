import json
import re

# Read all 4 locale files
files = {
    'en': r'frontend\src\i18n\locales\en.ts',
    'hi': r'frontend\src\i18n\locales\hi.ts',
    'ta': r'frontend\src\i18n\locales\ta.ts',
    'te': r'frontend\src\i18n\locales\te.ts',
}

def extract_keys(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    # Find all "key": "value"
    matches = re.findall(r'"([a-zA-Z0-9_\.\-]+)"\s*:', content)
    return set(matches)

keys_by_lang = {lang: extract_keys(path) for lang, path in files.items()}

print("======================================================================")
print("GRAM-X MULTILINGUAL i18n VALIDATION SUITE (Directive #35)")
print("======================================================================")

base_keys = keys_by_lang['en']
print(f"Total Base Translation Keys in 'en': {len(base_keys)}")

all_pass = True
for lang, k_set in keys_by_lang.items():
    missing = base_keys - k_set
    print(f"[{lang.upper()}] Keys: {len(k_set)} | Missing vs EN: {len(missing)}")
    if len(missing) > 0:
        print(f"  Missing in {lang}: {list(missing)[:5]}...")
        all_pass = False

if all_pass:
    print("ALL 4 LOCALES (HI, TA, TE, EN) HAVE 100% KEY PARITY!")
else:
    print("WARNING: Some keys are missing.")
