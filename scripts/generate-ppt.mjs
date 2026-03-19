// scripts/generate-ppt.mjs
// Generate the Mindflow recruiter presentation
// Run: npm run generate-ppt

import pptxgen from "pptxgenjs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.join(__dirname, "../mindflow-presentation.pptx");

// ── Design System ─────────────────────────────────────────────────────────────
const C = {
  BG: "1E2030",
  CARD: "252B3B",
  CARD2: "2D3548",
  ORANGE1: "FF7A00",
  ORANGE2: "FF9736",
  ORANGE3: "FFBC7D",
  WHITE: "FFFFFF",
  GRAY: "94A3B8",
  LIGHT: "CBD5E1",
  SUCCESS: "22C55E",
  BLUE: "3B82F6",
  PURPLE: "8B5CF6",
  BORDER: "334155",
  // Muted tints (solid approximations of semi-transparent overlays)
  ORANGE1_MUTED: "2D1800",
  ORANGE2_MUTED: "2D2300",
  BLUE_MUTED: "0E1A38",
  PURPLE_MUTED: "1A1035",
  SUCCESS_MUTED: "0D2E1A",
  BG_OVERLAY: "1A1C2E",
};

const FONT = "Segoe UI";
const SLIDE_W = 13.33;
const SLIDE_H = 7.5;

// ── Helpers ───────────────────────────────────────────────────────────────────

function darkBg(prs, slide) {
  slide.addShape(prs.ShapeType.rect, {
    x: 0, y: 0, w: SLIDE_W, h: SLIDE_H,
    fill: { color: C.BG }, line: { color: C.BG },
  });
}

function accentBar(prs, slide) {
  slide.addShape(prs.ShapeType.rect, {
    x: 0, y: 0, w: SLIDE_W, h: 0.05,
    fill: { color: C.ORANGE1 }, line: { color: C.ORANGE1 },
  });
}

function card(prs, slide, x, y, w, h, opts = {}) {
  slide.addShape(prs.ShapeType.rect, {
    x, y, w, h,
    fill: { color: opts.fill || C.CARD },
    line: { color: opts.border || C.BORDER, width: opts.lineW || 1 },
    rectRadius: opts.radius || 0,
  });
}

function leftAccent(prs, slide, x, y, h, color) {
  slide.addShape(prs.ShapeType.rect, {
    x, y, w: 0.07, h,
    fill: { color: color || C.ORANGE1 },
    line: { color: color || C.ORANGE1 },
  });
}

function heading(slide, text, x, y, w, opts = {}) {
  slide.addText(text, {
    x, y, w, h: opts.h || 0.6,
    fontSize: opts.size || 26,
    bold: opts.bold !== false,
    color: opts.color || C.WHITE,
    fontFace: FONT,
    align: opts.align || "left",
    valign: "middle",
  });
}

function subtext(slide, text, x, y, w, h, opts = {}) {
  slide.addText(text, {
    x, y, w, h,
    fontSize: opts.size || 13,
    color: opts.color || C.GRAY,
    fontFace: FONT,
    align: opts.align || "left",
    valign: opts.valign || "top",
    wrap: true,
  });
}

function badge(prs, slide, text, x, y, opts = {}) {
  const color = opts.color || C.ORANGE1;
  const w = Math.max(text.length * 0.115 + 0.5, 1.2);
  slide.addShape(prs.ShapeType.rect, {
    x, y, w, h: 0.3,
    fill: { color: C.CARD2 },
    line: { color: color, width: 1 },
  });
  slide.addText(text, {
    x: x + 0.1, y: y + 0.02, w: w - 0.2, h: 0.26,
    fontSize: 9, color: color, bold: true, fontFace: FONT,
    align: "center",
  });
}

function arrow(prs, slide, x1, y, x2) {
  slide.addShape(prs.ShapeType.line, {
    x: x1, y, w: x2 - x1, h: 0,
    line: { color: C.ORANGE1, width: 2, endArrowType: "arrow" },
  });
}

function nodeBox(prs, slide, label, x, y, opts = {}) {
  const w = opts.w || 2.0;
  const h = opts.h || 0.65;
  const color = opts.color || C.ORANGE1;
  slide.addShape(prs.ShapeType.rect, {
    x, y, w, h,
    fill: { color: C.CARD2 },
    line: { color, width: 1.5 },
  });
  slide.addText(label, {
    x: x + 0.1, y, w: w - 0.2, h,
    fontSize: opts.fontSize || 11,
    bold: true,
    color: C.WHITE,
    fontFace: FONT,
    align: "center",
    valign: "middle",
  });
}

function sectionLabel(prs, slide, text, x, y, color) {
  badge(prs, slide, text, x, y, { color: color || C.ORANGE1 });
}

