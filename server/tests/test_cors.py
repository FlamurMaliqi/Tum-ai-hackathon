import sys
import unittest
from pathlib import Path


# Ensure we can import server/main.py as "main" and its "api" package.
SERVER_DIR = Path(__file__).resolve().parents[1]
if str(SERVER_DIR) not in sys.path:
    sys.path.insert(0, str(SERVER_DIR))

from fastapi.testclient import TestClient  # noqa: E402
import main as server_main  # noqa: E402


class TestCORS(unittest.TestCase):
    def setUp(self) -> None:
        self.client = TestClient(server_main.app)
        self.allowed_origin = "http://localhost:3000"

    def test_preflight_includes_allow_origin(self) -> None:
        resp = self.client.options(
            "/api/v1/artikel/",
            headers={
                "Origin": self.allowed_origin,
                "Access-Control-Request-Method": "GET",
            },
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.headers.get("access-control-allow-origin"), self.allowed_origin)

    def test_error_responses_still_include_allow_origin(self) -> None:
        # This endpoint may return 500 in tests if DB isn't available, but CORS headers
        # should still be present so the browser can read the error payload.
        resp = self.client.get(
            "/api/v1/artikel/",
            headers={"Origin": self.allowed_origin},
        )
        self.assertEqual(resp.headers.get("access-control-allow-origin"), self.allowed_origin)

    def test_disallowed_origin_has_no_allow_origin_header(self) -> None:
        resp = self.client.options(
            "/api/v1/artikel/",
            headers={
                "Origin": "http://evil.example",
                "Access-Control-Request-Method": "GET",
            },
        )
        # Starlette returns 400 for disallowed origins on preflight.
        self.assertIn(resp.status_code, (400, 200))
        self.assertNotEqual(resp.headers.get("access-control-allow-origin"), "http://evil.example")


if __name__ == "__main__":
    unittest.main()

