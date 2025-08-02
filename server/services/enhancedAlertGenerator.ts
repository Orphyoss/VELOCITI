import { db } from "./supabase";
import { alerts } from "@shared/schema";
import { storage } from "../storage";
import { sql } from "drizzle-orm";
import { logger, logAgent } from "./logger";

export interface AlertScenario {
  type: 'competitive' | 'demand' | 'operational' | 'system' | 'economic';
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  recommendation: string;
  route?: string;
  confidence: number;
  agent_source: string;
  metadata?: any;
}

export class EnhancedAlertGenerator {
  private scenarios: AlertScenario[] = [];

  constructor() {
    logger.info('EnhancedAlertGenerator', 'init', 'Initializing Enhanced Alert Generation Engine');
    this.initializeScenarios();
    logger.info('EnhancedAlertGenerator', 'init', `Loaded ${this.scenarios.length} sophisticated alert scenarios`);
  }

  private initializeScenarios() {
    this.scenarios = [
      // Competitive Intelligence Scenarios
      {
        type: 'competitive',
        priority: 'critical',
        category: 'competitive',
        title: 'Ryanair Flash Sale Attack on Core Route LGW-BCN',
        description: 'Ryanair has launched aggressive pricing 25% below normal levels on LGW-BCN for mid-haul flights (14-35 days out). This represents their most aggressive move on this route in 6 months. British Airways has responded by increasing premium positioning rather than matching.',
        recommendation: 'IMMEDIATE ACTION: Consider selective price matching on Tuesday-Thursday flights where Ryanair pricing is most aggressive. Maintain weekend premium but monitor booking pace carefully. Set up hourly booking alerts for next 48 hours.',
        route: 'LGW-BCN',
        confidence: 0.94,
        agent_source: 'competitive',
        metadata: {
          competitor: 'Ryanair',
          price_drop_percentage: 25,
          affected_days: '14-35',
          competitor_response: 'British Airways premium positioning'
        }
      },
      {
        type: 'competitive',
        priority: 'high',
        category: 'competitive',
        title: 'BA Premium Push Counter-Attack on LGW-CDG',
        description: 'British Airways has increased prices 15% above normal on LGW-CDG business routes, focusing on premium travelers. This follows aggressive Wizz Air expansion on the route. BA is betting on service differentiation over price competition.',
        recommendation: 'STRATEGIC RESPONSE: Position as premium alternative to Wizz Air but below BA pricing. Target 8-12% price increase with enhanced service messaging. Monitor BA load factors for validation.',
        route: 'LGW-CDG',
        confidence: 0.87,
        agent_source: 'competitive',
        metadata: {
          competitor: 'British Airways',
          price_increase_percentage: 15,
          strategy: 'premium_positioning',
          threat: 'Wizz Air expansion'
        }
      },

      // Demand Anomaly Scenarios
      {
        type: 'demand',
        priority: 'high',
        category: 'performance',
        title: 'Viral Demand Surge on LGW-Malaga Route',
        description: 'Search volume for LGW-AGP has increased 300% in 5 days, likely due to social media travel content. Conversion rates are 45% above normal, indicating high purchase intent. Current pricing may be leaving money on the table.',
        recommendation: 'REVENUE OPPORTUNITY: Increase prices 12-15% for flights departing 14-28 days. Demand strength supports premium capture. Monitor competitor response and be ready to adjust if market pushes back.',
        route: 'LGW-AGP',
        confidence: 0.89,
        agent_source: 'performance',
        metadata: {
          search_increase_percentage: 300,
          conversion_increase_percentage: 45,
          trigger: 'social_media_viral',
          recommended_price_increase: '12-15%'
        }
      },
      {
        type: 'demand',
        priority: 'medium',
        category: 'performance',
        title: 'Weekend Warrior Pattern Shift - PMI Route',
        description: 'Unusual mid-week booking surge detected on LGW-PMI. Tuesday-Thursday flights showing 87% load factors vs 72% for weekends. This breaks traditional leisure travel patterns for Palma.',
        recommendation: 'TACTICAL ADJUSTMENT: Shift capacity from weekend to mid-week if possible. Increase Tuesday-Thursday pricing 8% to capitalize on unusual demand pattern. Investigate if this is temporary or structural shift.',
        route: 'LGW-PMI',
        confidence: 0.76,
        agent_source: 'performance',
        metadata: {
          midweek_load_factor: 87.5,
          weekend_load_factor: 72.3,
          pattern: 'reverse_traditional',
          capacity_recommendation: 'shift_to_midweek'
        }
      },

      // Operational Disruption Scenarios
      {
        type: 'operational',
        priority: 'high',
        category: 'network',
        title: 'Strike Disruption Creates Demand Spillover',
        description: 'French ATC strike is disrupting Paris routes, creating 60% surge in demand for Amsterdam and Brussels alternatives. Current capacity may be insufficient to capture opportunity.',
        recommendation: 'TACTICAL RESPONSE: Consider aircraft swap to larger gauge on LGW-AMS if available. Increase prices 8-10% to optimize revenue from constrained capacity. Extend promotion to Brussels route to capture additional spillover.',
        route: 'LGW-AMS',
        confidence: 0.91,
        agent_source: 'network',
        metadata: {
          disruption_type: 'ATC_strike',
          affected_routes: ['LGW-CDG', 'LGW-ORY'],
          spillover_demand: 60,
          alternative_routes: ['LGW-AMS', 'LGW-BRU']
        }
      },

      // System Conflict Scenarios
      {
        type: 'system',
        priority: 'medium',
        category: 'performance',
        title: 'Revenue Management System Override Detected',
        description: 'Elysium recommended price increase on LGW-BCN flight EZY8842 (25 days out) but analyst manually overrode with price decrease. Distance from profile: -23%. This suggests either system calibration issue or analyst has market intelligence not captured in model.',
        recommendation: 'REVIEW REQUIRED: Investigate analyst reasoning for override. If valid competitive threat detected, update system parameters. If analyst error, provide additional training on profile interpretation.',
        route: 'LGW-BCN',
        confidence: 0.82,
        agent_source: 'performance',
        metadata: {
          system_recommendation: 'price_increase',
          analyst_action: 'price_decrease',
          profile_distance: '-23%',
          flight_code: 'EZY8842',
          days_out: 25
        }
      },

      // Economic Signal Scenarios
      {
        type: 'economic',
        priority: 'medium',
        category: 'network',
        title: 'GBP Strength May Impact European Leisure Demand',
        description: 'GBP has strengthened 5% vs EUR in 3 days, making UK holidays more expensive for European travelers. Historical correlation suggests 8-12% demand reduction for European leisure traffic within 14 days.',
        recommendation: 'HEDGE STRATEGY: Consider promotional pricing for European point-of-sale markets. Monitor booking pace from EU origins closely. Potential opportunity to shift marketing spend to domestic UK leisure market.',
        confidence: 0.76,
        agent_source: 'network',
        metadata: {
          currency_change: 'GBP_EUR_+5%',
          historical_impact: '8-12% demand reduction',
          affected_segment: 'European leisure',
          timeframe: '14 days'
        }
      },

      // Network Optimization Scenarios
      {
        type: 'operational',
        priority: 'high',
        category: 'network',
        title: 'Capacity Reallocation Opportunity - Eastern Europe',
        description: 'Load factors on Eastern European routes (WAW, BUD, PRG) averaging 91% vs 78% Western Europe average. Demand exceeding supply by estimated 15%. Opportunity for capacity reallocation.',
        recommendation: 'CAPACITY STRATEGY: Evaluate aircraft reallocation from underperforming Western routes to Eastern Europe. Consider frequency increases on WAW-LGW and BUD-LGW. ROI analysis suggests 12% revenue uplift potential.',
        confidence: 0.85,
        agent_source: 'network',
        metadata: {
          eastern_europe_lf: 91,
          western_europe_lf: 78,
          demand_excess: 15,
          recommended_routes: ['WAW-LGW', 'BUD-LGW'],
          roi_potential: '12%'
        }
      },

      // Crisis Management Scenarios
      {
        type: 'operational',
        priority: 'critical',
        category: 'network',
        title: 'Volcanic Ash Cloud Disruption Imminent',
        description: 'Meteorological models show 72% probability of volcanic ash cloud affecting Northern European airspace within 48 hours. Historical data suggests 3-5 day disruption period with 85% flight cancellations.',
        recommendation: 'CRISIS PREPARATION: Activate contingency protocols immediately. Pre-position aircraft in Southern European bases. Prepare passenger re-accommodation procedures. Consider temporary route suspensions to preserve crew duty time.',
        confidence: 0.88,
        agent_source: 'network',
        metadata: {
          disruption_probability: 72,
          estimated_duration: '3-5 days',
          expected_cancellations: 85,
          affected_region: 'Northern Europe',
          trigger: 'volcanic ash'
        }
      },

      // Revenue Optimization Scenarios
      {
        type: 'demand',
        priority: 'high',
        category: 'performance',
        title: 'Last-Minute Booking Surge - Summer Routes',
        description: 'Mediterranean routes showing 40% increase in bookings within 7 days of departure. Average fare premium 35% above advance bookings. Trend accelerating vs historical patterns.',
        recommendation: 'DYNAMIC PRICING: Implement aggressive last-minute pricing strategy. Increase inventory protection for close-in sales. Consider reducing advance purchase incentives temporarily to capture higher yields.',
        confidence: 0.83,
        agent_source: 'performance',
        metadata: {
          booking_surge: 40,
          fare_premium: 35,
          booking_window: '7 days',
          affected_routes: 'Mediterranean',
          trend: 'accelerating'
        }
      }
    ];
  }

