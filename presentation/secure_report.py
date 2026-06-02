"""
Encrypt / decrypt the written report so only holders of the access token can open it.

The encrypted blob (assets/report.enc) is SAFE to commit to a public repo — it is
useless without the token. The plaintext .docx must NEVER be committed.

File format:  [16-byte random salt][Fernet token]
Key:          PBKDF2-HMAC-SHA256(token, salt, 200k iters) -> 32 bytes -> urlsafe b64
Auth:         Fernet is authenticated (HMAC), so a wrong token fails cleanly.

Usage (PowerShell):
    $env:REPORT_TOKEN = "your-secret-token"
    python presentation/secure_report.py encrypt        # (re)build report.enc — rotates the token
    python presentation/secure_report.py decrypt         # sanity check: is the token valid?
    python presentation/secure_report.py decrypt out.docx  # write the decrypted file out
"""

import base64
import os
import sys
from pathlib import Path

from cryptography.fernet import Fernet, InvalidToken
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

ASSETS = Path(__file__).resolve().parent / "assets"
PLAINTEXT = ASSETS / "SRWA_Report_NKAFU_CT23A129_v2.docx"
ENC = ASSETS / "report.enc"
ITERATIONS = 200_000


def derive_key(token: str, salt: bytes) -> bytes:
    kdf = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=salt, iterations=ITERATIONS)
    return base64.urlsafe_b64encode(kdf.derive(token.encode("utf-8")))


def encrypt(token: str) -> None:
    if not PLAINTEXT.exists():
        sys.exit(f"Plaintext report not found: {PLAINTEXT}")
    salt = os.urandom(16)
    blob = Fernet(derive_key(token, salt)).encrypt(PLAINTEXT.read_bytes())
    ENC.write_bytes(salt + blob)
    print(f"Encrypted -> {ENC}  ({ENC.stat().st_size:,} bytes)")


def decrypt(token: str, out: str | None = None) -> None:
    if not ENC.exists():
        sys.exit(f"Encrypted report not found: {ENC}")
    raw = ENC.read_bytes()
    salt, blob = raw[:16], raw[16:]
    try:
        plain = Fernet(derive_key(token, salt)).decrypt(blob)
    except InvalidToken:
        sys.exit("WRONG TOKEN — access denied.")
    if out:
        Path(out).write_bytes(plain)
        print(f"Decrypted -> {out}  ({len(plain):,} bytes)")
    else:
        print(f"Token valid. Plaintext is {len(plain):,} bytes.")


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "encrypt"
    tok = os.environ.get("REPORT_TOKEN")
    if not tok:
        sys.exit("Set REPORT_TOKEN first, e.g.  $env:REPORT_TOKEN = 'your-token'")
    if cmd == "encrypt":
        encrypt(tok)
    elif cmd == "decrypt":
        decrypt(tok, sys.argv[2] if len(sys.argv) > 2 else None)
    else:
        sys.exit(f"Unknown command: {cmd} (use 'encrypt' or 'decrypt')")
