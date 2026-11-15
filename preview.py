"""Serve the production Next.js export and unchanged API for integration QA."""
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from api.index import app

@app.get('/workspace')
def workspace():
    return FileResponse('web/out/workspace.html')

@app.get('/compare')
def compare():
    return FileResponse('web/out/compare.html')

@app.get('/lab')
def lab():
    return FileResponse('web/out/lab.html')

app.mount('/', StaticFiles(directory='web/out', html=True), name='dashboard')