// ── Slide 01 — Title ──────────────────────────────────────────────────────────
function slide01_Title(prs) {
  const slide = prs.addSlide();
  darkBg(prs, slide);

  // Diagonal orange bars (logo-inspired)
  const bars = [
    { x: -0.3, color: C.ORANGE1 },
    { x: 0.55, color: C.ORANGE2 },
    { x: 1.35, color: C.ORANGE3 },
  ];
  for (const b of bars) {
    slide.addShape(prs.ShapeType.rect, {
      x: b.x, y: -1, w: 0.55, h: 10,
      fill: { color: b.color }, line: { color: b.color },
      rotate: 12,
    });
  }

  // Dark overlay so text is readable over bars
  slide.addShape(prs.ShapeType.rect, {
    x: 0, y: 0, w: SLIDE_W, h: SLIDE_H,
    fill: { color: C.BG_OVERLAY }, line: { color: C.BG_OVERLAY },
  });

  // App name
  slide.addText("Mindflow", {
    x: 1.5, y: 1.6, w: 10.33, h: 1.4,
    fontSize: 72, bold: true, color: C.WHITE,
    fontFace: FONT, align: "center",
  });

  // Orange underline
  slide.addShape(prs.ShapeType.rect, {
    x: 4.5, y: 3.0, w: 4.33, h: 0.07,
    fill: { color: C.ORANGE1 }, line: { color: C.ORANGE1 },
  });

  // Tagline
  slide.addText("AI-Native Visual Workflow Automation", {
    x: 1.5, y: 3.2, w: 10.33, h: 0.6,
    fontSize: 22, color: C.ORANGE2, fontFace: FONT, align: "center", bold: false,
  });

  // Subtitle
  slide.addText("Build automations between your tools visually.\nExecute reliably. No code required.", {
    x: 2.5, y: 3.9, w: 8.33, h: 0.8,
    fontSize: 16, color: C.GRAY, fontFace: FONT, align: "center",
  });

  // Tech pill badges at bottom
  const tags = ["Next.js 15", "Inngest", "React Flow", "tRPC", "Polar", "Better Auth", "Vercel AI SDK"];
  let bx = (SLIDE_W - tags.length * 1.75) / 2;
  for (const t of tags) {
    badge(prs, slide, t, bx, 5.2, { color: C.ORANGE3 });
    bx += 1.75;
  }

  // Footer
  slide.addText("Built Solo · Production-Ready SaaS · Full-Stack TypeScript", {
    x: 0.5, y: 6.95, w: 12.33, h: 0.35,
    fontSize: 10, color: C.BORDER, fontFace: FONT, align: "center",
  });
}

// ── Slide 02 — The Problem ────────────────────────────────────────────────────
function slide02_Problem(prs) {
  const slide = prs.addSlide();
  darkBg(prs, slide);
  accentBar(prs, slide);

  sectionLabel(prs, slide, "THE PROBLEM", 0.5, 0.25);

  slide.addText("SMBs waste hours on tasks\nthat should take seconds.", {
    x: 0.5, y: 0.7, w: 6.0, h: 1.6,
    fontSize: 32, bold: true, color: C.WHITE, fontFace: FONT,
  });

  subtext(slide, "Teams are stuck copy-pasting data between tools, manually following up leads, and running repetitive workflows — with no automation in place.", 0.5, 2.4, 5.8, 1.2);

  // Pain point cards
  const pains = [
    { icon: "✋", title: "Manual Data Entry", desc: "Copy-pasting between CRM, spreadsheets, and email wastes 2–3 hours daily" },
    { icon: "⏰", title: "Slow Lead Response", desc: "Leads go cold because no one set up automatic qualification or follow-up" },
    { icon: "🔁", title: "Repetitive Tasks", desc: "Weekly reports, reminders, and notifications built by hand, every time" },
    { icon: "🔗", title: "Tool Silos", desc: "Zapier/Make cost $100–400/month and don't support AI-powered decisions" },
  ];

  let cy = 0.65;
  for (const p of pains) {
    card(prs, slide, 7.1, cy, 5.7, 1.3, { fill: C.CARD, border: C.BORDER });
    leftAccent(prs, slide, 7.1, cy, 1.3, C.ORANGE1);
    slide.addText(p.icon + "  " + p.title, {
      x: 7.35, y: cy + 0.1, w: 5.2, h: 0.38,
      fontSize: 14, bold: true, color: C.WHITE, fontFace: FONT,
    });
    subtext(slide, p.desc, 7.35, cy + 0.48, 5.2, 0.65, { size: 12 });
    cy += 1.45;
  }
}

