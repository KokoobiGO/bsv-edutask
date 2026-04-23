import pytest
from pymongo.errors import WriteError, DuplicateKeyError
from src.util.dao import DAO


@pytest.fixture
def test_dao():
    dao = DAO("user")
    dao.collection.create_index("email", unique=True)
    yield dao
    dao.drop()


def test_create_valid_document(test_dao):
    data = {
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com"
    }
    result = test_dao.create(data)

    assert result is not None
    assert result["firstName"] == "John"
    assert result["lastName"] == "Doe"
    assert result["email"] == "john@example.com"
    assert "_id" in result


def test_create_missing_required_field(test_dao):
    data = {
        "firstName": "Jane",
        "lastName": "Doe"
    }
    with pytest.raises(WriteError):
        test_dao.create(data)


def test_create_wrong_field_type(test_dao):
    data = {
        "firstName": 123,
        "lastName": "Doe",
        "email": "wrong@example.com"
    }
    with pytest.raises(WriteError):
        test_dao.create(data)


def test_create_duplicate_email(test_dao):
    data = {
        "firstName": "Alice",
        "lastName": "Smith",
        "email": "duplicate@example.com"
    }
    test_dao.create(data)

    data2 = {
        "firstName": "Bob",
        "lastName": "Jones",
        "email": "duplicate@example.com"
    }
    with pytest.raises(DuplicateKeyError):
        test_dao.create(data2)


def test_create_with_extra_field(test_dao):
    data = {
        "firstName": "Eve",
        "lastName": "Brown",
        "email": "eve@example.com",
        "nickname": "Evie"
    }
    result = test_dao.create(data)

    assert result is not None
    assert result["email"] == "eve@example.com"
    assert result["nickname"] == "Evie"
