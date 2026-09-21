"""
Enterprise Proposal Generator for Toursurv / Travel Company Platform
Generates an executive-ready Word document (.docx) focused on conceptual workflows:
1. Dynamic Rate Management (Time Periods & Country of Origin Tiers)
2. Live Currency & Foreign Exchange Multipliers
3. Automated Base Cost Data (Hotels, Guides, Drivers, Vehicle Packages & Per-KM rates)
4. Attraction & POI Pricing Engine (Master DB, Tiered Nationality Rates, Dynamic "Other" on-the-fly pricing)
5. Automated Web Scraping & Data Ingestion Engine (Hybrid Architecture leveraging srilanka-travel-etl)
6. Comprehensive User Journeys & Conceptual "How It Works" Operations
7. Detailed Implementation Plan & Roadmap
(Streamlined to focus purely on business logic, workflows, and operational concept—free of raw arithmetic/calculation formulas)
"""

import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    """Set inner padding for table cells in dxa (1 pt = 20 dxa)"""
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_cell_shading(cell, color_hex):
    """Set background color of a cell"""
    shading = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>')
    cell._tc.get_or_add_tcPr().append(shading)

def set_cell_borders(cell, top=None, bottom=None, left=None, right=None):
    """Set individual cell borders"""
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = OxmlElement('w:tcBorders')
    
    borders = {'top': top, 'bottom': bottom, 'left': left, 'right': right}
    for border_name, border_style in borders.items():
        if border_style:
            b_el = OxmlElement(f'w:{border_name}')
            b_el.set(qn('w:val'), border_style.get('val', 'single'))
            b_el.set(qn('w:sz'), str(border_style.get('sz', '4')))
            b_el.set(qn('w:space'), '0')
            b_el.set(qn('w:color'), border_style.get('color', 'CCCCCC'))
            tcBorders.append(b_el)
        else:
            b_el = OxmlElement(f'w:{border_name}')
            b_el.set(qn('w:val'), 'none')
            tcBorders.append(b_el)
    tcPr.append(tcBorders)

def add_styled_heading(doc, text, level, space_before=14, space_after=6):
    """Add a heading with tailored styling and brand color"""
    p = doc.add_heading(level=level)
    p.paragraph_format.space_before = Pt(space_before)
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.keep_with_next = True
    
    run = p.add_run(text)
    run.font.name = 'Calibri'
    run.bold = True
    
    if level == 1:
        run.font.size = Pt(17)
        run.font.color.rgb = RGBColor(15, 41, 66)      # Navy #0F2942
        pPr = p._p.get_or_add_pPr()
        pBdr = OxmlElement('w:pBdr')
        bottom = OxmlElement('w:bottom')
        bottom.set(qn('w:val'), 'single')
        bottom.set(qn('w:sz'), '12') # 1.5 pt
        bottom.set(qn('w:space'), '4')
        bottom.set(qn('w:color'), '0D9488') # Teal accent
        pBdr.append(bottom)
        pPr.append(pBdr)
    elif level == 2:
        run.font.size = Pt(13.5)
        run.font.color.rgb = RGBColor(30, 58, 138)     # Royal Blue #1E3A8A
    elif level == 3:
        run.font.size = Pt(11)
        run.font.color.rgb = RGBColor(13, 148, 136)    # Teal #0D9488
    return p

def add_styled_paragraph(doc, text="", bold_prefix=None, space_after=6, line_spacing=1.15):
    """Add a body paragraph with standard typography"""
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = line_spacing
    
    if bold_prefix:
        r_bold = p.add_run(bold_prefix)
        r_bold.font.name = 'Calibri'
        r_bold.font.size = Pt(10)
        r_bold.bold = True
        r_bold.font.color.rgb = RGBColor(30, 41, 59)
        
    if text:
        r_text = p.add_run(text)
        r_text.font.name = 'Calibri'
        r_text.font.size = Pt(10)
        r_text.font.color.rgb = RGBColor(51, 65, 85) # Slate #334155
    return p

def add_bullet_item(doc, bold_prefix, text):
    """Add a bullet point item with bold title and explanatory text"""
    p = doc.add_paragraph(style='List Bullet')
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.line_spacing = 1.15
    
    r_bold = p.add_run(bold_prefix + ": ")
    r_bold.font.name = 'Calibri'
    r_bold.font.size = Pt(10)
    r_bold.bold = True
    r_bold.font.color.rgb = RGBColor(15, 23, 42)
    
    r_text = p.add_run(text)
    r_text.font.name = 'Calibri'
    r_text.font.size = Pt(10)
    r_text.font.color.rgb = RGBColor(51, 65, 85)
    return p

