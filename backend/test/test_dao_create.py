import os
from unittest.mock import patch

import pymongo
import pytest
from dotenv import dotenv_values
from pymongo.errors import DuplicateKeyError, WriteError

from src.util.dao import DAO


TEST_COLLECTION = "user_create_test"

FAKE_USER_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": ["firstName", "lastName", "email"],
        "properties": {
            "firstName": {"bsonType": "string"},
            "lastName": {"bsonType": "string"},
            "email": {"bsonType": "string", "uniqueItems": True},
        },
    }
}


def mongo_client():
    local_mongo_url = dotenv_values(".env").get("MONGO_URL")
    mongo_url = os.environ.get("MONGO_URL", local_mongo_url)
    return pymongo.MongoClient(mongo_url)


@pytest.fixture
def test_dao():
    client = mongo_client()
    database = client.edutask
    database.drop_collection(TEST_COLLECTION)

    with patch("src.util.dao.getValidator", return_value=FAKE_USER_VALIDATOR):
        dao = DAO(TEST_COLLECTION)

    dao.collection.create_index("email", unique=True)
    yield dao
    dao.drop()
    client.close()


def test_create_valid_document_returns_inserted_email(test_dao):
    data = {
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
    }

    result = test_dao.create(data)

    assert result["email"] == "john@example.com"


def test_create_missing_required_field_raises_write_error(test_dao):
    data = {
        "firstName": "Jane",
        "lastName": "Doe",
    }

    with pytest.raises(WriteError):
        test_dao.create(data)


def test_create_wrong_field_type_raises_write_error(test_dao):
    data = {
        "firstName": 123,
        "lastName": "Doe",
        "email": "wrong@example.com",
    }

    with pytest.raises(WriteError):
        test_dao.create(data)


def test_create_duplicate_email_raises_duplicate_key_error(test_dao):
    data = {
        "firstName": "Alice",
        "lastName": "Smith",
        "email": "duplicate@example.com",
    }
    test_dao.create(data)

    data2 = {
        "firstName": "Bob",
        "lastName": "Jones",
        "email": "duplicate@example.com",
    }
    with pytest.raises(DuplicateKeyError):
        test_dao.create(data2)


def test_create_with_extra_field_keeps_extra_field(test_dao):
    data = {
        "firstName": "Eve",
        "lastName": "Brown",
        "email": "eve@example.com",
        "nickname": "Evie",
    }

    result = test_dao.create(data)

    assert result["nickname"] == "Evie"
