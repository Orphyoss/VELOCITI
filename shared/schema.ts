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
  created_at: timestamp("created_at").defaultNow(),
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
  total_analyses: integer("total_analyses").default(0),
  successful_predictions: integer("successful_predictions").default(0),
  configuration: jsonb("configuration").default({}),
  last_active: timestamp("last_active").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
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
  airline_code: varchar("airline_code", { length: 10 }).primaryKey(),
  airline_name: varchar("airline_name", { length: 100 }).notNull(),
  carrier_type: varchar("carrier_type", { length: 20 }).notNull(), // LCC, FSC, ULCC, Hybrid
  country_code: varchar("country_code", { length: 3 }),
  active_flag: boolean("active_flag").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Airports and Cities (existing table)
export const airports = pgTable("airports", {
  airport_code: varchar("airport_code", { length: 10 }).primaryKey(),
  airport_name: varchar("airport_name", { length: 100 }),
  city_name: varchar("city_name", { length: 50 }),
  country_code: varchar("country_code", { length: 3 }),
  region: varchar("region", { length: 50 }),
  timezone: varchar("timezone", { length: 50 }),
  active_flag: boolean("active_flag").default(true),
});

// Route Markets (existing table)
export const routes = pgTable("routes", {
  route_id: varchar("route_id", { length: 20 }).primaryKey(), // Format: LGW-BCN
  origin_airport: varchar("origin_airport", { length: 10 }).references(() => airports.airport_code),
  destination_airport: varchar("destination_airport", { length: 10 }).references(() => airports.airport_code),
  market_type: varchar("market_type", { length: 20 }), // Domestic, EU, International
  distance_km: integer("distance_km"),
  is_easyjet_route: boolean("is_easyjet_route").default(false),
  route_priority: varchar("route_priority", { length: 20 }), // Core, Secondary, Seasonal
  created_at: timestamp("created_at").defaultNow(),
});

// Aircraft Types (existing table)
export const aircraft_types = pgTable("aircraft_types", {
  aircraft_code: varchar("aircraft_code", { length: 10 }).primaryKey(),
  aircraft_name: varchar("aircraft_name", { length: 50 }),
  typical_seats: integer("typical_seats"),
  aircraft_category: varchar("aircraft_category", { length: 20 }), // Narrowbody, Widebody, Regional
});

// Competitive Pricing Data (existing table with correct column names)
export const competitive_pricing = pgTable("competitive_pricing", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  insert_date: timestamp("insert_date").notNull(),
  observation_date: date("observation_date").notNull(),
  route_id: varchar("route_id", { length: 20 }),
  airline_code: varchar("airline_code", { length: 10 }),
  flight_date: date("flight_date").notNull(),
  flight_number: varchar("flight_number", { length: 20 }),
  departure_time: time("departure_time"),
  price_amount: decimal("price_amount", { precision: 10, scale: 2 }),
  price_currency: varchar("price_currency", { length: 3 }),
  fare_type: varchar("fare_type", { length: 20 }),
  booking_class: varchar("booking_class", { length: 10 }),
  availability_seats: integer("availability_seats"),
  data_source: varchar("data_source", { length: 20 }),
  created_at: timestamp("created_at").defaultNow(),
});

// Intelligence Insights (existing table with correct column names)
export const intelligence_insights = pgTable("intelligence_insights", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  insight_date: date("insight_date").notNull(),
  insight_type: varchar("insight_type", { length: 30 }),
  priority_level: varchar("priority_level", { length: 20 }),
  route_id: varchar("route_id", { length: 20 }),
  airline_code: varchar("airline_code", { length: 10 }),
  title: varchar("title", { length: 200 }),
  description: text("description"),
  recommendation: text("recommendation"),
  confidence_score: decimal("confidence_score", { precision: 3, scale: 2 }),
  supporting_data: json("supporting_data"),
  analyst_feedback: varchar("analyst_feedback", { length: 500 }),
  action_taken: boolean("action_taken").default(false),
  agent_source: varchar("agent_source", { length: 30 }),
  created_at: timestamp("created_at").defaultNow(),
});

// Market Capacity Data (existing table)
export const market_capacity = pgTable("market_capacity", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  insert_date: timestamp("insert_date").notNull(),
  flight_date: date("flight_date").notNull(),
  route_id: varchar("route_id"),
  airline_code: varchar("airline_code"),
  aircraft_type: varchar("aircraft_type"),
  flight_number: varchar("flight_number"),
  departure_time: time("departure_time"),
  num_flights: integer("num_flights"),
  num_seats: integer("num_seats"),
  frequency_pattern: varchar("frequency_pattern"),
  data_source: varchar("data_source"),
  created_at: timestamp("created_at").defaultNow(),
});

