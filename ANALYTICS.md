# GRAM-X — Department Performance & Service Health Index (Phase 9)

## 1. Service Health Score Formulation

The **Service Health Score (0 - 100)** measures the operational reliability of civic infrastructure departments (Water, Electricity, Roads, Sanitation):

$$\text{Health Score} = 0.40 \times (\text{SLA Compliance \%}) + 0.35 \times (\text{Resolution Rate \%}) + 0.25 \times \left(\frac{\text{Citizen Satisfaction}}{5.0} \times 100\right) - 1.5 \times (\text{Reopen Rate \%})$$


### Status Classifications:
- **EXCELLENT**: Score $\ge 90$
- **GOOD**: Score $80 - 89$
- **NEEDS_ATTENTION**: Score $70 - 79$
- **CRITICAL**: Score $< 70$

---

## 2. Statistical Trend & Anomaly Detection

- **30-Day Trend**: Compares current 30-day incoming grievance volume against previous 30-day baseline:
  $$\Delta\% = \left(\frac{V_{\text{current}} - V_{\text{previous}}}{V_{\text{previous}}}\right) \times 100$$
- **Spike Anomaly**: Flagged when volume in a single Gram Panchayat exceeds $3.0\times$ the rolling 8-week average.
- **Root-Cause Clustering**: Detects when $\ge 3$ complaints occur within a 500-meter radius within 7 days, grouping them under a single root-cause cluster with contributing factors.
