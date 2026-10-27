import uuid
import io
import os
from contextlib import asynccontextmanager
from typing import Optional, List, Dict, Any
import pandas as pd
from datetime import datetime
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Load .env variables at startup
load_dotenv()

from .database import (
    init_db, save_report, get_latest_report, get_report_by_id,
    get_transactions_by_report, get_user_preferences, update_user_preferences
)
from .agents.orchestrator import run_finance_pipeline
from .agents.advisor_agent import chat_advisor_response
from .schemas import ChatRequest, ChatResponse, UserPreferencesRequest
from .llm import get_llm_status

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database on startup."""
    init_db()
    yield

app = FastAPI(
    title="Autonomous Personal Finance Agent API",
    description="Multi-agent AI backend for financial wellness and proactive expense management",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for React frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "Autonomous Personal Finance Agent", "version": "1.0.0"}

@app.get("/api/config/llm")
def llm_config():
    """Returns active LLM provider configuration and status for Groq and Gemini."""
    return get_llm_status()

@app.get("/api/preferences")
def get_preferences():
    return get_user_preferences()

@app.post("/api/preferences")
def set_preferences(pref_data: UserPreferencesRequest):
    update_user_preferences(
        pref_data.budgets,
        pref_data.min_balance_threshold,
        pref_data.monthly_savings_goal
    )
    
    # If there is a latest report, re-run analysis with updated preferences
    latest = get_latest_report()
    if latest:
        txns = get_transactions_by_report(latest["id"])
        if txns:
            updated_prefs = get_user_preferences()
            final_state = run_finance_pipeline(txns, updated_prefs)
            report_data = {
                "spending_analysis": final_state.get("spending_analysis", {}),
                "forecast": final_state.get("forecast", {}),
                "advisory_report": final_state.get("advisory_report", {}),
                "agent_traces": final_state.get("agent_traces", []),
                "preferences": updated_prefs
            }
            save_report(latest["id"], latest["filename"], report_data, final_state.get("categorized_transactions", []))
            return {"status": "updated", "recalculated_report_id": latest["id"]}
            
    return {"status": "updated"}

@app.post("/api/upload")
async def upload_csv_file(file: UploadFile = File(...)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")
        
    content = await file.read()
    try:
        df = pd.read_csv(io.StringIO(content.decode("utf-8", errors="replace")))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV file: {str(e)}")
        
    required_patterns = ["date", "amount", "description"]
    cols_lower = [str(c).lower() for c in df.columns]
    missing = [rp for rp in required_patterns if not any(rp in c for c in cols_lower)]
    if missing:
        raise HTTPException(status_code=400, detail=f"CSV missing mandatory columns: {', '.join(missing)}")
        
    raw_records = df.to_dict(orient="records")
    prefs = get_user_preferences()
    
    # Run multi-agent pipeline
    final_state = run_finance_pipeline(raw_records, prefs)
    
    if final_state.get("errors") and not final_state.get("categorized_transactions"):
        raise HTTPException(status_code=400, detail="; ".join(final_state["errors"]))
        
    report_id = f"rep_{uuid.uuid4().hex[:8]}"
    report_data = {
        "spending_analysis": final_state.get("spending_analysis", {}),
        "forecast": final_state.get("forecast", {}),
        "advisory_report": final_state.get("advisory_report", {}),
        "agent_traces": final_state.get("agent_traces", []),
        "preferences": prefs
    }
    
    categorized_txns = final_state.get("categorized_transactions", [])
    save_report(report_id, file.filename, report_data, categorized_txns)
    
    return {
        "report_id": report_id,
        "filename": file.filename,
        "created_at": datetime.now().isoformat(),
        "data": report_data,
        "transactions_count": len(categorized_txns)
    }

@app.post("/api/analyze-sample")
def analyze_sample_data():
    sample_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "sample_data", "sample_transactions.csv"))
    if not os.path.exists(sample_path):
        raise HTTPException(status_code=404, detail="Sample dataset not found on server.")
        
    df = pd.read_csv(sample_path)
    raw_records = df.to_dict(orient="records")
    prefs = get_user_preferences()
    
    # Run multi-agent pipeline
    final_state = run_finance_pipeline(raw_records, prefs)
    
    report_id = f"sample_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    report_data = {
        "spending_analysis": final_state.get("spending_analysis", {}),
        "forecast": final_state.get("forecast", {}),
        "advisory_report": final_state.get("advisory_report", {}),
        "agent_traces": final_state.get("agent_traces", []),
        "preferences": prefs
    }
    
    categorized_txns = final_state.get("categorized_transactions", [])
    save_report(report_id, "sample_transactions.csv", report_data, categorized_txns)
    
    return {
        "report_id": report_id,
        "filename": "sample_transactions.csv",
        "created_at": datetime.now().isoformat(),
        "data": report_data,
        "transactions_count": len(categorized_txns)
    }

@app.get("/api/reports/latest")
def get_latest_analysis():
    latest = get_latest_report()
    if not latest:
        return analyze_sample_data()
    return latest

@app.get("/api/reports/{report_id}")
def get_report(report_id: str):
    report = get_report_by_id(report_id)
    if not report:
        raise HTTPException(status_code=404, detail=f"Report {report_id} not found.")
    return report

@app.get("/api/transactions")
def list_transactions(
    report_id: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(default=100, le=500)
):
    if not report_id:
        latest = get_latest_report()
        if latest:
            report_id = latest["id"]
        else:
            return []
            
    txns = get_transactions_by_report(report_id)
    
    if category and category != "All":
        txns = [t for t in txns if t["category"].lower() == category.lower()]
        
    if search:
        s_lower = search.lower()
        txns = [t for t in txns if s_lower in t["description"].lower() or s_lower in str(t["amount"])]
        
    return txns[:limit]

@app.post("/api/chat", response_model=ChatResponse)
def chat_with_advisor(req: ChatRequest):
    report = None
    if req.report_id:
        report = get_report_by_id(req.report_id)
    if not report:
        report = get_latest_report()
        
    if not report or not report.get("data"):
        return ChatResponse(
            query=req.query,
            response="Please upload a transaction CSV file or analyze the sample data first so I can inspect your financial metrics."
        )
        
    data = report["data"]
    ans = chat_advisor_response(
        req.query,
        data.get("spending_analysis", {}),
        data.get("forecast", {}),
        data.get("advisory_report", {})
    )
    return ChatResponse(query=req.query, response=ans)

# Serve built frontend if dist directory exists
dist_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
if os.path.exists(dist_path):
    app.mount("/", StaticFiles(directory=dist_path, html=True), name="frontend")
