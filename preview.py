"""Serve the production export and API together for local integration QA."""
from fastapi.staticfiles import StaticFiles
from api.index import app
app.mount('/', StaticFiles(directory='web/out',html=True),name='dashboard')
