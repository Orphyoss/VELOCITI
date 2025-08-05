import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, decimal, boolean, jsonb, uuid, bigserial, date, time, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User management
export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("analyst"), // analyst, manager, executive
  preferences: jsonb("preferences").default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

// Alerts and notifications
export const alerts = pgTable("alerts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type"),
  priority: text("priority").notNull(), // critical, high, medium, low
  title: text("title").notNull(),
  description: text("description").notNull(),
  route: text("route"),
  route_name: text("route_name"),
  metric_value: decimal("metric_value", { precision: 12, scale: 4 }),
  threshold_value: decimal("threshold_value", { precision: 12, scale: 4 }),
  impact_score: decimal("impact_score", { precision: 12, scale: 2 }),
  confidence: decimal("confidence", { precision: 5, scale: 4 }),
  agent_id: text("agent_id").notNull(),
  metadata: jsonb("metadata").default({}),
  status: text("status").notNull().default("active"), // active, dismissed, escalated
  created_at: timestamp("created_at").defaultNow(),
  acknowledged_at: timestamp("acknowledged_at"),
  resolved_at: timestamp("resolved_at"),
  category: text("category").notNull(), // competitive, performance, network
});

// Agent performance and learning
export const agents = pgTable("agents", {
  id: text("id").primaryKey(), // competitive, performance, network
  name: text("name").notNull(),
  status: text("status").notNull().default("active"), // active, learning, maintenance
  accuracy: decimal("accuracy", { precision: 5, scale: 2 }).default("0.00"),
  totalAnalyses: integer("total_analyses").default(0),
  successfulPredictions: integer("successful_predictions").default(0),
  configuration: jsonb("configuration").default({}),
  lastActive: timestamp("last_active").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Feedback for agent learning
export const feedback = pgTable("feedback", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  alert_id: uuid("alert_id").references(() => alerts.id),
  agent_id: text("agent_id").references(() => agents.id),
  user_id: uuid("user_id").references(() => users.id),
  rating: integer("rating").notNull(), // 1-5 or thumbs up/down (-1, 1)
  comment: text("comment"),
  action_taken: boolean("action_taken").default(false),
  impact_realized: decimal("impact_realized", { precision: 10, scale: 2 }),
  created_at: timestamp("created_at").defaultNow(),
});

// ============================================================================
// TELOS INTELLIGENCE PLATFORM SCHEMA - EXISTING TABLES
// ============================================================================

// Airlines and Carriers (existing table)
export const airlines = pgTable("airlines", {
  airlineCode: varchar("airline_code", { length: 10 }).primaryKey(),
  airlineName: varchar("airline_name", { length: 100 }).notNull(),
  carrierType: varchar("carrier_type", { length: 20 }).notNull(), // LCC, FSC, ULCC, Hybrid
  countryCode: varchar("country_code", { length: 3 }),
  activeFlag: boolean("active_flag").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Airports and Cities (existing table)
export const airports = pgTable("airports", {
  airportCode: varchar("airport_code", { length: 10 }).primaryKey(),
  airportName: varchar("airport_name", { length: 100 }),
  cityName: varchar("city_name", { length: 50 }),
  countryCode: varchar("country_code", { length: 3 }),
  region: varchar("region", { length: 50 }),
  timezone: varchar("timezone", { length: 50 }),
  activeFlag: boolean("active_flag").default(true),
});

// Route Markets (existing table)
export const routes = pgTable("routes", {
  routeId: varchar("route_id", { length: 20 }).primaryKey(), // Format: LGW-BCN
  originAirport: varchar("origin_airport", { length: 10 }).references(() => airports.airportCode),
  destinationAirport: varchar("destination_airport", { length: 10 }).references(() => airports.airportCode),
  marketType: varchar("market_type", { length: 20 }), // Domestic, EU, International
  distanceKm: integer("distance_km"),
  isEasyjetRoute: boolean("is_easyjet_route").default(false),
  routePriority: varchar("route_priority", { length: 20 }), // Core, Secondary, Seasonal
  createdAt: timestamp("created_at").defaultNow(),
});

// Aircraft Types (existing table)
export const aircraftTypes = pgTable("aircraft_types", {
  aircraftCode: varchar("aircraft_code", { length: 10 }).primaryKey(),
  aircraftName: varchar("aircraft_name", { length: 50 }),
  typicalSeats: integer("typical_seats"),
  aircraftCategory: varchar("aircraft_category", { length: 20 }), // Narrowbody, Widebody, Regional
});

// Competitive Pricing Data (existing table with correct column names)
export const competitivePricing = pgTable("competitive_pricing", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  insertDate: timestamp("insert_date").notNull(),
  observationDate: date("observation_date").notNull(),
  routeId: varchar("route_id", { length: 20 }),
  airlineCode: varchar("airline_code", { length: 10 }),
  flightDate: date("flight_date").notNull(),
  flightNumber: varchar("flight_number", { length: 20 }),
  departureTime: time("departure_time"),
  priceAmount: decimal("price_amount", { precision: 10, scale: 2 }),
  priceCurrency: varchar("price_currency", { length: 3 }),
  fareType: varchar("fare_type", { length: 20 }),
  bookingClass: varchar("booking_class", { length: 10 }),
  availabilitySeats: integer("availability_seats"),
  dataSource: varchar("data_source", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Intelligence Insights (existing table with correct column names)
export const intelligenceInsights = pgTable("intelligence_insights", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  insightDate: date("insight_date").notNull(),
  insightType: varchar("insight_type", { length: 30 }),
  priorityLevel: varchar("priority_level", { length: 20 }),
  routeId: varchar("route_id", { length: 20 }),
  airlineCode: varchar("airline_code", { length: 10 }),
  title: varchar("title", { length: 200 }),
  description: text("description"),
  recommendation: text("recommendation"),
  confidenceScore: decimal("confidence_score", { precision: 3, scale: 2 }),
  supportingData: json("supporting_data"),
  analystFeedback: varchar("analyst_feedback", { length: 500 }),
  actionTaken: boolean("action_taken").default(false),
  agentSource: varchar("agent_source", { length: 30 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Market Capacity Data (existing table)
export const marketCapacity = pgTable("market_capacity", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  insertDate: timestamp("insert_date").notNull(),
  flightDate: date("flight_date").notNull(),
  routeId: varchar("route_id"),
  airlineCode: varchar("airline_code"),
  aircraftType: varchar("aircraft_type"),
  flightNumber: varchar("flight_number"),
  departureTime: time("departure_time"),
  numFlights: integer("num_flights"),
  numSeats: integer("num_seats"),
  frequencyPattern: varchar("frequency_pattern"),
  dataSource: varchar("data_source"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Flight Performance Metrics (existing table)  
export const flightPerformance = pgTable("flight_performance", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  insertDate: timestamp("insert_date").notNull(),
  performanceDate: date("performance_date").notNull(),
  flightDate: date("flight_date").notNull(),
  routeId: varchar("route_id"),
  flightNumber: varchar("flight_number"),
  aircraftType: varchar("aircraft_type"),
  totalSeats: integer("total_seats"),
  bookingsCount: integer("bookings_count"),
  loadFactor: decimal("load_factor", { precision: 5, scale: 2 }),
  revenueTotal: decimal("revenue_total", { precision: 12, scale: 2 }),
  revenueCurrency: varchar("revenue_currency"),
  yieldPerPax: decimal("yield_per_pax", { precision: 10, scale: 2 }),
  ancillaryRevenue: decimal("ancillary_revenue", { precision: 10, scale: 2 }),
  noShows: integer("no_shows"),
  deniedBoardings: integer("denied_boardings"),
  daysToDeparture: integer("days_to_departure"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Web Search Data (existing table - matches actual production schema)
export const webSearchData = pgTable("web_search_data", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  searchDate: date("search_date").notNull(),
  searchQuery: text("search_query").notNull(),
  dataSource: varchar("data_source", { length: 100 }).notNull(),
  rawData: jsonb("raw_data"),
  processedData: jsonb("processed_data"),
  relevanceScore: decimal("relevance_score", { precision: 3, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Other tables exist but need column verification before defining schema
export const bookingChannels = pgTable("booking_channels", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
});

export const rmPricingActions = pgTable("rm_pricing_actions", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
});

export const marketEvents = pgTable("market_events", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
});

export const economicIndicators = pgTable("economic_indicators", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
});

export const nightshiftProcessing = pgTable("nightshift_processing", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
});

export const analystInteractions = pgTable("analyst_interactions", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
});

// Legacy route performance data (kept for compatibility)
export const routePerformance = pgTable("route_performance", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  route: text("route").notNull(), // e.g., "LGW→BCN"
  routeName: text("route_name").notNull(), // e.g., "London Gatwick → Barcelona"
  date: timestamp("date").notNull(),
  yield: decimal("yield", { precision: 8, scale: 2 }),
  loadFactor: decimal("load_factor", { precision: 5, scale: 2 }),
  performance: decimal("performance", { precision: 5, scale: 2 }), // % change
  competitorPrice: decimal("competitor_price", { precision: 8, scale: 2 }),
  ourPrice: decimal("our_price", { precision: 8, scale: 2 }),
  demandIndex: decimal("demand_index", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Conversation history for LLM interactions
export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id),
  type: text("type").notNull(), // genie, strategic
  title: text("title"),
  messages: jsonb("messages").notNull().default([]),
  context: jsonb("context").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// System metrics and monitoring
export const systemMetrics = pgTable("system_metrics", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  metricType: text("metric_type").notNull(), // network_yield, load_factor, etc.
  value: decimal("value", { precision: 12, scale: 4 }).notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  metadata: jsonb("metadata").default({}),
});

// Activity log
export const activities = pgTable("activities", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // alert, analysis, feedback, etc.
  title: text("title").notNull(),
  description: text("description"),
  agentId: text("agent_id"),
  userId: uuid("user_id"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  created_at: true,
  acknowledged_at: true,
  resolved_at: true,
});

export const insertAgentSchema = createInsertSchema(agents).omit({
  lastActive: true,
  updatedAt: true,
});

export const insertFeedbackSchema = createInsertSchema(feedback).omit({
  id: true,
  created_at: true,
});

export const insertRoutePerformanceSchema = createInsertSchema(routePerformance).omit({
  id: true,
  createdAt: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSystemMetricSchema = createInsertSchema(systemMetrics).omit({
  id: true,
  timestamp: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

// Action Agents Configuration and Management
export const actionAgentConfigs = pgTable("action_agent_configs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  agent_id: text("agent_id").notNull().unique(), // surge-detector, booking-curve, elasticity-monitor
  config_name: text("config_name").notNull(),
  config_data: jsonb("config_data").default({}),
  is_active: boolean("is_active").default(true),
  name: text("name"),
  class_name: text("class_name"),
  description: text("description"),
  status: text("status").default("active"), // active, paused, error, maintenance
  db_tables: text("db_tables").array().default([]),
  config_params: jsonb("config_params").default({}),
  methods: text("methods").array().default([]),
  schedule_config: jsonb("schedule_config").default({}),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Action Agent Execution History  
export const actionAgentExecutions = pgTable("action_agent_executions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  agent_id: text("agent_id").notNull(),
  execution_status: text("execution_status").notNull(), // running, completed, failed, cancelled
  start_time: timestamp("start_time"),
  end_time: timestamp("end_time"),
  result_data: jsonb("result_data").default({}),
  error_message: text("error_message"),
  created_at: timestamp("created_at").defaultNow(),
  execution_start: timestamp("execution_start"),
  execution_end: timestamp("execution_end"),
  status: text("status"),
  alerts_generated: integer("alerts_generated").default(0),
  processing_time_ms: integer("processing_time_ms"),
  confidence: decimal("confidence", { precision: 5, scale: 4 }),
  revenue_impact: decimal("revenue_impact", { precision: 12, scale: 2 }),
  execution_logs: jsonb("execution_logs").default([]),
});

// Action Agent Metrics
export const actionAgentMetrics = pgTable("action_agent_metrics", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  agent_id: text("agent_id").notNull(),
  metric_name: text("metric_name").notNull(),
  metric_value: decimal("metric_value"),
  metric_date: date("metric_date").defaultNow(),
  created_at: timestamp("created_at").defaultNow(),
  avg_processing_time: integer("avg_processing_time"),
  success_rate: decimal("success_rate", { precision: 5, scale: 2 }),
  alerts_generated: integer("alerts_generated").default(0),
  revenue_impact: decimal("revenue_impact", { precision: 12, scale: 2 }),
  execution_count: integer("execution_count").default(0),
  error_count: integer("error_count").default(0),
});

// Insert schemas for action agents
export const insertActionAgentConfigSchema = createInsertSchema(actionAgentConfigs).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertActionAgentExecutionSchema = createInsertSchema(actionAgentExecutions).omit({
  id: true,
  createdAt: true,
});

export const insertActionAgentMetricSchema = createInsertSchema(actionAgentMetrics).omit({
  id: true,
  createdAt: true,
});

// Insert schemas for Telos Intelligence Platform tables  
export const insertCompetitivePricingSchema = createInsertSchema(competitivePricing).omit({
  id: true,
  createdAt: true,
});

export const insertMarketCapacitySchema = createInsertSchema(marketCapacity).omit({
  id: true,
  createdAt: true,
});

export const insertFlightPerformanceSchema = createInsertSchema(flightPerformance).omit({
  id: true,
  createdAt: true,
});

export const insertWebSearchDataSchema = createInsertSchema(webSearchData).omit({
  id: true,
  createdAt: true,
});

export const insertIntelligenceInsightSchema = createInsertSchema(intelligenceInsights).omit({
  id: true,
  createdAt: true,
});

// Types for Telos Intelligence Platform
export type InsertCompetitivePricing = z.infer<typeof insertCompetitivePricingSchema>;
export type CompetitivePricing = typeof competitivePricing.$inferSelect;

export type InsertMarketCapacity = z.infer<typeof insertMarketCapacitySchema>;
export type MarketCapacity = typeof marketCapacity.$inferSelect;

export type InsertFlightPerformance = z.infer<typeof insertFlightPerformanceSchema>;
export type FlightPerformanceData = typeof flightPerformance.$inferSelect;

export type InsertWebSearchData = z.infer<typeof insertWebSearchDataSchema>;
export type WebSearchData = typeof webSearchData.$inferSelect;

export type InsertIntelligenceInsight = z.infer<typeof insertIntelligenceInsightSchema>;
export type IntelligenceInsight = typeof intelligenceInsights.$inferSelect;

// Legacy types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = typeof alerts.$inferSelect;

export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type Agent = typeof agents.$inferSelect;

export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type Feedback = typeof feedback.$inferSelect;

export type InsertRoutePerformance = z.infer<typeof insertRoutePerformanceSchema>;
export type RoutePerformance = typeof routePerformance.$inferSelect;

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

export type InsertSystemMetric = z.infer<typeof insertSystemMetricSchema>;
export type SystemMetric = typeof systemMetrics.$inferSelect;

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;

// Action Agent types
export type InsertActionAgentConfig = z.infer<typeof insertActionAgentConfigSchema>;
export type ActionAgentConfig = typeof actionAgentConfigs.$inferSelect;

export type InsertActionAgentExecution = z.infer<typeof insertActionAgentExecutionSchema>;
export type ActionAgentExecution = typeof actionAgentExecutions.$inferSelect;

export type InsertActionAgentMetric = z.infer<typeof insertActionAgentMetricSchema>;
export type ActionAgentMetric = typeof actionAgentMetrics.$inferSelect;

// Enums for type safety
export const AlertPriority = {
  CRITICAL: "critical",
  HIGH: "high", 
  MEDIUM: "medium",
  LOW: "low"
} as const;

export const AlertCategory = {
  COMPETITIVE: "competitive",
  PERFORMANCE: "performance", 
  NETWORK: "network"
} as const;

export const AgentStatus = {
  ACTIVE: "active",
  LEARNING: "learning",
  MAINTENANCE: "maintenance"
} as const;
