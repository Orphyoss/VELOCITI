/**
 * Telos Metrics Registry
 * Comprehensive metrics definitions and thresholds for the Telos Intelligence Platform
 * Based on the comprehensive metrics analytics framework
 */

export enum MetricCategory {
  SYSTEM_PERFORMANCE = 'system_performance',
  AI_ACCURACY = 'ai_accuracy', 
  BUSINESS_IMPACT = 'business_impact',
  USER_ADOPTION = 'user_adoption',
  DATA_QUALITY = 'data_quality',
  OPERATIONAL_EFFICIENCY = 'operational_efficiency'
}

export enum MetricFrequency {
  REAL_TIME = 'real_time',
  DAILY = 'daily',
  WEEKLY = 'weekly', 
  MONTHLY = 'monthly'
}

export interface MetricDefinition {
  metricName: string;
  category: MetricCategory;
  frequency: MetricFrequency;
  description: string;
  calculationMethod: string;
  targetValue: string;
  thresholdWarning: string;
  thresholdCritical: string;
  businessImpact: string;
  dataSources: string[];
}

export interface MetricThresholds {
  target: number;
  warning: number;
  critical: number;
}

export class TelosMetricsRegistry {
  private metrics: Map<string, MetricDefinition>;

  constructor() {
    this.metrics = new Map();
    this.initializeMetrics();
  }

