# Velociti Intelligence Platform - Comprehensive Metrics Guide

## Overview
This document provides a complete reference for all metrics used in the Velociti Intelligence Platform, including their calculations, data sources, and business significance.

---

## 1. SYSTEM PERFORMANCE METRICS

### 1.1 System Availability
**Formula:** `(uptimeChecks / totalChecks) * 100`
- **Data Source:** `systemMetrics` table, `metricType = 'system_uptime'`
- **Calculation:** Filters metrics where `value > 0`, calculates percentage
- **Default:** 99.5% when no data available
- **Business Impact:** Platform reliability measurement

### 1.2 Uptime Hours
**Formula:** `(availabilityPercent / 100) * 24 * 7`
- **Data Source:** Derived from system availability
- **Calculation:** Weekly uptime hours based on availability percentage
- **Unit:** Hours per week

### 1.3 Nightshift Processing Time
**Formula:** `AVG(processingMetrics.value)` and `MAX(processingMetrics.value)`
- **Data Source:** `systemMetrics` table, `metricType = 'processing_time'`
- **Calculation:** Average and maximum processing times
- **Default:** 42 minutes average, 65 minutes maximum
- **Success Rate:** 
  - `< 45 min = 95%`
  - `45-60 min = 85%` 
  - `> 60 min = 75%`

### 1.4 Data Freshness
**Formula:** `AVG(freshnessMetrics.value)`
- **Data Source:** `systemMetrics` table, `metricType = 'data_freshness'`
- **Calculation:** Average hours delay across all data sources
- **Default:** 1.8 hours
- **By Source Breakdown:**
  - Competitive Pricing: `avgHoursDelay * 0.8`
  - Flight Performance: `avgHoursDelay * 1.2`
  - Search Data: `avgHoursDelay * 0.6`

---

## 2. AI ACCURACY METRICS

### 2.1 Insight Accuracy Rate
**Formula:** `(highConfidenceInsights / totalInsights) * 100`
- **Data Source:** `intelligenceInsights` table
- **Calculation:** Percentage of insights with confidence score >= 0.8
- **Default:** 87.3% when no data available
- **Breakdown:** Calculated per insight type

### 2.2 Competitive Alert Precision
**Formula:** `(actionableAlerts / totalCompetitiveAlerts) * 100`
- **Data Source:** `intelligenceInsights` table where `agentSource = 'Competitive_Intelligence_Agent'`
- **Calculation:** Percentage of competitive alerts that resulted in action
- **Default:** 73.2% when no data available

### 2.3 Confidence Distribution
**Formula:** Buckets insights by confidence score ranges
- **Very High:** `>= 0.9`
- **High:** `0.85 - 0.89`
- **Medium:** `0.8 - 0.84`
- **Low:** `< 0.8`
- **High Confidence Rate:** `(insights >= 0.8 / total) * 100`

### 2.4 Average Satisfaction
**Formula:** `AVG(feedback.rating)`
- **Data Source:** `feedback` table
- **Calculation:** Average user satisfaction rating
- **Default:** 4.2/5.0 when no feedback available

---

## 3. BUSINESS IMPACT METRICS

### 3.1 Analyst Time Savings
**Formula:** `totalInsights * avgTimePerInsight`
- **Data Source:** Intelligence insights count × agent configuration
- **Default Time Per Insight:** 45 minutes (from competitive agent config)
- **Calculation:** `totalHoursSaved = (insightCount * 45) / 60`
- **Daily Savings:** `totalHoursSaved / daysDifference * 60` (minutes)

### 3.2 Revenue Impact
**Formula:** `actionableInsights * avgRevenuePerInsight`
- **Data Source:** Insights where `actionTaken = true`
- **Default Revenue Per Insight:** £125,000
- **Calculations:**
  - Total AI-Driven Revenue: `actionableCount * £125,000`
  - Monthly Revenue: `totalRevenue / months`
  - Revenue Per Insight: `totalRevenue / totalInsights`
  - ROI Multiple: `totalRevenue / (implementationCost || £50,000)`

### 3.3 Competitive Response Speed
**Formula:** Analysis of alert response times
- **Data Source:** Alert creation to resolution timestamps
- **Calculations:**
  - Average Response Time: `AVG(responseTimeHours)`
  - Fast Responses: `COUNT(responses <= 4 hours)`
  - Fastest/Slowest: `MIN/MAX(responseTimeHours)`

---

## 4. USER ADOPTION METRICS

### 4.1 Daily Active Users
**Formula:** `COUNT(DISTINCT userId) per day`
- **Data Source:** `activities` table grouped by date
- **Calculations:**
  - Average Daily Users: `AVG(daily user counts)`
  - Peak Daily Users: `MAX(daily user counts)`
  - Growth Trend: Comparison over time periods

### 4.2 User Satisfaction (NPS)
**Formula:** `((promoters - detractors) / totalResponses) * 100`
- **Data Source:** `feedback` table ratings
- **Rating Classification:**
  - Promoters: 4-5 stars
  - Passive: 3 stars  
  - Detractors: 1-2 stars
- **Default NPS:** 72 when no feedback available

