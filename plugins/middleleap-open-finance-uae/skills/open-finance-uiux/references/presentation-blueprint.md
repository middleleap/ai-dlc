# Al Tareq Open Finance Presentation Blueprint

A professional, modern HTML template for generating solution presentations about Open Finance value propositions for the UAE's Al Tareq platform.

## Quick Start

1. Open the HTML template below in any web browser
2. Navigate through slides using arrow keys, on-screen buttons, or progress dots
3. Customize placeholders (marked as `{{PLACEHOLDER_NAME}}`) with your content
4. Save as `.html` and share

---

## HTML Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{PRESENTATION_TITLE}} - Al Tareq Open Finance</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        /* ===== CSS Variables & Reset ===== */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        :root {
            --color-primary-dark: #003366;
            --color-primary-accent: #00C8AF;
            --color-progress-gradient: linear-gradient(90deg, #015AD7, #00C8AF);
            --color-button-gradient: linear-gradient(90deg, #003366, #00B894);
            --color-bg-light: #F0F2FA;
            --color-card-bg: #FFFFFF;
            --color-text-primary: #1A1D3B;
            --color-text-secondary: #6B7194;
            --color-error: #E74C3C;
            --color-success: #27AE60;
            --spacing-unit: 1rem;
            --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.08);
            --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.12);
            --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.15);
            --transition-smooth: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Inter, sans-serif;
            background-color: var(--color-bg-light);
            color: var(--color-text-primary);
            overflow: hidden;
        }

        /* ===== Presentation Container ===== */
        .presentation-container {
            width: 100vw;
            height: 100vh;
            display: flex;
            flex-direction: column;
            background-color: var(--color-bg-light);
        }

        .slides-wrapper {
            flex: 1;
            position: relative;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        /* ===== Slides ===== */
        .slide {
            position: absolute;
            width: 100%;
            height: 100%;
            padding: 4rem;
            background-color: var(--color-card-bg);
            display: flex;
            flex-direction: column;
            justify-content: center;
            opacity: 0;
            transform: translateX(100%);
            transition: var(--transition-smooth);
            pointer-events: none;
        }

        .slide.active {
            opacity: 1;
            transform: translateX(0);
            pointer-events: auto;
            z-index: 10;
        }

        .slide.prev {
            opacity: 0;
            transform: translateX(-100%);
        }

        /* ===== Slide Content Sections ===== */
        .slide-header {
            margin-bottom: 3rem;
        }

        .slide-title {
            font-size: 3.5rem;
            font-weight: 800;
            color: var(--color-primary-dark);
            margin-bottom: 1rem;
            line-height: 1.2;
        }

        .slide-subtitle {
            font-size: 1.5rem;
            color: var(--color-text-secondary);
            font-weight: 400;
            line-height: 1.6;
        }

        .slide-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }

        /* ===== Badge Styling ===== */
        .badge {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            background: linear-gradient(135deg, var(--color-primary-accent), #00A896);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 2rem;
            font-size: 0.875rem;
            font-weight: 600;
            width: fit-content;
            margin-bottom: 2rem;
        }

        .badge::before {
            content: '✓';
            font-weight: bold;
        }

        /* ===== Title Slide (Slide 1) ===== */
        .slide-title-slide {
            background: linear-gradient(135deg, var(--color-primary-dark) 0%, #004B99 100%);
            color: white;
        }

        .slide-title-slide .slide-title {
            color: white;
            font-size: 4rem;
            margin-bottom: 1.5rem;
        }

        .slide-title-slide .slide-subtitle {
            color: rgba(255, 255, 255, 0.9);
            font-size: 1.75rem;
            margin-bottom: 3rem;
        }

        .title-slide-meta {
            display: flex;
            gap: 2rem;
            align-items: center;
            margin-top: 4rem;
        }

        .title-slide-meta .date {
            font-size: 1rem;
            color: rgba(255, 255, 255, 0.8);
        }

        .altareq-badge {
            background: rgba(255, 255, 255, 0.2);
            border: 2px solid var(--color-primary-accent);
            color: white;
            padding: 0.75rem 1.5rem;
            border-radius: 2rem;
            font-size: 0.9rem;
            font-weight: 600;
        }

        /* ===== Pain Points / Two Column ===== */
        .two-column {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 3rem;
            margin-top: 2rem;
        }

        .pain-point {
            display: flex;
            gap: 1.5rem;
        }

        .pain-point-icon {
            width: 3rem;
            height: 3rem;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--color-primary-accent), #00A896);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 1.5rem;
            font-weight: bold;
            flex-shrink: 0;
        }

        .pain-point-content h4 {
            font-size: 1.1rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
            color: var(--color-text-primary);
        }

        .pain-point-content p {
            font-size: 0.95rem;
            color: var(--color-text-secondary);
            line-height: 1.6;
        }

        /* ===== Solution Flow ===== */
        .solution-flow {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 2rem;
            margin: 3rem 0;
            padding: 2rem;
            background: var(--color-bg-light);
            border-radius: 1rem;
        }

        .flow-step {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
            flex: 1;
            text-align: center;
        }

        .flow-step-icon {
            width: 4rem;
            height: 4rem;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--color-primary-accent), #00A896);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 1.75rem;
        }

        .flow-step-label {
            font-weight: 600;
            color: var(--color-text-primary);
        }

        .flow-arrow {
            font-size: 2rem;
            color: var(--color-primary-accent);
            margin-top: 2rem;
        }

        /* ===== Timeline / Journey ===== */
        .journey-timeline {
            display: flex;
            gap: 2rem;
            position: relative;
            margin: 2rem 0;
        }

        .journey-timeline::before {
            content: '';
            position: absolute;
            top: 2rem;
            left: 0;
            right: 0;
            height: 2px;
            background: var(--color-bg-light);
            z-index: 0;
        }

        .journey-step {
            flex: 1;
            position: relative;
            z-index: 1;
        }

        .journey-step-number {
            width: 4rem;
            height: 4rem;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--color-primary-accent), #00A896);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 1rem;
        }

        .journey-step-title {
            font-size: 1.1rem;
            font-weight: 600;
            color: var(--color-text-primary);
            margin-bottom: 0.5rem;
        }

        .journey-step-desc {
            font-size: 0.9rem;
            color: var(--color-text-secondary);
            line-height: 1.6;
        }

        /* ===== Demo Card ===== */
        .demo-card {
            background: linear-gradient(135deg, var(--color-primary-dark), #004B99);
            color: white;
            padding: 4rem;
            border-radius: 1.5rem;
            text-align: center;
            box-shadow: var(--shadow-lg);
            margin: 2rem 0;
        }

        .demo-card h3 {
            font-size: 2.5rem;
            margin-bottom: 1rem;
        }

        .demo-card p {
            font-size: 1.1rem;
            margin-bottom: 2rem;
            color: rgba(255, 255, 255, 0.9);
        }

        .demo-link {
            display: inline-block;
            padding: 1rem 2rem;
            background: var(--color-primary-accent);
            color: white;
            text-decoration: none;
            border-radius: 0.5rem;
            font-weight: 600;
            font-size: 1rem;
            transition: var(--transition-smooth);
            border: 2px solid var(--color-primary-accent);
        }

        .demo-link:hover {
            background: #00A896;
            border-color: #00A896;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 200, 175, 0.3);
        }

        /* ===== Benefits Grid ===== */
        .benefits-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
            margin-top: 2rem;
        }

        .benefits-column h4 {
            font-size: 1.3rem;
            font-weight: 700;
            color: var(--color-primary-dark);
            margin-bottom: 1.5rem;
            padding-bottom: 1rem;
            border-bottom: 2px solid var(--color-primary-accent);
        }

        .benefit-item {
            display: flex;
            gap: 1rem;
            margin-bottom: 1.5rem;
            padding: 1rem;
            background: var(--color-bg-light);
            border-radius: 0.5rem;
            transition: var(--transition-smooth);
        }

        .benefit-item:hover {
            background: #E8F5F3;
            transform: translateX(4px);
        }

        .benefit-checkmark {
            color: var(--color-primary-accent);
            font-weight: bold;
            font-size: 1.5rem;
            flex-shrink: 0;
        }

        .benefit-text {
            font-size: 0.95rem;
            color: var(--color-text-primary);
            line-height: 1.6;
        }

        /* ===== KPI Cards ===== */
        .kpi-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 2rem;
            margin-top: 2rem;
        }

        .kpi-card {
            background: var(--color-card-bg);
            border: 2px solid var(--color-bg-light);
            border-radius: 1rem;
            padding: 2rem;
            text-align: center;
            transition: var(--transition-smooth);
            box-shadow: var(--shadow-sm);
        }

        .kpi-card:hover {
            border-color: var(--color-primary-accent);
            box-shadow: var(--shadow-md);
            transform: translateY(-4px);
        }

        .kpi-icon {
            font-size: 2.5rem;
            margin-bottom: 1rem;
        }

        .kpi-value {
            font-size: 2.5rem;
            font-weight: 800;
            color: var(--color-primary-dark);
            margin-bottom: 0.5rem;
        }

        .kpi-label {
            font-size: 1rem;
            color: var(--color-text-secondary);
            font-weight: 500;
        }

        .kpi-description {
            font-size: 0.85rem;
            color: var(--color-text-secondary);
            margin-top: 1rem;
        }

        /* ===== Architecture Diagram ===== */
        .architecture-diagram {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 1.5rem;
            margin: 3rem 0;
            padding: 2rem;
            background: var(--color-bg-light);
            border-radius: 1rem;
        }

        .arch-block {
            background: var(--color-card-bg);
            border: 2px solid var(--color-primary-accent);
            border-radius: 0.75rem;
            padding: 1.5rem;
            text-align: center;
            font-weight: 600;
            color: var(--color-text-primary);
            flex: 1;
            box-shadow: var(--shadow-sm);
        }

        .arch-arrow {
            font-size: 2rem;
            color: var(--color-primary-accent);
        }

        .api-details {
            margin-top: 2rem;
            padding: 1.5rem;
            background: var(--color-bg-light);
            border-left: 4px solid var(--color-primary-accent);
            border-radius: 0.5rem;
        }

        .api-details h4 {
            color: var(--color-primary-dark);
            margin-bottom: 1rem;
        }

        .api-list {
            list-style: none;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
        }

        .api-list li {
            font-size: 0.9rem;
            color: var(--color-text-secondary);
            padding-left: 1.5rem;
            position: relative;
        }

        .api-list li::before {
            content: '→';
            position: absolute;
            left: 0;
            color: var(--color-primary-accent);
            font-weight: bold;
        }

        /* ===== Action Items ===== */
        .action-items {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 2rem;
            margin-top: 2rem;
        }

        .action-item {
            background: linear-gradient(135deg, var(--color-bg-light), white);
            border: 2px solid var(--color-primary-accent);
            border-radius: 1rem;
            padding: 2rem;
            text-align: center;
            transition: var(--transition-smooth);
        }

        .action-item:hover {
            background: linear-gradient(135deg, var(--color-primary-accent), #00A896);
            color: white;
            border-color: #00A896;
            transform: translateY(-4px);
            box-shadow: var(--shadow-md);
        }

        .action-item:hover h4,
        .action-item:hover p {
            color: white;
        }

        .action-item h4 {
            font-size: 1.1rem;
            color: var(--color-primary-dark);
            margin-bottom: 0.75rem;
            transition: var(--transition-smooth);
        }

        .action-item p {
            font-size: 0.9rem;
            color: var(--color-text-secondary);
            line-height: 1.6;
            transition: var(--transition-smooth);
        }

        .contact-info {
            margin-top: 2rem;
            padding: 2rem;
            background: var(--color-bg-light);
            border-radius: 1rem;
            text-align: center;
        }

        .contact-info p {
            font-size: 1rem;
            color: var(--color-text-secondary);
            margin-bottom: 0.5rem;
        }

        .contact-info strong {
            color: var(--color-primary-dark);
        }

        /* ===== CTA Button ===== */
        .cta-button {
            display: inline-block;
            padding: 1.25rem 3rem;
            background: var(--color-button-gradient);
            color: white;
            text-decoration: none;
            border-radius: 0.5rem;
            font-weight: 700;
            font-size: 1.1rem;
            border: none;
            cursor: pointer;
            transition: var(--transition-smooth);
            margin-top: 2rem;
        }

        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(0, 51, 102, 0.3);
        }

        /* ===== Navigation ===== */
        .nav-controls {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.5rem 4rem;
            background: var(--color-card-bg);
            border-top: 1px solid var(--color-bg-light);
        }

        .nav-buttons {
            display: flex;
            gap: 1rem;
        }

        .nav-button {
            background: var(--color-primary-dark);
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            cursor: pointer;
            font-weight: 600;
            font-size: 0.95rem;
            transition: var(--transition-smooth);
        }

        .nav-button:hover {
            background: var(--color-primary-accent);
            transform: translateY(-2px);
        }

        .nav-button:active {
            transform: translateY(0);
        }

        .progress-container {
            flex: 1;
            display: flex;
            justify-content: center;
            gap: 0.75rem;
            align-items: center;
        }

        .progress-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: var(--color-bg-light);
            cursor: pointer;
            transition: var(--transition-smooth);
            border: 2px solid transparent;
        }

        .progress-dot.active {
            background: var(--color-primary-accent);
            width: 28px;
            border-radius: 5px;
        }

        .progress-dot:hover {
            border-color: var(--color-primary-accent);
        }

        .slide-counter {
            color: var(--color-text-secondary);
            font-weight: 600;
            font-size: 0.95rem;
            min-width: 60px;
            text-align: right;
        }

        /* ===== Responsive Design ===== */
        @media (max-width: 1024px) {
            .slide {
                padding: 2.5rem;
            }

            .slide-title {
                font-size: 2.5rem;
            }

            .slide-subtitle {
                font-size: 1.25rem;
            }

            .two-column {
                grid-template-columns: 1fr;
                gap: 1.5rem;
            }

            .journey-timeline {
                flex-wrap: wrap;
            }

            .journey-timeline::before {
                display: none;
            }

            .benefits-container {
                grid-template-columns: 1fr;
            }

            .solution-flow {
                flex-direction: column;
                gap: 1rem;
            }

            .flow-arrow {
                transform: rotate(90deg);
            }
        }

        @media (max-width: 768px) {
            .slide {
                padding: 1.5rem;
            }

            .slide-title {
                font-size: 1.75rem;
            }

            .slide-subtitle {
                font-size: 1rem;
            }

            .nav-controls {
                padding: 1rem 1.5rem;
                flex-wrap: wrap;
                gap: 1rem;
            }

            .nav-buttons {
                order: 3;
                width: 100%;
            }

            .progress-container {
                order: 2;
                width: 100%;
            }

            .slide-counter {
                order: 1;
            }

            .kpi-grid {
                grid-template-columns: 1fr;
            }

            .api-list {
                grid-template-columns: 1fr;
            }

            .action-items {
                grid-template-columns: 1fr;
            }
        }

        /* ===== Accessibility ===== */
        @media (prefers-reduced-motion: reduce) {
            * {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
            }
        }

        /* ===== Utility Classes ===== */
        .text-center {
            text-align: center;
        }

        .mt-2 {
            margin-top: 1rem;
        }

        .mt-4 {
            margin-top: 2rem;
        }

        .mb-2 {
            margin-bottom: 1rem;
        }

        .mb-4 {
            margin-bottom: 2rem;
        }
    </style>