// ── Slide 03 — The Solution ───────────────────────────────────────────────────
function slide03_Solution(prs) {
  const slide = prs.addSlide();
  darkBg(prs, slide);
  accentBar(prs, slide);

  sectionLabel(prs, slide, "THE SOLUTION", 0.5, 0.25);

  slide.addText("Mindflow connects your tools and runs\nautomations — powered by AI.", {
    x: 1.0, y: 0.65, w: 11.33, h: 1.3,
    fontSize: 34, bold: true, color: C.WHITE, fontFace: FONT, align: "center",
  });

  slide.addShape(prs.ShapeType.rect, {
    x: 3.5, y: 2.0, w: 6.33, h: 0.06,
    fill: { color: C.ORANGE1 }, line: { color: C.ORANGE1 },
  });

  // Three feature columns
  const cols = [
    {
      x: 0.5, icon: "🎨", color: C.ORANGE1,
      title: "Visual Builder",
      points: [
        "Drag-and-drop canvas",
        "React Flow powered",
        "14 ready-made node types",
        "Connect any trigger to any action",
      ],
    },
    {
      x: 4.8, icon: "🤖", color: C.ORANGE2,
      title: "AI-Powered",
      points: [
        "Anthropic Claude",
        "OpenAI GPT-4",
        "Google Gemini",
        "AI decides, not just routes",
      ],
    },
    {
      x: 9.1, icon: "🚀", color: C.SUCCESS,
      title: "Production-Ready",
      points: [
        "Auth & subscription billing",
        "Encrypted credential vault",
        "Durable execution (Inngest)",
        "Real-time status per node",
      ],
    },
  ];

  for (const col of cols) {
    card(prs, slide, col.x, 2.2, 3.85, 4.7, { fill: C.CARD });
    slide.addShape(prs.ShapeType.rect, {
      x: col.x, y: 2.2, w: 3.85, h: 0.06,
      fill: { color: col.color }, line: { color: col.color },
    });
    slide.addText(col.icon, {
      x: col.x + 0.2, y: 2.35, w: 0.6, h: 0.6,
      fontSize: 28, fontFace: FONT,
    });
    heading(slide, col.title, col.x + 0.85, 2.35, 2.8, { size: 18, color: C.WHITE });
    const items = col.points.map((p) => ({ text: "  ✓  " + p, options: { bullet: false } }));
    slide.addText(items, {
      x: col.x + 0.25, y: 3.1, w: 3.35, h: 3.5,
      fontSize: 13, color: C.LIGHT, fontFace: FONT,
      paraSpaceAfter: 10,
    });
  }
}

// ── Slide 04 — Platform Overview ──────────────────────────────────────────────
function slide04_Platform(prs) {
  const slide = prs.addSlide();
  darkBg(prs, slide);
  accentBar(prs, slide);

  sectionLabel(prs, slide, "PLATFORM OVERVIEW", 0.5, 0.25);
  heading(slide, "A complete automation canvas — built for AI", 0.5, 0.65, 12.0, { size: 24 });

  // Mock canvas area
  card(prs, slide, 0.5, 1.4, 7.5, 5.6, { fill: "1A1F30", border: C.BORDER });
  slide.addText("Workflow Canvas (React Flow)", {
    x: 0.7, y: 1.5, w: 3.5, h: 0.35,
    fontSize: 10, color: C.GRAY, fontFace: FONT,
  });

  // Mock nodes on canvas
  const mockNodes = [
    { label: "⚡ Cron Trigger", x: 1.0, y: 2.1, color: C.ORANGE1 },
    { label: "🤖 Claude AI", x: 3.3, y: 2.1, color: C.ORANGE2 },
    { label: "✅ Conditional", x: 5.5, y: 2.1, color: C.BLUE },
    { label: "💬 Slack", x: 3.3, y: 3.5, color: C.SUCCESS },
    { label: "🌐 HTTP Request", x: 5.5, y: 3.5, color: C.PURPLE },
    { label: "⚠️ Error Handler", x: 3.3, y: 4.8, color: "EF4444" },
  ];

  for (const n of mockNodes) {
    nodeBox(prs, slide, n.label, n.x, n.y, { color: n.color, w: 1.9, h: 0.55, fontSize: 10 });
  }

  // Arrows
  arrow(prs, slide, 2.9, 2.38, 3.3);
  arrow(prs, slide, 5.2, 2.38, 5.5);
  slide.addShape(prs.ShapeType.line, {
    x: 4.25, y: 2.65, w: 0, h: 0.85,
    line: { color: C.ORANGE1, width: 2, endArrowType: "arrow" },
  });
  slide.addShape(prs.ShapeType.line, {
    x: 6.45, y: 2.65, w: 0, h: 0.85,
    line: { color: C.BLUE, width: 2, endArrowType: "arrow" },
  });

  // Execution status dots (green = success)
  const dots = [
    { x: 2.82, y: 2.25 }, { x: 5.12, y: 2.25 }, { x: 7.32, y: 2.25 },
  ];
  for (const d of dots) {
    slide.addShape(prs.ShapeType.ellipse, {
      x: d.x, y: d.y, w: 0.18, h: 0.18,
      fill: { color: C.SUCCESS }, line: { color: C.SUCCESS },
    });
  }

  // Stat cards on right
  const stats = [
    { n: "14", label: "Node Types", sub: "Triggers · AI · Actions · Logic", color: C.ORANGE1 },
    { n: "3", label: "AI Providers", sub: "Anthropic · OpenAI · Gemini", color: C.ORANGE2 },
    { n: "∞", label: "Real-time Status", sub: "Live per-node execution updates", color: C.SUCCESS },
  ];

  let sy = 1.4;
  for (const s of stats) {
    card(prs, slide, 8.3, sy, 4.6, 1.65, { fill: C.CARD });
    leftAccent(prs, slide, 8.3, sy, 1.65, s.color);
    slide.addText(s.n, {
      x: 8.55, y: sy + 0.15, w: 1.2, h: 1.1,
      fontSize: 48, bold: true, color: s.color, fontFace: FONT, align: "center", valign: "middle",
    });
    heading(slide, s.label, 9.85, sy + 0.2, 2.8, { size: 16, color: C.WHITE });
    subtext(slide, s.sub, 9.85, sy + 0.65, 2.8, 0.7, { size: 11 });
    sy += 1.8;
  }
}

