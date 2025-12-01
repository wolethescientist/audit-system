"""
Quick verification script to check if system is ready for dummy data generation
"""

import requests
import sys

BASE_URL = "http://localhost:8000"
ADMIN_EMAIL = "admin@audit.com"

class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    END = '\033[0m'

def print_success(msg):
    print(f"{Colors.GREEN}✓ {msg}{Colors.END}")

def print_error(msg):
    print(f"{Colors.RED}✗ {msg}{Colors.END}")

def print_info(msg):
    print(f"{Colors.BLUE}ℹ {msg}{Colors.END}")

def print_warning(msg):
    print(f"{Colors.YELLOW}⚠ {msg}{Colors.END}")

def check_backend():
    """Check if backend is running"""
    try:
        response = requests.get(f"{BASE_URL}/docs", timeout=5)
        if response.status_code == 200:
            print_success("Backend server is running")
            return True
        else:
            print_error("Backend server returned unexpected status")
            return False
    except requests.exceptions.ConnectionError:
        print_error("Backend server is not running")
        print_info("  Start it with: cd backend && python -m uvicorn app.main:app --reload")
        return False
    except Exception as e:
        print_error(f"Error checking backend: {e}")
        return False

def check_admin_user():
    """Check if admin user exists"""
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": ADMIN_EMAIL},
            timeout=5
        )
        if response.status_code == 200:
            print_success("Admin user exists and can authenticate")
            return True
        elif response.status_code == 404:
            print_error("Admin user does not exist")
            print_info("  Create it with: python create-test-users.py")
            return False
        else:
            print_warning(f"Unexpected response: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Error checking admin user: {e}")
        return False

def check_database_tables():
    """Check if database tables exist by trying to fetch data"""
    try:
        # Try to authenticate first
        auth_response = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": ADMIN_EMAIL},
            timeout=5
        )
        
        if auth_response.status_code != 200:
            print_warning("Cannot check database tables (admin user needed)")
            return False
        
        token = auth_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Try to fetch departments
        response = requests.get(f"{BASE_URL}/departments", headers=headers, timeout=5)
        if response.status_code == 200:
            print_success("Database tables are accessible")
            dept_count = len(response.json())
            if dept_count > 0:
                print_info(f"  Found {dept_count} existing departments")
            return True
        else:
            print_error("Database tables may not exist")
            print_info("  Run migrations: cd backend && alembic upgrade head")
            return False
    except Exception as e:
        print_error(f"Error checking database: {e}")
        return False

def check_python_dependencies():
    """Check if required Python packages are installed"""
    try:
        import requests
        print_success("Python 'requests' library is installed")
        return True
    except ImportError:
        print_error("Python 'requests' library is not installed")
        print_info("  Install it with: pip install requests")
        return False

def main():
    print(f"\n{Colors.YELLOW}{'='*60}")
    print("Supabase Dummy Data Generation - Readiness Check")
    print(f"{'='*60}{Colors.END}\n")
    
    checks = []
    
    print("1. Checking Python dependencies...")
    checks.append(check_python_dependencies())
    print()
    
    print("2. Checking backend server...")
    checks.append(check_backend())
    print()
    
    print("3. Checking admin user...")
    checks.append(check_admin_user())
    print()
    
    print("4. Checking database tables...")
    checks.append(check_database_tables())
    print()
    
    print(f"{Colors.YELLOW}{'='*60}{Colors.END}")
    
    if all(checks):
        print(f"{Colors.GREEN}✓ All checks passed! You're ready to generate dummy data.{Colors.END}\n")
        print("Run the generator with:")
        print(f"  {Colors.BLUE}python generate-comprehensive-dummy-data.py{Colors.END}")
        print(f"  or")
        print(f"  {Colors.BLUE}generate-dummy-data.bat{Colors.END} (Windows)")
        print(f"  {Colors.BLUE}./generate-dummy-data.sh{Colors.END} (Linux/Mac)\n")
        return 0
    else:
        print(f"{Colors.RED}✗ Some checks failed. Please fix the issues above.{Colors.END}\n")
        print("Common fixes:")
        print("  1. Start backend: cd backend && python -m uvicorn app.main:app --reload")
        print("  2. Run migrations: cd backend && alembic upgrade head")
        print("  3. Create admin: python create-test-users.py")
        print("  4. Install requests: pip install requests\n")
        return 1

if __name__ == "__main__":
    sys.exit(main())
