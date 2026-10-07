import os
import unittest

os.environ.setdefault('API_TOKEN', 'test-token')

from app import app


class AuthenticationTest(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def test_missing_token_is_rejected_on_templates(self):
        response = self.client.get('/api/templates')
        self.assertEqual(response.status_code, 401)

    def test_invalid_token_is_rejected(self):
        response = self.client.get(
            '/api/templates',
            headers={'Authorization': 'Bearer invalid'}
        )
        self.assertEqual(response.status_code, 401)

    def test_valid_token_is_accepted(self):
        response = self.client.get(
            '/api/templates',
            headers={'Authorization': 'Bearer test-token'}
        )
        self.assertEqual(response.status_code, 200)

    def test_missing_server_token_fails_closed(self):
        previous = os.environ.pop('API_TOKEN', None)
        try:
            response = self.client.get('/api/templates')
            self.assertEqual(response.status_code, 503)
        finally:
            if previous is not None:
                os.environ['API_TOKEN'] = previous


if __name__ == '__main__':
    unittest.main()