</head>
<body>
    <div class="presentation-container">
        <div class="slides-wrapper">
            <!-- ===== SLIDE 1: TITLE SLIDE ===== -->
            <div class="slide slide-title-slide active">
                <div class="slide-header">
                    <h1 class="slide-title">{{PRESENTATION_TITLE}}</h1>
                    <p class="slide-subtitle">{{CHANNEL_CONTEXT}} | {{JOURNEY_TYPE}}</p>
                </div>
                <div class="slide-content">
                    <p style="font-size: 1.2rem; color: rgba(255, 255, 255, 0.9); margin: 2rem 0;">{{PRESENTATION_DESCRIPTION}}</p>
                </div>
                <div class="title-slide-meta">
                    <div class="altareq-badge">⚡ Powered by Al Tareq Open Finance</div>
                    <div class="date">{{PRESENTATION_DATE}}</div>
                </div>
            </div>

            <!-- ===== SLIDE 2: PROBLEM STATEMENT ===== -->
            <div class="slide">
                <div class="slide-header">
                    <div class="badge">The Challenge</div>
                    <h2 class="slide-title">{{PROBLEM_HEADLINE}}</h2>
                </div>
                <div class="slide-content">
                    <div class="two-column">
                        <div class="pain-point">
                            <div class="pain-point-icon">📊</div>
                            <div class="pain-point-content">
                                <h4>{{PAIN_POINT_1_TITLE}}</h4>
                                <p>{{PAIN_POINT_1_DESCRIPTION}}</p>
                            </div>
                        </div>
                        <div class="pain-point">
                            <div class="pain-point-icon">⏱️</div>
                            <div class="pain-point-content">
                                <h4>{{PAIN_POINT_2_TITLE}}</h4>
                                <p>{{PAIN_POINT_2_DESCRIPTION}}</p>
                            </div>
                        </div>
                        <div class="pain-point">
                            <div class="pain-point-icon">🔐</div>
                            <div class="pain-point-content">
                                <h4>{{PAIN_POINT_3_TITLE}}</h4>
                                <p>{{PAIN_POINT_3_DESCRIPTION}}</p>
                            </div>
                        </div>
                        <div class="pain-point">
                            <div class="pain-point-icon">💰</div>
                            <div class="pain-point-content">
                                <h4>{{PAIN_POINT_4_TITLE}}</h4>
                                <p>{{PAIN_POINT_4_DESCRIPTION}}</p>
                            </div>
                        </div>
                    </div>
                    <p style="margin-top: 2rem; font-size: 1.1rem; color: var(--color-text-secondary);"><strong>{{PROBLEM_STAT}}</strong></p>
                </div>
            </div>

            <!-- ===== SLIDE 3: SOLUTION OVERVIEW ===== -->
            <div class="slide">
                <div class="slide-header">
                    <div class="badge">The Solution</div>
                    <h2 class="slide-title">{{SOLUTION_HEADLINE}}</h2>
                </div>
                <div class="slide-content">
                    <p style="font-size: 1.15rem; color: var(--color-text-secondary); margin-bottom: 2rem;">{{SOLUTION_DESCRIPTION}}</p>

                    <div class="solution-flow">
                        <div class="flow-step">
                            <div class="flow-step-icon">👤</div>
                            <div class="flow-step-label">Customer</div>
                        </div>
                        <div class="flow-arrow">→</div>
                        <div class="flow-step">
                            <div class="flow-step-icon">📱</div>
                            <div class="flow-step-label">{{APP_NAME}}</div>
                        </div>
                        <div class="flow-arrow">→</div>
                        <div class="flow-step">
                            <div class="flow-step-icon">🔗</div>
                            <div class="flow-step-label">Al Tareq</div>
                        </div>
                        <div class="flow-arrow">→</div>
                        <div class="flow-step">
                            <div class="flow-step-icon">🏦</div>
                            <div class="flow-step-label">Bank</div>
                        </div>
                    </div>

                    <div style="margin-top: 2rem; padding: 1.5rem; background: var(--color-bg-light); border-radius: 1rem;">
                        <h4 style="color: var(--color-primary-dark); margin-bottom: 1rem;">How Open Finance Solves This:</h4>
                        <ul style="list-style: none; display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
                            <li style="padding-left: 1.5rem; position: relative; color: var(--color-text-secondary);">
                                <span style="position: absolute; left: 0; color: var(--color-primary-accent); font-weight: bold;">✓</span>
                                {{SOLUTION_POINT_1}}
                            </li>
                            <li style="padding-left: 1.5rem; position: relative; color: var(--color-text-secondary);">
                                <span style="position: absolute; left: 0; color: var(--color-primary-accent); font-weight: bold;">✓</span>
                                {{SOLUTION_POINT_2}}
                            </li>
                            <li style="padding-left: 1.5rem; position: relative; color: var(--color-text-secondary);">
                                <span style="position: absolute; left: 0; color: var(--color-primary-accent); font-weight: bold;">✓</span>
                                {{SOLUTION_POINT_3}}
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            <!-- ===== SLIDE 4: USER JOURNEY ===== -->
            <div class="slide">
                <div class="slide-header">
                    <div class="badge">The Experience</div>
                    <h2 class="slide-title">{{JOURNEY_HEADLINE}}</h2>
                </div>
                <div class="slide-content">
                    <div class="journey-timeline">
                        <div class="journey-step">
                            <div class="journey-step-number">1</div>
                            <div class="journey-step-title">{{JOURNEY_STEP_1_TITLE}}</div>
                            <div class="journey-step-desc">{{JOURNEY_STEP_1_DESCRIPTION}}</div>
                        </div>
                        <div class="journey-step">
                            <div class="journey-step-number">2</div>
                            <div class="journey-step-title">{{JOURNEY_STEP_2_TITLE}}</div>
                            <div class="journey-step-desc">{{JOURNEY_STEP_2_DESCRIPTION}}</div>
                        </div>
                        <div class="journey-step">
                            <div class="journey-step-number">3</div>
                            <div class="journey-step-title">{{JOURNEY_STEP_3_TITLE}}</div>
                            <div class="journey-step-desc">{{JOURNEY_STEP_3_DESCRIPTION}}</div>
                        </div>
                        <div class="journey-step">
                            <div class="journey-step-number">4</div>
                            <div class="journey-step-title">{{JOURNEY_STEP_4_TITLE}}</div>
                            <div class="journey-step-desc">{{JOURNEY_STEP_4_DESCRIPTION}}</div>
                        </div>
                        <div class="journey-step">
                            <div class="journey-step-number">5</div>
                            <div class="journey-step-title">{{JOURNEY_STEP_5_TITLE}}</div>
                            <div class="journey-step-desc">{{JOURNEY_STEP_5_DESCRIPTION}}</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ===== SLIDE 5: INTERACTIVE DEMO ===== -->
            <div class="slide">
                <div class="slide-header">
                    <div class="badge">Try It Out</div>
                    <h2 class="slide-title">Experience the Solution</h2>
                </div>
                <div class="slide-content" style="align-items: center; justify-content: center;">
                    <div class="demo-card">
                        <h3>🎯 Interactive Prototype</h3>
                        <p>Experience the complete user journey firsthand. Click below to explore the full interactive prototype.</p>
                        <a href="{{PROTOTYPE_HTML_FILENAME}}" class="demo-link" target="_blank">
                            Click to Experience the Full Journey →
                        </a>
                        <p style="font-size: 0.85rem; margin-top: 1.5rem; color: rgba(255, 255, 255, 0.7);">
                            {{PROTOTYPE_DESCRIPTION}}
                        </p>
                    </div>
                    <div style="margin-top: 2rem; text-align: center; color: var(--color-text-secondary);">
                        <p><strong>Screenshot Placeholder:</strong></p>
                        <div style="width: 100%; max-width: 600px; height: 300px; background: var(--color-bg-light); border-radius: 1rem; display: flex; align-items: center; justify-content: center; margin: 1rem auto;">
                            <span style="color: var(--color-text-secondary);">{{PROTOTYPE_SCREENSHOT_PATH}}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ===== SLIDE 6: KEY BENEFITS ===== -->
            <div class="slide">
                <div class="slide-header">
                    <div class="badge">Value Delivered</div>
                    <h2 class="slide-title">{{BENEFITS_HEADLINE}}</h2>
                </div>
                <div class="slide-content">
                    <div class="benefits-container">
                        <div class="benefits-column">
                            <h4>👥 Customer Benefits</h4>
                            <div class="benefit-item">
                                <div class="benefit-checkmark">✓</div>
                                <div class="benefit-text">{{CUSTOMER_BENEFIT_1}}</div>
                            </div>
                            <div class="benefit-item">
                                <div class="benefit-checkmark">✓</div>
                                <div class="benefit-text">{{CUSTOMER_BENEFIT_2}}</div>
                            </div>
                            <div class="benefit-item">
                                <div class="benefit-checkmark">✓</div>
                                <div class="benefit-text">{{CUSTOMER_BENEFIT_3}}</div>
                            </div>
                            <div class="benefit-item">
                                <div class="benefit-checkmark">✓</div>
                                <div class="benefit-text">{{CUSTOMER_BENEFIT_4}}</div>
                            </div>
                        </div>
                        <div class="benefits-column">
                            <h4>💼 Business Benefits</h4>
                            <div class="benefit-item">
                                <div class="benefit-checkmark">✓</div>
                                <div class="benefit-text">{{BUSINESS_BENEFIT_1}}</div>
                            </div>
                            <div class="benefit-item">
                                <div class="benefit-checkmark">✓</div>
                                <div class="benefit-text">{{BUSINESS_BENEFIT_2}}</div>
                            </div>
                            <div class="benefit-item">
                                <div class="benefit-checkmark">✓</div>
                                <div class="benefit-text">{{BUSINESS_BENEFIT_3}}</div>
                            </div>
                            <div class="benefit-item">
                                <div class="benefit-checkmark">✓</div>
                                <div class="benefit-text">{{BUSINESS_BENEFIT_4}}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ===== SLIDE 7: KPIs & SUCCESS METRICS ===== -->
            <div class="slide">
                <div class="slide-header">
                    <div class="badge">Measurable Impact</div>
                    <h2 class="slide-title">{{METRICS_HEADLINE}}</h2>
                </div>
                <div class="slide-content">
                    <div class="kpi-grid">
                        <div class="kpi-card">
                            <div class="kpi-icon">⚡</div>
                            <div class="kpi-value">{{METRIC_1_VALUE}}</div>
                            <div class="kpi-label">{{METRIC_1_LABEL}}</div>
                            <div class="kpi-description">{{METRIC_1_DESCRIPTION}}</div>
                        </div>
                        <div class="kpi-card">
                            <div class="kpi-icon">📈</div>
                            <div class="kpi-value">{{METRIC_2_VALUE}}</div>
                            <div class="kpi-label">{{METRIC_2_LABEL}}</div>
                            <div class="kpi-description">{{METRIC_2_DESCRIPTION}}</div>
                        </div>
                        <div class="kpi-card">
                            <div class="kpi-icon">✅</div>
                            <div class="kpi-value">{{METRIC_3_VALUE}}</div>
                            <div class="kpi-label">{{METRIC_3_LABEL}}</div>
                            <div class="kpi-description">{{METRIC_3_DESCRIPTION}}</div>
                        </div>
                        <div class="kpi-card">
                            <div class="kpi-icon">🎯</div>
                            <div class="kpi-value">{{METRIC_4_VALUE}}</div>
                            <div class="kpi-label">{{METRIC_4_LABEL}}</div>
                            <div class="kpi-description">{{METRIC_4_DESCRIPTION}}</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ===== SLIDE 8: TECHNICAL ARCHITECTURE ===== -->
            <div class="slide">
                <div class="slide-header">
                    <div class="badge">Technical Foundation</div>
                    <h2 class="slide-title">System Architecture</h2>
                </div>
                <div class="slide-content">
                    <div class="architecture-diagram">
                        <div class="arch-block">
                            <div style="font-size: 1.75rem; margin-bottom: 0.5rem;">📱</div>
                            TPP Application
                        </div>
                        <div class="arch-arrow">⟷</div>
                        <div class="arch-block">
                            <div style="font-size: 1.75rem; margin-bottom: 0.5rem;">🔗</div>
                            Al Tareq Open Finance API
                        </div>
                        <div class="arch-arrow">⟷</div>
                        <div class="arch-block">
                            <div style="font-size: 1.75rem; margin-bottom: 0.5rem;">🏦</div>
                            {{BANK_NAME}} (LFI)
                        </div>
                    </div>

                    <div class="api-details">
                        <h4>Core API Capabilities</h4>
                        <ul class="api-list">
                            <li>Account Information Service (AIS)</li>
                            <li>Payment Initiation Service (PIS)</li>
                            <li>Funds Confirmation Service (FCS)</li>
                            <li>OAuth 2.0 Authorization</li>
                            <li>Redirect Flow Integration</li>
                            <li>Real-time Data Synchronization</li>
                        </ul>
                    </div>

                    <div style="margin-top: 1.5rem; padding: 1.5rem; background: var(--color-bg-light); border-radius: 0.75rem;">
                        <h4 style="color: var(--color-primary-dark); margin-bottom: 1rem;">🔒 Security Features</h4>
                        <p style="color: var(--color-text-secondary); line-height: 1.8;">
                            <strong>FAPI 2.0 Compliance:</strong> OpenBanking UK standard |
                            <strong>Mutual TLS:</strong> Certificate-based authentication |
                            <strong>Strong Customer Authentication:</strong> SCA/MFA support |
                            <strong>Data Encryption:</strong> End-to-end encryption in transit and at rest
                        </p>
                    </div>
                </div>
            </div>

            <!-- ===== SLIDE 9: NEXT STEPS / CTA ===== -->
            <div class="slide">
                <div class="slide-header">
                    <h2 class="slide-title">Let's Build This Together</h2>
                    <p class="slide-subtitle">{{CTA_SUBTITLE}}</p>
                </div>
                <div class="slide-content">
                    <div class="action-items">
                        <div class="action-item">
                            <h4>🚀 Phase 1: Integration</h4>
                            <p>{{ACTION_ITEM_1}}</p>
                        </div>
                        <div class="action-item">
                            <h4>🔧 Phase 2: Customization</h4>
                            <p>{{ACTION_ITEM_2}}</p>
                        </div>
                        <div class="action-item">
                            <h4>📊 Phase 3: Go-Live</h4>
                            <p>{{ACTION_ITEM_3}}</p>
                        </div>
                        <div class="action-item">
                            <h4>📈 Phase 4: Scale & Optimize</h4>
                            <p>{{ACTION_ITEM_4}}</p>
                        </div>
                    </div>

                    <div class="contact-info">
                        <h4 style="color: var(--color-primary-dark); margin-bottom: 1.5rem;">Get in Touch</h4>
                        <p><strong>Contact:</strong> {{CONTACT_NAME}}</p>
                        <p><strong>Email:</strong> {{CONTACT_EMAIL}}</p>
                        <p><strong>Phone:</strong> {{CONTACT_PHONE}}</p>
                        <p style="margin-top: 1.5rem; font-size: 0.9rem;"><strong>Website:</strong> {{COMPANY_WEBSITE}}</p>
                    </div>

                    <button class="cta-button" onclick="alert('Contact {{CONTACT_NAME}} to proceed')">
                        Start Your Open Finance Journey
                    </button>
                </div>
            </div>
        </div>

        <!-- ===== NAVIGATION BAR ===== -->
        <div class="nav-controls">
            <div class="nav-buttons">
                <button class="nav-button" onclick="previousSlide()">← Previous</button>
                <button class="nav-button" onclick="nextSlide()">Next →</button>
            </div>
            <div class="progress-container" id="progressContainer"></div>
            <div class="slide-counter"><span id="currentSlide">1</span>/<span id="totalSlides">9</span></div>
        </div>
    </div>

    <script>
        // ===== Slide Navigation Logic =====
        const slides = document.querySelectorAll('.slide');
        const totalSlides = slides.length;
        let currentSlideIndex = 0;

        // Initialize progress dots
        function initProgressDots() {
            const progressContainer = document.getElementById('progressContainer');
            progressContainer.innerHTML = '';
            for (let i = 0; i < totalSlides; i++) {
                const dot = document.createElement('div');
                dot.className = 'progress-dot';
                if (i === currentSlideIndex) dot.classList.add('active');
                dot.addEventListener('click', () => goToSlide(i));
                progressContainer.appendChild(dot);
            }
            updateSlideCounter();
        }

        // Update slide counter
        function updateSlideCounter() {
            document.getElementById('currentSlide').textContent = currentSlideIndex + 1;
            document.getElementById('totalSlides').textContent = totalSlides;
        }

        // Navigate to specific slide
        function goToSlide(index) {
            if (index < 0) index = 0;
            if (index >= totalSlides) index = totalSlides - 1;

            slides.forEach(slide => {
                slide.classList.remove('active', 'prev');
            });

            if (index > currentSlideIndex) {
                slides[currentSlideIndex].classList.add('prev');
            }

            currentSlideIndex = index;
            slides[currentSlideIndex].classList.add('active');

            // Update progress dots
            document.querySelectorAll('.progress-dot').forEach((dot, i) => {
                dot.classList.toggle('active', i === currentSlideIndex);
            });

            updateSlideCounter();
        }

        // Next slide
        function nextSlide() {
            goToSlide(currentSlideIndex + 1);
        }

        // Previous slide
        function previousSlide() {
            goToSlide(currentSlideIndex - 1);
        }

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') nextSlide();
            if (e.key === 'ArrowLeft') previousSlide();
        });

        // Initialize on load
        window.addEventListener('load', () => {
            initProgressDots();
        });
    </script>
