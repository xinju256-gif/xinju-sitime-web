"""Remove terminal sentence punctuation from heading lines only."""
from html import escape, unescape
import re

TERMINAL = re.compile(r'''[。．.!！?？…]+(?=["'”’»）)\]】]*\s*$)''')


def clean_title_text(text):
    return '\n'.join(TERMINAL.sub('', line) for line in str(text).split('\n'))


def clean_heading_inner(inner):
    lines = re.split(r'(<br\b[^>]*>)', inner, flags=re.I)
    for index in range(0, len(lines), 2):
        tokens = re.split(r'(<[^>]*>)', lines[index])
        for position in range(len(tokens) - 1, -1, -1):
            if tokens[position].startswith('<') or not tokens[position].strip():
                continue
            old = unescape(tokens[position])
            new = clean_title_text(old)
            if new != old:
                tokens[position] = escape(new, quote=False)
            break
        lines[index] = ''.join(tokens)
    return ''.join(lines)


def clean_heading_markup(source):
    return re.sub(r'(<h[1-6]\b[^>]*>)(.*?)(</h[1-6]\s*>)',
                  lambda match: match[1] + clean_heading_inner(match[2]) + match[3], source, flags=re.I | re.S)
