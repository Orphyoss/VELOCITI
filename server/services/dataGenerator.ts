import { db } from '../services/supabase.js';
import * as schema from '../../shared/schema.js';
import { sql } from 'drizzle-orm';
import { logger } from './logger.js';

export interface DataGenerationResult {
  [tableName: string]: number;
}

export interface DataGenerationOptions {
  date: string;
  scenario: string;
}

export class DatabaseDataGenerator {
  private logger = logger;

  /**
   * Actually generate and insert data into the database
   * This replaces the broken Python script with working TypeScript implementation
   */
  async generateData(options: DataGenerationOptions): Promise<DataGenerationResult> {
    const { date, scenario } = options;
    const targetDate = new Date(date);
    
    this.logger.info('DataGenerator', 'start', `Generating data for ${date} with scenario: ${scenario}`);
    
    const results: DataGenerationResult = {};
    
    try {
      // Generate competitive pricing data
      results.competitive_pricing = await this.generateCompetitivePricing(targetDate, scenario);
      
      // Generate market capacity data
      results.market_capacity = await this.generateMarketCapacity(targetDate, scenario);
      
      // Generate web search data
      results.web_search_data = await this.generateWebSearchData(targetDate, scenario);
      
      // Generate RM pricing actions
      results.rm_pricing_actions = await this.generateRMPricingActions(targetDate, scenario);
      
      // Generate flight performance data
      results.flight_performance = await this.generateFlightPerformance(targetDate, scenario);
      
      // Generate market events
      results.market_events = await this.generateMarketEvents(targetDate, scenario);
      
      // Generate economic indicators  
      results.economic_indicators = await this.generateEconomicIndicators(targetDate, scenario);
      
      // Generate intelligence insights
      results.intelligence_insights = await this.generateIntelligenceInsights(targetDate, scenario);
      
      const totalRecords = Object.values(results).reduce((sum, count) => sum + count, 0);
      
      this.logger.info('DataGenerator', 'completed', `Generated ${totalRecords} total records for ${date}`, {
        results,
        scenario
      });
      
      return results;
      
    } catch (error: any) {
      this.logger.error('DataGenerator', 'failed', `Data generation failed for ${date}`, {
        error: error.message,
        scenario
      });
      throw error;
    }
  }

  private async generateCompetitivePricing(date: Date, scenario: string): Promise<number> {
    const routes = ['LGW-BCN', 'LGW-MAD', 'LGW-CDG', 'LGW-FCO', 'LGW-AMS', 'STN-BCN'];
    const airlines = ['EZY', 'RYR', 'BA', 'VY', 'TUI'];
    
    let recordsGenerated = 0;
    
    for (const route of routes) {
      for (const airline of airlines) {
        // Generate multiple pricing records per route-airline combination
        const recordCount = scenario === 'competitive_attack' ? Math.floor(Math.random() * 2) + 1 : 1;
        
        for (let i = 0; i < recordCount; i++) {
          const basePrice = Math.random() * 200 + 50;
          const priceVariation = scenario === 'competitive_attack' ? 0.8 + Math.random() * 0.4 : 0.9 + Math.random() * 0.2;
          const finalPrice = Math.round(basePrice * priceVariation * 100) / 100;
          const departureDate = new Date(date.getTime() + Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000);
          
          try {
            // Use exact column names that worked in job-001 
            await db.execute(sql`
              INSERT INTO competitive_pricing (
                insert_date, observation_date, route, airline_code, 
                flight_date, price_amount, price_currency, booking_class
              ) VALUES (
                ${new Date()}, ${date.toISOString().split('T')[0]}, ${route}, ${airline}, 
                ${departureDate.toISOString().split('T')[0]}, ${finalPrice}, 'GBP', 'Y'
              )
            `);
            recordsGenerated++;
            this.logger.info('DataGenerator', 'insert_success', `Inserted competitive pricing for ${route}-${airline}: £${finalPrice}`);
          } catch (error: any) {
            this.logger.error('DataGenerator', 'insert_error', `Failed to insert competitive pricing for ${route}-${airline}: ${error.message}`);
          }
        }
      }
    }
    
    return recordsGenerated;
  }

