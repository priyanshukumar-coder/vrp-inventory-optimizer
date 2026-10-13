from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import data, optimize, forecast, simulate
from app.config import settings

app = FastAPI(title=settings.app_name)

# CORS middleware for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(data.router)
app.include_router(optimize.router)
app.include_router(forecast.router)
app.include_router(simulate.router)

import os
import sys
from fastapi.responses import FileResponse, HTMLResponse

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}

@app.get("/api/report/pdf")
@app.get("/api/report/download")
def download_pdf_report():
    pdf_path = os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "VRP_Inventory_Optimization_Comprehensive_Technical_Report.pdf"))
    if not os.path.exists(pdf_path):
        # Alternative root check
        pdf_path = os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(__file__)), "VRP_Inventory_Optimization_Comprehensive_Technical_Report.pdf"))
    if not os.path.exists(pdf_path):
        return {"error": "PDF report not found. Please run backend/generate_report.py first."}
    return FileResponse(pdf_path, media_type="application/pdf", filename="VRP_Inventory_Optimization_Comprehensive_Technical_Report.pdf")

@app.get("/api/report/html")
def view_html_report():
    html_path = os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "VRP_Inventory_Optimization_Comprehensive_Technical_Report.html"))
    if not os.path.exists(html_path):
        html_path = os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(__file__)), "VRP_Inventory_Optimization_Comprehensive_Technical_Report.html"))
    if not os.path.exists(html_path):
        return HTMLResponse("<h1>Report not found. Please run backend/generate_report.py first.</h1>")
    with open(html_path, "r", encoding="utf-8") as f:
        content = f.read()
    return HTMLResponse(content)

@app.get("/")
def root():
    return {
        "app_name": settings.app_name,
        "message": "Welcome to the VRP Inventory Optimizer Backend",
        "pdf_report": "/api/report/pdf",
        "html_report": "/api/report/html"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8001, reload=True)
