# Airbnb Search Debug Guide

## Search Flow

### 1. Hero Component Search
When user searches for airbnb from Hero.tsx:
- User selects "Airbnb" tab → `searchType = "airbnb"`
- User enters location → `location = "nairobi"` (example)
- Clicks Search → Navigates to `/airbnb/nairobi`

### 2. Dynamic Route Handler
File: `/src/app/[type]/[location]/page.tsx`

**URL Mapping:**
- URL: `/airbnb/nairobi`
- `type` param: "airbnb"
- `location` param: "nairobi"

**Type Conversion (Line 11-19):**
```typescript
const getApiType = (urlType: ValidType): string => {
  switch (urlType) {
    case "airbnb":
      return "AIRBNB";  // ✅ Converts to uppercase
  }
};
```

**Server-Side Fetch (Line 106-135):**
```typescript
const queryParams = new URLSearchParams();
queryParams.append("type", type);  // type = "AIRBNB"
queryParams.append("location", location);  // location = "nairobi"
```

### 3. PropertyListingsClientSearch Component
File: `/src/components/properties/PropertyListingsClientSearch.tsx`

**Props Received:**
- `type`: "AIRBNB" (from dynamic route)
- `location`: "nairobi"
- `initialData`: Server-fetched properties

**Client-Side Fetch (Line 59-77):**
```typescript
queryParams.append("type", type);  // "AIRBNB"
queryParams.append("location", location);  // "nairobi"
```

### 4. API Route
File: `/src/app/api/properties/route.ts`

**Type Filter (Line 36-44):**
```typescript
const type = searchParams.get("type");  // "AIRBNB"
if (type) {
  const normalizedType = type.toLowerCase();  // "airbnb"
  whereClause += " AND LOWER(p.type) = ?";
  params.push(normalizedType);  // Query: WHERE LOWER(p.type) = 'airbnb'
}
```

## Debug Checklist

### Browser Console Logs
When searching for airbnb in Nairobi, you should see:

```
[PropertyListingsClientSearch] Fetching: { type: 'AIRBNB', location: 'nairobi', currentPage: 1 }
[PropertyListingsClientSearch] API URL: /api/properties?type=AIRBNB&location=nairobi&page=1&limit=10
[PropertyListingsClientSearch] API Response: { propertiesCount: X, pagination: {...}, firstProperty: {...} }
```

### Server Console Logs
```
[API] Type filter: { original: 'AIRBNB', normalized: 'airbnb' }
[API] Query results: { total: X, whereClause: "WHERE p.status = 'AVAILABLE' AND LOWER(p.type) = ? AND p.location LIKE ?", params: ['airbnb', '%nairobi%'] }
```

## Common Issues & Solutions

### Issue 1: No properties returned
**Symptom:** `propertiesCount: 0` in logs

**Possible Causes:**
1. No airbnb properties in database with that location
2. Location string doesn't match database format
3. Type stored incorrectly in database

**Debug SQL:**
```sql
-- Check airbnb properties
SELECT id, title, type, location FROM property WHERE LOWER(type) = 'airbnb';

-- Check location format
SELECT id, title, location FROM property WHERE location LIKE '%nairobi%';

-- Check both
SELECT id, title, type, location FROM property 
WHERE LOWER(type) = 'airbnb' AND location LIKE '%nairobi%';
```

### Issue 2: Type not matching
**Symptom:** Properties exist but not returned

**Check:**
```sql
-- See actual type values
SELECT DISTINCT type FROM property;

-- Should return: 'sale', 'rent', 'airbnb' (lowercase)
```

### Issue 3: Location not matching
**Symptom:** Properties exist but location filter fails

**Check:**
```sql
-- See actual location format
SELECT DISTINCT location FROM property WHERE LOWER(type) = 'airbnb';

-- Example formats:
-- "Nairobi, Nairobi County"
-- "Kilimani, Nairobi, Nairobi County"
```

## Testing Steps

### Step 1: Verify Airbnb Properties Exist
```sql
SELECT COUNT(*) as total FROM property WHERE LOWER(type) = 'airbnb' AND status = 'AVAILABLE';
```

### Step 2: Test Direct API Call
Open browser and navigate to:
```
http://localhost:3000/api/properties?type=AIRBNB&location=nairobi
```

Expected response:
```json
{
  "properties": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalItems": X,
    "itemsPerPage": 8
  },
  "stats": {...}
}
```

### Step 3: Test Search Flow
1. Go to homepage
2. Click "Airbnb" tab
3. Enter location (e.g., "Nairobi")
4. Click Search
5. Check browser console for logs
6. Check server terminal for logs

### Step 4: Verify Results
- URL should be: `/airbnb/nairobi`
- Page title: "Properties Airbnb in Nairobi, Kenya"
- Properties should display if they exist

## Quick Fix Commands

### If properties aren't showing, check database:
```sql
-- Update any incorrectly stored types
UPDATE property SET type = 'airbnb' WHERE type = 'AIRBNB';
UPDATE property SET type = 'sale' WHERE type = 'SALE';
UPDATE property SET type = 'rent' WHERE type = 'RENT';
```

### If location format is wrong:
The API uses `LIKE '%location%'` so partial matches work.
Example: searching "nairobi" will match:
- "Nairobi"
- "Kilimani, Nairobi"
- "Nairobi, Nairobi County"

## Expected Behavior

✅ **Working correctly when:**
- Airbnb properties show on `/airbnb` page
- Airbnb properties show on `/properties` page
- Searching for airbnb from Hero navigates to `/airbnb/{location}`
- Properties matching both type AND location are displayed
- Console logs show correct parameters

❌ **Not working when:**
- No properties show despite database having airbnb properties
- Console shows `propertiesCount: 0` but SQL query returns results
- Type or location parameters are incorrect in logs
