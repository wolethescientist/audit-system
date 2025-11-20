"""
Test login and get token for POC users
"""
import requests

API_URL = "http://localhost:8000"

test_users = [
    "admin@audit.com",
    "manager@audit.com",
    "auditor@audit.com",
    "finance.head@company.com",
    "hr.head@company.com",
    "it.head@company.com"
]

print("=" * 70)
print("TESTING LOGIN FOR ALL POC USERS")
print("=" * 70)

for email in test_users:
    try:
        response = requests.post(f"{API_URL}/auth/login", params={"email": email})
        if response.status_code == 200:
            data = response.json()
            token = data['access_token']
            
            # Validate token
            validate_response = requests.get(
                f"{API_URL}/auth/validate",
                headers={"Authorization": f"Bearer {token}"}
            )
            
            if validate_response.status_code == 200:
                user_info = validate_response.json()
                print(f"\n✅ {email}")
                print(f"   Role: {user_info.get('role', 'N/A')}")
                print(f"   Token: {token[:50]}...")
            else:
                print(f"\n❌ {email} - Token validation failed")
        else:
            print(f"\n❌ {email} - Login failed: {response.json()}")
    except Exception as e:
        print(f"\n❌ {email} - Error: {str(e)}")

print("\n" + "=" * 70)
print("HOW TO USE IN FRONTEND:")
print("=" * 70)
print("""
1. Go to http://localhost:3000/login
2. Enter any of the emails above (no password needed)
3. Click "Sign In"
4. You'll be redirected to the dashboard

The token is automatically stored in localStorage and sent with all requests.
""")
