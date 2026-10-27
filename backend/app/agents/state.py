from typing import TypedDict, List, Dict, Any, Optional

class AgentState(TypedDict, total=False):
    raw_transactions: List[Dict[str, Any]]
    normalized_transactions: List[Dict[str, Any]]
    categorized_transactions: List[Dict[str, Any]]
    preferences: Dict[str, Any]
    spending_analysis: Dict[str, Any]
    forecast: Dict[str, Any]
    advisory_report: Dict[str, Any]
    agent_traces: List[Dict[str, Any]]  # Execution traces, reasoning logs & decisions for each node
    chat_query: Optional[str]
    chat_response: Optional[str]
    errors: List[str]
