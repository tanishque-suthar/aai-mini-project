import pytest
from playwright.sync_api import sync_playwright

def test_frontend_end_to_end():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        # 1. Navigate to MVP Dashboard
        page.goto("http://127.0.0.1:8000/", timeout=15000)
        
        # 2. Check title and brand
        assert "Autonomous Personal Finance Agent" in page.title()
        assert page.locator("h1.brand-title").is_visible()
        
        # 3. Check Agent Nodes status indicators
        nodes_bar = page.locator(".agent-nodes-bar")
        assert nodes_bar.is_visible()
        assert nodes_bar.locator("text=Data Agent").is_visible()
        assert nodes_bar.locator("text=Analysis Agent").is_visible()
        assert nodes_bar.locator("text=Forecast Agent").is_visible()
        assert nodes_bar.locator("text=Advisor Agent").is_visible()
        
        # 4. Check Summary Cards (on Overview Tab by default)
        assert page.locator("#card-income").is_visible()
        assert page.locator("#card-expenses").is_visible()
        assert page.locator("#card-savings").is_visible()
        assert page.locator("#card-recurring").is_visible()
        
        # 5. Check Financial Health Card
        assert page.locator("#financial-health-card").is_visible()
        score_text = page.locator(".score-num").inner_text()
        assert int(score_text) > 0
        
        # 6. Switch to Budgets & Forecast Tab
        page.locator("#tab-nav-budgets").click()
        assert page.locator("#budget-tracker-card").is_visible()
        assert page.locator("#budget-tracker-card >> text=Food and Dining").is_visible()
        assert page.locator("#cash-flow-forecast-card").is_visible()
        assert page.locator("#cash-flow-forecast-card >> text=Day 30 Projected").is_visible()
        
        # 7. Switch to AI Advisor Tab and test chat query
        page.locator("#tab-nav-advisor").click()
        page.locator("button:has-text('Why did my expenses increase?')").click()
        page.wait_for_selector(".chat-bubble.advisor >> text=Shopping", timeout=8000)
        assert page.locator(".chat-bubble.advisor >> text=Shopping").is_visible()
        
        # 8. Switch to Risk & Obligations Tab
        page.locator("#tab-nav-risks").click()
        page.locator("#tab-recurring-btn").click()
        assert page.locator("#anomaly-alerts-card >> text=House Rent Payment").is_visible()
        assert page.locator("#anomaly-alerts-card >> text=Netflix Subscription").is_visible()
        
        # 9. Switch to Transactions Tab and test search
        page.locator("#tab-nav-transactions").click()
        search_input = page.locator("#transaction-search-input")
        search_input.fill("Swiggy")
        page.wait_for_timeout(500)
        assert page.locator(".tx-table >> text=Swiggy Food Delivery").first.is_visible()
        
        # 10. Switch to Agent Traces Tab and verify glass-box observability
        page.locator("#tab-nav-traces").click()
        assert page.locator("#agent-inspection-panel").is_visible()
        assert page.locator("text=Multi-Agent Workflow Observability").is_visible()
        assert page.locator("#trace-node-data_agent").is_visible()
        assert page.locator("#trace-node-advisor_agent").is_visible()
        
        browser.close()

def test_vite_react_dev_server():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        # Test React frontend via Vite dev server
        page.goto("http://127.0.0.1:5173/", timeout=15000)
        assert "Autonomous Personal Finance Agent" in page.title()
        assert page.locator("#financial-health-card").is_visible()
        assert page.locator(".score-num").inner_text() == "63"
        browser.close()
