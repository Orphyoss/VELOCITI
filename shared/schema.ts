import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, decimal, boolean, jsonb, uuid } from "drizzle-orm/pg-core";
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

// Route performance data
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

// Types
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
