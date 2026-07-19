// netlify/functions/create-checkout.js
//
// This creates a Stripe Checkout session and hands the URL back
// to your cart page, which redirects the customer to Stripe to pay.

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Server-side price list. This is the source of truth for what things
// cost — never trust the price sent from the browser, since anyone
// could edit it in devtools before checkout. Keep this in sync with
// whatever's on your product pages. Prices are in cents.
//
// Lookups are case-insensitive (see findPrice below), so "Graphic Cheetah
// Hoodie" and "GRAPHIC CHEETAH HOODIE" both match the same entry — but
// the actual words/spelling still need to match exactly.
const PRICES = {
  'Graphic Cheetah Hoodie': 5900,
  'Boxy Graphic Cheetah Tee': 2900,
  'Baggy Double-Waisted Cheetah Print Sweats': 5900,
  'Double-Waisted Cheetah Print Shorts': 5200,
  // Add new products here as: 'Exact Product Name': priceInCents,
};

// Case-insensitive lookup against PRICES
function findPrice(name) {
  const target = name.trim().toLowerCase();
  const match = Object.keys(PRICES).find(
    (key) => key.toLowerCase() === target
  );
  return match ? PRICES[match] : null;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { items } = JSON.parse(event.body);

    if (!items || items.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No items provided' }) };
    }

    const line_items = items.map((item) => {
      const unitAmount = findPrice(item.name);
      if (!unitAmount) {
        throw new Error(`Unknown product: "${item.name}". Add it to PRICES in create-checkout.js.`);
      }
      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.size ? `${item.name} (Size ${item.size})` : item.name,
          },
          unit_amount: unitAmount,
        },
        quantity: 1,
      };
    });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      success_url: `${process.env.URL}/success.html`,
      cancel_url: `${process.env.URL}/cart.html`,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};