from fastapi_users import schemas


class User(schemas.BaseUser):
    full_name: str | None


class UserCreate(schemas.BaseUserCreate):
    full_name: str | None


class UserUpdate(schemas.BaseUserUpdate):
    full_name: str | None


class UserDB(User, schemas.BaseUserDB):
    pass
