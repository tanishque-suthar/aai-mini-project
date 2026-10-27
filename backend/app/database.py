import sqlite3
import json
import os
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data", "finance_agent.db"))

def get_db_connection():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        report_id TEXT NOT NULL,
        date TEXT NOT NULL,
        description TEXT NOT NULL,
        amount REAL NOT NULL,
        transaction_type TEXT NOT NULL,
        category TEXT NOT NULL,
        account TEXT,
        confidence REAL DEFAULT 1.0,
        is_anomaly INTEGER DEFAULT 0,
        anomaly_reason TEXT,
        is_recurring INTEGER DEFAULT 0,
        recurring_group TEXT,
        created_at TEXT NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS analysis_reports (
        id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        filename TEXT NOT NULL,
        data_json TEXT NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS user_preferences (
        id INTEGER PRIMARY KEY,
        budgets_json TEXT NOT NULL,
        min_balance_threshold REAL DEFAULT 10000.0,
        monthly_savings_goal REAL DEFAULT 15000.0,
        updated_at TEXT NOT NULL
    );
    """)

    # Seed default user preferences if not existing
    cursor.execute("SELECT COUNT(*) FROM user_preferences WHERE id = 1")
    if cursor.fetchone()[0] == 0:
        default_budgets = {
            "Food and Dining": 6000.0,
            "Shopping": 8000.0,
            "Transportation": 3000.0,
            "Utilities and Bills": 6000.0,
            "Entertainment": 2000.0,
            "Healthcare": 3000.0,
            "Subscriptions": 2000.0
        }
        cursor.execute("""
            INSERT INTO user_preferences (id, budgets_json, min_balance_threshold, monthly_savings_goal, updated_at)
            VALUES (1, ?, ?, ?, ?)
        """, (json.dumps(default_budgets), 15000.0, 20000.0, datetime.now(timezone.utc).isoformat()))

    conn.commit()
    conn.close()

def save_report(report_id: str, filename: str, data: Dict[str, Any], transactions: List[Dict[str, Any]]):
    conn = get_db_connection()
    cursor = conn.cursor()
    now_str = datetime.now(timezone.utc).isoformat()
    
    cursor.execute("""
        INSERT OR REPLACE INTO analysis_reports (id, created_at, filename, data_json)
        VALUES (?, ?, ?, ?)
    """, (report_id, now_str, filename, json.dumps(data)))
    
    # Save transactions
    cursor.execute("DELETE FROM transactions WHERE report_id = ?", (report_id,))
    for tx in transactions:
        cursor.execute("""
            INSERT INTO transactions (
                report_id, date, description, amount, transaction_type, category,
                account, confidence, is_anomaly, anomaly_reason, is_recurring, recurring_group, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            report_id,
            str(tx.get("date", "")),
            str(tx.get("description", "")),
            float(tx.get("amount", 0.0)),
            str(tx.get("transaction_type", "Debit")),
            str(tx.get("category", "Other Expenses")),
            str(tx.get("account", "Main Account")),
            float(tx.get("confidence", 0.95)),
            1 if tx.get("is_anomaly") else 0,
            str(tx.get("anomaly_reason", "")),
            1 if tx.get("is_recurring") else 0,
            str(tx.get("recurring_group", "")),
            now_str
        ))
        
    conn.commit()
    conn.close()

def get_latest_report() -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM analysis_reports ORDER BY created_at DESC LIMIT 1")
    row = cursor.fetchone()
    conn.close()
    if row:
        return {
            "id": row["id"],
            "created_at": row["created_at"],
            "filename": row["filename"],
            "data": json.loads(row["data_json"])
        }
    return None

def get_report_by_id(report_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM analysis_reports WHERE id = ?", (report_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return {
            "id": row["id"],
            "created_at": row["created_at"],
            "filename": row["filename"],
            "data": json.loads(row["data_json"])
        }
    return None

def get_transactions_by_report(report_id: str) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM transactions WHERE report_id = ? ORDER BY date DESC", (report_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_user_preferences() -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM user_preferences WHERE id = 1")
    row = cursor.fetchone()
    conn.close()
    if row:
        return {
            "budgets": json.loads(row["budgets_json"]),
            "min_balance_threshold": float(row["min_balance_threshold"]),
            "monthly_savings_goal": float(row["monthly_savings_goal"])
        }
    return {
        "budgets": {},
        "min_balance_threshold": 10000.0,
        "monthly_savings_goal": 15000.0
    }

def update_user_preferences(budgets: Dict[str, float], min_balance_threshold: float, monthly_savings_goal: float):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT OR REPLACE INTO user_preferences (id, budgets_json, min_balance_threshold, monthly_savings_goal, updated_at)
        VALUES (1, ?, ?, ?, ?)
    """, (json.dumps(budgets), min_balance_threshold, monthly_savings_goal, datetime.now(timezone.utc).isoformat()))
    conn.commit()
    conn.close()
