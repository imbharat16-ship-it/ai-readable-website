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
        
        // Add header space (1 line gap before content starts)
        result.push('');
        
        // Step 1: Extract navigation
        const nav = this.extractNavigation();
        if (nav.brand) result.push(`<span class="brand-name">${nav.brand}</span>`);
        nav.navigation.forEach(link => result.push(link));
        nav.ctas.forEach(cta => result.push(cta));
        result.push('', '', ''); // 3 line breaks after navigation section
        
        // Step 2: Extract content hierarchy
        const content = this.extractContentHierarchy(processedElements, processedContent);
        result.push(...content);
        
        // Step 3: Extract tables
        const tables = this.extractTables();
        if (tables.length > 0) {
            result.push('', ''); // 2 line breaks before tables
            result.push(...tables);
            result.push('', ''); // 2 line breaks after tables
        }
        
        // Step 4: Extract footer
        const footer = this.extractFooter();
        if (footer.length > 0) {
            result.push('', '', ''); // 3 line breaks before footer section
            result.push(...footer);
        }
        
        // If we have very little content, try to extract more aggressively
        if (result.length < 5) {
            const fallbackContent = this.extractFallbackContent(processedElements, processedContent);
            result.push(...fallbackContent);
        }
        
        // Add footer space (1 line gap after content ends)
        result.push('');
        
        return result.join('\n');
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

    extractContentHierarchy(processedElements, processedContent) {
        const content = [];
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        
        headings.forEach((heading, index) => {
            const level = parseInt(heading.tagName.charAt(1));
            const text = this.cleanText(heading.textContent);
            
            if (text && text.length > 2) { // Only include meaningful headings
                // Add spacing based on heading level
                if (index > 0) {
                    if (level <= 2) {
                        content.push('', '', ''); // 3 line breaks for major sections (H1, H2)
                    } else {
                        content.push(''); // 1 line break for minor sections (H3, H4, H5, H6)
                    }
                }
                
                const markdown = '#'.repeat(level) + ' ' + text;
                content.push(markdown);
                
                // Extract associated content
                const associatedContent = this.getAssociatedContent(heading, processedElements, processedContent);
                if (associatedContent) {
                    content.push(associatedContent);
                }
            }
        });
        
        // If no headings found, try to extract main content paragraphs
        if (content.length === 0) {
            const paragraphs = document.querySelectorAll('p, .content p, main p, article p');
            paragraphs.forEach((p, index) => {
                if (!processedElements.has(p)) {
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
            });
        }
        
        return content;
    }

    getAssociatedContent(heading, processedElements, processedContent) {
        const content = [];
        let nextElement = heading.nextElementSibling;
        let contentCount = 0;
        
        // Limit the amount of content we extract to avoid overwhelming output
        while (nextElement && !this.isHeading(nextElement) && contentCount < 5) {
            if (this.isParagraph(nextElement) && !processedElements.has(nextElement)) {
                const text = this.extractTextWithLinks(nextElement);
                if (text && text.length > 10 && !processedContent.has(text)) { // Only include substantial paragraphs
                    content.push(text);
                    contentCount++;
                    processedElements.add(nextElement);
                    processedContent.add(text);
                } else if (text === null) {
                    // This is table-related content, skip it
                    processedElements.add(nextElement);
                    contentCount++;
                }
            } else if (this.isList(nextElement) && !processedElements.has(nextElement)) {
                const listContent = this.extractList(nextElement);
                if (listContent && !processedContent.has(listContent)) {
                    content.push(''); // 1 line break before list
                    content.push(listContent);
                    content.push(''); // 1 line break after list
                    contentCount++;
                    processedElements.add(nextElement);
                    processedContent.add(listContent);
                }
            } else if (this.isTable(nextElement) && !processedElements.has(nextElement)) {
                // Skip table extraction here - tables are handled separately in extractTables()
                // This prevents duplicate table processing
                processedElements.add(nextElement);
                contentCount++;
            }
            
            nextElement = nextElement.nextElementSibling;
        }
        
        return content.join('\n\n');
    }

    isTableRelated(element) {
        // Check if element contains table-like content
        if (this.isTable(element)) return true;
        
        // Check for table-related classes
        const tableClasses = ['table', 'grid', 'chart', 'graph', 'data-table', 'pricing-table'];
        const hasTableClass = tableClasses.some(cls => 
            element.className && element.className.toLowerCase().includes(cls)
        );
        
        if (hasTableClass) return true;
        
        // Check for table-like content in pre tags
        if (element.tagName === 'PRE') {
            const text = element.textContent;
            if (text && text.includes('|') && text.includes('-')) {
                return true;
            }
        }
        
        return false;
    }

    extractTextWithLinks(element) {
        // Skip table-related content - let table extraction handle it
        if (this.isTableRelated(element)) {
            return null;
        }
        
        // Extract text while preserving links as markdown
        // Skip pre-formatted markdown spans to avoid duplication
        const links = element.querySelectorAll('a[href]:not(.machine\\:hidden)');
        let text = element.textContent;
        
        // Remove pre-formatted markdown content to avoid duplication
        const markdownSpans = element.querySelectorAll('span.not-machine\\:hidden');
        markdownSpans.forEach(span => {
            text = text.replace(span.textContent, '');
        });
        
        // Replace links with markdown format (replace all occurrences)
        links.forEach(link => {
            const linkText = this.cleanText(link.textContent);
            const href = link.href;
            const isExternal = !href.includes(window.location.hostname);
            
            // Use global replace to handle multiple occurrences
            const regex = new RegExp(link.textContent.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
            if (isExternal) {
                text = text.replace(regex, `[${linkText}]($${href})`);
            } else {
                text = text.replace(regex, `[${linkText}](${href})`);
            }
        });
        
        // Clean the text after link processing
        return this.cleanText(text);
    }

    extractTables() {
        const tables = [];
        const processedTableContent = new Set(); // Track processed table content to prevent duplicates
        
        // Waterfall Method: Try each strategy in priority order, skip if already processed
        
        // Strategy 1: Pre-formatted markdown tables (highest priority - like Parallel.ai)
        const preElements = document.querySelectorAll('pre');
        preElements.forEach(pre => {
            const markdownTable = this.extractMarkdownTable(pre);
            if (markdownTable && !processedTableContent.has(markdownTable)) {
                tables.push(markdownTable);
                processedTableContent.add(markdownTable);
            }
        });
        
        // Strategy 2: Standard HTML tables (second priority)
        const standardTables = document.querySelectorAll('table, [role="table"]');
        standardTables.forEach(table => {
            const markdownTable = this.formatAsMarkdownTable(table);
            if (markdownTable && !processedTableContent.has(markdownTable)) {
                tables.push(markdownTable);
                processedTableContent.add(markdownTable);
            }
        });
        
        // Strategy 3: Chart/visualization structures (third priority)
        const chartTables = this.extractChartTables(processedTableContent);
        tables.push(...chartTables);
        
        // Strategy 4: Custom div structures (lowest priority)
        const customTables = this.extractCustomTableStructures(processedTableContent);
        tables.push(...customTables);
        
        return tables;
    }

    formatAsMarkdownTable(table) {
        const rows = table.querySelectorAll('tr');
        if (rows.length === 0) return '';
        
        const result = [];
        
        // Extract headers
        const headerRow = rows[0];
        const headers = Array.from(headerRow.querySelectorAll('th, td')).map(cell => 
            this.cleanText(this.extractCellContent(cell))
        );
        
        if (headers.length === 0) return '';
        
        result.push('| ' + headers.join(' | ') + ' |');
        result.push('| ' + headers.map(() => '--------').join(' | ') + ' |');
        
        // Extract data rows
        for (let i = 1; i < rows.length && i < 10; i++) { // Limit to 10 rows
            const cells = Array.from(rows[i].querySelectorAll('td, th')).map(cell => 
                this.cleanText(this.extractCellContent(cell))
            );
            
            if (cells.length > 0) {
                result.push('| ' + cells.join(' | ') + ' |');
            }
        }
        
        return result.join('\n');
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
        
        // Check for links
        const links = cell.querySelectorAll('a');
        if (links.length > 0) {
            links.forEach(link => {
                const linkText = this.cleanText(link.textContent);
                if (linkText) {
                    content += linkText + ' ';
                }
            });
        }
        
        // Get the main text content
        const mainText = cell.textContent.trim();
        if (mainText) {
            content += mainText;
        }
        
        return content.trim();
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

    extractChartTables(processedTableContent) {
        const chartTables = [];
        
        // Look for bar chart structures (Example 1)
        const barCharts = document.querySelectorAll('.bar-graph, [class*="chart"], [class*="graph"]');
        barCharts.forEach(chart => {
            const chartTable = this.convertChartToTable(chart);
            if (chartTable && !processedTableContent.has(chartTable)) {
                chartTables.push(chartTable);
                processedTableContent.add(chartTable);
            }
        });
        
        // Look for percentage-based visualizations
        const percentageCharts = document.querySelectorAll('[class*="percentage"], [class*="metric"], [class*="stat"]');
        percentageCharts.forEach(chart => {
            const chartTable = this.convertPercentageChartToTable(chart);
            if (chartTable && !processedTableContent.has(chartTable)) {
                chartTables.push(chartTable);
                processedTableContent.add(chartTable);
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
            // Create a simple table from chart data
            const table = ['| Metric | Value |', '| ------ | ----- |'];
            
            for (let i = 0; i < Math.min(numbers.length, labels.length); i++) {
                const number = this.cleanText(numbers[i].textContent);
                const label = this.cleanText(labels[i].textContent);
                if (number && label) {
                    table.push(`| ${label} | ${number} |`);
                }
            }
            
            if (table.length > 2) { // Has at least header + data
                return table.join('\n');
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
            // Create a table from percentage data
            const table = ['| Metric | Percentage |', '| ------ | ---------- |'];
            
            for (let i = 0; i < Math.min(percentages.length, labels.length); i++) {
                const percentage = this.cleanText(percentages[i].textContent);
                const label = this.cleanText(labels[i].textContent);
                if (percentage && label) {
                    table.push(`| ${label} | ${percentage} |`);
                }
            }
            
            if (table.length > 2) { // Has at least header + data
                return table.join('\n');
            }
        }
        
        return null;
    }

    extractCustomTableStructures(processedTableContent) {
        const customTables = [];
        
        // Look for div structures that might contain table-like data
        const potentialTables = document.querySelectorAll('div[class*="table"], div[class*="grid"], div[class*="list"]');
        
        potentialTables.forEach(div => {
            const tableData = this.parseCustomTableStructure(div);
            if (tableData && !processedTableContent.has(tableData)) {
                customTables.push(tableData);
                processedTableContent.add(tableData);
            }
        });
        
        return customTables;
    }

    parseCustomTableStructure(container) {
        // Look for structured data patterns
        const rows = container.querySelectorAll('[class*="row"], [class*="item"], [class*="entry"], tr, li');
        
        if (rows.length < 2) return null; // Need at least header + data
        
        const tableData = [];
        let headers = [];
        
        // Try to extract headers from first row
        const firstRow = rows[0];
        const firstRowCells = firstRow.querySelectorAll('td, th, div, span, p');
        
        if (firstRowCells.length > 1) {
            headers = Array.from(firstRowCells).map(cell => 
                this.cleanText(cell.textContent)
            );
            
            if (headers.length > 0) {
                tableData.push('| ' + headers.join(' | ') + ' |');
                tableData.push('| ' + headers.map(() => '--------').join(' | ') + ' |');
                
                // Extract data rows
                for (let i = 1; i < rows.length && i < 10; i++) { // Limit to 10 rows
                    const cells = Array.from(rows[i].querySelectorAll('td, th, div, span, p')).map(cell => 
                        this.cleanText(cell.textContent)
                    );
                    
                    if (cells.length > 0) {
                        tableData.push('| ' + cells.join(' | ') + ' |');
                    }
                }
                
                return tableData.join('\n');
            }
        }
        
        return null;
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
            .replace(/[^\w\s\-.,!?()|]/g, '')  // Added | to preserve pipe characters for tables
            .replace(/\n+/g, '\n');
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
        return Array.from(items).map(item => 
            '- ' + this.cleanText(item.textContent)
        ).join('\n');
    }
}

// Initialize the translator
const translator = new WebsiteTranslator();
