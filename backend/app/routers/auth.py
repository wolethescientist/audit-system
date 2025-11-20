from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.schemas import Token, UserCreate, UserResponse
from app.auth import create_access_token, get_current_user
from uuid import uuid4

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
    
    token_data = {
        "user_id": str(user.id),
        "role": user.role.value,
        "department_id": str(user.department_id) if user.department_id else None
    }
    access_token = create_access_token(data=token_data)
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/validate")
def validate_token(current_user: User = Depends(get_current_user)):
    return {"valid": True, "user_id": str(current_user.id), "role": current_user.role}
