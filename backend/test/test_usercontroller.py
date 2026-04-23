import pytest
from unittest.mock import MagicMock
from src.controllers.usercontroller import UserController


@pytest.fixture
def mock_dao():
    return MagicMock()


@pytest.fixture
def controller(mock_dao):
    return UserController(dao=mock_dao)


def test_invalid_email_raises_value_error(controller):
    with pytest.raises(ValueError):
        controller.get_user_by_email("invalidemail")


def test_valid_email_one_user(controller, mock_dao):
    user = {"_id": "1", "email": "test@example.com", "name": "Test User"}
    mock_dao.find.return_value = [user]

    result = controller.get_user_by_email("test@example.com")

    assert result == user
    mock_dao.find.assert_called_once_with({"email": "test@example.com"})


def test_valid_email_no_user(controller, mock_dao):
    mock_dao.find.return_value = []

    result = controller.get_user_by_email("noone@example.com")

    assert result is None


def test_valid_email_multiple_users(controller, mock_dao, capsys):
    user1 = {"_id": "1", "email": "dup@example.com", "name": "User One"}
    user2 = {"_id": "2", "email": "dup@example.com", "name": "User Two"}
    mock_dao.find.return_value = [user1, user2]

    result = controller.get_user_by_email("dup@example.com")

    assert result == user1
    captured = capsys.readouterr()
    assert "dup@example.com" in captured.out


def test_dao_exception_is_raised(controller, mock_dao):
    mock_dao.find.side_effect = Exception("Database error")

    with pytest.raises(Exception, match="Database error"):
        controller.get_user_by_email("test@example.com")