  private initializeMetrics() {
    // ================================================================
    // SYSTEM PERFORMANCE METRICS
    // ================================================================
    this.addMetric('system_availability', {
      metricName: 'System Availability',
      category: MetricCategory.SYSTEM_PERFORMANCE,
      frequency: MetricFrequency.REAL_TIME,
      description: 'Percentage of time Telos platform is operational and accessible',
      calculationMethod: '(uptime_minutes / total_minutes) * 100',
      targetValue: '> 99.9%',
      thresholdWarning: '< 99.5%',
      thresholdCritical: '< 99.0%',
      businessImpact: 'System downtime blocks analyst productivity and revenue decisions',
      dataSources: ['system_health_checks', 'uptime_monitoring', 'availability_logs']
    });

    this.addMetric('nightshift_processing_time', {
      metricName: 'NightShift Processing Time',
      category: MetricCategory.SYSTEM_PERFORMANCE,
      frequency: MetricFrequency.DAILY,
      description: 'Time required to complete overnight data processing and analysis',
      calculationMethod: 'end_time - start_time for overnight processing jobs',
      targetValue: '< 45 minutes',
      thresholdWarning: '> 60 minutes',
      thresholdCritical: '> 90 minutes',
      businessImpact: 'Long processing times delay morning briefings and analyst preparation',
      dataSources: ['batch_processing_logs', 'nightshift_jobs', 'data_pipeline_metrics']
    });

    this.addMetric('data_freshness', {
      metricName: 'Data Freshness Score',
      category: MetricCategory.SYSTEM_PERFORMANCE,
      frequency: MetricFrequency.REAL_TIME,
      description: 'Average age of data across all sources measured in hours',
      calculationMethod: 'avg(current_time - last_update_time) across all data sources',
      targetValue: '< 2 hours',
      thresholdWarning: '> 4 hours',
      thresholdCritical: '> 8 hours',
      businessImpact: 'Stale data leads to outdated insights and poor decision-making',
      dataSources: ['infare_feeds', 'oag_data', 'search_data', 'data_ingestion_logs']
    });

    // ================================================================
    // AI ACCURACY & QUALITY METRICS
    // ================================================================
    this.addMetric('insight_accuracy_rate', {
      metricName: 'AI Insight Accuracy Rate',
      category: MetricCategory.AI_ACCURACY,
      frequency: MetricFrequency.WEEKLY,
      description: 'Percentage of AI insights that analysts rate as accurate and actionable',
      calculationMethod: '(accurate_insights / total_insights_with_feedback) * 100',
      targetValue: '> 85%',
      thresholdWarning: '< 80%',
      thresholdCritical: '< 75%',
      businessImpact: 'Low accuracy reduces analyst trust and adoption',
      dataSources: ['intelligence_insights', 'analyst_interactions', 'feedback_ratings']
    });

    this.addMetric('competitive_alert_precision', {
      metricName: 'Competitive Alert Precision',
      category: MetricCategory.AI_ACCURACY,
      frequency: MetricFrequency.WEEKLY,
      description: 'Percentage of competitive alerts that result in analyst action',
      calculationMethod: '(actionable_competitive_alerts / total_competitive_alerts) * 100',
      targetValue: '> 70%',
      thresholdWarning: '< 60%',
      thresholdCritical: '< 50%',
      businessImpact: 'False alerts create noise and reduce responsiveness to real threats',
      dataSources: ['intelligence_insights', 'competitive_pricing', 'analyst_interactions']
    });

    this.addMetric('confidence_score_distribution', {
      metricName: 'AI Confidence Score Distribution',
      category: MetricCategory.AI_ACCURACY,
      frequency: MetricFrequency.DAILY,
      description: 'Percentage of insights with confidence score >= 0.8',
      calculationMethod: '(high_confidence_insights / total_insights) * 100',
      targetValue: '> 75%',
      thresholdWarning: '< 65%',
      thresholdCritical: '< 50%',
      businessImpact: 'Low confidence indicates model uncertainty and poor prediction quality',
      dataSources: ['intelligence_insights', 'ai_model_outputs', 'confidence_metrics']
    });

    // ================================================================
    // BUSINESS IMPACT & ROI METRICS
    // ================================================================
    this.addMetric('analyst_time_savings', {
      metricName: 'Analyst Time Savings',
      category: MetricCategory.BUSINESS_IMPACT,
      frequency: MetricFrequency.DAILY,
      description: 'Hours saved per analyst per day through AI automation',
      calculationMethod: 'sum(automated_task_time) / number_of_analysts',
      targetValue: '> 2 hours/day',
      thresholdWarning: '< 1.5 hours/day',
      thresholdCritical: '< 1 hour/day',
      businessImpact: 'Time savings directly correlate to productivity and analyst satisfaction',
      dataSources: ['task_automation_logs', 'analyst_interactions', 'time_tracking']
    });

    this.addMetric('revenue_impact', {
      metricName: 'AI-Driven Revenue Impact',
      category: MetricCategory.BUSINESS_IMPACT,
      frequency: MetricFrequency.MONTHLY,
      description: 'Estimated revenue impact from decisions driven by AI insights',
      calculationMethod: 'sum(revenue_uplift_from_ai_driven_decisions)',
      targetValue: '> £500K/month',
      thresholdWarning: '< £300K/month',
      thresholdCritical: '< £200K/month',
      businessImpact: 'Revenue impact validates ROI and justifies platform investment',
      dataSources: ['flight_performance', 'pricing_actions', 'load_factor_improvements']
    });

    this.addMetric('competitive_response_speed', {
      metricName: 'Competitive Response Speed',
      category: MetricCategory.BUSINESS_IMPACT,
      frequency: MetricFrequency.WEEKLY,
      description: 'Average time from competitor price change to EasyJet response action',
      calculationMethod: 'avg(easyjet_action_time - competitor_price_change_time)',
      targetValue: '< 4 hours',
      thresholdWarning: '> 8 hours',
      thresholdCritical: '> 24 hours',
      businessImpact: 'Faster competitive response protects market share and revenue',
      dataSources: ['competitive_pricing', 'rm_pricing_actions', 'intelligence_insights']
    });

    // ================================================================
    // USER ADOPTION & SATISFACTION METRICS
    // ================================================================
    this.addMetric('daily_active_users', {
      metricName: 'Daily Active Users',
      category: MetricCategory.USER_ADOPTION,
      frequency: MetricFrequency.DAILY,
      description: 'Number of unique analysts using the system daily',
      calculationMethod: 'count(distinct(analyst_id)) where login_date = current_date',
      targetValue: '> 90% of target analysts',
      thresholdWarning: '< 80%',
      thresholdCritical: '< 70%',
      businessImpact: 'Low adoption reduces ROI and indicates user experience issues',
      dataSources: ['analyst_interactions', 'system_access_logs']
    });

    this.addMetric('user_satisfaction_score', {
      metricName: 'User Satisfaction Score (NPS)',
      category: MetricCategory.USER_ADOPTION,
      frequency: MetricFrequency.MONTHLY,
      description: 'Net Promoter Score based on analyst feedback surveys',
      calculationMethod: '(promoters - detractors) / total_responses * 100',
      targetValue: '> 50 NPS',
      thresholdWarning: '< 30 NPS',
      thresholdCritical: '< 10 NPS',
      businessImpact: 'User satisfaction drives adoption and long-term success',
      dataSources: ['user_surveys', 'feedback_forms', 'satisfaction_ratings']
    });

    this.addMetric('insight_action_rate', {
      metricName: 'Insight Action Rate',
      category: MetricCategory.USER_ADOPTION,
      frequency: MetricFrequency.WEEKLY,
      description: 'Percentage of AI insights that result in analyst action',
      calculationMethod: '(insights_acted_upon / total_insights_presented) * 100',
      targetValue: '> 60%',
      thresholdWarning: '< 50%',
      thresholdCritical: '< 40%',
      businessImpact: 'Low action rate indicates insights are not valuable or actionable',
      dataSources: ['intelligence_insights', 'analyst_interactions', 'action_tracking']
    });

    // ================================================================
    // DATA QUALITY & RELIABILITY METRICS
    // ================================================================
    this.addMetric('data_completeness_rate', {
      metricName: 'Data Completeness Rate',
      category: MetricCategory.DATA_QUALITY,
      frequency: MetricFrequency.DAILY,
      description: 'Percentage of expected data records received from external sources',
      calculationMethod: '(records_received / records_expected) * 100',
      targetValue: '> 95%',
      thresholdWarning: '< 90%',
      thresholdCritical: '< 85%',
      businessImpact: 'Incomplete data leads to biased insights and missed opportunities',
      dataSources: ['data_ingestion_logs', 'infare_feeds', 'oag_data', 'search_data']
    });

    this.addMetric('data_accuracy_score', {
      metricName: 'External Data Accuracy Score',
      category: MetricCategory.DATA_QUALITY,
      frequency: MetricFrequency.WEEKLY,
      description: 'Accuracy of external data validated against known benchmarks',
      calculationMethod: '(validated_accurate_records / total_validated_records) * 100',
      targetValue: '> 98%',
      thresholdWarning: '< 95%',
      thresholdCritical: '< 92%',
      businessImpact: 'Inaccurate source data propagates errors through all AI insights',
      dataSources: ['data_validation_checks', 'competitive_pricing', 'benchmark_comparisons']
    });

    // ================================================================
    // OPERATIONAL EFFICIENCY METRICS
    // ================================================================
    this.addMetric('alert_fatigue_index', {
      metricName: 'Alert Fatigue Index',
      category: MetricCategory.OPERATIONAL_EFFICIENCY,
      frequency: MetricFrequency.WEEKLY,
      description: 'Ratio of actionable alerts to total alerts generated',
      calculationMethod: 'total_alerts / actionable_alerts',
      targetValue: '< 1.5',
      thresholdWarning: '> 2.0',
      thresholdCritical: '> 3.0',
      businessImpact: 'Too many alerts create fatigue and reduce analyst responsiveness',
      dataSources: ['intelligence_insights', 'alert_management', 'analyst_feedback']
    });

    this.addMetric('insight_generation_cost', {
      metricName: 'Cost per Insight Generated',
      category: MetricCategory.OPERATIONAL_EFFICIENCY,
      frequency: MetricFrequency.MONTHLY,
      description: 'Total system cost divided by number of insights generated',
      calculationMethod: '(compute_costs + api_costs + storage_costs) / total_insights',
      targetValue: '< £5 per insight',
      thresholdWarning: '> £8 per insight',
      thresholdCritical: '> £12 per insight',
      businessImpact: 'High cost per insight reduces platform profitability and scalability',
      dataSources: ['billing_data', 'usage_metrics', 'intelligence_insights']
    });
  }

