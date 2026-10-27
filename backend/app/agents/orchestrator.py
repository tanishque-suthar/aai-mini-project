from langgraph.graph import StateGraph, START, END
from typing import Dict, Any, List
from .state import AgentState
from .data_agent import financial_data_agent
from .analysis_agent import spending_analysis_agent
from .forecast_agent import cash_flow_forecast_agent
from .advisor_agent import financial_advisor_agent

def should_continue(state: AgentState) -> str:
    errors = state.get("errors", [])
    if errors and not state.get("categorized_transactions"):
        return END
    return "analysis_agent"

def build_finance_agent_graph():
    builder = StateGraph(AgentState)
    
    # Add agent nodes
    builder.add_node("data_agent", financial_data_agent)
    builder.add_node("analysis_agent", spending_analysis_agent)
    builder.add_node("forecast_agent", cash_flow_forecast_agent)
    builder.add_node("advisor_agent", financial_advisor_agent)
    
    # Define execution edges
    builder.add_edge(START, "data_agent")
    builder.add_conditional_edges("data_agent", should_continue, {
        "analysis_agent": "analysis_agent",
        END: END
    })
    builder.add_edge("analysis_agent", "forecast_agent")
    builder.add_edge("forecast_agent", "advisor_agent")
    builder.add_edge("advisor_agent", END)
    
    graph = builder.compile()
    return graph

# Singleton compiled graph instance
finance_workflow = build_finance_agent_graph()

def run_finance_pipeline(raw_transactions: List[Dict[str, Any]], preferences: Dict[str, Any]) -> AgentState:
    initial_state: AgentState = {
        "raw_transactions": raw_transactions,
        "preferences": preferences,
        "agent_traces": [],
        "errors": []
    }
    
    final_state = finance_workflow.invoke(initial_state)
    return final_state