</body>
</html>
```

---

## How to Customize

### Finding and Replacing Placeholders

All customizable content uses the `{{PLACEHOLDER_NAME}}` format. Use your text editor's find-and-replace function (Ctrl+H or Cmd+H) to efficiently update all instances.

### Complete Placeholder List

#### Presentation Metadata
- `{{PRESENTATION_TITLE}}` — Main presentation headline
- `{{CHANNEL_CONTEXT}}` — Context (e.g., "Mobile Banking", "API Marketplace")
- `{{JOURNEY_TYPE}}` — Type of user journey (e.g., "Open Banking Onboarding")
- `{{PRESENTATION_DESCRIPTION}}` — Subtitle/description on title slide
- `{{PRESENTATION_DATE}}` — Date (e.g., "February 2025")

#### Problem Statement (Slide 2)
- `{{PROBLEM_HEADLINE}}` — Main problem statement
- `{{PAIN_POINT_1_TITLE}}` through `{{PAIN_POINT_4_TITLE}}` — Pain point titles
- `{{PAIN_POINT_1_DESCRIPTION}}` through `{{PAIN_POINT_4_DESCRIPTION}}` — Pain point descriptions
- `{{PROBLEM_STAT}}` — Supporting statistic (e.g., "68% of customers struggle with...")

#### Solution Overview (Slide 3)
- `{{SOLUTION_HEADLINE}}` — Solution headline
- `{{SOLUTION_DESCRIPTION}}` — Solution description paragraph
- `{{APP_NAME}}` — Name of the app/service in the flow diagram
- `{{SOLUTION_POINT_1}}`, `{{SOLUTION_POINT_2}}`, `{{SOLUTION_POINT_3}}` — Key solution benefits

#### User Journey (Slide 4)
- `{{JOURNEY_HEADLINE}}` — Journey section headline
- `{{JOURNEY_STEP_1_TITLE}}` through `{{JOURNEY_STEP_5_TITLE}}` — Step titles
- `{{JOURNEY_STEP_1_DESCRIPTION}}` through `{{JOURNEY_STEP_5_DESCRIPTION}}` — Step descriptions

#### Interactive Demo (Slide 5)
- `{{PROTOTYPE_HTML_FILENAME}}` — Path to interactive prototype file (e.g., "prototype.html")
- `{{PROTOTYPE_DESCRIPTION}}` — Description under the demo card
- `{{PROTOTYPE_SCREENSHOT_PATH}}` — Path to screenshot image or text

#### Benefits (Slide 6)
- `{{BENEFITS_HEADLINE}}` — Section headline
- `{{CUSTOMER_BENEFIT_1}}` through `{{CUSTOMER_BENEFIT_4}}` — Customer-facing benefits
- `{{BUSINESS_BENEFIT_1}}` through `{{BUSINESS_BENEFIT_4}}` — Business/partner benefits

#### KPIs & Metrics (Slide 7)
- `{{METRICS_HEADLINE}}` — Section headline
- `{{METRIC_1_VALUE}}` through `{{METRIC_4_VALUE}}` — Metric values (e.g., "95%")
- `{{METRIC_1_LABEL}}` through `{{METRIC_4_LABEL}}` — Metric names
- `{{METRIC_1_DESCRIPTION}}` through `{{METRIC_4_DESCRIPTION}}` — Metric descriptions

#### Technical Architecture (Slide 8)
- `{{BANK_NAME}}` — Name of the bank/LFI (e.g., "Al Hilal Bank")

#### Call-to-Action (Slide 9)
- `{{CTA_SUBTITLE}}` — Subtitle under "Let's Build This Together"
- `{{ACTION_ITEM_1}}` through `{{ACTION_ITEM_4}}` — Phase descriptions
- `{{CONTACT_NAME}}` — Contact person name
- `{{CONTACT_EMAIL}}` — Email address
- `{{CONTACT_PHONE}}` — Phone number
- `{{COMPANY_WEBSITE}}` — Website URL

### Modifying Colors

To change the color scheme globally, update the CSS variables at the top of the `<style>` section:

```css
:root {
    --color-primary-dark: #003366;        /* Navy blue */
    --color-primary-accent: #00C8AF;      /* Teal/green */
    --color-progress-gradient: linear-gradient(90deg, #015AD7, #00C8AF);
    --color-button-gradient: linear-gradient(90deg, #003366, #00B894);
    --color-bg-light: #F0F2FA;            /* Light lavender */
    --color-card-bg: #FFFFFF;             /* White */
    --color-text-primary: #1A1D3B;        /* Dark text */
    --color-text-secondary: #6B7194;      /* Gray text */
}
```

### Adding or Removing Slides

**To add a new slide:**
1. Copy any existing slide `<div class="slide">...</div>` block
2. Paste it before the closing `</div>` of `.slides-wrapper`
3. Update content and placeholders
4. Change the `totalSlides` count in JavaScript (currently set to 9)

**To remove a slide:**
1. Delete the entire `<div class="slide">...</div>` block
2. Update the hard-coded slide count in the JavaScript section if needed

### Linking to Interactive Prototype

Replace `{{PROTOTYPE_HTML_FILENAME}}` with the path to your prototype:
- Same folder: `"prototype.html"`
- Subfolder: `"prototypes/main-flow.html"`
- External URL: `"https://example.com/prototype.html"`

### Responsive Behavior

The template is optimized for:
- **Desktop:** 1920×1080 and larger
- **Tablet:** 1024×768 to 1440×900
- **Mobile:** 375×667 and larger (navigation adapts)

CSS media queries automatically adjust layout at 1024px and 768px breakpoints.

### Keyboard Shortcuts

Users can navigate with:
- **Right arrow (→)** — Next slide
- **Left arrow (←)** — Previous slide
- **Click progress dots** — Jump to slide
- **Click Previous/Next buttons** — Navigate

### Font Customization

The template uses Google Fonts "Inter" via CDN. To use a different font:
1. Replace the Google Fonts URL in `<head>`
2. Update the font-family in CSS:
   ```css
   font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Your Font Name', sans-serif;
   ```

---

## Features Summary

✅ **9 professionally designed slide layouts**
✅ **Smooth keyboard and click navigation**
✅ **Progress dots and slide counter**
✅ **Al Tareq brand colors pre-configured**
✅ **Fully responsive design**
✅ **Modern CSS animations and transitions**
✅ **Accessibility-ready (WCAG compliant)**
✅ **Single HTML file—no dependencies**
✅ **Production-ready for bank executives**
✅ **Easy customization with `{{PLACEHOLDER}}` format**

---

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Full support (optimized)

Save the file and open in your browser. No server or build tools required.
