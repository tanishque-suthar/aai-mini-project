import os
import time
import json
from typing import Dict, Any, Tuple, Optional
from dotenv import load_dotenv
import openai

# Load environment variables from .env
load_dotenv()

GROQ_BASE_URL = "https://api.groq.com/openai/v1"
GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/"

DEFAULT_GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
DEFAULT_GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

def get_groq_key() -> Optional[str]:
    key = os.getenv("GROQ_API_KEY", "").strip()
    return key if key and not key.startswith("your_") else None

def get_gemini_key() -> Optional[str]:
    key = os.getenv("GEMINI_API_KEY", "").strip()
    return key if key and not key.startswith("your_") else None

def get_llm_status() -> Dict[str, Any]:
    groq_ok = bool(get_groq_key())
    gemini_ok = bool(get_gemini_key())
    
    if groq_ok and gemini_ok:
        mode = "Dual-LLM (Groq + Gemini)"
    elif groq_ok:
        mode = "Single-LLM (Groq Active)"
    elif gemini_ok:
        mode = "Single-LLM (Gemini Active)"
    else:
        mode = "High-Fidelity Simulation (No Keys in .env)"
        
    return {
        "groq_configured": groq_ok,
        "gemini_configured": gemini_ok,
        "groq_model": DEFAULT_GROQ_MODEL,
        "gemini_model": DEFAULT_GEMINI_MODEL,
        "active_mode": mode
    }

def call_groq(
    system_prompt: str, 
    user_prompt: str, 
    model: Optional[str] = None,
    temperature: float = 0.2
) -> Tuple[Optional[str], Dict[str, Any]]:
    key = get_groq_key()
    if not key:
        return None, {"provider": "Groq", "status": "skipped_no_key"}
    
    selected_model = model or DEFAULT_GROQ_MODEL
    start_time = time.time()
    try:
        client = openai.OpenAI(api_key=key, base_url=GROQ_BASE_URL, timeout=12.0)
        completion = client.chat.completions.create(
            model=selected_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=temperature
        )
        latency = int((time.time() - start_time) * 1000)
        content = completion.choices[0].message.content or ""
        tokens = completion.usage.total_tokens if completion.usage else 0
        return content, {
            "provider": "Groq",
            "model": selected_model,
            "status": "success",
            "latency_ms": latency,
            "tokens": tokens,
            "system_prompt": system_prompt,
            "user_prompt": user_prompt
        }
    except Exception as e:
        latency = int((time.time() - start_time) * 1000)
        return None, {
            "provider": "Groq",
            "model": selected_model,
            "status": f"error: {str(e)}",
            "latency_ms": latency
        }

def call_gemini(
    system_prompt: str, 
    user_prompt: str, 
    model: Optional[str] = None,
    temperature: float = 0.2
) -> Tuple[Optional[str], Dict[str, Any]]:
    key = get_gemini_key()
    if not key:
        return None, {"provider": "Gemini", "status": "skipped_no_key"}
    
    selected_model = model or DEFAULT_GEMINI_MODEL
    start_time = time.time()
    try:
        client = openai.OpenAI(api_key=key, base_url=GEMINI_BASE_URL, timeout=15.0)
        completion = client.chat.completions.create(
            model=selected_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=temperature
        )
        latency = int((time.time() - start_time) * 1000)
        content = completion.choices[0].message.content or ""
        tokens = completion.usage.total_tokens if completion.usage else 0
        return content, {
            "provider": "Gemini",
            "model": selected_model,
            "status": "success",
            "latency_ms": latency,
            "tokens": tokens,
            "system_prompt": system_prompt,
            "user_prompt": user_prompt
        }
    except Exception as e:
        latency = int((time.time() - start_time) * 1000)
        return None, {
            "provider": "Gemini",
            "model": selected_model,
            "status": f"error: {str(e)}",
            "latency_ms": latency
        }

def smart_llm_call(
    task_type: str, 
    system_prompt: str, 
    user_prompt: str, 
    fallback_generator
) -> Tuple[str, Dict[str, Any]]:
    """
    Routes LLM tasks between Groq and Gemini according to task requirements,
    with automatic cross-provider failover and deterministic fallback.
    """
    # 1. Routing preference:
    # classification & anomaly commentary -> Groq first, Gemini fallback
    # advisory synthesis & chat -> Gemini first, Groq fallback
    if task_type in ["classification", "anomaly_commentary"]:
        res, meta = call_groq(system_prompt, user_prompt)
        if res:
            return res, meta
        # Try Gemini failover if Groq failed or unconfigured
        res_alt, meta_alt = call_gemini(system_prompt, user_prompt)
        if res_alt:
            return res_alt, meta_alt
    else:
        # advisory_synthesis, chat
        res, meta = call_gemini(system_prompt, user_prompt)
        if res:
            return res, meta
        # Try Groq failover if Gemini failed or unconfigured
        res_alt, meta_alt = call_groq(system_prompt, user_prompt)
        if res_alt:
            return res_alt, meta_alt

    # 2. Both unconfigured or failed -> deterministic simulation fallback
    simulated_res = fallback_generator()
    return simulated_res, {
        "provider": "Deterministic Simulator",
        "model": "rule-grounded-engine-v1",
        "status": "simulated_fallback",
        "latency_ms": 4,
        "tokens": len(system_prompt.split()) + len(user_prompt.split()) + len(str(simulated_res).split()),
        "system_prompt": system_prompt,
        "user_prompt": user_prompt,
        "reason": "No active API keys found in .env; executing high-fidelity grounded simulation."
    }