// ── Slide 05 — Node Library ───────────────────────────────────────────────────
function slide05_NodeLibrary(prs) {
  const slide = prs.addSlide();
  darkBg(prs, slide);
  accentBar(prs, slide);

  sectionLabel(prs, slide, "NODE LIBRARY", 0.5, 0.25);
  heading(slide, "14 pre-built nodes — connect anything", 0.5, 0.65, 12.0, { size: 24 });

  const categories = [
    {
      title: "Triggers",
      color: C.ORANGE1,
      x: 0.4,
      nodes: [
        { name: "Manual Trigger", desc: "Run on demand" },
        { name: "Cron Schedule", desc: "e.g. every Monday 9am" },
        { name: "Google Form", desc: "On form submission" },
        { name: "Stripe Webhook", desc: "On payment events" },
      ],
    },
    {
      title: "AI Models",
      color: C.ORANGE2,
      x: 3.7,
      nodes: [
        { name: "Anthropic Claude", desc: "claude-sonnet-4-5" },
        { name: "OpenAI GPT-4", desc: "gpt-4 model" },
        { name: "Google Gemini", desc: "gemini-2.0-flash" },
      ],
    },
    {
      title: "Actions",
      color: C.BLUE,
      x: 6.95,
      nodes: [
        { name: "Slack Message", desc: "Post to channel" },
        { name: "Discord Message", desc: "Post to webhook" },
        { name: "HTTP Request", desc: "GET/POST/PUT/DELETE" },
        { name: "Error Handler", desc: "Catch & notify" },
      ],
    },
    {
      title: "Logic",
      color: C.PURPLE,
      x: 10.2,
      nodes: [
        { name: "Conditional", desc: "If / else branching" },
        { name: "Transform", desc: "JSONata expressions" },
      ],
    },
  ];

  const MUTED_MAP = {
    [C.ORANGE1]: C.ORANGE1_MUTED, [C.ORANGE2]: C.ORANGE2_MUTED,
    [C.BLUE]: C.BLUE_MUTED, [C.PURPLE]: C.PURPLE_MUTED, [C.SUCCESS]: C.SUCCESS_MUTED,
  };

  for (const cat of categories) {
    // Category header
    card(prs, slide, cat.x, 1.5, 2.9, 0.45, { fill: MUTED_MAP[cat.color] || C.CARD2, border: cat.color });
    slide.addText(cat.title, {
      x: cat.x + 0.1, y: 1.5, w: 2.7, h: 0.45,
      fontSize: 13, bold: true, color: C.WHITE, fontFace: FONT, align: "center", valign: "middle",
    });

    // Node cards
    let ny = 2.1;
    for (const n of cat.nodes) {
      card(prs, slide, cat.x, ny, 2.9, 1.05, { fill: C.CARD, border: C.BORDER });
      leftAccent(prs, slide, cat.x, ny, 1.05, cat.color);
      slide.addText(n.name, {
        x: cat.x + 0.22, y: ny + 0.12, w: 2.55, h: 0.38,
        fontSize: 12, bold: true, color: C.WHITE, fontFace: FONT,
      });
      subtext(slide, n.desc, cat.x + 0.22, ny + 0.5, 2.55, 0.38, { size: 10, color: C.GRAY });
      ny += 1.15;
    }
  }
}

// ── Slide 06 — How Execution Works ────────────────────────────────────────────
function slide06_Execution(prs) {
  const slide = prs.addSlide();
  darkBg(prs, slide);
  accentBar(prs, slide);

  sectionLabel(prs, slide, "EXECUTION ENGINE", 0.5, 0.25);
  heading(slide, "Every workflow runs with durable, real-time execution", 0.5, 0.65, 12.0, { size: 22 });

  // 5-step flow
  const steps = [
    { label: "1. Trigger\nFires", sub: "Manual / Webhook / Cron", color: C.ORANGE1, x: 0.4 },
    { label: "2. Inngest\nEvent", sub: "`workflows/execute.workflow`", color: C.ORANGE2, x: 2.95 },
    { label: "3. Topo\nSort", sub: "DAG ordered execution", color: C.ORANGE3, x: 5.5 },
    { label: "4. Node\nExecutors", sub: "Each updates context", color: C.BLUE, x: 8.05 },
    { label: "5. Result\nStored", sub: "DB + realtime publish", color: C.SUCCESS, x: 10.6 },
  ];

  for (const s of steps) {
    nodeBox(prs, slide, s.label, s.x, 1.8, { color: s.color, w: 2.2, h: 0.9, fontSize: 12 });
    subtext(slide, s.sub, s.x, 2.78, 2.2, 0.55, { size: 10, align: "center" });
  }

  // Arrows between steps
  for (let i = 0; i < steps.length - 1; i++) {
    arrow(prs, slide, steps[i].x + 2.2, 2.25, steps[i + 1].x);
  }

  // Two detail cards
  const detailCards = [
    {
      x: 0.4, title: "Context Accumulation",
      color: C.ORANGE1,
      content: "Each node writes output to a shared context object.\nDownstream nodes access it via Handlebars templates.",
      code: '{ ...context, [variableName]: { text: aiResult } }\n// Next node: "{{myAI.text}}"',
    },
    {
      x: 6.87, title: "Conditional Branching",
      color: C.BLUE,
      content: "Conditional nodes record which branch was taken.\nUnreachable downstream nodes are automatically skipped.",
      code: "context.__conditional_nodeId = 'true' | 'false'\n// Skipped nodes don't execute",
    },
  ];

  for (const d of detailCards) {
    card(prs, slide, d.x, 3.65, 6.0, 3.4, { fill: C.CARD, border: d.color });
    slide.addShape(prs.ShapeType.rect, {
      x: d.x, y: 3.65, w: 6.0, h: 0.05,
      fill: { color: d.color }, line: { color: d.color },
    });
    heading(slide, d.title, d.x + 0.25, 3.75, 5.5, { size: 14, color: d.color });
    subtext(slide, d.content, d.x + 0.25, 4.15, 5.5, 0.85, { size: 12 });
    // Code block
    card(prs, slide, d.x + 0.2, 5.1, 5.6, 1.65, { fill: "111827", border: "374151" });
    slide.addText(d.code, {
      x: d.x + 0.4, y: 5.2, w: 5.2, h: 1.45,
      fontSize: 11, color: "A5F3FC", fontFace: "Courier New",
    });
  }
}

