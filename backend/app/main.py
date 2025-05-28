from fastapi import FastAPI, Request
from pydantic import BaseModel
import os
from dotenv import load_dotenv
import openai