// AI-Readable Website Content Script
// Based on translation_logic.md

class WebsiteTranslator {
    constructor() {
        this.isAIMode = false;
        this.originalContent = null;
        this.aiContainer = null;
        this.init();
    }

    init() {
        // Don't automatically enable AI mode - only respond to popup messages
        
        // Listen for messages from popup
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'toggleAIMode') {
                if (request.enabled) {
                    this.enableAIMode().then(() => {
                        sendResponse({ success: true });
                    }).catch(error => {
                        console.error('Error enabling AI mode:', error);
                        sendResponse({ success: false, error: error.message });
                    });
                    return true; // Keep the message channel open for async response
                } else {
                    this.disableAIMode();
                    sendResponse({ success: true });
                }
            }
        });
    }

    async enableAIMode() {
        if (this.isAIMode) return;
        
        this.isAIMode = true;
        this.saveOriginalContent();
        
        // Wait a bit for any dynamic content to load
        await this.waitForDynamicContent();
        
        this.createAIView();
    }

    disableAIMode() {
        if (!this.isAIMode) return;
        
        this.isAIMode = false;
        this.restoreOriginalContent();
    }

    saveOriginalContent() {
        // Create a deep clone of the current DOM to preserve it
        const clonedBody = document.body.cloneNode(true);
        this.originalContent = {
            html: document.documentElement.innerHTML,
            title: document.title,
            bodyClone: clonedBody
        };
    }

    restoreOriginalContent() {
        if (this.originalContent) {
            // Restore the original content
            document.documentElement.innerHTML = this.originalContent.html;
            document.title = this.originalContent.title;
        }
        if (this.aiContainer) {
            this.aiContainer.remove();
            this.aiContainer = null;
        }
    }

    createAIView() {
        // Extract and translate content BEFORE clearing the page
        const translatedContent = this.translateWebsite();
        
        // Clear the page
        document.body.innerHTML = '';
        
        // Create AI container
        this.aiContainer = document.createElement('div');
        this.aiContainer.className = 'ai-readable-container';
        
        // Create the AI view
        this.aiContainer.innerHTML = `
            <div class="ai-content">
                <div class="ai-markdown"></div>
            </div>
        `;
        
        // Use innerHTML to render HTML formatting (like CTA highlights) while preserving markdown
        const markdownElement = this.aiContainer.querySelector('.ai-markdown');
        markdownElement.innerHTML = translatedContent;
        
        document.body.appendChild(this.aiContainer);
    }

    translateWebsite() {
        // Implementation of translation logic from translation_logic.md
        const result = [];
        const processedElements = new Set(); // Track processed elements to avoid duplication
        const processedContent = new Set(); // Track processed content to avoid text duplication
        const tableMarkers = new Map(); // Track table markers and their content
        const markerCounter = { value: 0 }; // Unique identifier for table markers (object reference)
        
        console.log('[AI-Readable] Starting website translation...');
        
        // Add generous header space like Parallel.ai
        result.push('', '', '', '');
        
        // Step 1: Extract navigation section
        result.push('<div class="section-divider"><!-- NAVIGATION SECTION --></div>');
        const nav = this.extractNavigation();
        if (nav.brand) result.push(`<span class="brand-name">${nav.brand}</span>`);
        
        // Add spacing after brand name
        if (nav.brand) result.push('', '');
        
        nav.navigation.forEach(link => result.push(link));
        
        // Add spacing before CTAs
        if (nav.ctas.length > 0) result.push('', '');
        nav.ctas.forEach(cta => result.push(cta));
        
        // Massive spacing after navigation like Parallel.ai
        result.push('', '', '', '', '', '', ''); // 7 line breaks for generous separation
        
        // Step 2: Extract main content section
        result.push('<div class="section-divider"><!-- MAIN CONTENT SECTION --></div>');
        console.log('[AI-Readable] Step 2: Extracting content hierarchy with markers...');
        const content = this.extractContentHierarchyWithMarkers(processedElements, processedContent, tableMarkers, markerCounter);
        result.push(...content);
        
        console.log(`[AI-Readable] Content extraction complete. Result length: ${result.length}, Markers found: ${tableMarkers.size}`);
        console.log('[AI-Readable] Content with markers:', result);
        
        // Step 3: Extract all tables and store them
        console.log('[AI-Readable] Step 3: Extracting all tables...');
        const tables = this.extractAllTables();
        console.log(`[AI-Readable] Extracted ${tables.length} unique tables`);
        console.log('[AI-Readable] Tables extracted:', tables.map(t => ({ type: t.type, content: t.content.substring(0, 100) + '...' })));
        
        // Step 4: Replace table markers with actual table content
        console.log('[AI-Readable] Step 4: Replacing table markers...');
        const finalResult = this.replaceTableMarkers(result, tableMarkers, tables);
        
        console.log(`[AI-Readable] Final result length: ${finalResult.length}`);
        console.log('[AI-Readable] Final result preview:', finalResult.slice(0, 10));
        
        // Step 5: Extract footer section
        const footer = this.extractFooter();
        if (footer.length > 0) {
            finalResult.push('', '', '', ''); // 4 line breaks before footer section for major section separation
            finalResult.push('<div class="section-divider"><!-- FOOTER SECTION --></div>');
            finalResult.push(...footer);
        }
        
        // If we have very little content, try to extract more aggressively
        if (finalResult.length < 5) {
            const fallbackContent = this.extractFallbackContent(processedElements, processedContent);
            finalResult.push(...fallbackContent);
        }
        
        // Add footer space (1 line gap after content ends)
        finalResult.push('');
        
        return finalResult.join('\n\n');
    }

    extractNavigation() {
        const brand = this.getBrandName();
        const navLinks = this.getNavigationLinks();
        const ctas = this.getPrimaryCTAs();
        
        return {
            brand: brand,
            navigation: navLinks,
            ctas: ctas
        };
    }

    getBrandName() {
        const selectors = [
            'h1', '.logo', '.brand', '.site-title', 
            '[class*="logo"]', '[class*="brand"]',
            'header h1', 'nav h1', '.navbar-brand',
            '.site-logo', '.company-name', '.brand-name'
        ];
        
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim()) {
                const text = element.textContent.trim();
                // Clean and format the brand name
                return this.cleanText(text).toUpperCase();
            }
        }
        
        // Fallback to page title
        const title = document.title.split('|')[0].split('-')[0].trim();
        return this.cleanText(title).toUpperCase();
    }

    getNavigationLinks() {
        const links = [];
        const navElements = document.querySelectorAll('nav a, header a, .nav a, .menu a, .navigation a');
        
        navElements.forEach(link => {
            if (link.textContent.trim() && link.href && !this.shouldSkipLink(link)) {
                const text = this.cleanText(link.textContent);
                const href = link.href;
                const isExternal = !href.includes(window.location.hostname);
                
                if (isExternal) {
                    links.push(`[${text}](${href})`);
                } else {
                    links.push(`[${text}](${href})`);
                }
            }
        });
        
        return links.slice(0, 10); // Limit to first 10 nav links
    }

    getPrimaryCTAs() {
        const ctas = [];
        const ctaSelectors = [
            'button', '.btn', '.cta', '[role="button"]',
            '.button', '.call-to-action', '.primary-button'
        ];
        
        ctaSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                if (element.textContent.trim() && this.isCTALink(element)) {
                    const text = this.cleanText(element.textContent);
                    if (element.href) {
                        ctas.push(`<span class="cta-highlight">[${text}](${element.href})</span>`);
                    } else {
                        ctas.push(`<span class="cta-highlight">[${text}]</span>`);
                    }
                }
            });
        });
        
        return ctas.slice(0, 3); // Limit to first 3 CTAs
    }

    extractContentHierarchyWithMarkers(processedElements, processedContent, tableMarkers, markerCounter) {
        const content = [];
        
        console.log('[AI-Readable] Starting content hierarchy extraction with table markers...');
        
        // Get all headings in document order
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
            .filter(heading => !processedElements.has(heading))
            .sort((a, b) => {
                // Sort by document order
                return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
            });
        
        console.log(`[AI-Readable] Found ${headings.length} headings to process`);
        
        headings.forEach(heading => {
            try {
                if (!heading || !heading.textContent) {
                    console.log('[AI-Readable] Skipping invalid heading element');
                    return;
                }
                
                if (processedElements.has(heading)) return;
                
                const headingText = this.cleanText(heading.textContent);
                if (!headingText || processedContent.has(headingText)) return;
            
            // Check if this heading is part of a table structure
            if (this.isTableRelated(heading)) {
                console.log(`[AI-Readable] Found table-related heading: "${headingText}" - placing marker`);
                
                // Place a marker for this table on its own line
                const markerId = `TABLE_MARKER_${markerCounter.value++}`;
                const marker = `[TABLE_MARKER:${markerId}]`;
                content.push(''); // Add spacing before marker
                content.push(marker);
                content.push(''); // Add spacing after marker
                
                // Store the marker info for later replacement
                tableMarkers.set(markerId, {
                    heading: headingText,
                    element: heading,
                    type: 'heading'
                });
                
                processedElements.add(heading);
                return;
            }
            
            console.log(`[AI-Readable] Processing heading: "${headingText}"`);
            
            // Add proper spacing between sections
            const level = parseInt(heading.tagName.charAt(1));
            if (level <= 2) {
                content.push('', '', '', ''); // 4 line breaks before major headings for better section separation
            } else {
                content.push('', '', ''); // 3 line breaks before minor headings
            }
            
            const markdownHeading = '#'.repeat(level) + ' ' + headingText;
            content.push(markdownHeading);
            
            // Get associated content (paragraphs, lists, etc.) with table markers
            const associatedContent = this.getAssociatedContentWithMarkers(heading, processedElements, processedContent, tableMarkers, markerCounter);
            console.log(`[AI-Readable] Associated content for "${headingText}":`, {
                hasContent: !!associatedContent,
                contentLength: associatedContent?.length,
                content: associatedContent?.map(item => typeof item === 'string' ? item.substring(0, 50) + '...' : item)
            });
            
            if (associatedContent && associatedContent.length > 0) {
                console.log(`[AI-Readable] Adding ${associatedContent.length} content items for heading "${headingText}"`);
                content.push(''); // 1 line break between heading and content
                // Add each content item with proper spacing
                associatedContent.forEach((item, index) => {
                    content.push(item);
                    // Add spacing after each content item except the last one
                    if (index < associatedContent.length - 1) {
                        content.push('', ''); // 2 line breaks between content items for better separation
                    }
                });
                content.push('', ''); // 2 line breaks after the entire content block
            } else {
                console.log(`[AI-Readable] No associated content for heading "${headingText}"`);
                // If no associated content, still add spacing after the heading
                content.push(''); // 1 line break after heading for section separation
            }
            
            processedElements.add(heading);
            processedContent.add(headingText);
            } catch (error) {
                console.log(`[AI-Readable] Error processing heading:`, error);
                // Continue processing other headings instead of crashing
            }
        });
        
        // If no headings found, try to extract main content paragraphs
        if (content.length === 0) {
            console.log('[AI-Readable] No headings found, extracting fallback content...');
            const paragraphs = document.querySelectorAll('p, .content p, main p, article p');
            console.log(`[AI-Readable] Found ${paragraphs.length} paragraphs to process`);
            
            paragraphs.forEach((p, index) => {
                try {
                    if (!p || !processedElements || !processedElements.has) {
                        console.log('[AI-Readable] Invalid paragraph element or processedElements');
                        return;
                    }
                    
                    if (!processedElements.has(p)) {
                        // Check if this paragraph is part of a table structure
                        if (this.isTableRelated(p)) {
                            console.log('[AI-Readable] Found table-related paragraph - placing marker');
                            
                            // Place a marker for this table on its own line
                            const markerId = `TABLE_MARKER_${markerCounter.value++}`;
                            const marker = `[TABLE_MARKER:${markerId}]`;
                            content.push(''); // Add spacing before marker
                            content.push(marker);
                            content.push(''); // Add spacing after marker
                            
                            // Store the marker info for later replacement
                            tableMarkers.set(markerId, {
                                element: p,
                                type: 'paragraph'
                            });
                            
                            processedElements.add(p);
                            return;
                        }
                        
                        const text = this.extractTextWithLinks(p);
                        if (text && text.length > 20 && !processedContent.has(text)) { // Only include substantial paragraphs
                            if (index > 0) {
                                content.push(''); // 1 line break between content blocks
                            }
                            content.push(text);
                            processedElements.add(p);
                            processedContent.add(text);
                        }
                    }
                } catch (error) {
                    console.log('[AI-Readable] Error processing paragraph in fallback content:', error);
                    // Continue processing other paragraphs instead of crashing
                }
            });
        }
        
        console.log(`[AI-Readable] Content hierarchy extraction complete. Added ${content.length} content blocks with ${tableMarkers.size} table markers.`);
        return content;
    }

    getAssociatedContentWithMarkers(heading, processedElements, processedContent, tableMarkers, markerCounter) {
        // Defensive check: ensure all parameters are valid
        if (!heading || !processedElements || !processedContent || !tableMarkers || !markerCounter) {
            console.log('[AI-Readable] Invalid parameters passed to getAssociatedContentWithMarkers');
            return [];
        }

        const content = [];
        let nextElement = heading.nextElementSibling;
        let contentCount = 0;
        
        // Limit the amount of content we extract to avoid overwhelming output
        while (nextElement && !this.isHeading(nextElement) && contentCount < 5) {
            try {
                // Skip if this element is already processed
                if (processedElements.has(nextElement)) {
                    nextElement = nextElement.nextElementSibling;
                    continue;
                }
                
                // Check if this element is table-related
                if (this.isTableRelated(nextElement)) {
                    console.log('[AI-Readable] Found table-related element in associated content - placing marker');
                    
                    // Place a marker for this table on its own line
                    const markerId = `TABLE_MARKER_${markerCounter.value++}`;
                    const marker = `[TABLE_MARKER:${markerId}]`;
                    content.push(''); // Add spacing before marker
                    content.push(marker);
                    content.push(''); // Add spacing after marker
                    
                    // Store the marker info for later replacement
                    tableMarkers.set(markerId, {
                        element: nextElement,
                        type: 'associated',
                        parentHeading: heading
                    });
                    
                    processedElements.add(nextElement);
                    nextElement = nextElement.nextElementSibling;
                    continue;
                }
                
                if (this.isParagraph(nextElement)) {
                    console.log(`[AI-Readable] Found paragraph element:`, {
                        tagName: nextElement.tagName,
                        className: nextElement.className,
                        textContent: nextElement.textContent?.substring(0, 100) + '...'
                    });
                    
                    const text = this.extractTextWithLinks(nextElement);
                    console.log(`[AI-Readable] Extracted text:`, text?.substring(0, 100) + '...');
                    
                    if (text && text.length > 10 && !processedContent.has(text)) { // Only include substantial paragraphs
                        console.log(`[AI-Readable] Adding paragraph to content`);
                        content.push(text);
                        contentCount++;
                        processedElements.add(nextElement);
                        processedContent.add(text);
                    } else {
                        console.log(`[AI-Readable] Skipping paragraph:`, {
                            hasText: !!text,
                            textLength: text?.length,
                            alreadyProcessed: processedContent.has(text)
                        });
                    }
                } else if (this.isList(nextElement)) {
                    try {
                        const listContent = this.extractList(nextElement);
                        if (listContent && !processedContent.has(listContent)) {
                            content.push(''); // 1 line break before list
                            content.push(listContent);
                            content.push(''); // 1 line break after list
                            contentCount++;
                            processedElements.add(nextElement);
                            processedContent.add(listContent);
                        }
                    } catch (error) {
                        console.log('[AI-Readable] Error processing list element:', error);
                    }
                }
            } catch (error) {
                console.log('[AI-Readable] Error processing element in getAssociatedContentWithMarkers:', error);
                // Continue processing other elements instead of crashing
            }
            
            nextElement = nextElement.nextElementSibling;
        }
        
        console.log(`[AI-Readable] getAssociatedContentWithMarkers returning:`, {
            contentLength: content.length,
            content: content.map(item => typeof item === 'string' ? item.substring(0, 50) + '...' : item)
        });
        return content;
    }

    isTableRelated(element) {
        // Defensive check: ensure element exists and is valid
        if (!element || !element.tagName) {
            console.log('[AI-Readable] Invalid element passed to isTableRelated');
            return false;
        }

        console.log(`[AI-Readable] Checking if element is table-related:`, {
            tagName: element.tagName,
            className: element.className,
            textContent: element.textContent?.substring(0, 100) + '...'
        });
        
        // Check if element contains table-like content
        if (this.isTable(element)) {
            console.log('[AI-Readable] Element is a standard HTML table');
            return true;
        }
        
        // Check for table-related classes with defensive programming
        const tableClasses = ['table', 'grid', 'chart', 'graph', 'data-table', 'pricing-table', 'benchmark', 'metrics', 'stats'];
        
        // Safely handle different types of className
        let classNameString = '';
        try {
            if (element.className) {
                if (typeof element.className === 'string') {
                    classNameString = element.className;
                } else if (element.className instanceof DOMTokenList) {
                    classNameString = Array.from(element.className).join(' ');
                } else {
                    classNameString = String(element.className);
                }
            }
        } catch (error) {
            console.log('[AI-Readable] Error processing className:', error);
            classNameString = '';
        }
        
        const hasTableClass = tableClasses.some(cls => 
            classNameString.toLowerCase().includes(cls)
        );
        
        if (hasTableClass) {
            console.log(`[AI-Readable] Element has table-related class: ${classNameString}`);
            return true;
        }
        
        // Check for table-like content in pre tags
        if (element.tagName === 'PRE') {
            try {
                const text = element.textContent;
                if (text && text.includes('|') && text.includes('-')) {
                    console.log('[AI-Readable] Pre element contains table-like content');
                    return true;
                }
            } catch (error) {
                console.log('[AI-Readable] Error processing PRE element:', error);
            }
        }
        
        // Check for table-like content in divs with specific patterns
        if (element.tagName === 'DIV') {
            try {
                const text = element.textContent;
                // Look for patterns like "Category vs Accuracy" or similar table headers
                if (text && (text.includes(' vs ') || text.includes('Category') || text.includes('Accuracy') || text.includes('Win Rate'))) {
                    // Check if it has multiple lines with similar structure
                    const lines = text.split('\n').filter(line => line.trim().length > 0);
                    if (lines.length >= 3) {
                        // Check if multiple lines have similar structure (likely a table)
                        const hasTableStructure = lines.some(line => 
                            line.includes('|') || line.includes('  ') || line.includes('\t')
                        );
                        if (hasTableStructure) {
                            console.log('[AI-Readable] Div element contains table-like structure');
                            return true;
                        }
                    }
                }
            } catch (error) {
                console.log('[AI-Readable] Error processing DIV element:', error);
            }
        }
        
        // Check if element contains table-like children
        try {
            const tableChildren = element.querySelectorAll('table, [role="table"], .table, .grid, .chart, .graph');
            if (tableChildren.length > 0) {
                console.log(`[AI-Readable] Element contains ${tableChildren.length} table-like children`);
                return true;
            }
        } catch (error) {
            console.log('[AI-Readable] Error checking for table children:', error);
        }
        
        console.log('[AI-Readable] Element is NOT table-related');
        return false;
    }

    extractTextWithLinks(element) {
        // Defensive check: ensure element exists and is valid
        if (!element || !element.tagName) {
            console.log('[AI-Readable] Invalid element passed to extractTextWithLinks');
            return null;
        }

        // Skip table-related content - let table extraction handle it
        if (this.isTableRelated(element)) {
            return null;
        }
        
        try {
            // Extract text while preserving links as markdown
            // Skip pre-formatted markdown spans to avoid duplication
            const links = element.querySelectorAll('a[href]:not(.machine\\:hidden)');
            let text = element.textContent || '';
            
            // Remove pre-formatted markdown content to avoid duplication
            const markdownSpans = element.querySelectorAll('span.not-machine\\:hidden');
            markdownSpans.forEach(span => {
                if (span && span.textContent) {
                    text = text.replace(span.textContent, '');
                }
            });
            
            // Replace links with markdown format (replace all occurrences)
            links.forEach(link => {
                try {
                    const linkText = this.cleanText(link.textContent);
                    const href = link.href;
                    if (linkText && href) {
                        const isExternal = !href.includes(window.location.hostname);
                        
                        // Use global replace to handle multiple occurrences
                        const regex = new RegExp(link.textContent.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                        if (isExternal) {
                            text = text.replace(regex, `[${linkText}]($${href})`);
                        } else {
                            text = text.replace(regex, `[${linkText}](${href})`);
                        }
                    }
                } catch (error) {
                    console.log('[AI-Readable] Error processing link:', error);
                }
            });
        
            // Clean the text after link processing
            return this.cleanText(text);
        } catch (error) {
            console.log('[AI-Readable] Error in extractTextWithLinks:', error);
            return null;
        }
    }

    extractAllTables() {
        const tables = [];
        
        console.log('[AI-Readable] Starting extraction of all tables...');
        
        // Strategy 1: Pre-formatted markdown tables (highest priority - like Parallel.ai)
        const preElements = document.querySelectorAll('pre');
        console.log(`[AI-Readable] Found ${preElements.length} pre elements`);
        preElements.forEach(pre => {
            const markdownTable = this.extractMarkdownTable(pre);
            if (markdownTable) {
                console.log('[AI-Readable] Adding pre-formatted table');
                tables.push({
                    content: markdownTable,
                    element: pre,
                    type: 'pre-formatted',
                    priority: 1
                });
            }
        });
        
        // Strategy 2: Standard HTML tables (second priority)
        const standardTables = document.querySelectorAll('table, [role="table"]');
        console.log(`[AI-Readable] Found ${standardTables.length} standard tables`);
        standardTables.forEach(table => {
            const markdownTable = this.formatAsMarkdownTable(table);
            if (markdownTable) {
                console.log('[AI-Readable] Adding standard table');
                tables.push({
                    content: markdownTable,
                    element: table,
                    type: 'html',
                    priority: 2
                });
            }
        });
        
        // Strategy 3: Chart/visualization structures (third priority)
        const chartTables = this.extractChartTables();
        console.log(`[AI-Readable] Added ${chartTables.length} chart tables`);
        chartTables.forEach(chartTable => {
            tables.push({
                content: chartTable,
                type: 'chart',
                priority: 3
            });
        });
        
        // Strategy 4: Custom div structures (lowest priority)
        const customTables = this.extractCustomTableStructures();
        console.log(`[AI-Readable] Added ${customTables.length} custom table structures (down from 81!)`);
        customTables.forEach(customTable => {
            tables.push({
                content: customTable,
                type: 'custom',
                priority: 4
            });
        });
        
        console.log(`[AI-Readable] Total tables extracted: ${tables.length}`);
        return tables;
    }

    // New method: Normalize table content for deduplication
    normalizeTableContent(tableContent) {
        if (!tableContent) return '';
        
        // Remove formatting characters and normalize whitespace
        return tableContent
            .replace(/[|+-]/g, ' ') // Remove table formatting characters
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim()
            .toLowerCase(); // Case-insensitive comparison
    }

    formatAsMarkdownTable(table) {
        const rows = table.querySelectorAll('tr');
        if (rows.length === 0) return '';
        
        // Extract headers
        const headerRow = rows[0];
        const headers = Array.from(headerRow.querySelectorAll('th, td')).map(cell => 
            this.cleanText(this.extractCellContent(cell)) || ''
        );
        
        if (headers.length === 0) return '';
        
        // Extract all data rows first to calculate optimal column widths
        const dataRows = [];
        for (let i = 1; i < rows.length && i < 15; i++) {
            const cells = Array.from(rows[i].querySelectorAll('td, th')).map(cell => {
                const content = this.cleanText(this.extractCellContent(cell));
                return content || '';
            });
            
            // Pad cells array to match header length
            while (cells.length < headers.length) {
                cells.push('');
            }
            
            // Only add non-empty rows or rows with at least one non-empty cell
            if (cells.some(cell => cell.trim() !== '')) {
                dataRows.push(cells);
            }
        }
        
        // Filter out rows that are completely empty or have very little content
        const filteredDataRows = dataRows.filter(row => 
            row.some(cell => cell.trim().length > 0)
        );
        
        // Calculate optimal column widths
        const columnWidths = headers.map((header, index) => {
            let maxWidth = header.length;
            filteredDataRows.forEach(row => {
                if (row[index] && row[index].length > maxWidth) {
                    maxWidth = row[index].length;
                }
            });
            return Math.max(maxWidth, 8); // Minimum width of 8
        });
        
        return this.formatASCIITable(headers, filteredDataRows, columnWidths);
    }
    
    formatASCIITable(headers, dataRows, columnWidths) {
        const result = [];
        
        // Add spacing before table
        result.push(''); // Empty line before table
        
        // Create top border using standard ASCII characters
        const topBorder = '+' + columnWidths.map(width => '-'.repeat(width + 2)).join('+') + '+';
        result.push(topBorder);
        
        // Create header row
        const headerCells = headers.map((header, index) => 
            ' ' + header.padEnd(columnWidths[index]) + ' '
        );
        result.push('|' + headerCells.join('|') + '|');
        
        // Create separator row
        const separator = '+' + columnWidths.map(width => '-'.repeat(width + 2)).join('+') + '+';
        result.push(separator);
        
        // Create data rows with proper spacing
        dataRows.forEach((row, index) => {
            const rowCells = row.map((cell, index) => 
                ' ' + (cell || '').padEnd(columnWidths[index]) + ' '
            );
            result.push('|' + rowCells.join('|') + '|');
            
            // Add spacing between rows (but not after the last row)
            if (index < dataRows.length - 1) {
                result.push(''); // Empty line between rows
            }
        });
        
        // Create bottom border
        const bottomBorder = '+' + columnWidths.map(width => '-'.repeat(width + 2)).join('+') + '+';
        result.push(bottomBorder);
        
        // Add spacing after table
        result.push(''); // Empty line after table
        
        return result.join('\n\n');
    }

    extractCellContent(cell) {
        // Handle complex cell content (icons, links, mixed content)
        let content = '';
        
        // Check for SVG icons and replace with meaningful text
        const icons = cell.querySelectorAll('svg');
        if (icons.length > 0) {
            // Look for common icon patterns and replace with text
            icons.forEach(icon => {
                const iconText = this.getIconDescription(icon);
                if (iconText) {
                    content += iconText + ' ';
                }
            });
        }
        
        // Check for links - preserve as markdown links in tables
        const links = cell.querySelectorAll('a');
        if (links.length > 0) {
            let linkContent = '';
            links.forEach(link => {
                const linkText = this.cleanText(link.textContent);
                const href = link.href;
                if (linkText && href) {
                    linkContent += `[${linkText}](${href}) `;
                } else if (linkText) {
                    linkContent += linkText + ' ';
                }
            });
            content += linkContent;
        }
        
        // Get the main text content, but avoid duplicating link text
        let mainText = cell.textContent.trim();
        
        // Remove link text that we've already processed to avoid duplication
        links.forEach(link => {
            const linkText = link.textContent.trim();
            if (linkText) {
                // Remove the link text from the main text to avoid duplication
                mainText = mainText.replace(linkText, '').trim();
            }
        });
        
        // Only add main text if we haven't already captured the content via links
        if (mainText && links.length === 0) {
            content += mainText;
        } else if (mainText && !content.includes(mainText)) {
            content += ' ' + mainText;
        }
        
        // Clean up extra spaces and return
        return this.cleanText(content);
    }

    getIconDescription(icon) {
        // Try to identify common icons and provide meaningful descriptions
        const svgContent = icon.outerHTML;
        
        // Check for common icon patterns
        if (svgContent.includes('check') || svgContent.includes('tick')) {
            return '✓';
        } else if (svgContent.includes('star') || svgContent.includes('favorite')) {
            return '★';
        } else if (svgContent.includes('arrow') || svgContent.includes('chevron')) {
            return '→';
        } else if (svgContent.includes('plus') || svgContent.includes('add')) {
            return '+';
        } else if (svgContent.includes('minus') || svgContent.includes('remove')) {
            return '-';
        } else if (svgContent.includes('fire') || svgContent.includes('flame')) {
            return '🔥';
        } else {
            return '•'; // Generic bullet for unknown icons
        }
    }

    extractMarkdownTable(preElement) {
        const text = preElement.textContent;
        if (!text) return null;
        
        // Check if this pre element contains markdown table syntax
        const lines = text.trim().split('\n');
        if (lines.length < 3) return null; // Need at least header, separator, and one data row
        
        // Look for markdown table pattern: | col1 | col2 | col3 |
        const hasTableSyntax = lines.some(line => 
            line.trim().startsWith('|') && line.trim().endsWith('|') && line.includes('|')
        );
        
        if (!hasTableSyntax) return null;
        
        // This is a markdown table, return it as-is
        return text.trim();
    }

    extractChartTables() {
        const chartTables = [];
        
        // Look for bar chart structures (Example 1)
        const barCharts = document.querySelectorAll('.bar-graph, [class*="chart"], [class*="graph"]');
        barCharts.forEach(chart => {
            const chartTable = this.convertChartToTable(chart);
            if (chartTable) {
                chartTables.push(chartTable);
            }
        });
        
        // Look for percentage/metric charts (Example 2)
        const percentageCharts = document.querySelectorAll('[class*="percentage"], [class*="metric"], [class*="stat"]');
        percentageCharts.forEach(chart => {
            const chartTable = this.convertPercentageChartToTable(chart);
            if (chartTable) {
                chartTables.push(chartTable);
            }
        });
        
        return chartTables;
    }

    convertChartToTable(chartElement) {
        // Look for chart-like structures
        const chartContainer = chartElement.closest('section, div');
        if (!chartContainer) return null;
        
        // Try to find chart data
        const chartData = [];
        
        // Look for percentage/numbers and labels
        const numbers = chartContainer.querySelectorAll('[class*="number"], [class*="percentage"], [class*="value"]');
        const labels = chartContainer.querySelectorAll('[class*="tag"], [class*="label"], [class*="title"]');
        
        if (numbers.length > 0 && labels.length > 0) {
            const headers = ['Metric', 'Value'];
            const dataRows = [];
            
            for (let i = 0; i < Math.min(numbers.length, labels.length); i++) {
                const number = this.cleanText(numbers[i].textContent);
                const label = this.cleanText(labels[i].textContent);
                if (number && label) {
                    dataRows.push([label, number]);
                }
            }
            
            if (dataRows.length > 0) {
                // Calculate column widths
                const columnWidths = [
                    Math.max(headers[0].length, Math.max(...dataRows.map(row => row[0].length)), 8),
                    Math.max(headers[1].length, Math.max(...dataRows.map(row => row[1].length)), 8)
                ];
                
                return this.formatASCIITable(headers, dataRows, columnWidths);
            }
        }
        
        return null;
    }

    convertPercentageChartToTable(chartElement) {
        // Look for percentage-based chart structures
        const chartContainer = chartElement.closest('section, div');
        if (!chartContainer) return null;
        
        // Try to find percentage data and labels
        const percentages = chartContainer.querySelectorAll('[class*="number"], [class*="percentage"], [class*="value"], [class*="stat"]');
        const labels = chartContainer.querySelectorAll('[class*="tag"], [class*="label"], [class*="title"], [class*="name"]');
        
        if (percentages.length > 0 && labels.length > 0) {
            const headers = ['Metric', 'Percentage'];
            const dataRows = [];
            
            for (let i = 0; i < Math.min(percentages.length, labels.length); i++) {
                const percentage = this.cleanText(percentages[i].textContent);
                const label = this.cleanText(labels[i].textContent);
                if (percentage && label) {
                    dataRows.push([label, percentage]);
                }
            }
            
            if (dataRows.length > 0) {
                // Calculate column widths
                const columnWidths = [
                    Math.max(headers[0].length, Math.max(...dataRows.map(row => row[0].length)), 8),
                    Math.max(headers[1].length, Math.max(...dataRows.map(row => row[1].length)), 8)
                ];
                
                return this.formatASCIITable(headers, dataRows, columnWidths);
            }
        }
        
        return null;
    }

    extractCustomTableStructures() {
        const customTables = [];
        
        // Much more conservative approach - only look for divs that are likely tables
        const potentialTables = document.querySelectorAll('div[class*="table"], div[class*="grid"], div[class*="chart"], div[class*="data"], div[class*="pricing"], div[class*="comparison"], div[class*="stats"], div[class*="metrics"]');
        
        console.log(`[AI-Readable] Found ${potentialTables.length} potential custom table divs (conservative selection)`);
        
        // Limit processing to prevent overwhelming output
        let processedCount = 0;
        const maxTables = 10; // Limit to 10 custom tables max
        
        potentialTables.forEach(div => {
            if (processedCount >= maxTables) return;
            
            // Additional validation before processing
            if (this.isLikelyCustomTable(div)) {
                const tableData = this.parseCustomTableStructure(div);
                if (tableData) {
                    customTables.push(tableData);
                    processedCount++;
                    console.log(`[AI-Readable] Added custom table #${processedCount} from div with classes: ${div.className}`);
                }
            }
        });
        
        console.log(`[AI-Readable] Extracted ${customTables.length} custom tables (limited to ${maxTables})`);
        return customTables;
    }

    isLikelyCustomTable(div) {
        // Additional validation to ensure this div is actually a table
        if (!div || !div.className) return false;
        
        // Check if it has table-like classes
        const tableClasses = ['table', 'grid', 'chart', 'data', 'pricing', 'comparison', 'stats', 'metrics'];
        const hasTableClass = tableClasses.some(cls => 
            div.className.toLowerCase().includes(cls)
        );
        
        if (!hasTableClass) return false;
        
        // Check if it has reasonable dimensions (not too small, not too large)
        const rect = div.getBoundingClientRect();
        if (rect.width < 100 || rect.height < 50) return false; // Too small to be a meaningful table
        if (rect.width > 2000 || rect.height > 2000) return false; // Too large, probably not a table
        
        // Check if it has structured content
        const rows = div.querySelectorAll('[class*="row"], [class*="item"], [class*="entry"], tr, li');
        if (rows.length < 2 || rows.length > 50) return false; // Need reasonable number of rows
        
        // Check if content looks like table data (not just paragraphs)
        const hasTableStructure = this.hasTableLikeStructure(div);
        
        return hasTableStructure;
    }

    hasTableLikeStructure(container) {
        // Check if the content actually looks like a table
        const rows = container.querySelectorAll('[class*="row"], [class*="item"], [class*="entry"], tr, li');
        
        if (rows.length < 2) return false;
        
        // Check if rows have consistent structure
        let consistentStructure = true;
        let expectedCells = 0;
        
        rows.forEach((row, index) => {
            const cells = row.querySelectorAll('td, th, div, span, p');
            if (index === 0) {
                expectedCells = cells.length;
            } else if (cells.length !== expectedCells) {
                consistentStructure = false;
            }
        });
        
        // Check if content is not just paragraphs (which should be handled as text)
        const paragraphs = container.querySelectorAll('p');
        const totalTextLength = Array.from(paragraphs).reduce((sum, p) => sum + (p.textContent?.length || 0), 0);
        const totalContainerText = container.textContent?.length || 0;
        
        // If more than 80% is paragraph text, it's probably not a table
        if (totalTextLength / totalContainerText > 0.8) return false;
        
        return consistentStructure && expectedCells > 1;
    }

    parseCustomTableStructure(container) {
        // Much more conservative parsing - only process if we're confident it's a table
        if (!this.isLikelyCustomTable(container)) {
            return null;
        }
        
        // Look for structured data patterns
        const rows = container.querySelectorAll('[class*="row"], [class*="item"], [class*="entry"], tr, li');
        
        if (rows.length < 2 || rows.length > 20) return null; // Reasonable limits
        
        let headers = [];
        const dataRows = [];
        
        // Try to extract headers from first row
        const firstRow = rows[0];
        const firstRowCells = firstRow.querySelectorAll('td, th, div, span, p');
        
        if (firstRowCells.length < 2 || firstRowCells.length > 10) return null; // Reasonable column count
        
        headers = Array.from(firstRowCells).map(cell => 
            this.cleanText(cell.textContent)
        ).filter(header => header.length > 0); // Filter out empty headers
        
        if (headers.length < 2) return null; // Need at least 2 meaningful headers
        
        // Extract data rows with stricter validation
        for (let i = 1; i < rows.length && i < 15; i++) { // Limit to 15 rows
            const cells = Array.from(rows[i].querySelectorAll('td, th, div, span, p')).map(cell => 
                this.cleanText(cell.textContent)
            ).filter(cell => cell.length > 0); // Filter out empty cells
            
            if (cells.length >= headers.length * 0.5) { // At least 50% of headers have data
                // Pad cells to match header length
                while (cells.length < headers.length) {
                    cells.push('');
                }
                dataRows.push(cells);
            }
        }
        
        if (dataRows.length < 1) return null; // Need at least 1 data row
        
        // Additional validation: ensure this actually looks like table data
        const hasReasonableContent = dataRows.some(row => 
            row.some(cell => cell.length > 3) // At least some cells have meaningful content
        );
        
        if (!hasReasonableContent) return null;
        
        // Calculate column widths
        const columnWidths = headers.map((header, index) => {
            let maxWidth = header.length;
            dataRows.forEach(row => {
                if (row[index] && row[index].length > maxWidth) {
                    maxWidth = row[index].length;
                }
            });
            return Math.max(maxWidth, 8);
        });
        
        return this.formatASCIITable(headers, dataRows, columnWidths);
    }

    extractFooter() {
        const footer = [];
        const footerElement = document.querySelector('footer');
        
        if (footerElement) {
            const links = footerElement.querySelectorAll('a');
            links.forEach(link => {
                if (link.textContent.trim() && link.href) {
                    const text = this.cleanText(link.textContent);
                    const href = link.href;
                    const isExternal = !href.includes(window.location.hostname);
                    
                    if (isExternal) {
                        footer.push(`[${text}](${href})`);
                    } else {
                        footer.push(`[${text}](${href})`);
                    }
                }
            });
        }
        
        return footer.slice(0, 20); // Limit footer links
    }

    extractFallbackContent(processedElements, processedContent) {
        const content = [];
        
        // Try to find any meaningful text content
        const allTextElements = document.querySelectorAll('p, div, span, h1, h2, h3, h4, h5, h6, li, td, th');
        
        allTextElements.forEach(element => {
            // Skip already processed elements
            if (processedElements.has(element)) {
                return;
            }
            
            const text = this.cleanText(element.textContent);
            if (text && text.length > 15 && text.length < 500 && !processedContent.has(text)) { // Reasonable length
                // Check if this text is visible and not hidden
                const style = window.getComputedStyle(element);
                if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
                    content.push(text);
                    processedElements.add(element);
                    processedContent.add(text);
                }
            }
        });
        
        // Remove duplicates and limit results
        const uniqueContent = [...new Set(content)];
        return uniqueContent.slice(0, 10);
    }

    // Helper methods
    async waitForDynamicContent() {
        // Wait for any dynamic content to load
        return new Promise(resolve => {
            // If the page is already loaded, resolve immediately
            if (document.readyState === 'complete') {
                resolve();
                return;
            }
            
            // Otherwise wait for the page to finish loading
            window.addEventListener('load', resolve, { once: true });
            
            // Fallback timeout after 2 seconds
            setTimeout(resolve, 2000);
        });
    }

    cleanText(text) {
        return text
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/[^\w\s\-.,!?()|@+%/:\[\]()]/g, '')  // Preserve more characters for table content
            .replace(/\n+/g, ' ')
            .replace(/\s+/g, ' '); // Final cleanup of multiple spaces
    }

    shouldSkipLink(element) {
        const text = element.textContent.toLowerCase();
        const skipPatterns = ['cookie', 'privacy', 'terms', 'login', 'sign up', 'cart'];
        return skipPatterns.some(pattern => text.includes(pattern));
    }

    isCTALink(element) {
        const text = element.textContent.toLowerCase();
        const ctaPatterns = [
            'start', 'get', 'try', 'sign up', 'download', 'learn more', 'contact',
            'build', 'create', 'join', 'register', 'subscribe', 'book', 'schedule',
            'buy', 'purchase', 'order', 'shop', 'explore', 'discover', 'find out',
            'request', 'apply', 'submit', 'send', 'call', 'email', 'demo'
        ];
        return ctaPatterns.some(pattern => text.includes(pattern));
    }

    isHeading(element) {
        return /^H[1-6]$/.test(element.tagName);
    }

    isParagraph(element) {
        return element.tagName === 'P' || element.tagName === 'DIV';
    }

    isList(element) {
        return element.tagName === 'UL' || element.tagName === 'OL';
    }

    isTable(element) {
        return element.tagName === 'TABLE';
    }

    extractList(listElement) {
        const items = listElement.querySelectorAll('li');
        const listItems = Array.from(items).map(item => 
            '- ' + this.cleanText(item.textContent)
        );
        
        // Add spacing around the list
        const result = [];
        result.push(''); // Spacing before list
        result.push(listItems.join('\n\n')); // Items with double spacing
        result.push(''); // Spacing after list
        
        return result.join('\n\n');
    }

    // New method: Check if content has already been processed as part of a table
    isContentAlreadyInTable(element, processedTableElements) {
        // Check if this element is within a table structure that's already been processed
        let parent = element.parentElement;
        while (parent && parent !== document.body) {
            if (processedTableElements.has(parent)) {
                return true;
            }
            parent = parent.parentElement;
        }
        return false;
    }

    replaceTableMarkers(result, tableMarkers, tables) {
        console.log('[AI-Readable] Starting table marker replacement...');
        console.log(`[AI-Readable] Found ${tableMarkers.size} markers and ${tables.length} tables`);
        console.log('[AI-Readable] Markers:', Array.from(tableMarkers.entries()));
        console.log('[AI-Readable] Result array length:', result.length);
        
        const finalResult = [];
        let markerCount = 0;
        
        for (let i = 0; i < result.length; i++) {
            const line = result[i];
            
            console.log(`[AI-Readable] Processing line ${i}:`, typeof line === 'string' ? line.substring(0, 50) + '...' : line);
            
            // Check if this line is a table marker or contains multiple markers
            if (typeof line === 'string') {
                // Split the line by line breaks to handle multi-line content
                const subLines = line.split('\n');
                let processedSubLines = [];
                
                for (const subLine of subLines) {
                    const trimmedSubLine = subLine.trim();
                    
                    if (trimmedSubLine.startsWith('[TABLE_MARKER:')) {
                        markerCount++;
                        console.log(`[AI-Readable] Found marker #${markerCount}: ${trimmedSubLine}`);
                        
                        const markerId = trimmedSubLine.match(/\[TABLE_MARKER:([^\]]+)\]/)[1];
                        const markerInfo = tableMarkers.get(markerId);
                        
                        console.log(`[AI-Readable] Processing marker: ${markerId}, Info:`, markerInfo);
                        
                        if (markerInfo) {
                            console.log(`[AI-Readable] Replacing marker ${markerId} with table content`);
                            
                            // Find the best table to replace this marker
                            const bestTable = this.findBestTableForMarker(markerInfo, tables);
                            
                            if (bestTable) {
                                // Add the table content
                                processedSubLines.push(''); // Add spacing before table
                                processedSubLines.push(bestTable.content);
                                processedSubLines.push(''); // Add spacing after table
                                
                                // Remove this table from the available tables to prevent reuse
                                const tableIndex = tables.indexOf(bestTable);
                                if (tableIndex > -1) {
                                    tables.splice(tableIndex, 1);
                                }
                                
                                console.log(`[AI-Readable] Successfully replaced marker ${markerId} with ${bestTable.type} table`);
                            } else {
                                console.log(`[AI-Readable] No suitable table found for marker ${markerId}`);
                                // Keep the marker if no table found (for debugging)
                                processedSubLines.push(trimmedSubLine);
                            }
                        } else {
                            console.log(`[AI-Readable] Marker info not found for ${markerId}`);
                            processedSubLines.push(trimmedSubLine);
                        }
                    } else if (trimmedSubLine.length > 0) {
                        // Not a marker, keep the non-empty line
                        processedSubLines.push(trimmedSubLine);
                    }
                }
                
                // Join the processed sub-lines and add to final result
                if (processedSubLines.length > 0) {
                    finalResult.push(processedSubLines.join('\n\n'));
                }
            } else {
                // Not a string, keep the line as is
                finalResult.push(line);
            }
        }
        
        console.log(`[AI-Readable] Processed ${markerCount} markers total`);
        console.log(`[AI-Readable] Table marker replacement complete. ${tables.length} tables remaining unused.`);
        console.log('[AI-Readable] Final result after marker replacement:', finalResult);
        return finalResult;
    }

    findBestTableForMarker(markerInfo, tables) {
        if (tables.length === 0) return null;
        
        console.log(`[AI-Readable] Finding best table for marker type: ${markerInfo.type}`);
        
        // If we have a specific element, try to find a table that was extracted from it
        if (markerInfo.element) {
            // First priority: find exact element match
            const exactMatch = tables.find(table => table.element === markerInfo.element);
            if (exactMatch) {
                console.log(`[AI-Readable] Found exact element match for marker`);
                return exactMatch;
            }
            
            // Second priority: find table with similar content based on heading
            if (markerInfo.heading) {
                const headingMatch = this.findTableByHeading(markerInfo.heading, tables);
                if (headingMatch) {
                    console.log(`[AI-Readable] Found table match by heading: "${markerInfo.heading}"`);
                    return headingMatch;
                }
            }
        }
        
        // Fallback: return the highest priority table available
        const bestTable = tables.reduce((best, current) => {
            if (!best || current.priority < best.priority) {
                return current;
            }
            return best;
        });
        
        if (bestTable) {
            console.log(`[AI-Readable] Using fallback table of type: ${bestTable.type}`);
        }
        
        return bestTable;
    }
    
    findTableByHeading(heading, tables) {
        // Normalize the heading for comparison
        const normalizedHeading = heading.toLowerCase().replace(/[^\w\s]/g, '');
        
        // Look for tables that might contain this heading
        for (const table of tables) {
            if (table.content && table.content.toLowerCase().includes(normalizedHeading)) {
                return table;
            }
        }
        
        return null;
    }
}

// Initialize the translator
const translator = new WebsiteTranslator();
