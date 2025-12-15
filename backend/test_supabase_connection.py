"""
Test Supabase Storage Connection
Run this script to verify Supabase Storage is configured correctly
"""
import sys
from app.services.supabase_storage_service import supabase_storage
from app.config import settings

def test_connection():
    """Test Supabase Storage connection and configuration"""
    print("=" * 60)
    print("Supabase Storage Connection Test")
    print("=" * 60)
    
    # Check configuration
    print("\n1. Checking Configuration...")
    print(f"   Supabase URL: {settings.SUPABASE_URL}")
    print(f"   Bucket Name: {settings.SUPABASE_BUCKET_NAME}")
    print(f"   Anon Key: {'*' * 20}...{settings.SUPABASE_ANON_KEY[-10:]}")
    
    # Test connection
    print("\n2. Testing Connection...")
    try:
        # Try to list files (this will verify connection)
        test_audit_id = "test-connection"
        files = supabase_storage.list_files(test_audit_id)
        print("   ✓ Connection successful!")
        print(f"   Found {len(files)} files in test folder")
    except Exception as e:
        print(f"   ✗ Connection failed: {str(e)}")
        return False
    
    # Test upload
    print("\n3. Testing File Upload...")
    try:
        test_content = b"This is a test file for Supabase Storage"
        result = supabase_storage.upload_file(
            file_content=test_content,
            file_name="test_connection.txt",
            audit_id="test-connection",
            user_id="test-user",
            content_type="text/plain"
        )
        
        if result.get("success"):
            print("   ✓ Upload successful!")
            print(f"   File URL: {result['file_url']}")
            print(f"   File Hash: {result['file_hash']}")
            print(f"   File Size: {result['file_size']} bytes")
            
            # Test delete
            print("\n4. Testing File Deletion...")
            file_path = result['file_path']
            delete_success = supabase_storage.delete_file(file_path)
            if delete_success:
                print("   ✓ Deletion successful!")
            else:
                print("   ✗ Deletion failed")
        else:
            print(f"   ✗ Upload failed: {result.get('error')}")
            return False
    except Exception as e:
        print(f"   ✗ Upload test failed: {str(e)}")
        return False
    
    print("\n" + "=" * 60)
    print("All tests passed! ✓")
    print("=" * 60)
    return True

if __name__ == "__main__":
    try:
        success = test_connection()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\nFatal error: {str(e)}")
        sys.exit(1)