### 4.3 Insight Action Rate
**Formula:** `(insightsActedUpon / totalInsights) * 100`
- **Data Source:** `intelligenceInsights` table, `actionTaken` field
- **Breakdown:** Calculated by insight type and priority level
- **Default:** 64.2% when no data available

---

## 5. REVENUE MANAGEMENT METRICS

### 5.1 Load Factor Calculation
**Formula:** `AVG(flightPerformance.loadFactor)`
- **Data Source:** `flightPerformance` table
- **Calculation:** Average load factor per route over specified timeframe
- **Unit:** Percentage (e.g., 78.8%)

### 5.2 Yield Optimization
**Formula:** `AVG(competitivePricing.priceAmount)` for EasyJet (EZY)
- **Data Source:** `competitivePricing` table where `airlineCode = 'EZY'`
- **Calculations:**
  - Current Yield: Average EasyJet price
  - Target Yield: `currentYield * 1.08` (8% improvement target)
  - Optimization Potential: `targetYield - currentYield`
  - Performance vs Target: `(currentYield / targetYield) * 100`

### 5.3 Revenue Calculation
**Formula:** `estimatedPax * avgPrice`
- **Components:**
  - Estimated Passengers: `totalSeats * (loadFactor / 100)`
  - Total Revenue: `estimatedPax * avgPrice`
  - Daily Revenue: Scaled to daily figures

### 5.4 Market Share Calculation
**Formula:** `(easyjetSeats / totalMarketSeats) * 100`
- **Data Source:** `marketCapacity` table
- **Calculation:** EasyJet capacity as percentage of total market capacity
- **Includes:** Competitor ranking and market position

---

## 6. COMPETITIVE INTELLIGENCE METRICS

### 6.1 Price Advantage
**Formula:** `easyjetPrice - competitorAvgPrice`
- **Data Source:** `competitivePricing` table
- **Calculation:** Price differential vs competitor average
- **Positive Value:** EasyJet premium
- **Negative Value:** EasyJet discount

### 6.2 Market Response Speed
**Formula:** Time from competitor action to EasyJet response
- **Data Source:** Alert timestamps and resolution data
- **Target:** < 4 hours for critical competitive moves
- **Calculation:** `responseTimestamp - alertTimestamp`

---

## 7. ALERT GENERATION METRICS

### 7.1 Alert Volume
**Formula:** `COUNT(alerts)` per time period
- **Data Source:** `alerts` table
- **Breakdown:** By type (competitive, performance, network, demand)
- **Frequency:** Every 45 minutes via AlertScheduler

### 7.2 Alert Priority Distribution
**Formula:** `COUNT(alerts) GROUP BY priority`
- **Categories:** Critical, High, Medium, Low
- **Business Rule:** Critical alerts require immediate action

---

## 8. NETWORK PERFORMANCE METRICS

### 8.1 Route Performance Aggregation
**Formula:** Multiple calculations per route
- **Load Factor:** `AVG(loadFactor)` per route
- **Yield:** `AVG(priceAmount)` per route
- **Revenue:** `SUM(estimatedRevenue)` per route
- **Flight Count:** `COUNT(flights)` per route

### 8.2 Timeframe Analysis
**Supported Timeframes:** 24 hours, 7 days, 30 days
- **Calculation:** Date filtering with `cutoffDate = today - timeframe`
- **Data Source:** `flightPerformance` and `competitivePricing` tables

---

## 9. DATA QUALITY METRICS

### 9.1 Observation Count
**Formula:** `COUNT(records)` per data source
- **Purpose:** Data completeness validation
- **Sources:** Flight performance, competitive pricing, market capacity

### 9.2 Data Recency
**Formula:** `NOW() - MAX(lastUpdated)`
- **Measurement:** Hours since last data refresh
- **Alert Threshold:** > 6 hours delay triggers warning

---

## 10. CALCULATION DEFAULTS & FALLBACKS

### Default Values (when no data available):
- **System Availability:** 99.5%
- **Processing Time:** 42 minutes average
- **Data Freshness:** 1.8 hours delay
- **Insight Accuracy:** 87.3%
- **Competitive Precision:** 73.2%
- **NPS Score:** 72
- **Action Rate:** 64.2%
- **Time Per Insight:** 45 minutes
- **Revenue Per Insight:** £125,000

### Data Source Priority:
1. Real-time database queries
2. Cached metrics (when available)
3. Calculated defaults (fallback)

---

## 11. BUSINESS INTELLIGENCE FORMULAS

### 11.1 Risk Assessment
**Formula:** Weighted scoring system
- **Negative Performance:** Routes with declining metrics
- **Low Yield:** Below-average pricing performance  
- **High Volatility:** Significant metric fluctuations
- **Overall Risk Score:** `(negative + lowYield + volatile) / totalRoutes`

### 11.2 Competitive Threat Level
**Formula:** Multi-factor analysis
- **Price Aggression:** Competitor price drops > 10%
- **Capacity Increases:** Competitor seat additions > 15%
- **Market Response:** Speed of competitive moves
- **Threat Score:** Weighted combination of factors

---

This comprehensive guide covers all metrics calculations used throughout the Velociti Intelligence Platform, providing transparency into how business intelligence is generated and measured.