  private async generateMarketCapacity(date: Date, scenario: string): Promise<number> {
    const routes = ['LGW-BCN', 'LGW-MAD', 'LGW-CDG', 'LGW-FCO'];
    let recordsGenerated = 0;
    
    for (const route of routes) {
      const capacityMultiplier = scenario === 'demand_surge' ? 1.3 : 1.0;
      const baseCapacity = Math.floor((Math.random() * 300 + 150) * capacityMultiplier);
      const easyjetSeats = Math.floor(baseCapacity * (0.3 + Math.random() * 0.2));
      const marketSharePct = Math.round((0.25 + Math.random() * 0.15) * 100 * 100) / 100;
      const competitiveIndex = Math.round((0.7 + Math.random() * 0.6) * 100) / 100;
      
      try {
        // Use direct SQL for market capacity - table structure may differ
        await db.execute(sql`
          INSERT INTO market_capacity (
            insert_date, flight_date, route_id, airline_code, 
            num_flights, num_seats, data_source
          ) VALUES (
            ${new Date()}, ${date.toISOString().split('T')[0]}, ${route}, 'EZY',
            ${Math.floor(baseCapacity / 180)}, ${baseCapacity}, 'data_generator'
          ) ON CONFLICT DO NOTHING
        `);
        recordsGenerated++;
        this.logger.info('DataGenerator', 'insert_success', `Inserted market capacity for ${route}: ${baseCapacity} seats`);
      } catch (error: any) {
        this.logger.error('DataGenerator', 'insert_error', `Market capacity error for ${route}: ${error.message}`);
      }
    }
    
    return recordsGenerated;
  }

  private async generateWebSearchData(date: Date, scenario: string): Promise<number> {
    const routes = ['LGW-BCN', 'LGW-MAD', 'LGW-CDG', 'STN-BCN'];
    let recordsGenerated = 0;
    
    for (const route of routes) {
      const recordCount = scenario === 'demand_surge' ? Math.floor(Math.random() * 4) + 3 : Math.floor(Math.random() * 2) + 1;
      
      for (let i = 0; i < recordCount; i++) {
        const searchVolume = scenario === 'demand_surge' ? 
          Math.floor(Math.random() * 5000) + 2000 : 
          Math.floor(Math.random() * 2000) + 500;
        const bookingVolume = Math.floor(searchVolume * (0.02 + Math.random() * 0.08)); // 2-10% conversion
        const conversionRate = bookingVolume / searchVolume;
        const avgPrice = Math.random() * 200 + 80;
        
        try {
          // Use direct SQL for web search data
          await db.execute(sql`
            INSERT INTO web_search_data (
              search_date, route_id, search_volume, booking_volume,
              conversion_rate, avg_search_price, price_currency
            ) VALUES (
              ${date.toISOString().split('T')[0]}, ${route}, ${searchVolume}, ${bookingVolume},
              ${conversionRate}, ${avgPrice}, 'GBP'
            )
          `);
          recordsGenerated++;
          this.logger.info('DataGenerator', 'insert_success', `Inserted web search data for ${route}: ${searchVolume} searches`);
        } catch (error: any) {
          this.logger.error('DataGenerator', 'insert_error', `Web search data error for ${route}: ${error.message}`);
        }
      }
    }
    
    return recordsGenerated;
  }

