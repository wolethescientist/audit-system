from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, users, departments, audits, analytics, workflows

app = FastAPI(title="Audit Management System", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(departments.router)
app.include_router(audits.router)
app.include_router(analytics.router)
app.include_router(workflows.router)

@app.get("/")
def root():
    return {"message": "Audit Management System API", "version": "1.0.0"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