def add_callout_box(doc, title, content_lines, box_type="info"):
    """Create a highlight callout box with a colored left accent border"""
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    
    colors = {
        "info": {"bg": "F0FDF4", "border": "0D9488", "title": RGBColor(13, 148, 136)},
        "alert": {"bg": "FEF2F2", "border": "EF4444", "title": RGBColor(220, 38, 38)},
        "note": {"bg": "F8FAFC", "border": "1E3A8A", "title": RGBColor(30, 58, 138)},
        "summary": {"bg": "F0F9FF", "border": "0284C7", "title": RGBColor(2, 132, 199)}
    }
    cfg = colors.get(box_type, colors["info"])
    
    cell = tbl.cell(0, 0)
    cell.width = Inches(6.8)
    set_cell_margins(cell, top=120, bottom=120, left=180, right=140)
    set_cell_shading(cell, cfg["bg"])
    set_cell_borders(cell, 
                     left={'val': 'single', 'sz': '24', 'color': cfg["border"]},
                     top={'val': 'none'}, right={'val': 'none'}, bottom={'val': 'none'})
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_after = Pt(3)
    r_title = p.add_run(f"✦ {title}")
    r_title.font.name = 'Calibri'
    r_title.font.size = Pt(10.5)
    r_title.bold = True
    r_title.font.color.rgb = cfg["title"]
    
    for line in content_lines:
        p_line = cell.add_paragraph()
        p_line.paragraph_format.space_after = Pt(2)
        r_line = p_line.add_run(line)
        r_line.font.name = 'Calibri'
        r_line.font.size = Pt(9.5)
        r_line.font.color.rgb = RGBColor(51, 65, 85)
        
    doc.add_paragraph().paragraph_format.space_after = Pt(4)

def create_styled_table(doc, headers, rows_data, col_widths=None):
    """Create a high-end corporate table with styled headers and alternating row colors"""
    tbl = doc.add_table(rows=len(rows_data) + 1, cols=len(headers))
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    
    # Header Row
    hdr_row = tbl.rows[0]
    for idx, header_text in enumerate(headers):
        cell = hdr_row.cells[idx]
        if col_widths and idx < len(col_widths):
            cell.width = col_widths[idx]
        set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
        set_cell_shading(cell, "0F2942")
        set_cell_borders(cell, 
                         top={'val': 'single', 'sz': '4', 'color': '0F2942'},
                         bottom={'val': 'single', 'sz': '12', 'color': '0D9488'},
                         left={'val': 'single', 'sz': '4', 'color': '1E3A8A'},
                         right={'val': 'single', 'sz': '4', 'color': '1E3A8A'})
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_after = Pt(0)
        run = p.add_run(header_text)
        run.font.name = 'Calibri'
        run.font.size = Pt(9.0)
        run.bold = True
        run.font.color.rgb = RGBColor(255, 255, 255)
        
    # Data Rows
    for r_idx, row in enumerate(rows_data):
        row_el = tbl.rows[r_idx + 1]
        bg_color = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, val in enumerate(row):
            cell = row_el.cells[c_idx]
            if col_widths and c_idx < len(col_widths):
                cell.width = col_widths[c_idx]
            set_cell_margins(cell, top=70, bottom=70, left=100, right=100)
            set_cell_shading(cell, bg_color)
            set_cell_borders(cell, 
                             top={'val': 'single', 'sz': '4', 'color': 'E2E8F0'},
                             bottom={'val': 'single', 'sz': '4', 'color': 'E2E8F0'},
                             left={'val': 'single', 'sz': '4', 'color': 'E2E8F0'},
                             right={'val': 'single', 'sz': '4', 'color': 'E2E8F0'})
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            run = p.add_run(str(val))
            run.font.name = 'Calibri'
            run.font.size = Pt(8.5)
            run.font.color.rgb = RGBColor(30, 41, 59)
            
    doc.add_paragraph().paragraph_format.space_after = Pt(4)
    return tbl

