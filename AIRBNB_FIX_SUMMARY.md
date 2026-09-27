# Airbnb Properties Fix Summary

## Issues Identified

1. **API Route Type Filter** - Was hardcoded to only accept 'sale' or 'rent', excluding 'airbnb'
2. **PropertyListingsClient Default** - Had `type="SALE"` as default, filtering out airbnb on `/properties` page
3. **Case Sensitivity** - Pages pass uppercase ("AIRBNB") but database stores lowercase ("airbnb")

## Changes Made

### 1. `/src/app/api/properties/route.ts`
- **Line 35-40**: Changed type filter from hardcoded `IN ('sale', 'rent')` to parameterized query
- **Before**: 
  ```typescript
  if (type) {
    whereClause += " AND LOWER(p.type) IN ('sale', 'rent')";
    // ... only handled sale/rent
  }
  ```
- **After**:
  ```typescript
  if (type) {
    const normalizedType = type.toLowerCase();
    whereClause += " AND LOWER(p.type) = ?";
    params.push(normalizedType);
  }
  ```
- Added debug logging to track type filtering

### 2. `/src/components/properties/PropertyListingsClient.tsx`
- **Line 107**: Removed default value `type = "SALE"`
- **Before**: `type = "SALE",`
- **After**: `type,`
- This allows `/properties` page to show ALL property types when no type is specified
- Added debug logging to track API calls

## How It Works Now

### Property Creation Flow
1. User selects listing type in form: "sale" | "rent" | "airbnb" (lowercase)
2. Form submits to `/api/crm/properties` with `listingType` field
3. Database stores the type as lowercase varchar: "sale", "rent", or "airbnb"

### Property Fetching Flow
1. **Airbnb Page** (`/airbnb`): Passes `type="AIRBNB"` (uppercase)
2. **Sale Page** (`/properties-for-sale`): Passes `type="SALE"` (uppercase)
3. **Rent Page** (`/properties-for-rent`): Passes `type="RENT"` (uppercase)
4. **All Properties** (`/properties`): Passes NO type parameter
5. API converts uppercase to lowercase: "AIRBNB" → "airbnb"
6. Query uses case-insensitive comparison: `LOWER(p.type) = 'airbnb'`

## Testing Checklist

### Test 1: Create Airbnb Property
- [ ] Go to `/crm/create-listing`
- [ ] Select "Airbnb/Short Stay" as listing type
- [ ] Complete all steps and submit
- [ ] Verify property is created successfully

### Test 2: View Airbnb Properties
- [ ] Go to `/airbnb` page
- [ ] Should see all airbnb properties
- [ ] Check browser console for logs: "Fetching properties with: { type: 'AIRBNB', ... }"
- [ ] Check server console for: "[API] Type filter: { original: 'AIRBNB', normalized: 'airbnb' }"

### Test 3: View All Properties
- [ ] Go to `/properties` page
- [ ] Should see ALL properties (sale, rent, AND airbnb)
- [ ] Check browser console: "Fetching properties with: { type: undefined, ... }"
- [ ] Check server console: "[API] No type filter - fetching all property types"

### Test 4: View Sale/Rent Properties
- [ ] Go to `/properties-for-sale`
- [ ] Should see only sale properties
- [ ] Go to `/properties-for-rent`
- [ ] Should see only rent properties

## Database Schema Reference

```sql
CREATE TABLE `property` (
  `type` varchar(191) NOT NULL,  -- Stores: "sale", "rent", "airbnb" (lowercase)
  ...
)
```

## Debug Logging

### Client-Side (Browser Console)
```
Fetching properties with: { type: 'AIRBNB', selectedCategory: null, currentPage: 1 }
API URL: /api/properties?type=AIRBNB&page=1
API Response: { properties: [...], pagination: {...}, stats: {...} }
```

### Server-Side (Terminal)
```
[API] Type filter: { original: 'AIRBNB', normalized: 'airbnb' }
[API] Query results: { total: 5, whereClause: "WHERE p.status = 'AVAILABLE' AND LOWER(p.type) = ?", params: ['airbnb'] }
```

## Rollback Instructions

If issues occur, revert these files:
1. `src/app/api/properties/route.ts` - Lines 35-42
2. `src/components/properties/PropertyListingsClient.tsx` - Line 107

## Additional Notes

- The fix is backward compatible with existing sale/rent properties
- Case-insensitive comparison ensures robustness
- No database migration needed (type field is already varchar)
- All property types now work consistently across the application
