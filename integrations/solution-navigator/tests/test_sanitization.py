import unittest
import os
from solution_navigator.core.sanitization import sanitize_text, validate_path

class TestSanitization(unittest.TestCase):
    def test_redact_api_keys(self):
        sample = "Error al conectar con DEEPSEEK_API_KEY=sk-abcdef123456789012345678"
        sanitized = sanitize_text(sample)
        self.assertNotIn("sk-abcdef123456789012345678", sanitized)
        self.assertIn("[REDACTED", sanitized)

    def test_redact_bearer_token(self):
        sample = "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.token"
        sanitized = sanitize_text(sample)
        self.assertNotIn("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9", sanitized)
        self.assertIn("[REDACTED_BEARER_TOKEN]", sanitized)

    def test_redact_private_key(self):
        sample = "-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA...\n-----END RSA PRIVATE KEY-----"
        sanitized = sanitize_text(sample)
        self.assertNotIn("MIIEowIBAAKCAQEA", sanitized)
        self.assertIn("[REDACTED_PRIVATE_KEY]", sanitized)

    def test_path_traversal_prevention(self):
        base_dir = "/tmp/sandbox_project"
        os.makedirs(base_dir, exist_ok=True)

        # Valid subpath
        valid, _ = validate_path("/tmp/sandbox_project/src/main.py", base_dir)
        self.assertTrue(valid)

        # Attempt to escape base directory via ..
        invalid, err = validate_path("/tmp/sandbox_project/../../etc/passwd", base_dir)
        self.assertFalse(invalid)
        self.assertIn("Acceso denegado", err)

        # Root access attempt
        invalid_root, _ = validate_path("/etc/shadow", base_dir)
        self.assertFalse(invalid_root)

if __name__ == "__main__":
    unittest.main()