  private async generateRMPricingActions(date: Date, scenario: string): Promise<number> {
    // RM Pricing Actions table may not exist or have different schema
    // We'll create simple records for testing
    let recordsGenerated = 0;
    
    try {
      // Try a simple insert to test if table exists and accepts data
      // Use direct SQL for RM pricing actions
      const oldPrice = Math.random() * 200 + 50;
      const newPrice = Math.random() * 200 + 50;
      await db.execute(sql`
        INSERT INTO rm_pricing_actions (
          created_date, route_id, action_type, old_price, new_price, reason
        ) VALUES (
          ${date.toISOString().split('T')[0]}, 'LGW-BCN', 'price_adjustment',
          ${oldPrice}, ${newPrice}, ${scenario === 'competitive_attack' ? 'Competitive response' : 'Yield optimization'}
        )
      `);
      recordsGenerated = 1;
    } catch (error) {
      this.logger.debug('DataGenerator', 'table_missing', 'rm_pricing_actions table not accessible');
      recordsGenerated = 0;
    }
    
    return recordsGenerated;
  }

  private async generateFlightPerformance(date: Date, scenario: string): Promise<number> {
    const routes = ['LGW-BCN', 'LGW-MAD', 'LGW-CDG', 'STN-BCN', 'STN-MAD', 'LTN-FCO', 'STN-DUB'];
    let recordsGenerated = 0;
    
    for (const route of routes) {
      const flightCount = scenario === 'operational_disruption' ? Math.floor(Math.random() * 3) + 1 : Math.floor(Math.random() * 5) + 3;
      
      for (let i = 0; i < flightCount; i++) {
        const onTimePerf = scenario === 'operational_disruption' ? 
          Math.random() * 0.5 + 0.3 : 
          Math.random() * 0.3 + 0.7;
        const loadFactor = Math.round((0.6 + Math.random() * 0.35) * 100 * 100) / 100;
        const flightsOperated = Math.floor(Math.random() * 6) + 2;
        const cancellationRate = Math.round(Math.random() * 5 * 100) / 100;
        const delayMinutes = Math.floor(Math.random() * 45);
        const onTimePerfPercent = Math.round(onTimePerf * 100 * 100) / 100;
        
        try {
          // Use minimal columns that definitely exist
          // Use exact column names that worked in job-001 
          await db.execute(sql`
            INSERT INTO flight_performance (
              flight_date, route_id, flight_number, load_factor,
              ontime_performance, delay_minutes, flights_operated, cancellation_rate
            ) VALUES (
              ${date.toISOString().split('T')[0]}, ${route}, ${'EZY' + (1000 + i)}, ${loadFactor},
              ${onTimePerfPercent}, ${delayMinutes}, ${flightsOperated}, ${cancellationRate}
            ) ON CONFLICT DO NOTHING
          `);
          recordsGenerated++;
          this.logger.info('DataGenerator', 'insert_success', `Inserted flight performance for ${route}: ${loadFactor}% load factor`);
        } catch (error: any) {
          this.logger.error('DataGenerator', 'insert_error', `Flight performance error for ${route}: ${error.message}`);
        }
      }
    }
    
    return recordsGenerated;
  }

  private async generateMarketEvents(date: Date, scenario: string): Promise<number> {
    const eventTypes = ['competitor_price_change', 'demand_spike', 'route_launch', 'capacity_increase'];
    const eventCount = scenario === 'competitive_attack' ? Math.floor(Math.random() * 3) + 2 : Math.floor(Math.random() * 2) + 1;
    
    let recordsGenerated = 0;
    
    for (let i = 0; i < eventCount; i++) {
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const impactScore = Math.round((Math.random() * 10) * 100) / 100;
      const affectedRoute = ['LGW-BCN', 'LGW-MAD', 'STN-BCN'][Math.floor(Math.random() * 3)];
      
      try {
        // Use exact column names that worked in job-001 
        await db.execute(sql`
          INSERT INTO market_events (
            event_date, event_type, affected_route, impact_score,
            description, source
          ) VALUES (
            ${date.toISOString().split('T')[0]}, ${eventType}, ${affectedRoute}, ${impactScore},
            ${`${eventType.replace('_', ' ')} detected on ${affectedRoute} - scenario: ${scenario}`}, 'automated_detection'
          )
        `);
        recordsGenerated++;
        this.logger.info('DataGenerator', 'insert_success', `Inserted market event: ${eventType} for ${affectedRoute}`);
      } catch (error: any) {
        this.logger.error('DataGenerator', 'insert_error', `Market events error for ${eventType}: ${error.message}`);
      }
    }
    
    return recordsGenerated;
  }

