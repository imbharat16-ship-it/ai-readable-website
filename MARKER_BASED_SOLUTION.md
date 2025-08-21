# Marker-Based Table Replacement Solution

## Problem with Previous Approach

The previous deduplication approach had fundamental flaws:
1. **Content normalization was too aggressive** - stripping formatting made different tables appear identical
2. **Element tracking wasn't comprehensive** - didn't handle relationships between DOM elements
3. **Strategy conflicts** - different extraction methods processed the same data independently

## New Marker-Based Solution

### How It Works

1. **Content Extraction with Markers**
   - During content hierarchy extraction, when table-related content is detected, we place a marker `[TABLE_MARKER:ID]`
   - The marker preserves the logical position where the table should appear
   - No table content is extracted during this phase

2. **Table Extraction**
   - All tables are extracted using our existing strategies (pre-formatted, HTML, chart, custom)
   - Each table gets metadata including type, priority, and source element
   - No deduplication is attempted at this stage

3. **Marker Replacement**
   - Each marker is replaced with the best available table
   - Tables are matched to markers based on:
     - Exact element match (highest priority)
     - Heading similarity
     - Type priority (pre-formatted > HTML > chart > custom)
   - Once a table is used, it's removed from the available pool

### Key Benefits

1. **No Duplication**: Each table appears exactly once, in its logical position
2. **Preserves Structure**: Tables appear where they belong in the content flow
3. **Simpler Logic**: No complex deduplication algorithms needed
4. **Better Quality**: Can choose the best format for each table
5. **Easier Debugging**: Clear markers show where tables should appear

### Implementation Details

#### New Methods Added:
- `extractContentHierarchyWithMarkers()` - Places markers for table content
- `getAssociatedContentWithMarkers()` - Handles associated content with markers
- `extractAllTables()` - Extracts all tables without deduplication
- `replaceTableMarkers()` - Replaces markers with actual table content
- `findBestTableForMarker()` - Intelligently matches tables to markers

#### Marker System:
- **Format**: `[TABLE_MARKER:UNIQUE_ID]`
- **Types**: `heading`, `paragraph`, `associated`
- **Metadata**: Stores element reference, heading text, and context

#### Table Matching Priority:
1. **Exact Element Match** - Table extracted from the same DOM element
2. **Heading Similarity** - Table content matches the marker's heading
3. **Type Priority** - Pre-formatted > HTML > chart > custom

### Example Flow

```
1. Content Extraction: "## AI Performance Benchmarks" [TABLE_MARKER:1]
2. Table Extraction: 
   - Pre-formatted table (Priority 1)
   - HTML table (Priority 2)
   - Chart table (Priority 3)
3. Marker Replacement: [TABLE_MARKER:1] → Pre-formatted table
4. Result: Clean, non-duplicated content with tables in logical positions
```

### Testing

The test page (`test-page.html`) contains:
- Multiple table formats for the same data
- Table-related headings and content
- Various table structures

Expected result: Each dataset appears only once, in the best available format, positioned logically in the content.

### Debugging

Comprehensive logging shows:
- Where markers are placed
- Which tables are extracted
- How markers are matched to tables
- Final replacement results

This approach should completely eliminate the duplicate table issue while maintaining clean, logical content structure.
