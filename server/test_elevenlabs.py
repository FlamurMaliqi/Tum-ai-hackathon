"""
Test script for ElevenLabs integration

This script tests:
1. Token generation endpoint
2. Basic server connectivity

Run with: python test_elevenlabs.py
"""

import asyncio
import os
from dotenv import load_dotenv
import httpx

load_dotenv()

API_BASE_URL = "http://localhost:8000/api/v1"


async def test_token_generation():
    """Test the ElevenLabs token generation endpoint"""
    print("\n=== Testing Token Generation ===")
    
    api_key = os.getenv("ELEVENLABS_API_KEY")
    if not api_key:
        print("❌ ELEVENLABS_API_KEY not set in .env file")
        return False
    
    print(f"✓ API key found: {api_key[:8]}...")
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{API_BASE_URL}/elevenlabs-token/")
            
            if response.status_code == 200:
                data = response.json()
                token = data.get("token")
                if token:
                    print(f"✓ Token generated successfully: {token[:20]}...")
                    return True
                else:
                    print("❌ No token in response")
                    return False
            else:
                print(f"❌ Request failed with status {response.status_code}")
                print(f"   Response: {response.text}")
                return False
    
    except httpx.ConnectError:
        print("❌ Cannot connect to server. Is it running on http://localhost:8000?")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


async def test_server_health():
    """Test if the server is running"""
    print("\n=== Testing Server Health ===")
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get("http://localhost:8000/health")
            
            if response.status_code == 200:
                print("✓ Server is healthy")
                return True
            else:
                print(f"❌ Server returned status {response.status_code}")
                return False
    
    except httpx.ConnectError:
        print("❌ Cannot connect to server at http://localhost:8000")
        print("   Make sure to start the server with: python main.py")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


async def main():
    print("=" * 50)
    print("ElevenLabs Integration Test")
    print("=" * 50)
    
    # Test server health
    server_ok = await test_server_health()
    if not server_ok:
        print("\n⚠️  Server is not running. Start it first!")
        return
    
    # Test token generation
    token_ok = await test_token_generation()
    
    # Summary
    print("\n" + "=" * 50)
    print("Test Summary")
    print("=" * 50)
    print(f"Server Health: {'✓ PASS' if server_ok else '❌ FAIL'}")
    print(f"Token Generation: {'✓ PASS' if token_ok else '❌ FAIL'}")
    
    if server_ok and token_ok:
        print("\n✓ All tests passed! Your ElevenLabs integration is ready.")
        print("\nNext steps:")
        print("1. Start the frontend: cd client && npm run dev")
        print("2. Navigate to the Voice page")
        print("3. Click the microphone to start recording")
    else:
        print("\n❌ Some tests failed. Please check the errors above.")


if __name__ == "__main__":
    asyncio.run(main())
