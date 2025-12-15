"""
Supabase Storage Service for Evidence File Management
Handles file uploads, downloads, and management in Supabase S3 bucket
"""
from typing import Optional, BinaryIO
import hashlib
from datetime import datetime
import mimetypes

try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    Client = None

class SupabaseStorageService:
    def __init__(self):
        self._supabase = None
        self._bucket_name = None
        self._initialized = False
    
    def _ensure_initialized(self):
        """Lazy initialization of Supabase client"""
        if self._initialized:
            return
        
        if not SUPABASE_AVAILABLE:
            raise ImportError("supabase package not installed. Run: pip install supabase")
        
        try:
            from app.config import settings
            self._supabase = create_client(
                settings.SUPABASE_URL,
                settings.SUPABASE_ANON_KEY
            )
            self._bucket_name = settings.SUPABASE_BUCKET_NAME
            self._initialized = True
        except Exception as e:
            raise RuntimeError(f"Failed to initialize Supabase client: {e}")
    
    @property
    def supabase(self):
        self._ensure_initialized()
        return self._supabase
    
    @property
    def bucket_name(self):
        self._ensure_initialized()
        return self._bucket_name
    
    def upload_file(
        self,
        file_content: bytes,
        file_name: str,
        audit_id: str,
        user_id: str,
        content_type: Optional[str] = None
    ) -> dict:
        """
        Upload file to Supabase Storage
        
        Args:
            file_content: File content as bytes
            file_name: Original file name
            audit_id: Audit ID for organizing files
            user_id: User ID who uploaded the file
            content_type: MIME type of the file
        
        Returns:
            dict with file_url, file_hash, file_size, and other metadata
        """
        # Generate unique file path
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        file_path = f"audits/{audit_id}/{timestamp}_{file_name}"
        
        # Calculate file hash for integrity
        file_hash = hashlib.sha256(file_content).hexdigest()
        file_size = len(file_content)
        
        # Detect content type if not provided
        if not content_type:
            content_type, _ = mimetypes.guess_type(file_name)
            if not content_type:
                content_type = "application/octet-stream"
        
        try:
            # Upload to Supabase Storage
            response = self.supabase.storage.from_(self.bucket_name).upload(
                path=file_path,
                file=file_content,
                file_options={"content-type": content_type}
            )
            
            # Get public URL
            public_url = self.supabase.storage.from_(self.bucket_name).get_public_url(file_path)
            
            return {
                "success": True,
                "file_url": public_url,
                "file_path": file_path,
                "file_name": file_name,
                "file_hash": file_hash,
                "file_size": file_size,
                "mime_type": content_type,
                "uploaded_at": datetime.utcnow().isoformat()
            }
        
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def download_file(self, file_path: str) -> Optional[bytes]:
        """
        Download file from Supabase Storage
        
        Args:
            file_path: Path to file in storage
        
        Returns:
            File content as bytes or None if error
        """
        try:
            response = self.supabase.storage.from_(self.bucket_name).download(file_path)
            return response
        except Exception as e:
            print(f"Error downloading file: {e}")
            return None
    
    def delete_file(self, file_path: str) -> bool:
        """
        Delete file from Supabase Storage
        
        Args:
            file_path: Path to file in storage
        
        Returns:
            True if successful, False otherwise
        """
        try:
            self.supabase.storage.from_(self.bucket_name).remove([file_path])
            return True
        except Exception as e:
            print(f"Error deleting file: {e}")
            return False
    
    def get_file_url(self, file_path: str) -> str:
        """
        Get public URL for a file
        
        Args:
            file_path: Path to file in storage
        
        Returns:
            Public URL string
        """
        return self.supabase.storage.from_(self.bucket_name).get_public_url(file_path)
    
    def list_files(self, audit_id: str) -> list:
        """
        List all files for an audit
        
        Args:
            audit_id: Audit ID
        
        Returns:
            List of file metadata
        """
        try:
            folder_path = f"audits/{audit_id}"
            files = self.supabase.storage.from_(self.bucket_name).list(folder_path)
            return files
        except Exception as e:
            print(f"Error listing files: {e}")
            return []

# Singleton instance
supabase_storage = SupabaseStorageService()
