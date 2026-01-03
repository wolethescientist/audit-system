"""
Two-Factor Authentication (2FA) Service
Implements TOTP (Time-based One-Time Password) for enhanced security
"""

import pyotp
import qrcode
import io
import base64
import secrets
import hashlib
import json
from typing import List, Tuple, Optional


class TOTPService:
    """Service for managing TOTP-based two-factor authentication"""
    
    ISSUER_NAME = "Galaxy Audit System"
    BACKUP_CODE_COUNT = 10
    BACKUP_CODE_LENGTH = 8
    
    @staticmethod
    def generate_secret() -> str:
        """Generate a new TOTP secret key"""
        return pyotp.random_base32()
    
    @staticmethod
    def get_totp(secret: str) -> pyotp.TOTP:
        """Get TOTP instance for a given secret"""
        return pyotp.TOTP(secret)
    
    @classmethod
    def generate_qr_code(cls, secret: str, user_email: str) -> str:
        """
        Generate a QR code for authenticator app setup
        Returns base64 encoded PNG image
        """
        totp = cls.get_totp(secret)
        provisioning_uri = totp.provisioning_uri(
            name=user_email,
            issuer_name=cls.ISSUER_NAME
        )
        
        # Generate QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(provisioning_uri)
        qr.make(fit=True)
        
        # Create image
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to base64
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        
        return f"data:image/png;base64,{img_base64}"
    
    @classmethod
    def verify_code(cls, secret: str, code: str) -> bool:
        """
        Verify a TOTP code
        Allows for 1 time step tolerance (30 seconds before/after)
        """
        if not secret or not code:
            return False
        
        totp = cls.get_totp(secret)
        # valid_window=1 allows codes from 30 seconds before/after current time
        return totp.verify(code, valid_window=1)
    
    @classmethod
    def generate_backup_codes(cls) -> Tuple[List[str], List[str]]:
        """
        Generate backup recovery codes
        Returns tuple of (plain_codes, hashed_codes)
        Plain codes are shown to user once, hashed codes are stored in DB
        """
        plain_codes = []
        hashed_codes = []
        
        for _ in range(cls.BACKUP_CODE_COUNT):
            # Generate random code
            code = secrets.token_hex(cls.BACKUP_CODE_LENGTH // 2).upper()
            # Format as XXXX-XXXX for readability
            formatted_code = f"{code[:4]}-{code[4:]}"
            plain_codes.append(formatted_code)
            
            # Hash the code for storage
            hashed = cls.hash_backup_code(formatted_code)
            hashed_codes.append(hashed)
        
        return plain_codes, hashed_codes
    
    @staticmethod
    def hash_backup_code(code: str) -> str:
        """Hash a backup code for secure storage"""
        # Remove formatting and lowercase for consistent hashing
        normalized = code.replace("-", "").lower()
        return hashlib.sha256(normalized.encode()).hexdigest()
    
    @classmethod
    def verify_backup_code(cls, code: str, stored_hashes_json: str) -> Tuple[bool, Optional[str]]:
        """
        Verify a backup code against stored hashes
        Returns (is_valid, updated_hashes_json)
        If valid, the used code is removed from the list
        """
        if not code or not stored_hashes_json:
            return False, None
        
        try:
            stored_hashes = json.loads(stored_hashes_json)
        except json.JSONDecodeError:
            return False, None
        
        code_hash = cls.hash_backup_code(code)
        
        if code_hash in stored_hashes:
            # Remove used code
            stored_hashes.remove(code_hash)
            updated_json = json.dumps(stored_hashes)
            return True, updated_json
        
        return False, None
    
    @staticmethod
    def get_remaining_backup_codes_count(stored_hashes_json: str) -> int:
        """Get the count of remaining backup codes"""
        if not stored_hashes_json:
            return 0
        
        try:
            stored_hashes = json.loads(stored_hashes_json)
            return len(stored_hashes)
        except json.JSONDecodeError:
            return 0


# Singleton instance
totp_service = TOTPService()