  private addMetric(key: string, metric: MetricDefinition) {
    this.metrics.set(key, metric);
  }

  getMetric(metricName: string): MetricDefinition | undefined {
    return this.metrics.get(metricName);
  }

  getMetricsByCategory(category: MetricCategory): MetricDefinition[] {
    return Array.from(this.metrics.values()).filter(metric => metric.category === category);
  }

  getAllMetrics(): MetricDefinition[] {
    return Array.from(this.metrics.values());
  }

  getMetricThresholds(metricName: string): MetricThresholds | undefined {
    const metric = this.getMetric(metricName);
    if (!metric) return undefined;

    return {
      target: this.parseThresholdValue(metric.targetValue),
      warning: this.parseThresholdValue(metric.thresholdWarning),
      critical: this.parseThresholdValue(metric.thresholdCritical)
    };
  }

  private parseThresholdValue(value: string): number {
    // Extract numeric value from threshold strings like "> 99.9%" or "< 4 hours"
    const match = value.match(/[\d.]+/);
    return match ? parseFloat(match[0]) : 0;
  }

  // Get metrics that should be monitored in real-time
  getRealTimeMetrics(): MetricDefinition[] {
    return this.getMetricsByFrequency(MetricFrequency.REAL_TIME);
  }

  private getMetricsByFrequency(frequency: MetricFrequency): MetricDefinition[] {
    return Array.from(this.metrics.values()).filter(metric => metric.frequency === frequency);
  }
}

// Export singleton instance
export const metricsRegistry = new TelosMetricsRegistry();