  async generateScenarioAlerts(count: number = 3): Promise<void> {
    return await logger.logOperation(
      'EnhancedAlertGenerator',
      'generateScenarioAlerts',
      `Generating ${count} scenario alerts`,
      async () => {
        const selectedScenarios = this.getRandomScenarios(count);
        logger.debug('EnhancedAlertGenerator', 'selection', `Selected scenarios`, { 
          count: selectedScenarios.length,
          scenarios: selectedScenarios.map(s => ({ title: s.title, priority: s.priority, type: s.type }))
        });
        
        let successful = 0;
        let failed = 0;
        
        for (const scenario of selectedScenarios) {
          try {
            await this.createAlert(scenario);
            await this.createActivity(scenario);
            successful++;
            logAgent(scenario.agent_source, 'alert_generated', `Created: ${scenario.title}`, {
              priority: scenario.priority,
              type: scenario.type,
              confidence: scenario.confidence
            });
          } catch (error) {
            failed++;
            logger.error('EnhancedAlertGenerator', 'create_scenario', `Failed to create scenario: ${scenario.title}`, error, {
              scenario: scenario.title,
              type: scenario.type,
              priority: scenario.priority
            });
          }
        }
        
        logger.info('EnhancedAlertGenerator', 'generateScenarioAlerts', 
          `Generation completed - Success: ${successful}, Failed: ${failed}`, {
            successful,
            failed,
            totalRequested: count,
            scenarios: selectedScenarios.map(s => s.title)
          });
      },
      { requestedCount: count }
    );
  }