// ── Slide 07 — Real Business Workflows ───────────────────────────────────────
function slide07_Workflows(prs) {
  const slide = prs.addSlide();
  darkBg(prs, slide);
  accentBar(prs, slide);

  sectionLabel(prs, slide, "REAL BUSINESS WORKFLOWS", 0.5, 0.25);
  heading(slide, "Production automations you can build in minutes", 0.5, 0.65, 12.0, { size: 22 });

  const workflows = [
    {
      title: "Lead Qualification",
      usecase: "When a lead submits your form → Claude qualifies them → team gets a Slack summary",
      y: 1.55,
      color: C.ORANGE1,
      nodes: [
        { label: "Google Form", color: C.ORANGE1 },
        { label: "Claude AI", color: C.ORANGE2 },
        { label: "Conditional", color: C.BLUE },
        { label: "Slack Alert", color: C.SUCCESS },
      ],
    },
    {
      title: "Payment Processing",
      usecase: "When Stripe payment fires → update your CRM via HTTP → notify the team on Discord",
      y: 3.45,
      color: C.ORANGE2,
      nodes: [
        { label: "Stripe Webhook", color: C.ORANGE2 },
        { label: "Transform", color: C.PURPLE },
        { label: "HTTP Request", color: C.BLUE },
        { label: "Discord Alert", color: "7289DA" },
      ],
    },
    {
      title: "Scheduled Reporting",
      usecase: "Every Monday at 9am → fetch analytics → reshape with JSONata → post digest to Slack",
      y: 5.3,
      color: C.SUCCESS,
      nodes: [
        { label: "Cron Trigger", color: C.SUCCESS },
        { label: "HTTP Request", color: C.BLUE },
        { label: "Transform", color: C.PURPLE },
        { label: "Slack Report", color: C.SUCCESS },
      ],
    },
  ];

  for (const wf of workflows) {
    // Row background
    card(prs, slide, 0.4, wf.y, 12.53, 1.65, { fill: C.CARD, border: wf.color });
    slide.addShape(prs.ShapeType.rect, {
      x: 0.4, y: wf.y, w: 0.07, h: 1.65,
      fill: { color: wf.color }, line: { color: wf.color },
    });

    // Title
    slide.addText(wf.title, {
      x: 0.65, y: wf.y + 0.12, w: 3.5, h: 0.38,
      fontSize: 14, bold: true, color: C.WHITE, fontFace: FONT,
    });
    subtext(slide, wf.usecase, 0.65, wf.y + 0.55, 3.3, 0.95, { size: 10 });

    // Node chain
    let nx = 4.3;
    for (let i = 0; i < wf.nodes.length; i++) {
      const n = wf.nodes[i];
      nodeBox(prs, slide, n.label, nx, wf.y + 0.5, { color: n.color, w: 1.85, h: 0.6, fontSize: 10 });
      if (i < wf.nodes.length - 1) {
        arrow(prs, slide, nx + 1.85, wf.y + 0.8, nx + 2.15);
      }
      nx += 2.15;
    }
  }
}

