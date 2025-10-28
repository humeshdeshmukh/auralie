from typing import Optional, List
from datetime import datetime
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from app.database.models.user import User as DBUser
from app.schemas.user import UserCreate, UserUpdate, UserInDB

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def get_user(db: Session, user_id: int) -> Optional[DBUser]:
    return db.query(DBUser).filter(DBUser.id == user_id).first()

def get_user_by_email(db: Session, email: str) -> Optional[DBUser]:
    return db.query(DBUser).filter(DBUser.email == email).first()

def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[DBUser]:
    return db.query(DBUser).offset(skip).limit(limit).all()

def create_user(db: Session, user: UserCreate) -> DBUser:
    hashed_password = get_password_hash(user.password)
    db_user = DBUser(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password,
        full_name=user.full_name,
        gender=user.gender,
        date_of_birth=user.date_of_birth,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user(db: Session, user_id: int, user: UserUpdate) -> DBUser:
    db_user = get_user(db, user_id=user_id)
    if not db_user:
        return None
    
    update_data = user.dict(exclude_unset=True)
    if 'password' in update_data:
        update_data['hashed_password'] = get_password_hash(update_data.pop('password'))
    
    for field, value in update_data.items():
        setattr(db_user, field, value)
    
    db_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int) -> bool:
    db_user = get_user(db, user_id=user_id)
    if not db_user:
        return False
    db.delete(db_user)
    db.commit()
    return True

def authenticate_user(db: Session, email: str, password: str) -> Optional[DBUser]:
    user = get_user_by_email(db, email=email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user