// Flight Performance Metrics (existing table)  
export const flight_performance = pgTable("flight_performance", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  insert_date: timestamp("insert_date").notNull(),
  performance_date: date("performance_date").notNull(),
  flight_date: date("flight_date").notNull(),
  route_id: varchar("route_id"),
  flight_number: varchar("flight_number"),
  aircraft_type: varchar("aircraft_type"),
  total_seats: integer("total_seats"),
  bookings_count: integer("bookings_count"),
  load_factor: decimal("load_factor", { precision: 5, scale: 2 }),
  revenue_total: decimal("revenue_total", { precision: 12, scale: 2 }),
  revenue_currency: varchar("revenue_currency"),
  yield_per_pax: decimal("yield_per_pax", { precision: 10, scale: 2 }),
  ancillary_revenue: decimal("ancillary_revenue", { precision: 10, scale: 2 }),
  no_shows: integer("no_shows"),
  denied_boardings: integer("denied_boardings"),
  days_to_departure: integer("days_to_departure"),
  created_at: timestamp("created_at").defaultNow(),
});

// Web Search Data (existing table - matches actual production schema)
export const web_search_data = pgTable("web_search_data", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  search_date: date("search_date").notNull(),
  search_query: text("search_query").notNull(),
  data_source: varchar("data_source", { length: 100 }).notNull(),
  raw_data: jsonb("raw_data"),
  processed_data: jsonb("processed_data"),
  relevance_score: decimal("relevance_score", { precision: 3, scale: 2 }),
  created_at: timestamp("created_at").defaultNow(),
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

// Competitive Pricing Data (infare_webfare_fact)
export const competitivePricing = pgTable("competitive_pricing", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  marketKey: integer("market_key").notNull(),
  snapshotDateKey: integer("snapshot_date_key").notNull(),
  dptrDateKey: integer("dptr_date_key").notNull(),
  dptrTimeKey: integer("dptr_time_key").notNull(),
  outbndBookingClassCd: varchar("outbnd_booking_class_cd", { length: 10 }),
  outbndFareBasis: varchar("outbnd_fare_basis", { length: 20 }),
  observationTmKey: integer("observation_tm_key"),
  outbndFltNbr: integer("outbnd_flt_nbr"),
  priceExclTaxAmt: decimal("price_excl_tax_amt", { precision: 10, scale: 2 }),
  priceInclTaxAmt: decimal("price_incl_tax_amt", { precision: 10, scale: 2 }),
  taxAmt: decimal("tax_amt", { precision: 10, scale: 2 }),
  currencyKey: integer("currency_key"),
  carrKey: integer("carr_key"),
  carrAirlineCode: varchar("carr_airline_code", { length: 10 }),
  carrAirlineName: varchar("carr_airline_name", { length: 255 }),
  priceOutbndAmt: decimal("price_outbnd_amt", { precision: 10, scale: 2 }),
  priceInbndAmt: decimal("price_inbnd_amt", { precision: 10, scale: 2 }),
  isTaxInclFlg: varchar("is_tax_incl_flg", { length: 50 }),
  searchClass: varchar("search_class", { length: 50 }),
  estimatedCos: varchar("estimated_cos", { length: 50 }),
  saverSellup: decimal("saver_sellup", { precision: 10, scale: 2 }),
  expectedFareBasis: text("expected_fare_basis"),
  saverPrice: decimal("saver_price", { precision: 10, scale: 2 }),
  mainPrice: decimal("main_price", { precision: 10, scale: 2 }),
  fltNbr: integer("flt_nbr"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Route Markets mapping
export const routeMarkets = pgTable("route_markets", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  marketKey: integer("market_key").unique().notNull(),
  originAirport: varchar("origin_airport", { length: 3 }).notNull(),
  destinationAirport: varchar("destination_airport", { length: 3 }).notNull(),
  routeCode: varchar("route_code", { length: 10 }).notNull(),
  marketName: varchar("market_name", { length: 100 }),
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
export const insertCompetitivePricingSchema = createInsertSchema(competitive_pricing).omit({
  id: true,
  createdAt: true,
});

export const insertMarketCapacitySchema = createInsertSchema(market_capacity).omit({
  id: true,
  createdAt: true,
});

export const insertFlightPerformanceSchema = createInsertSchema(flight_performance).omit({
  id: true,
  createdAt: true,
});

export const insertWebSearchDataSchema = createInsertSchema(web_search_data).omit({
  id: true,
  createdAt: true,
});

export const insertIntelligenceInsightSchema = createInsertSchema(intelligence_insights).omit({
  id: true,
  createdAt: true,
});

// Types for Telos Intelligence Platform
export type InsertCompetitivePricing = z.infer<typeof insertCompetitivePricingSchema>;
export type CompetitivePricing = typeof competitive_pricing.$inferSelect;

export type InsertMarketCapacity = z.infer<typeof insertMarketCapacitySchema>;
export type MarketCapacity = typeof market_capacity.$inferSelect;

export type InsertFlightPerformance = z.infer<typeof insertFlightPerformanceSchema>;
export type FlightPerformanceData = typeof flight_performance.$inferSelect;

export type InsertWebSearchData = z.infer<typeof insertWebSearchDataSchema>;
export type WebSearchData = typeof web_search_data.$inferSelect;

export type InsertIntelligenceInsight = z.infer<typeof insertIntelligenceInsightSchema>;
export type IntelligenceInsight = typeof intelligence_insights.$inferSelect;

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
