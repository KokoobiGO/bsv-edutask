import pytest
from unittest.mock import MagicMock

from src.controllers.usercontroller import UserController


@pytest.fixture
def mock_dao():
    return MagicMock()


@pytest.fixture
def controller(mock_dao):
    return UserController(dao=mock_dao)


def test_email_missing_local_part_raises_value_error(controller):
    with pytest.raises(ValueError):
        controller.get_user_by_email("@example.com")


def test_email_missing_at_symbol_raises_value_error(controller):
    with pytest.raises(ValueError):
        controller.get_user_by_email("john.example.com")


def test_email_with_multiple_at_symbols_raises_value_error(controller):
    with pytest.raises(ValueError):
        controller.get_user_by_email("john@@example.com")


def test_email_missing_domain_dot_raises_value_error(controller):
    with pytest.raises(ValueError):
        controller.get_user_by_email("john@example")


def test_valid_email_one_user_returns_user(controller, mock_dao):
    user = {"_id": "1", "email": "john@example.com", "name": "John User"}
    mock_dao.find.return_value = [user]

    result = controller.get_user_by_email("john@example.com")

    assert result == user


def test_valid_email_no_user_returns_none(controller, mock_dao):
    mock_dao.find.return_value = []

    result = controller.get_user_by_email("absent@example.com")

    assert result is None


def test_valid_email_multiple_users_returns_first_and_warns(
    controller, mock_dao, capsys
):
    user1 = {"_id": "1", "email": "dup@example.com", "name": "User One"}
    user2 = {"_id": "2", "email": "dup@example.com", "name": "User Two"}
    mock_dao.find.return_value = [user1, user2]

    result = controller.get_user_by_email("dup@example.com")
    captured = capsys.readouterr()

    assert result == user1
    assert "dup@example.com" in captured.out


def test_dao_exception_is_raised(controller, mock_dao):
    mock_dao.find.side_effect = Exception("Database error")

    with pytest.raises(Exception, match="Database error"):
        controller.get_user_by_email("dbfail@example.com")
