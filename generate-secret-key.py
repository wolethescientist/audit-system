#!/usr/bin/env python3
"""
Generate a secure JWT secret key
Run this script to generate a random secret key for JWT authentication
"""

import secrets
import base64

def generate_secret_key():
    """
    Generate a cryptographically secure random secret key
    Returns a URL-safe base64 encoded 256-bit (32 bytes) key
    """
    # Generate 32 random bytes (256 bits)
    random_bytes = secrets.token_bytes(32)
    # Encode as URL-safe base64 (no special chars that cause issues)
    secret_key = base64.urlsafe_b64encode(random_bytes).decode('utf-8')
    return secret_key

def generate_hex_key():
    """
    Alternative: Generate a hex-encoded key (simpler, no special chars)
    Returns a 64-character hexadecimal string
    """
    return secrets.token_hex(32)

if __name__ == "__main__":
    print("=" * 70)
    print("JWT SECRET KEY GENERATOR")
    print("=" * 70)
    print()
    
    # Generate both types
    base64_key = generate_secret_key()
    hex_key = generate_hex_key()
    
    print("Option 1: Base64 URL-Safe Key (Recommended)")
    print("-" * 70)
    print(base64_key)
    print()
    print("Copy this to your backend/.env file:")
    print(f"JWT_SECRET_KEY={base64_key}")
    print()
    print()
    
    print("Option 2: Hexadecimal Key (Alternative)")
    print("-" * 70)
    print(hex_key)
    print()
    print("Copy this to your backend/.env file:")
    print(f"JWT_SECRET_KEY={hex_key}")
    print()
    print()
    
    print("=" * 70)
    print("⚠️  IMPORTANT:")
    print("  - Keep this key secret and never commit it to git!")
    print("  - Use different keys for development and production")
    print("  - Both options are equally secure (256-bit entropy)")
    print("=" * 70)