// ── Slide 08 — Technical Architecture ────────────────────────────────────────
function slide08_Architecture(prs) {
  const slide = prs.addSlide();
  darkBg(prs, slide);
  accentBar(prs, slide);

  sectionLabel(prs, slide, "TECHNICAL ARCHITECTURE", 0.5, 0.25);
  heading(slide, "Full-stack TypeScript — every layer type-safe", 0.5, 0.65, 12.0, { size: 24 });

  const layers = [
    {
      label: "Frontend Layer",
      color: C.ORANGE1,
      y: 1.45,
      items: ["Next.js 15 App Router", "React 19 + TypeScript", "React Flow Canvas", "Tailwind CSS v4 + Radix UI", "TanStack Query", "Jotai"],
    },
    {
      label: "API Layer",
      color: C.ORANGE2,
      y: 3.0,
      items: ["tRPC v11 (type-safe)", "Server Actions", "Better Auth sessions", "Polar subscription gate", "Zod validation"],
    },
    {
      label: "Execution Engine",
      color: C.BLUE,
      y: 4.5,
      items: ["Inngest functions", "Topological sort (DAG)", "Real-time channels", "Step durability", "Sentry tracing"],
    },
    {
      label: "Data Layer",
      color: C.SUCCESS,
      y: 6.0,
      items: ["Prisma ORM", "PostgreSQL (Neon)", "Cryptr encryption", "Handlebars templates", "JSONata transforms"],
    },
  ];

  for (const layer of layers) {
    card(prs, slide, 0.4, layer.y, 12.53, 1.3, { fill: C.CARD, border: layer.color });
    slide.addShape(prs.ShapeType.rect, {
      x: 0.4, y: layer.y, w: 12.53, h: 0.05,
      fill: { color: layer.color }, line: { color: layer.color },
    });
    // Label
    slide.addText(layer.label, {
      x: 0.6, y: layer.y + 0.15, w: 2.4, h: 0.9,
      fontSize: 13, bold: true, color: layer.color, fontFace: FONT, valign: "middle",
    });
    // Vertical separator
    slide.addShape(prs.ShapeType.line, {
      x: 3.1, y: layer.y + 0.15, w: 0, h: 1.0,
      line: { color: C.BORDER, width: 1 },
    });
    // Tech items as badges
    let bx = 3.35;
    for (const item of layer.items) {
      badge(prs, slide, item, bx, layer.y + 0.48, { color: layer.color });
      bx += item.length * 0.115 + 0.65;
    }

    // Down arrow
    if (layer.y < 6.0) {
      slide.addShape(prs.ShapeType.line, {
        x: 6.66, y: layer.y + 1.3, w: 0, h: 0.2,
        line: { color: C.GRAY, width: 1, endArrowType: "arrow" },
      });
    }
  }
}

// ── Slide 09 — Production-Ready Features ──────────────────────────────────────
function slide09_Production(prs) {
  const slide = prs.addSlide();
  darkBg(prs, slide);
  accentBar(prs, slide);

  sectionLabel(prs, slide, "PRODUCTION-READY", 0.5, 0.25);
  heading(slide, "Built like a real SaaS — not a tutorial project", 0.5, 0.65, 12.0, { size: 24 });

  const features = [
    {
      icon: "🔐", title: "Better Auth",
      color: C.ORANGE1,
      points: ["Email + password auth", "GitHub & Google OAuth", "Prisma session adapter", "No per-MAU pricing"],
    },
    {
      icon: "💳", title: "Polar Billing",
      color: C.ORANGE2,
      points: ["Subscription management", "`premiumProcedure` tRPC gate", "API-level enforcement", "One-click checkout flow"],
    },
    {
      icon: "🔒", title: "Credential Encryption",
      color: C.BLUE,
      points: ["Cryptr AES encryption", "Keys stored encrypted at rest", "Decrypted only at runtime", "ENCRYPTION_KEY env var"],
    },
    {
      icon: "⚡", title: "Inngest Durability",
      color: C.PURPLE,
      points: ["3 auto-retries in prod", "`NonRetriableError` for config", "onFailure handler", "`step.run()` atomicity"],
    },
    {
      icon: "📊", title: "Sentry Monitoring",
      color: "F59E0B",
      points: ["Full-stack error tracking", "Vercel AI SDK integration", "Console log capture", "tracesSampleRate: 1"],
    },
    {
      icon: "🔴", title: "Real-time Updates",
      color: C.SUCCESS,
      points: ["Inngest Realtime channels", "Per-node status streaming", "loading → success/error", "No polling required"],
    },
  ];

  const positions = [
    { x: 0.4, y: 1.45 },
    { x: 4.56, y: 1.45 },
    { x: 8.72, y: 1.45 },
    { x: 0.4, y: 4.3 },
    { x: 4.56, y: 4.3 },
    { x: 8.72, y: 4.3 },
  ];

  for (let i = 0; i < features.length; i++) {
    const f = features[i];
    const p = positions[i];
    card(prs, slide, p.x, p.y, 3.8, 2.65, { fill: C.CARD, border: f.color });
    slide.addShape(prs.ShapeType.rect, {
      x: p.x, y: p.y, w: 3.8, h: 0.05,
      fill: { color: f.color }, line: { color: f.color },
    });
    slide.addText(f.icon + "  " + f.title, {
      x: p.x + 0.2, y: p.y + 0.12, w: 3.4, h: 0.45,
      fontSize: 14, bold: true, color: C.WHITE, fontFace: FONT,
    });
    const bullets = f.points.map((pt) => ({ text: pt, options: { bullet: { indent: 15 } } }));
    slide.addText(bullets, {
      x: p.x + 0.2, y: p.y + 0.65, w: 3.4, h: 1.85,
      fontSize: 12, color: C.LIGHT, fontFace: FONT, paraSpaceAfter: 6,
    });
  }
}