  private getRandomScenarios(count: number): AlertScenario[] {
    const shuffled = [...this.scenarios].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, this.scenarios.length));
  }

  private async createAlert(scenario: AlertScenario): Promise<void> {
    return await logger.logOperation(
      'EnhancedAlertGenerator',
      'createAlert',
      `Creating alert: ${scenario.title}`,
      async () => {
        const alertData = {
          type: scenario.type,
          priority: scenario.priority,
          title: scenario.title,
          description: scenario.description,
          route: scenario.route || null,
          confidence: scenario.confidence.toFixed(4),
          agent_id: scenario.agent_source,
          category: scenario.category,
          status: 'active',
          metadata: {
            ...scenario.metadata,
            recommendation: scenario.recommendation,
            scenario_generated: true,
            generation_timestamp: new Date().toISOString()
          }
        };

        await db.insert(alerts).values([alertData]);
        
        logger.debug('EnhancedAlertGenerator', 'createAlert', `Database insert successful`, {
          alertId: scenario.title,
          type: scenario.type,
          priority: scenario.priority,
          confidence: scenario.confidence
        });
      },
      { 
        scenario: scenario.title, 
        priority: scenario.priority, 
        type: scenario.type 
      }
    );
  }

  private async createActivity(scenario: AlertScenario): Promise<void> {
    try {
      await storage.createActivity({
        type: 'analysis',
        title: `Enhanced Alert Generated: ${scenario.title}`,
        description: `AI agent detected ${scenario.type} scenario requiring attention`,
        agentId: scenario.agent_source,
        metadata: {
          scenario_type: scenario.type,
          priority: scenario.priority,
          route: scenario.route
        }
      });
    } catch (error) {
      console.error('[EnhancedAlertGenerator] Error creating activity:', error);
    }
  }

  // Method to generate specific type of alerts
  async generateAlertsByType(type: AlertScenario['type'], count: number = 2): Promise<void> {
    const typeScenarios = this.scenarios.filter(s => s.type === type);
    const selected = typeScenarios.slice(0, Math.min(count, typeScenarios.length));
    
    for (const scenario of selected) {
      await this.createAlert(scenario);
      await this.createActivity(scenario);
    }
    
    console.log(`[EnhancedAlertGenerator] Generated ${selected.length} ${type} alerts`);
  }

  // Method to generate alerts by priority
  async generateAlertsByPriority(priority: AlertScenario['priority'], count: number = 2): Promise<void> {
    const priorityScenarios = this.scenarios.filter(s => s.priority === priority);
    const selected = priorityScenarios.slice(0, Math.min(count, priorityScenarios.length));
    
    for (const scenario of selected) {
      await this.createAlert(scenario);
      await this.createActivity(scenario);
    }
    
    console.log(`[EnhancedAlertGenerator] Generated ${selected.length} ${priority} priority alerts`);
  }

  // Get scenario statistics
  getScenarioStats() {
    const stats = {
      total: this.scenarios.length,
      byType: {} as Record<string, number>,
      byPriority: {} as Record<string, number>,
      byCategory: {} as Record<string, number>
    };

    this.scenarios.forEach(scenario => {
      stats.byType[scenario.type] = (stats.byType[scenario.type] || 0) + 1;
      stats.byPriority[scenario.priority] = (stats.byPriority[scenario.priority] || 0) + 1;
      stats.byCategory[scenario.category] = (stats.byCategory[scenario.category] || 0) + 1;
    });

    return stats;
  }
}

export const enhancedAlertGenerator = new EnhancedAlertGenerator();