# JWT Secret Key Generator

## Quick Start

### Windows
```bash
generate-secret-key.bat
```

### Mac/Linux
```bash
chmod +x generate-secret-key.sh
./generate-secret-key.sh
```

### Direct Python
```bash
python generate-secret-key.py
```

## What It Does

Generates a cryptographically secure random 64-character secret key for JWT authentication.

## Example Output

```
======================================================================
JWT SECRET KEY GENERATOR
======================================================================

Your new JWT secret key:

aB3$xY9#mK2@pL5&qR8*nS1!tU4%vW7^wX0+yZ6-cD2=eF5~gH8

======================================================================

Copy this key and paste it in your backend/.env file:
JWT_SECRET_KEY=aB3$xY9#mK2@pL5&qR8*nS1!tU4%vW7^wX0+yZ6-cD2=eF5~gH8

⚠️  IMPORTANT: Keep this key secret and never commit it to git!
======================================================================
```

## How to Use

1. Run the script
2. Copy the generated key
3. Open `backend/.env`
4. Replace the value of `JWT_SECRET_KEY` with your new key
5. Restart your backend server

## Security Notes

✅ Uses Python's `secrets` module (cryptographically secure)  
✅ 64 characters long  
✅ Includes letters, numbers, and special characters  
⚠️ Never commit your secret key to version control  
⚠️ Use different keys for development and production  
⚠️ Rotate keys periodically for better security  

## Alternative Methods

### Using OpenSSL (if available)
```bash
openssl rand -base64 48
```

### Using Node.js
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

### Online (NOT RECOMMENDED for production)
Only use online generators for development/testing:
- https://randomkeygen.com/
- https://www.grc.com/passwords.htm

**Always generate production keys locally!**
