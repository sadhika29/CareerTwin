import pytest
from unittest.mock import patch

@pytest.fixture(autouse=True)
def mock_firebase():
    """Globally mock firebase initialization and firestore client for all tests."""
    with patch("backend.database.firestore.initialize_firebase"):
        with patch("backend.database.firestore.firestore.client"):
            yield