def build_proposal_document():
    doc = docx.Document()
    
    # 1. Page Setup & Margins
    for s in doc.sections:
        s.top_margin = Inches(0.75)
        s.bottom_margin = Inches(0.75)
        s.left_margin = Inches(0.75)
        s.right_margin = Inches(0.75)
        
        # Header & Footer
        header = s.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hr = hp.add_run("TOURSURV TRAVEL PLATFORM | TECHNICAL & ARCHITECTURAL PROPOSAL")
        hr.font.name = "Calibri"
        hr.font.size = Pt(8.5)
        hr.font.color.rgb = RGBColor(148, 163, 184)
        
        footer = s.footer
        fp = footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        fr = fp.add_run("CONFIDENTIAL | FOR INTERNAL USE & MANAGEMENT APPROVAL ONLY | PAGE ")
        fr.font.name = "Calibri"
        fr.font.size = Pt(8.5)
        fr.font.color.rgb = RGBColor(148, 163, 184)

    # ---------------------------------------------------------------------------
    # COVER / TITLE BLOCK
    # ---------------------------------------------------------------------------
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(20)
    title_p.paragraph_format.space_after = Pt(4)
    r_sub_top = title_p.add_run("ENTERPRISE SOLUTION PROPOSAL & OPERATIONAL ARCHITECTURE\n")
    r_sub_top.font.name = 'Calibri'
    r_sub_top.font.size = Pt(11)
    r_sub_top.bold = True
    r_sub_top.font.color.rgb = RGBColor(13, 148, 136) # Teal
    
    r_title = title_p.add_run("Dynamic Rate Management, Automated Costing, Multi-Tier Attraction Pricing & Web Scraping Engine")
    r_title.font.name = 'Calibri'
    r_title.font.size = Pt(22)
    r_title.bold = True
    r_title.font.color.rgb = RGBColor(15, 41, 66) # Navy
    
    subtitle_p = doc.add_paragraph()
    subtitle_p.paragraph_format.space_after = Pt(16)
    r_sub = subtitle_p.add_run("A High-Level Operational Proposal: How the System Eliminates Manual Data Entry, Automates Rates by Season & Nationality, Protects Forex Margins, and Ingests Public Tariffs via Web Scraping")
    r_sub.font.name = 'Calibri'
    r_sub.font.size = Pt(11.5)
    r_sub.font.italic = True
    r_sub.font.color.rgb = RGBColor(71, 85, 105)

    # Metadata Block Table
    meta_headers = ["Project Attribute", "Specification Details"]
    meta_rows = [
        ["Document Title", "Enterprise Technical Proposal: Dynamic Rate Management & Cost Automation Engine"],
        ["Target System", "Toursurv Multi-Tenant Travel Management Platform (Next.js 14 / MongoDB / Python ETL)"],
        ["Prepared For", "Executive Management & Operations Leadership"],
        ["Prepared By", "Senior System Architect & Technical Implementation Lead"],
        ["Version & Status", "Version 3.0.0 — Executive Operational Architecture (Concept-Focused)"],
        ["Target Rollout", "Q4 2026 / 10-Week Phased Delivery"],
    ]
    create_styled_table(doc, meta_headers, meta_rows, [Inches(2.2), Inches(4.6)])

    add_callout_box(doc, "EXECUTIVE CONCEPT & OPERATIONAL HIGHLIGHTS", [
        "1. Complete Elimination of Manual Data Entry: The system stores foundational supplier rates (hotels, drivers, tour guides, and vehicle packages) directly in a secure master database.",
        "2. Automated Rate Variations: Rates automatically adjust depending on travel dates (seasonal demand) and tourist nationality (market origin tiers).",
        "3. High-Precision Currency Conversion: The system applies exact real-time or pegged foreign exchange rates with an automated safety buffer to protect profit margins against currency swings.",
        "4. Smart Fleet Dispatch Costing: The moment a vehicle and driver are assigned to a tour, the system automatically pulls their package rates and route distance to compute total transport costs with zero manual typing.",
        "5. Multi-Tiered Attraction Tickets & Dynamic 'Other' Entry: Standard sites apply lower rates for SAARC/Thailand visitors and standard rates for other foreign travelers; unexpected or new sites can be added instantly on-the-fly.",
        "6. Automated Web Scraping Pipeline: Public tariffs (monument tickets, wildlife park fees, live bank exchange rates) are automatically gathered and kept up to date using the platform's existing web scraping engine."
    ], box_type="summary")

    # ---------------------------------------------------------------------------
    # SECTION 1: EXECUTIVE SUMMARY & PROBLEM ANALYSIS
    # ---------------------------------------------------------------------------
    add_styled_heading(doc, "1. Executive Summary & Business Case", level=1)
    
    add_styled_paragraph(doc, 
        "The tourism industry operates within a fast-moving commercial environment where supplier prices change by season, foreign exchange rates fluctuate constantly, and tourists from different parts of the world receive different pricing agreements. Currently, operations staff and travel consultants spend substantial time manually looking up hotel contracts, negotiating vehicle fees over the phone, and typing in attraction ticket prices by hand. This proposal introduces an automated, centralized engine that manages these rates systematically, eliminates human calculation errors, and dramatically speeds up customer quotation generation.",
        bold_prefix="Business Background: ")

    add_styled_heading(doc, "1.1 The Problems Solved by This Initiative", level=2)
    add_bullet_item(doc, "Eliminating Costly Human Errors", "When staff manually look up paper contract sheets and type numbers into quotes, errors inevitably happen—such as forgetting seasonal price jumps or applying the wrong ticket tier. Storing master rates in the system guarantees that quotes are always accurate and profitable.")
    add_bullet_item(doc, "Preventing Foreign Exchange Losses", "Tours are sold to foreign guests in US Dollars ($), but local expenses (hotels, drivers, entry tickets) are paid in Sri Lankan Rupees (LKR). If the currency exchange rate changes or static approximations are used, the company loses margin. The system solves this by using exact live conversion rates with a built-in safety cushion.")
    add_bullet_item(doc, "Removing Dispatch Bottlenecks", "Assigning transport currently requires an employee to sit down and manually compute mileage allowances and driver wages. The new system performs this instantly the second a vehicle is allocated.")
    add_bullet_item(doc, "Enforcing Official Attraction Rules", "Government sites like Sigiriya and the Temple of the Tooth charge different prices based on traveler passport origin (such as special discounts for SAARC countries and Thailand). The system detects nationality and applies the correct official fee automatically.")
    add_bullet_item(doc, "Seamless Handling of Custom Sites", "When guests request unusual or unlisted excursion stops, staff previously had to make manual accounting workarounds. The new 'Other' option allows instant ad-hoc price entry that flows naturally into the booking.")

    add_styled_heading(doc, "1.2 Operational Improvements & Business Impact", level=2)
    roi_headers = ["Operational Area", "Current Manual Approach", "Target Automated Solution", "Key Business Advantage"]
    roi_rows = [
        ["Quotation Preparation", "Manual lookups taking 2 to 4 hours", "Instant generation in under 5 minutes", "95% faster response time to client inquiries"],
        ["Pricing Accuracy", "Prone to typos and forgotten surcharges", "Fully automated from approved master data", "Zero pricing errors and guaranteed profit margins"],
        ["Foreign Currency (Forex)", "Static rate approximations", "Exact bank multipliers + margin safety buffer", "Protects bottom-line profits from currency drops"],
        ["Vehicle Fleet Costing", "Manual mileage and wage calculations", "Instant auto-cost upon vehicle assignment", "Completely eliminates manual dispatch typing"],
        ["Attraction Management", "Staff must memorize complex nationality rules", "Automatic passport-to-tariff matching", "100% compliance with official cultural site rules"],
        ["Rate Maintenance", "Manual typing of dozens of spreadsheets", "Web scrapers + easy back-office console", "Massive reduction in administrative workload"]
    ]
    create_styled_table(doc, roi_headers, roi_rows, [Inches(1.6), Inches(1.8), Inches(1.8), Inches(1.6)])

    # ---------------------------------------------------------------------------
    # SECTION 2: SYSTEM MODULES & HOW THEY WORK
    # ---------------------------------------------------------------------------
    add_styled_heading(doc, "2. Core System Modules & How They Work", level=1)
    add_styled_paragraph(doc, "The solution is built around five core functional pillars designed to make pricing and cost management seamless, transparent, and completely automated.")

    # Pillar 1
    add_styled_heading(doc, "2.1 Module 1: Dynamic Rate & Seasonality Management", level=2)
    add_styled_paragraph(doc, 
        "How it works: Rates are not static; they change based on calendar dates and who the customer is. The system manages this foundational data through an intuitive management interface.",
        bold_prefix="Operational Concept: ")
    
    add_bullet_item(doc, "Seasonal Date Matching", "Managers define date periods once (such as Peak Season for winter travel, High Season, or special event dates like the Kandy Perahera). When a quote is created, the system checks the tour dates and automatically selects the correct seasonal rate.")
    add_bullet_item(doc, "Country & Market Tiers", "The system recognizes where guests are coming from (e.g., Domestic, SAARC & Regional Bilateral partners like Thailand, Western Europe, or North America) and automatically applies the specific rates negotiated for that market.")
    add_bullet_item(doc, "Easy Rate Maintenance Console", "An intuitive management screen (`/admin/rates`) allows authorized managers to review and update rates in seconds, apply bulk adjustments (such as increasing summer hotel rates by 5% across the board), or import fresh rate sheets via Excel/CSV.")
    add_bullet_item(doc, "Locked Historical Records", "Once a quotation or invoice is sent to a client, its rates are permanently locked to that booking so future master rate updates will never unintentionally alter an existing agreement.")

    # Pillar 2
    add_styled_heading(doc, "2.2 Module 2: Live Currency & Foreign Exchange Engine", level=2)
    add_styled_paragraph(doc, 
        "How it works: Foreign tourist payments are priced in dollars or euros, while local costs are in rupees. The system ensures every conversion is exact and protects the company against currency drops.",
        bold_prefix="Operational Concept: ")
    
    add_bullet_item(doc, "Exact Currency Multiplier", "Instead of rounding or guessing, the system uses the precise exchange rate down to the cent, ensuring exact mathematical accuracy between foreign income and local costs.")
    add_bullet_item(doc, "Automatic or Pegged Rate Options", "The company can choose between two modes: automatic daily synchronization with official bank exchange rates, or setting a steady 'company pegged rate' that management controls directly.")
    add_bullet_item(doc, "Forex Volatility Cushion", "To protect profit margins from sudden currency devaluations between the day a quote is issued and the day the tour concludes, the system applies a configurable safety margin buffer.")
    add_bullet_item(doc, "Transparent Dual-Currency Views", "Consultants and clients can see quotations clearly in US Dollars with an itemized breakdown of local rupee costs, ensuring complete trust and clarity.")

    # Pillar 3
    add_styled_heading(doc, "2.3 Module 3: Automated Base Cost Data & Fleet Dispatch Engine", level=2)
    add_styled_paragraph(doc, 
        "How it works: All vendor agreements are pre-stored in the system. The moment operational resources are allocated to a tour, the system automatically pulls their pricing and updates the booking ledger.",
        bold_prefix="Operational Concept: ")

    cost_data_headers = ["Master Cost Category", "What the System Stores", "How the System Handles It Automatically"]
    cost_data_rows = [
        ["Hotel Rates", "Contracted net rates per hotel, room category, meal plan (BB, HB, FB), and season.", "System matches the hotel, room type, and travel season, applying the exact negotiated rate for the total nights."],
        ["Tour Guides", "License categories, language proficiencies (e.g., German, French, Mandarin), and daily allowances.", "System identifies tour duration, adds language specialities, and incorporates daily guide fees automatically."],
        ["Drivers & Chauffeurs", "Employment types, daily base wages, and outstation overnight lodging allowances (bata).", "System multiplies the tour's working days by the driver's daily rate and outstation lodging fees."],
        ["Vehicle Fleet Packages", "Vehicle categories (Sedan, Van, Mini Coach, SUV), daily packages (with included km), and excess per-km rates.", "System checks the tour days and route distance; if the journey exceeds the package mileage, it adds the excess distance automatically."]
    ]
    create_styled_table(doc, cost_data_headers, cost_data_rows, [Inches(1.8), Inches(2.7), Inches(2.3)])

    add_callout_box(doc, "INSTANT FLEET DISPATCH TRIGGER", [
        "In the existing platform, assigning a vehicle or driver only recorded their contact details.",
        "Under the new system: The exact moment an Operations Dispatcher selects a vehicle (e.g., a 14-seater Luxury Van) and assigns a driver, the system immediately pulls that vehicle's package terms and the driver's daily allowance, references the planned itinerary distance, and updates the tour's financial ledger automatically—without the dispatcher typing a single number."
    ], box_type="info")

    # Pillar 4
    add_styled_heading(doc, "2.4 Module 4: Tiered Attraction Pricing & Dynamic 'Other' Location Handler", level=2)
    add_styled_paragraph(doc, 
        "How it works: The system maintains an official attraction catalog that applies the right ticket price based on who is visiting, while providing complete flexibility for unexpected or custom excursions.",
        bold_prefix="Operational Concept: ")

    add_bullet_item(doc, "Pre-Loaded Attraction Database", "The system comes equipped with verified ticket rates for key cultural monuments, ancient cities, and wildlife parks across Sri Lanka (such as Sigiriya Rock Fortress, the Temple of the Tooth in Kandy, Dambulla Cave Temple, and Yala Safari).")
    add_bullet_item(doc, "Automatic Nationality-Tier Matching", "When visitors from SAARC countries or Thailand travel, the system automatically assigns their official bilateral discounted rate (~LKR 2,000 equivalent). For visitors from other foreign countries, it automatically applies the standard international rate (~LKR 3,000 equivalent). Local visitors receive domestic tariffs.")
    add_bullet_item(doc, "The Instant 'Other' Attraction Feature", "If a guest requests an unexpected excursion, a private boat safari, or a newly discovered site that isn't in the database:\n1. The consultant clicks '+ Add Other Attraction'.\n2. Types the location name and inputs the price on the spot.\n3. The system immediately captures this price, multiplies it by the number of travelers, and includes it in the total tour calculation without delay.\n4. An optional switch allows staff to save the new site into the master database for future tours.")

    # Pillar 5
    add_styled_heading(doc, "2.5 Module 5: Automated Web Scraping & Data Ingestion (The Hybrid Approach)", level=2)
    add_styled_paragraph(doc, 
        "How it works: To eliminate the tedious work of manually searching for and typing in public prices, the system uses automated web scraping to pull verified public tariffs directly into the platform.",
        bold_prefix="Operational Concept: ")

    scraping_headers = ["Information Source", "Where the Data Comes From", "What the Scraper Does", "How the System Uses It"]
    scraping_rows = [
        ["Monument & Cultural Sites", "Central Cultural Fund (CCF) portals & Temple of the Tooth official site", "Periodically extracts official ticket rates for Local, SAARC, and Foreign tiers.", "Keeps attraction database up to date without manual research."],
        ["Wildlife Parks & Safaris", "Department of Wildlife Conservation (DWC) official portal", "Pulls official entry fees, vehicle service charges, and conservation fees.", "Ensures safari tour costs in Yala and Wilpattu are always accurate."],
        ["Live Currency Rates", "Central Bank of Sri Lanka (CBSL) & commercial banking rate boards", "Extracts official daily buying and selling rates for USD, EUR, and GBP.", "Supplies the live currency engine with exact daily exchange values."],
        ["Retail Hotel Benchmarks", "Major online booking platforms (Booking.com, Agoda via existing ETL)", "Gathers average retail nightly room rates.", "Provides a market price ceiling so the agency can ensure quotes are competitive."],
        ["Fuel Tariff Revisions", "Ceylon Petroleum Corporation (CPC / Ceypetco) announcements", "Monitors national diesel and petrol price adjustments.", "Alerts managers when vehicle per-kilometer rates should be reviewed."]
    ]
    create_styled_table(doc, scraping_headers, scraping_rows, [Inches(1.6), Inches(2.2), Inches(1.7), Inches(1.3)])

    add_callout_box(doc, "THE HYBRID ADVANTAGE: PUBLIC SCRAPING + PRIVATE CONTRACTS", [
        "Public Web Scraping handles public information: Monument entry tickets, national park permits, bank exchange rates, and public hotel price ceilings.",
        "Master B2B Data handles private information: Confidential hotel contract rates (negotiated 20% to 40% below public rates), driver outstation allowances, and internal vehicle fleet agreements.",
        "Smart Priority Flow: The system always prioritizes your private contracted rate first; if an uncontracted hotel is selected, it seamlessly uses the real scraped rate as an intelligent fallback."
    ], box_type="note")

    # ---------------------------------------------------------------------------
    # SECTION 3: USER JOURNEY MAPS
    # ---------------------------------------------------------------------------
    add_styled_heading(doc, "3. Step-by-Step User Journey Maps", level=1)
    add_styled_paragraph(doc, "Here is how the daily workflow operates across four key roles in the company:")

    add_styled_heading(doc, "3.1 Journey 1: The Rate Manager / Administrator (Master Configuration)", level=2)
    add_bullet_item(doc, "Step 1: Checking Ingested Public Rates", "The manager opens the Rate Management Console (`/admin/rates`). If the web scraper detected a tariff revision on the Central Cultural Fund website, a notification appears: '3 Site Tariffs Updated by Web Scraper — Click to Review'. The manager verifies the change and approves it with one click.")
    add_bullet_item(doc, "Step 2: Setting Seasonal Brackets", "The manager reviews upcoming travel seasons (e.g., setting the Winter Peak period from mid-December to mid-January) and confirms market classifications (ensuring Thailand and SAARC countries are linked to the bilateral discount tier).")
    add_bullet_item(doc, "Step 3: Uploading Private Contracts", "The manager uploads confidential hotel contract rates and vehicle package tariffs for the upcoming season using a simple Excel/CSV upload.")
    add_bullet_item(doc, "Step 4: Confirming Exchange Rates", "The manager checks the live currency rate pulled from the Central Bank, confirms the safety buffer, and publishes the active rates.")

    add_styled_heading(doc, "3.2 Journey 2: The Travel Consultant (Creating Quotes & Custom Tours)", level=2)
    add_bullet_item(doc, "Step 1: Setting Up the Itinerary", "The consultant opens the Tour Customizer (`/pricing-calculator`), enters traveler details (e.g., 4 adults traveling in November), and selects their nationality ('Thailand').")
    add_bullet_item(doc, "Step 2: Adding Attractions Automatically", "The consultant selects Sigiriya and the Temple of the Tooth. Because the system knows the travelers are from Thailand, it automatically selects the bilateral concession rate instead of the standard foreign rate, immediately reflecting the correct total for all travelers.")
    add_bullet_item(doc, "Step 3: Adding an Unlisted Site on the Fly", "The client requests a visit to an unlisted private herbal garden. The consultant clicks '+ Add Other Attraction', types 'Ranweli Herbal Garden', enters the spot ticket price, and the system instantly incorporates it into the running total.")
    add_bullet_item(doc, "Step 4: Instant Dollar Conversion", "The system converts all rupee expenses into US Dollars using the exact live exchange rate and margin buffer, presenting a finalized quotation ready to send to the client.")

    add_styled_heading(doc, "3.3 Journey 3: The Fleet Dispatcher (Zero-Typing Vehicle Assignment)", level=2)
    add_bullet_item(doc, "Step 1: Reviewing Confirmed Bookings", "The dispatcher opens the Tour Allocation screen (`/admin/allocations`) to assign vehicles and crew to upcoming confirmed tours.")
    add_bullet_item(doc, "Step 2: Selecting Vehicle & Driver", "The dispatcher selects an available vehicle (e.g., a Luxury Van) and assigns an approved driver.")
    add_bullet_item(doc, "Step 3: Instant Automated Costing", "The system takes over: it references the tour's total duration and planned route distance, checks the vehicle's pre-configured daily package allowance, adds any excess distance fees, includes the driver's daily outstation lodging fee, and immediately enters the total cost onto the tour ledger.")
    add_bullet_item(doc, "Step 4: Dispatch Confirmation", "The dispatcher clicks 'Confirm Allocation'. Crew dispatch notifications are sent, and the financial invoice is updated automatically without the dispatcher typing a single number.")

    add_styled_heading(doc, "3.4 Journey 4: The Finance Officer (Invoicing & Margin Protection)", level=2)
    add_bullet_item(doc, "Step 1: Proforma Verification", "The finance officer reviews the auto-populated Proforma Invoice, confirming that contracted rates, exact currency multipliers, and margin buffers are cleanly applied.")
    add_bullet_item(doc, "Step 2: Final Settlement", "When the tour concludes, the system compares actual journey mileage against the pre-stored package baseline, generating the Final Actual Invoice with complete financial accuracy.")

    # ---------------------------------------------------------------------------
    # SECTION 4: HOW THE SYSTEM OPERATES CONCEPTUALLY
    # ---------------------------------------------------------------------------
    add_styled_heading(doc, "4. Conceptual Architecture: How It Works Behind the Scenes", level=1)
    add_styled_paragraph(doc, "Rather than relying on manual human calculations, the platform operates through four coordinated automated workflows:")

    add_styled_heading(doc, "4.1 The Attraction & Nationality Pricing Flow", level=2)
    add_styled_paragraph(doc, 
        "1. Guest Passport Check: The system reads the tourist's declared nationality.\n"
        "2. Tier Resolution: If the guest is from Sri Lanka, it selects local tariffs. If from a SAARC member nation or Thailand, it selects the official bilateral concession tier. For all other international travelers, it selects the standard foreign tourist tariff.\n"
        "3. Traveler Count Application: The resolved unit price is multiplied across the traveler party.\n"
        "4. Custom 'Other' Insertion: When an unlisted location is added, the user-entered price is captured directly, marked as an ad-hoc line item, and merged seamlessly into the total cost summary.",
        bold_prefix="Operational Flow: ")

    add_styled_heading(doc, "4.2 The Fleet & Crew Auto-Costing Flow", level=2)
    add_styled_paragraph(doc, 
        "1. Resource Allocation Event: The dispatcher assigns a vehicle and driver to a tour booking.\n"
        "2. Itinerary Data Retrieval: The system reads the number of tour days and estimated route distance.\n"
        "3. Package Allowance Verification: The system checks the vehicle's daily included kilometer allowance against total journey distance to determine if excess mileage applies.\n"
        "4. Cost Assembly: The system combines the vehicle daily package fee, any excess distance charge, and the driver's daily outstation wage into a unified fleet cost.\n"
        "5. Automated Ledger Injection: The calculated total is immediately written into the tour's financial records without manual entry.",
        bold_prefix="Operational Flow: ")

    add_styled_heading(doc, "4.3 The Currency Conversion & Margin Protection Flow", level=2)
    add_styled_paragraph(doc, 
        "1. Exchange Rate Sourcing: The system references the latest validated bank exchange rate (or administrative pegged rate).\n"
        "2. Safety Margin Application: A protective volatility buffer is factored into the conversion rate to insulate the company from sudden currency devaluations.\n"
        "3. Exact Multiplier Conversion: Local operational expenses (in LKR) are divided by this protected rate to determine the exact foreign selling price (in USD).\n"
        "4. Dual Ledger Maintenance: Both the local buying costs and the foreign selling amounts are preserved side-by-side for transparent accounting.",
        bold_prefix="Operational Flow: ")

    add_styled_heading(doc, "4.4 The Web Scraping & Ingestion Flow", level=2)
    add_styled_paragraph(doc, 
        "1. Scheduled Web Monitoring: The platform's scraping engine periodically checks official government tourist websites and central bank exchange boards.\n"
        "2. Change Detection: If a ticket tariff or exchange rate has changed, the system flags the update.\n"
        "3. Manager Review Queue: Managers are presented with clear comparison cards showing old vs. new rates.\n"
        "4. Instant Propagation: Once approved, the updated rates immediately apply to all new quotations across the entire platform.",
        bold_prefix="Operational Flow: ")

    # ---------------------------------------------------------------------------
    # SECTION 5: IMPLEMENTATION ROADMAP
    # ---------------------------------------------------------------------------
    add_styled_heading(doc, "5. Implementation Plan & Delivery Roadmap", level=1)
    add_styled_paragraph(doc, "A structured, 5-phase delivery roadmap executed over a 10-week cycle to guarantee smooth operational adoption and thorough testing:")

    plan_headers = ["Phase & Strategic Focus", "Timeline", "Key Deliverables", "Target Milestone"]
    plan_rows = [
        ["Phase 1: Architecture & Scraper Setup", "Weeks 1 - 2", "• Create centralized database structures for seasonal rates, currencies, hotel contracts, vehicle packages, and attractions.\n• Connect the existing 'srilanka-travel-etl' scraper to auto-pull monument tariffs and bank exchange rates.\n• Pre-seed the system with official Sri Lankan attraction rates.", "Milestone 1: Database ready and initial public rates auto-scraped."],
        ["Phase 2: Master Rate Management UI", "Weeks 3 - 4", "• Build the easy-to-use Back-Office Rate Center (`/admin/rates`).\n• Create intuitive management tables for Hotels, Vehicles, Drivers, and Attractions.\n• Build the Scraper Approval Queue for quick rate reviews.\n• Implement Excel/CSV bulk import/export for vendor rate sheets.", "Milestone 2: Operations team actively managing base rates."],
        ["Phase 3: Automated Pricing Engine", "Weeks 5 - 6", "• Implement the dynamic calculation engine for nationality-based attraction pricing.\n• Implement automated vehicle package and excess mileage costing.\n• Integrate the live currency multiplier and safety buffer.", "Milestone 3: Engine tested and verified against historical quotes."],
        ["Phase 4: Dispatch & 'Other' Flow", "Weeks 7 - 8", "• Connect vehicle assignment in `/admin/allocations` directly to the automated cost ledger.\n• Add the '+ Add Other Attraction' instant pricing feature to the tour customizer.\n• Connect automated fleet costs directly to Proforma invoice generation.", "Milestone 4: Full quote-to-dispatch workflow operational."],
        ["Phase 5: User Training & Go-Live", "Weeks 9 - 10", "• User Acceptance Testing (UAT) with tour consultants, dispatchers, and finance staff.\n• Conduct hands-on staff training workshops.\n• Deploy to production and sunset manual quotation spreadsheets.", "Milestone 5: 100% Production launch across all departments."]
    ]
    create_styled_table(doc, plan_headers, plan_rows, [Inches(1.7), Inches(0.9), Inches(2.9), Inches(1.7)])

    # Risk Management Table
    add_styled_heading(doc, "5.1 Risk Assessment & Practical Mitigations", level=2)
    risk_headers = ["Potential Challenge", "Impact", "Practical Solution"]
    risk_rows = [
        ["External Website Layout Changes", "Medium", "The scraper runs as a background assistant; if a public website changes layout, the system safely keeps using existing verified rates and alerts technical staff."],
        ["Sudden Currency Devaluations", "High", "The built-in Forex Volatility Buffer automatically protects company margins, while daily bank rate sync ensures quotes reflect current economic conditions."],
        ["Unexpected Itinerary Detours", "Medium", "The instant 'Other' attraction tool ensures consultants and dispatchers can enter any unlisted excursion fee on-the-spot without delay."],
        ["Staff Transition to the New System", "Low", "The management console is designed with familiar spreadsheet-like views and supports Excel upload, ensuring a smooth and easy learning curve."]
    ]
    create_styled_table(doc, risk_headers, risk_rows, [Inches(1.9), Inches(0.9), Inches(4.0)])

    # ---------------------------------------------------------------------------
    # SECTION 6: CONCLUSION & SIGN-OFF REQUEST
    # ---------------------------------------------------------------------------
    add_styled_heading(doc, "6. Recommendations & Next Steps", level=1)
    add_styled_paragraph(doc, 
        "This proposed solution addresses every core directive provided by leadership. By replacing slow, error-prone manual lookups with automated base data, dynamic seasonal and nationality-based rules, exact currency multipliers, and automated web scraping, Toursurv will protect profit margins, cut quote creation time by 95%, and provide staff with an effortless modern tool.",
        bold_prefix="Executive Conclusion: ")
    
    add_styled_paragraph(doc, 
        "Upon executive approval, Phase 1 execution will commence immediately, with the first operational preview of the Rate Management Console delivered by the end of Week 4.",
        bold_prefix="Immediate Action: ")

    # Signature Block Table
    sig_headers = ["Stakeholder Role", "Printed Name", "Signature", "Date"]
    sig_rows = [
        ["Managing Director / Executive Sponsor", "________________________", "________________________", "____ / ____ / 2026"],
        ["Head of Tour Operations", "________________________", "________________________", "____ / ____ / 2026"],
        ["Chief Financial Officer", "________________________", "________________________", "____ / ____ / 2026"],
        ["Lead Solutions Architect", "________________________", "________________________", "____ / ____ / 2026"]
    ]
    create_styled_table(doc, sig_headers, sig_rows, [Inches(2.2), Inches(1.8), Inches(1.8), Inches(1.2)])

    # Save document
    output_path = os.path.join("docs", "proposals", "Dynamic_Rate_Management_and_Automated_Costing_Proposal.docx")
    doc.save(output_path)
    print(f"Successfully generated streamlined conceptual proposal document at: {output_path}")

if __name__ == "__main__":
    build_proposal_document()
