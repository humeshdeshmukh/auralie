import firebase_admin
from firebase_admin import credentials, auth, firestore, storage, exceptions, db
from fastapi import HTTPException, status, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, Dict, Any, List
import json
import os
from datetime import datetime, timedelta
from ..core.config import settings

# Initialize Firebase Admin SDK
def initialize_firebase():
    if not firebase_admin._apps:
        # Get Firebase credentials from settings
        cred_dict = settings.FIREBASE_CREDENTIALS
        
        cred = credentials.Certificate(cred_dict)
        firebase_admin.initialize_app(cred, {
            'databaseURL': settings.FIREBASE_DATABASE_URL,
            'storageBucket': f"{cred_dict['project_id']}.appspot.com"
        })

# Call initialize_firebase when this module is imported
initialize_firebase()

# Get Firebase services
db = firestore.client()
firebase_auth = auth
firebase_storage = storage.bucket()

# Security
security = HTTPBearer()

class FirebaseAuthError(HTTPException):
    def __init__(self, detail: str, status_code: int = status.HTTP_401_UNAUTHORIZED):
        super().__init__(status_code=status_code, detail=detail, headers={"WWW-Authenticate": "Bearer"})

# Authentication Service
class AuthService:
    @staticmethod
    async def create_user(email: str, password: str, display_name: str = None) -> Dict[str, Any]:
        """Create a new user in Firebase Authentication"""
        try:
            user = auth.create_user(
                email=email,
                password=password,
                display_name=display_name
            )
            return {
                'uid': user.uid,
                'email': user.email,
                'display_name': display_name,
                'email_verified': False
            }
        except auth.EmailAlreadyExistsError:
            raise FirebaseAuthError("Email already exists")
        except Exception as e:
            raise FirebaseAuthError(f"Error creating user: {str(e)}")

    @staticmethod
    async def verify_token(token: str) -> Dict[str, Any]:
        """Verify Firebase ID token and return decoded token"""
        try:
            return auth.verify_id_token(token)
        except auth.ExpiredIdTokenError:
            raise FirebaseAuthError("Token expired")
        except auth.RevokedIdTokenError:
            raise FirebaseAuthError("Token revoked")
        except auth.InvalidIdTokenError:
            raise FirebaseAuthError("Invalid token")
        except Exception as e:
            raise FirebaseAuthError(f"Error verifying token: {str(e)}")

    @staticmethod
    async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
        """Dependency to get current user from Authorization header"""
        token = credentials.credentials
        try:
            decoded_token = await AuthService.verify_token(token)
            user = auth.get_user(decoded_token['uid'])
            return {
                'uid': user.uid,
                'email': user.email,
                'display_name': user.display_name,
                'email_verified': user.email_verified
            }
        except Exception as e:
            raise FirebaseAuthError(str(e))

# Firestore Service
class FirestoreService:
    def __init__(self, collection_name: str):
        self.collection = db.collection(collection_name)

    async def get_document(self, doc_id: str) -> Optional[Dict[str, Any]]:
        """Get a single document by ID"""
        doc = self.collection.document(doc_id).get()
        return self._format_doc(doc)

    async def get_documents(self, filters: Optional[Dict] = None, limit: int = 100) -> List[Dict[str, Any]]:
        """Get multiple documents with optional filters"""
        query = self.collection.limit(limit)
        
        if filters:
            for field, (op, value) in filters.items():
                query = query.where(field, op, value)
                
        return [self._format_doc(doc) for doc in query.stream()]

    async def create_document(self, data: Dict[str, Any]) -> str:
        """Create a new document and return its ID"""
        data['created_at'] = firestore.SERVER_TIMESTAMP
        doc_ref = self.collection.document()
        doc_ref.set(data)
        return doc_ref.id

    async def update_document(self, doc_id: str, data: Dict[str, Any]) -> bool:
        """Update an existing document"""
        data['updated_at'] = firestore.SERVER_TIMESTAMP
        doc_ref = self.collection.document(doc_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            return False
            
        doc_ref.update(data)
        return True

    async def delete_document(self, doc_id: str) -> bool:
        """Delete a document"""
        doc_ref = self.collection.document(doc_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            return False
            
        doc_ref.delete()
        return True

    def _format_doc(self, doc) -> Optional[Dict[str, Any]]:
        """Format Firestore document to dict"""
        if not doc.exists:
            return None
            
        data = doc.to_dict()
        data['id'] = doc.id
        return data

# Storage Service
class StorageService:
    @staticmethod
    async def upload_file(file_path: str, destination_path: str) -> str:
        """Upload a file to Firebase Storage"""
        try:
            blob = firebase_storage.blob(destination_path)
            blob.upload_from_filename(file_path)
            blob.make_public()
            return blob.public_url
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Error uploading file: {str(e)}"
            )

    @staticmethod
    async def get_download_url(file_path: str) -> str:
        """Get a download URL for a file"""
        try:
            blob = firebase_storage.blob(file_path)
            return blob.generate_signed_url(
                expiration=timedelta(hours=1),
                version='v4'
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Error getting download URL: {str(e)}"
            )

class RealtimeDBService:
    def __init__(self):
        self.db = firebase_admin.db
        
    async def get_data(self, path: str) -> Any:
        """Get data from a specific path in Realtime Database"""
        try:
            ref = self.db.reference(path)
            return ref.get()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Error getting data from Realtime Database: {str(e)}"
            )
    
    async def set_data(self, path: str, data: Dict[str, Any]) -> None:
        """Set data at a specific path in Realtime Database"""
        try:
            ref = self.db.reference(path)
            ref.set(data)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Error setting data in Realtime Database: {str(e)}"
            )
    
    async def update_data(self, path: str, updates: Dict[str, Any]) -> None:
        """Update specific fields at a path in Realtime Database"""
        try:
            ref = self.db.reference(path)
            ref.update(updates)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Error updating data in Realtime Database: {str(e)}"
            )
    
    async def delete_data(self, path: str) -> None:
        """Delete data at a specific path in Realtime Database"""
        try:
            ref = self.db.reference(path)
            ref.delete()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Error deleting data from Realtime Database: {str(e)}"
            )

# Initialize services
auth_service = AuthService()
user_service = FirestoreService('users')
cycle_service = FirestoreService('menstrual_cycles')
symptom_service = FirestoreService('symptoms')
realtime_db = RealtimeDBService()