// ── Slide 10 — Built Solo ──────────────────────────────────────────────────────
function slide10_BuiltSolo(prs) {
  const slide = prs.addSlide();
  darkBg(prs, slide);
  accentBar(prs, slide);

  sectionLabel(prs, slide, "BUILT SOLO", 0.5, 0.25);
  heading(slide, "From idea to production SaaS — independently", 0.5, 0.65, 12.0, { size: 24 });

  // Left: timeline
  const milestones = [
    { phase: "Architecture", detail: "Chose Inngest, tRPC, React Flow — designed the executor contract pattern" },
    { phase: "Core Canvas", detail: "Built React Flow canvas, node registry, variable inspector" },
    { phase: "Node Executors", detail: "Implemented all 14 node types: triggers, AI, actions, logic" },
    { phase: "Auth + Billing", detail: "Better Auth with OAuth, Polar subscription gating on tRPC" },
    { phase: "Production Polish", detail: "Sentry monitoring, encryption, real-time status, error handling" },
  ];

  // Vertical line
  slide.addShape(prs.ShapeType.line, {
    x: 1.2, y: 1.5, w: 0, h: 5.6,
    line: { color: C.ORANGE1, width: 2 },
  });

  let my = 1.55;
  for (const m of milestones) {
    // Dot
    slide.addShape(prs.ShapeType.ellipse, {
      x: 1.08, y: my, w: 0.24, h: 0.24,
      fill: { color: C.ORANGE1 }, line: { color: C.ORANGE1 },
    });
    slide.addText(m.phase, {
      x: 1.55, y: my - 0.05, w: 4.5, h: 0.32,
      fontSize: 13, bold: true, color: C.WHITE, fontFace: FONT,
    });
    subtext(slide, m.detail, 1.55, my + 0.27, 4.5, 0.52, { size: 11 });
    my += 1.1;
  }

  // Right: key decisions
  const decisions = [
    {
      title: "Inngest over custom queues",
      color: C.ORANGE1,
      why: "Durability, retries, and real-time channels out-of-the-box. No Redis or BullMQ infra to manage.",
    },
    {
      title: "tRPC over REST",
      color: C.BLUE,
      why: "End-to-end TypeScript types between server and client. TypeScript becomes the API documentation.",
    },
    {
      title: "Better Auth over Clerk",
      color: C.SUCCESS,
      why: "Full control, self-hosted, no per-MAU pricing. Pairs cleanly with Polar for billing.",
    },
  ];

  let dy = 1.45;
  for (const d of decisions) {
    card(prs, slide, 6.5, dy, 6.4, 1.75, { fill: C.CARD, border: d.color });
    leftAccent(prs, slide, 6.5, dy, 1.75, d.color);
    heading(slide, d.title, 6.75, dy + 0.15, 5.9, { size: 14, color: d.color });
    subtext(slide, d.why, 6.75, dy + 0.55, 5.9, 1.0, { size: 12 });
    dy += 1.95;
  }

  // Bottom tagline
  subtext(slide, "\"Every architectural decision was made deliberately — balancing DX, cost, and production reliability.\"", 0.5, 6.95, 12.33, 0.4, { size: 11, color: C.ORANGE3, align: "center" });
}

// ── Slide 11 — Tech Stack ─────────────────────────────────────────────────────
function slide11_TechStack(prs) {
  const slide = prs.addSlide();
  darkBg(prs, slide);
  accentBar(prs, slide);

  sectionLabel(prs, slide, "TECH STACK", 0.5, 0.25);
  heading(slide, "Modern, production-grade TypeScript stack", 0.5, 0.65, 12.0, { size: 24 });

  const groups = [
    {
      title: "Frontend",
      color: C.ORANGE1,
      x: 0.4, y: 1.5,
      items: ["Next.js 15", "React 19", "TypeScript 5", "Tailwind CSS v4", "Radix UI", "React Flow"],
    },
    {
      title: "Backend & API",
      color: C.ORANGE2,
      x: 3.6, y: 1.5,
      items: ["tRPC v11", "Better Auth", "Polar", "Zod v4", "Server Actions"],
    },
    {
      title: "Execution & DB",
      color: C.BLUE,
      x: 6.75, y: 1.5,
      items: ["Inngest", "Prisma ORM", "PostgreSQL", "Neon DB", "Cryptr"],
    },
    {
      title: "AI & Integration",
      color: C.PURPLE,
      x: 9.9, y: 1.5,
      items: ["Vercel AI SDK", "Anthropic Claude", "OpenAI GPT", "Google Gemini", "Handlebars", "JSONata"],
    },
  ];

  const MUTED_MAP2 = {
    [C.ORANGE1]: C.ORANGE1_MUTED, [C.ORANGE2]: C.ORANGE2_MUTED,
    [C.BLUE]: C.BLUE_MUTED, [C.PURPLE]: C.PURPLE_MUTED, [C.SUCCESS]: C.SUCCESS_MUTED,
  };

  for (const g of groups) {
    card(prs, slide, g.x, g.y, 3.0, 0.45, { fill: MUTED_MAP2[g.color] || C.CARD2, border: g.color });
    slide.addText(g.title, {
      x: g.x + 0.1, y: g.y, w: 2.8, h: 0.45,
      fontSize: 13, bold: true, color: C.WHITE, fontFace: FONT, align: "center", valign: "middle",
    });

    let iy = g.y + 0.6;
    for (const item of g.items) {
      card(prs, slide, g.x, iy, 3.0, 0.72, { fill: C.CARD, border: C.BORDER });
      leftAccent(prs, slide, g.x, iy, 0.72, g.color);
      slide.addText(item, {
        x: g.x + 0.22, y: iy, w: 2.65, h: 0.72,
        fontSize: 13, bold: true, color: C.WHITE, fontFace: FONT, valign: "middle",
      });
      iy += 0.82;
    }
  }

  // Bottom bar
  card(prs, slide, 0.4, 6.85, 12.53, 0.45, { fill: C.CARD, border: C.BORDER });
  slide.addText("Linted with Biome · Monitored with Sentry · Deployed on Vercel · Database on Neon", {
    x: 0.5, y: 6.87, w: 12.33, h: 0.4,
    fontSize: 11, color: C.GRAY, fontFace: FONT, align: "center", valign: "middle",
  });
}

