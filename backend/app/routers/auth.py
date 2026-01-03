from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.schemas import (
    Token, UserCreate, UserResponse,
    TwoFactorSetupResponse, TwoFactorVerifyRequest, TwoFactorVerifyResponse,
    TwoFactorStatusResponse, TwoFactorDisableRequest
)
from app.auth import create_access_token, get_current_user
from app.services.totp_service import totp_service
from uuid import uuid4
import json

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/signup", response_model=UserResponse)
def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    new_user = User(
        id=uuid4(),
        email=user_data.email,
        full_name=user_data.full_name,
        role=user_data.role,
        department_id=user_data.department_id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

@router.post("/login", response_model=Token)
def login(email: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email, User.is_active == True).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Check if 2FA is enabled
    if user.totp_enabled:
        # Generate temporary token for 2FA verification
        temp_token_data = {
            "user_id": str(user.id),
            "purpose": "2fa_verification"
        }
        temp_token = create_access_token(data=temp_token_data, expires_minutes=5)
        
        return Token(
            access_token="",
            token_type="bearer",
            requires_2fa=True,
            temp_token=temp_token
        )
    
    # No 2FA, generate full access token
    token_data = {
        "user_id": str(user.id),
        "role": user.role.value if hasattr(user.role, 'value') else str(user.role),
        "department_id": str(user.department_id) if user.department_id else None
    }
    access_token = create_access_token(data=token_data)
    
    return Token(access_token=access_token, token_type="bearer", requires_2fa=False)

@router.post("/login/2fa", response_model=TwoFactorVerifyResponse)
def verify_2fa_login(
    request: TwoFactorVerifyRequest,
    db: Session = Depends(get_db)
):
    """Complete login with 2FA verification"""
    from jose import jwt, JWTError
    from app.auth import SECRET_KEY, ALGORITHM
    
    if not request.temp_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Temporary token is required"
        )
    
    try:
        # Decode temporary token
        payload = jwt.decode(request.temp_token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        purpose = payload.get("purpose")
        
        if purpose != "2fa_verification":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid token purpose"
            )
        
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Verify TOTP code
        if totp_service.verify_code(user.totp_secret, request.code):
            # Generate full access token
            token_data = {
                "user_id": str(user.id),
                "role": user.role.value if hasattr(user.role, 'value') else str(user.role),
                "department_id": str(user.department_id) if user.department_id else None
            }
            access_token = create_access_token(data=token_data)
            
            return TwoFactorVerifyResponse(
                success=True,
                message="2FA verification successful",
                access_token=access_token,
                token_type="bearer"
            )
        
        # Try backup code
        if user.backup_codes:
            is_valid, updated_codes = totp_service.verify_backup_code(request.code, user.backup_codes)
            if is_valid:
                user.backup_codes = updated_codes
                db.commit()
                
                token_data = {
                    "user_id": str(user.id),
                    "role": user.role.value if hasattr(user.role, 'value') else str(user.role),
                    "department_id": str(user.department_id) if user.department_id else None
                }
                access_token = create_access_token(data=token_data)
                
                return TwoFactorVerifyResponse(
                    success=True,
                    message="Backup code verified successfully",
                    access_token=access_token,
                    token_type="bearer"
                )
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid verification code"
        )
        
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired temporary token"
        )

@router.get("/validate", response_model=UserResponse)
def validate_token(current_user: User = Depends(get_current_user)):
    return current_user

# 2FA Management Endpoints

@router.post("/2fa/setup", response_model=TwoFactorSetupResponse)
def setup_2fa(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Initialize 2FA setup for current user"""
    if current_user.totp_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA is already enabled for this account"
        )
    
    # Generate new secret
    secret = totp_service.generate_secret()
    
    # Generate QR code
    qr_code = totp_service.generate_qr_code(secret, current_user.email)
    
    # Generate backup codes
    plain_codes, hashed_codes = totp_service.generate_backup_codes()
    
    # Store secret and backup codes (not enabled yet until verified)
    current_user.totp_secret = secret
    current_user.backup_codes = json.dumps(hashed_codes)
    db.commit()
    
    return TwoFactorSetupResponse(
        secret=secret,
        qr_code=qr_code,
        backup_codes=plain_codes,
        message="Scan the QR code with your authenticator app, then verify with a code to enable 2FA"
    )

@router.post("/2fa/verify", response_model=TwoFactorVerifyResponse)
def verify_and_enable_2fa(
    request: TwoFactorVerifyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Verify 2FA code and enable 2FA for the account"""
    if current_user.totp_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA is already enabled"
        )
    
    if not current_user.totp_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA setup not initiated. Please call /2fa/setup first"
        )
    
    # Verify the code
    if not totp_service.verify_code(current_user.totp_secret, request.code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code"
        )
    
    # Enable 2FA
    current_user.totp_enabled = True
    db.commit()
    
    return TwoFactorVerifyResponse(
        success=True,
        message="2FA has been successfully enabled for your account"
    )

@router.post("/2fa/disable", response_model=TwoFactorVerifyResponse)
def disable_2fa(
    request: TwoFactorDisableRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Disable 2FA for current user (requires current 2FA code)"""
    if not current_user.totp_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA is not enabled for this account"
        )
    
    # Verify the code before disabling
    if not totp_service.verify_code(current_user.totp_secret, request.code):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid verification code"
        )
    
    # Disable 2FA
    current_user.totp_enabled = False
    current_user.totp_secret = None
    current_user.backup_codes = None
    db.commit()
    
    return TwoFactorVerifyResponse(
        success=True,
        message="2FA has been disabled for your account"
    )

@router.get("/2fa/status", response_model=TwoFactorStatusResponse)
def get_2fa_status(current_user: User = Depends(get_current_user)):
    """Get current 2FA status for the user"""
    backup_count = totp_service.get_remaining_backup_codes_count(current_user.backup_codes)
    
    return TwoFactorStatusResponse(
        enabled=current_user.totp_enabled or False,
        backup_codes_remaining=backup_count
    )

@router.post("/2fa/regenerate-backup-codes", response_model=TwoFactorSetupResponse)
def regenerate_backup_codes(
    request: TwoFactorVerifyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Regenerate backup codes (requires current 2FA code)"""
    if not current_user.totp_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA is not enabled for this account"
        )
    
    # Verify the code
    if not totp_service.verify_code(current_user.totp_secret, request.code):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid verification code"
        )
    
    # Generate new backup codes
    plain_codes, hashed_codes = totp_service.generate_backup_codes()
    current_user.backup_codes = json.dumps(hashed_codes)
    db.commit()
    
    return TwoFactorSetupResponse(
        secret="",  # Don't expose secret again
        qr_code="",  # Don't regenerate QR code
        backup_codes=plain_codes,
        message="New backup codes generated. Please save them securely."
    )
