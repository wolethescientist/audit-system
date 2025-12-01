#!/usr/bin/env python3
"""Fix all enum values to uppercase in SQL file"""

with open('comprehensive-dummy-data.sql', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace all enum values with uppercase versions
replacements = {
    "'high'": "'HIGH'",
    "'medium'": "'MEDIUM'",
    "'low'": "'LOW'",
    "'critical'": "'CRITICAL'",
    "'draft'": "'DRAFT'",
    "'under_review'": "'UNDER_REVIEW'",
    "'approved'": "'APPROVED'",
    "'rejected'": "'REJECTED'",
    "'published'": "'PUBLISHED'",
    "'pending'": "'PENDING'",
    "'in_progress'": "'IN_PROGRESS'",
    "'completed'": "'COMPLETED'",
    "'signed'": "'SIGNED'",
    "'reviewed'": "'REVIEWED'",
    "'acknowledged'": "'ACKNOWLEDGED'",
    "'returned'": "'RETURNED'",
}

for old, new in replacements.items():
    content = content.replace(old, new)

with open('comprehensive-dummy-data.sql', 'w', encoding='utf-8') as f:
    f.write(content)

print("✓ Fixed all enum values to uppercase")
