# chattypatty
Conversational AI language buddy which gives guidance and correction to aid the learning of a foreign language. 


## Running locally
Can be run locally using docker. You will first need to generate a few API keys:
- OpenAI API
- Google Translate API
- ElevenLabs API Key
- For local deployment you can use basic reCaptcha credentials for testing purposes

- Ensure you are in the root folder (/chattypatty)
- Add an env file, configuring the following variables:
    - DB_NAME={postgres}
    - DB_USER={postgres}
    - DB_PASSWORD={password}
    - DB_HOST={db}
    - DB_PORT={5432}
    - OPENAI_API_KEY={key}
    - GOOGLE_TRANSLATE_API_KEY={key}
    - DATABASE_URL={url something like: postgresql+asyncpg://postgres:password@db:5432/postgres)}
- Run "docker compose up --build"