// ── Slide 12 — Roadmap ────────────────────────────────────────────────────────
function slide12_Roadmap(prs) {
  const slide = prs.addSlide();
  darkBg(prs, slide);
  accentBar(prs, slide);

  sectionLabel(prs, slide, "ROADMAP", 0.5, 0.25);
  heading(slide, "What's coming next", 0.5, 0.65, 7.5, { size: 24 });

  const items = [
    { icon: "📧", title: "Gmail / SMTP Node", q: "High Priority", desc: "Send and receive emails as workflow actions. Most-requested by SMB users.", color: C.ORANGE1 },
    { icon: "📊", title: "Google Sheets Node", q: "High Priority", desc: "Read/write rows. Connects non-technical teams to live workflow data.", color: C.ORANGE2 },
    { icon: "💬", title: "WhatsApp Business", q: "High Priority", desc: "Send messages via Twilio. High value for client communication workflows.", color: C.SUCCESS },
    { icon: "📋", title: "Template Gallery", q: "Medium Priority", desc: "Pre-built workflows: Form→AI→Slack, Lead→Email, Payment→Notify.", color: C.BLUE },
    { icon: "👥", title: "Team Workspaces", q: "Medium Priority", desc: "Multi-user with roles (admin, editor, viewer). Share workflows across teams.", color: C.PURPLE },
  ];

  let iy = 1.45;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const col = i < 3 ? 0 : 1;
    const cx = col === 0 ? 0.4 : 6.87;
    const cy = col === 0 ? iy : (i === 3 ? 1.45 : 3.3);

    card(prs, slide, cx, cy, 6.1, 1.6, { fill: C.CARD, border: item.color });
    slide.addShape(prs.ShapeType.rect, {
      x: cx, y: cy, w: 6.1, h: 0.05,
      fill: { color: item.color }, line: { color: item.color },
    });
    slide.addText(item.icon, {
      x: cx + 0.15, y: cy + 0.12, w: 0.55, h: 0.5,
      fontSize: 22, fontFace: FONT,
    });
    slide.addText(item.title, {
      x: cx + 0.75, y: cy + 0.12, w: 4.0, h: 0.38,
      fontSize: 14, bold: true, color: C.WHITE, fontFace: FONT,
    });
    badge(prs, slide, item.q, cx + 4.85, cy + 0.18, { color: item.color });
    subtext(slide, item.desc, cx + 0.2, cy + 0.65, 5.7, 0.8, { size: 12 });

    if (col === 0) iy += 1.75;
  }

  // Closing card
  card(prs, slide, 6.87, 5.15, 6.1, 2.1, { fill: C.CARD2, border: C.ORANGE1 });
  slide.addText("Open to Opportunities", {
    x: 7.1, y: 5.28, w: 5.65, h: 0.45,
    fontSize: 16, bold: true, color: C.ORANGE1, fontFace: FONT, align: "center",
  });
  subtext(slide, "Full-stack · Backend · AI Tooling · SaaS Products\n\nThis project demonstrates end-to-end SaaS delivery:\narchitecture, integrations, billing, and production ops — built solo.", 7.1, 5.8, 5.65, 1.3, { size: 12, align: "center", color: C.LIGHT });
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const prs = new pptxgen();
  prs.layout = "LAYOUT_WIDE";
  prs.title = "Mindflow — Visual Workflow Automation";
  prs.subject = "Recruiter Portfolio Presentation";
  prs.author = "Yogesh Pawar";

  slide01_Title(prs);
  slide02_Problem(prs);
  slide03_Solution(prs);
  slide04_Platform(prs);
  slide05_NodeLibrary(prs);
  slide06_Execution(prs);
  slide07_Workflows(prs);
  slide08_Architecture(prs);
  slide09_Production(prs);
  slide10_BuiltSolo(prs);
  slide11_TechStack(prs);
  slide12_Roadmap(prs);

  await prs.writeFile({ fileName: OUTPUT_PATH });
  console.log(`✅ Presentation saved → ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error("❌ Failed to generate presentation:", err);
  process.exit(1);
});
