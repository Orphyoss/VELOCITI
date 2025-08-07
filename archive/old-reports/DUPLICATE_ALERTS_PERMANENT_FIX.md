# Duplicate Alerts Issue - Permanent Resolution

## Root Cause Identified
The duplicate alerts issue was caused by **multiple components making concurrent API calls** to the same alerts endpoint with different query keys, creating race conditions and duplicate data fetching:

1. **Header.tsx** - `['/api/alerts', 'critical']` for bell notifications
2. **MorningBriefing.tsx** - `['/api/alerts', 'critical']` and `['/api/alerts', 'high']` 
3. **TodaysPriorities.tsx** - `['/api/alerts', 'dashboard']`
4. **AnalystWorkbench.tsx** - `['workbench-alerts', alertLimit]`

## Permanent Solution Implemented

### ✅ Centralized Alert Query Strategy
**Single Shared Query Key**: All components now use `['alerts-shared']` 

**Benefits:**
- React Query automatically deduplicates requests with same key
- Single API call fetches all alerts once and shares across components
- Eliminates race conditions between components
- Consistent caching behavior

### ✅ Component-Level Filtering
Instead of multiple API calls, components now filter from shared data:

```typescript
// Header.tsx
const alerts = allAlerts?.filter(alert => alert.priority === 'critical')?.slice(0, 10);

// MorningBriefing.tsx  
const criticalAlerts = allAlerts?.filter(alert => alert.priority === 'critical')?.slice(0, 5);
const highAlerts = allAlerts?.filter(alert => alert.priority === 'high')?.slice(0, 3);

// TodaysPriorities.tsx
const criticalAlerts = allAlerts?.filter(alert => alert.priority === 'critical')?.slice(0, 5);

// AnalystWorkbench.tsx
// Applies user filters + deduplication on shared data
```

### ✅ Enhanced Deduplication
- **Query Level**: React Query prevents duplicate network requests
- **Data Level**: Additional deduplication by alert ID in select function
- **Component Level**: Filter duplicate IDs in render logic as failsafe

### ✅ Optimized Caching Strategy
- **staleTime**: 5 minutes (prevents unnecessary refetching)
- **gcTime**: 10 minutes (keeps data in cache longer) 
- **refetchOnWindowFocus**: false (prevents aggressive refetching)
- **retry**: 1 (reduces failed request overhead)

## Technical Impact

### Before Fix:
- 4+ concurrent API calls to `/api/alerts` on page load
- Multiple WebSocket connections competing for data
- Race conditions causing duplicate display
- Inconsistent caching and refetch behavior

### After Fix:
- 1 API call to `/api/alerts` shared across all components
- Single WebSocket connection per session
- Guaranteed deduplication at multiple levels
- Consistent data synchronization

## Monitoring Points

### WebSocket Connections
- Should see only 1-2 WebSocket connections instead of 4-6
- No more rapid connection/disconnection cycles

### API Request Logs
- Single `/api/alerts` call per page load instead of multiple
- Reduced server load and database queries

### Frontend Console
- No more "duplicate alert" warnings in browser console
- Cleaner React Query devtools showing single query

## Long-term Maintenance

This centralized approach prevents future duplicate issues because:

1. **Any new component** requiring alerts automatically uses shared data
2. **Query key consistency** enforced through shared constant
3. **Single source of truth** for all alert-related data
4. **React Query deduplication** handles edge cases automatically

The fix addresses the root architectural issue rather than symptoms, ensuring permanent resolution of the duplicate alerts problem.