  private async generateEconomicIndicators(date: Date, scenario: string): Promise<number> {
    const indicators = [
      { name: 'fuel_price_index', value: 85 + Math.random() * 30 },
      { name: 'consumer_confidence', value: 70 + Math.random() * 25 },
      { name: 'gdp_growth_rate', value: 1.5 + Math.random() * 2 },
      { name: 'inflation_rate', value: 2 + Math.random() * 3 }
    ];
    
    let recordsGenerated = 0;
    
    for (const indicator of indicators) {
      const variance = scenario === 'economic_turbulence' ? Math.random() * 0.4 - 0.2 : Math.random() * 0.1 - 0.05;
      const adjustedValue = Math.round((indicator.value * (1 + variance)) * 100) / 100;
      
      try {
        // Use exact column names that worked in job-001 
        await db.execute(sql`
          INSERT INTO economic_indicators (
            indicator_date, indicator_name, indicator_value, indicator_unit,
            data_source, confidence_level
          ) VALUES (
            ${date.toISOString().split('T')[0]}, ${indicator.name}, ${adjustedValue}, 
            ${indicator.name.includes('rate') ? 'percentage' : 'index'},
            'market_analysis', ${Math.round((0.8 + Math.random() * 0.2) * 100) / 100}
          )
        `);
        recordsGenerated++;
        this.logger.info('DataGenerator', 'insert_success', `Inserted economic indicator: ${indicator.name} = ${adjustedValue}`);
      } catch (error: any) {
        this.logger.error('DataGenerator', 'insert_error', `Economic indicators error for ${indicator.name}: ${error.message}`);
      }
    }
    
    return recordsGenerated;
  }

  private async generateIntelligenceInsights(date: Date, scenario: string): Promise<number> {
    const insightTypes = ['competitive_move', 'market_opportunity', 'risk_alert', 'performance_insight'];
    const insightCount = Math.floor(Math.random() * 3) + 1;
    
    let recordsGenerated = 0;
    
    for (let i = 0; i < insightCount; i++) {
      const insightType = insightTypes[Math.floor(Math.random() * insightTypes.length)];
      const title = `${insightType.replace('_', ' ')} detected for ${scenario} scenario`;
      const description = `Automated analysis identified ${insightType} pattern in market data for ${date.toISOString().split('T')[0]}`;
      const confidenceScore = Math.round((0.6 + Math.random() * 0.4) * 100) / 100;
      const impactLevel = Math.floor(Math.random() * 5) + 1;
      const affectedRoutes = JSON.stringify(['LGW-BCN', 'LGW-MAD']);
      
      try {
        // Use minimal columns that definitely exist
        // Fix intelligence insights with required insight_text field
        const priorityLevel = impactLevel >= 4 ? 'High' : impactLevel >= 2 ? 'Medium' : 'Low';
        const routeId = ['LGW-BCN', 'LGW-MAD', 'STN-BCN'][Math.floor(Math.random() * 3)];
        await db.execute(sql`
          INSERT INTO intelligence_insights (
            insight_date, insight_type, title, description, confidence_score,
            impact_level, priority_level, route_id, insight_text
          ) VALUES (
            ${date.toISOString().split('T')[0]}, ${insightType}, ${title}, ${description}, ${confidenceScore},
            ${impactLevel}, ${priorityLevel}, ${routeId}, ${description}
          )
        `);
        recordsGenerated++;
        this.logger.info('DataGenerator', 'insert_success', `Inserted intelligence insight: ${insightType}`);
      } catch (error: any) {
        this.logger.error('DataGenerator', 'insert_error', `Intelligence insights error for ${insightType}: ${error.message}`);
      }
    }
    
    return recordsGenerated;
  }
}

export const dataGenerator = new DatabaseDataGenerator();