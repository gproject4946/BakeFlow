const express = require('express');
const router = express.Router();
const db = require('../sheets/sheetsClient');

// POST /api/invoice/scan - scan supplier invoice with Gemini Vision
router.post('/scan', async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: 'No image provided' });
    if (!process.env.GEMINI_API_KEY) return res.status(400).json({ error: 'GEMINI_API_KEY not configured' });

    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `This is a purchase invoice for a bakery/food business.
Extract ALL line items and return ONLY a valid JSON array.
Format each item as: {"name": "...", "quantity": 0, "unit": "...", "unitPrice": 0, "totalPrice": 0}
If unit is missing, infer from context (kg, g, litre, ml, piece, packet, box).
Return ONLY the JSON array with no explanation, no markdown, no extra text.`;

    const result = await model.generateContent([
      { inlineData: { mimeType: 'image/jpeg', data: image } },
      { text: prompt }
    ]);

    let text = result.response.text().trim();
    // Clean markdown code blocks if present
    text = text.replace(/```json\n?|\n?```/g, '').trim();
    const items = JSON.parse(text);

    const e = { name: req.headers['x-employee-name']||'Unknown', email: req.headers['x-employee-email']||'' };
    await db.addLog('SCAN_INVOICE', `${items.length} items detected`, e.name, e.email, 'SupplierInvoice', '');

    res.json({ items, count: items.length });
  } catch (err) {
    console.error('[invoice] scan:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
