import re
import os
from typing import Tuple

SECRET_PATTERNS = [
    # Database connection URLs with passwords
    (re.compile(r'(?i)(postgres|postgresql|mysql|mongodb|redis|amqp|mssql)://([^:]+):([^@]+)@'), r'\1://\2:[REDACTED_PASSWORD]@'),
    # API Keys & Tokens
    (re.compile(r'(?i)(api[_-]?key|secret|token|password|passwd|auth)[ \t]*[:=][ \t]*["\']?([a-zA-Z0-9_\-\.]{8,})["\']?'), r'\1="[REDACTED_SECRET]"'),
    # Bearer Tokens
    (re.compile(r'(?i)bearer[ \t]+[a-zA-Z0-9_\-\.]{15,}'), 'Bearer [REDACTED_BEARER_TOKEN]'),
    # DeepSeek / OpenAI / Anthropic format keys
    (re.compile(r'sk-[a-zA-Z0-9]{20,}'), '[REDACTED_AI_API_KEY]'),
    # Private Key Headers
    (re.compile(r'-----BEGIN [A-Z ]+ PRIVATE KEY-----[\s\S]*?-----END [A-Z ]+ PRIVATE KEY-----'), '[REDACTED_PRIVATE_KEY]'),
    # Generic env variables with sensitive names
    (re.compile(r'(?i)(DEEPSEEK_API_KEY|ANTHROPIC_API_KEY|OPENAI_API_KEY|AWS_SECRET_ACCESS_KEY|GITHUB_TOKEN)[ \t]*=[ \t]*[^\s]+'), r'\1=[REDACTED_KEY]')
]

MAX_EVIDENCE_BYTES = 512 * 1024  # 512 KB per evidence item

def sanitize_text(text: str) -> str:
    """
    Sanitizes strings and log texts, stripping all detected credentials and secret formats.
    """
    if not text:
        return ""
    sanitized = text
    for pattern, replacement in SECRET_PATTERNS:
        sanitized = pattern.sub(replacement, sanitized)
    return sanitized

def validate_path(target_path: str, allowed_base_dir: str) -> Tuple[bool, str]:
    """
    Validates that target_path resides strictly within allowed_base_dir.
    Guards against path traversal (../), symlink escape, and unauthorized root access.
    """
    if not target_path or not allowed_base_dir:
        return False, "Ruta no especificada o directorio base inválido."

    real_base = os.path.realpath(os.path.expanduser(allowed_base_dir))
    real_target = os.path.realpath(os.path.expanduser(target_path))

    # Target must start with real_base directory path
    if real_base == os.sep:
        return True, real_target

    if real_target == real_base or real_target.startswith(real_base + os.sep):
        return True, real_target

    return False, f"Acceso denegado: La ruta '{target_path}' se encuentra fuera del directorio autorizado '{allowed_base_dir}'."
