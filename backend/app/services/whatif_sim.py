def simulate_what_if(
    category: str,
    base_cost: float,
    severity: str,
    population: int
) -> dict:
    """
    Simulates three timelines for an incident:
    1. Fix Today (Immediate Action)
    2. Delay 1 Month
    3. Delay 3 Months (Do Nothing)
    
    Generates cost multiplier, risk levels, and secondary impacts.
    """
    cat = category.lower()
    sev = severity.lower()
    
    # Defaults
    consequences_today = []
    consequences_1m = []
    consequences_3m = []
    
    resources_today = ["Standard toolkit", "Qualified technician"]
    resources_1m = ["Standard toolkit", "Replacement components", "2 technician team"]
    resources_3m = ["Specialized repair team", "Heavy machinery / replacement assets", "Site supervisor"]

    if cat == "water":
        consequences_today = ["Minor local water fetching inconvenience during repair (2 hours)."]
        consequences_1m = [
            "Households forced to walk 1.5km to Handpump A.",
            "Water collection wait times at Handpump A increase by 45 minutes.",
            "Minor drop in sanitation levels."
        ]
        consequences_3m = [
            "Critical water scarcity. Dry borewell risks.",
            "Severe health risk: outbreak of waterborne diarrheal illnesses.",
            "Alternative water trucking required (additional cost of ₹15,000/week).",
            "Children missing school to haul water from neighboring village."
        ]
        cost_mult_1m = 1.6
        cost_mult_3m = 2.8
        risk_today = "LOW"
        risk_1m = "MEDIUM"
        risk_3m = "HIGH" if sev != "critical" else "CRITICAL"
        
    elif cat == "roads":
        consequences_today = ["Traffic detour for 6 hours.", "Minor dust emissions during rolling."]
        consequences_1m = [
            "Water accumulation inside potholes causing structural base softening.",
            "Increased repair volume by 40% due to edge crumbling.",
            "Frequent suspension wear and tire punctures reported by motorcyclists."
        ]
        consequences_3m = [
            "Complete base layer failure requiring full road reconstruction.",
            "Total transport blockage for local dairy and agriculture transport vans.",
            "High frequency of tractor and two-wheeler accidents, especially during night.",
            "Economic loss for market vendors due to decreased visitor access."
        ]
        cost_mult_1m = 2.0
        cost_mult_3m = 4.5
        risk_today = "LOW"
        risk_1m = "MEDIUM"
        risk_3m = "HIGH"
        
    elif cat == "drainage":
        consequences_today = ["Temporary odor during excavation/clearing."]
        consequences_1m = [
            "Overflowing wastewater onto sidewalks, causing foul smell in market.",
            "Mosquito breeding grounds forming in stagnant water puddles.",
            "Disruption of adjacent vegetable vendors due to mud splash."
        ]
        consequences_3m = [
            "Basement flooding of 3 local shops.",
            "Outbreak of vector-borne diseases (Dengue/Malaria) in Ward B.",
            "Structural damage to nearby mud-brick house foundations.",
            "Complete market shutdown due to unhygienic conditions."
        ]
        cost_mult_1m = 1.8
        cost_mult_3m = 3.5
        risk_today = "LOW"
        risk_1m = "HIGH"
        risk_3m = "CRITICAL"
        
    else:  # electricity/streetlights, waste, etc.
        consequences_today = ["Localized temporary service outage during installation."]
        consequences_1m = [
            "Dark spots causing discomfort at night.",
            "Slight increase in minor thefts or vandalism.",
            "Decreased movement of female residents after 7 PM."
        ]
        consequences_3m = [
            "Severe increase in night-time security incidents and vandalism.",
            "Significant drop in night market sales and economic activity.",
            "Repeated citizen complaints leading to loss of trust in local governance.",
            "Road accident risks at blind turns due to zero visibility."
        ]
        cost_mult_1m = 1.3
        cost_mult_3m = 2.0
        risk_today = "LOW"
        risk_1m = "MEDIUM"
        risk_3m = "HIGH"

    # Scale costs
    cost_today = base_cost
    cost_1m = base_cost * cost_mult_1m
    cost_3m = base_cost * cost_mult_3m

    # Estimate affected population increases due to compounding/spreading issues
    pop_today = population
    pop_1m = int(population * 1.25)
    pop_3m = int(population * 1.8)

    return {
        "today": {
            "label": "Fix Today (Immediate)",
            "estimated_cost": round(cost_today, 2),
            "population_affected": pop_today,
            "expected_improvement_pct": 100.0,
            "predicted_future_cost": round(cost_today, 2),
            "risk_level": risk_today,
            "secondary_consequences": consequences_today,
            "resource_requirements": resources_today
        },
        "delayed_1m": {
            "label": "Delay by 1 Month",
            "estimated_cost": round(cost_1m, 2),
            "population_affected": pop_1m,
            "expected_improvement_pct": 80.0,
            "predicted_future_cost": round(cost_1m, 2),
            "risk_level": risk_1m,
            "secondary_consequences": consequences_1m,
            "resource_requirements": resources_1m
        },
        "delayed_3m": {
            "label": "Delay by 3 Months (Do Nothing)",
            "estimated_cost": round(cost_3m, 2),
            "population_affected": pop_3m,
            "expected_improvement_pct": 40.0,
            "predicted_future_cost": round(cost_3m, 2),
            "risk_level": risk_3m,
            "secondary_consequences": consequences_3m,
            "resource_requirements": resources_3m
        }
    }
