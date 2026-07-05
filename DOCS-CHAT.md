We are building a Shopify machine test app.

Completed:
- Shopify app created with React Router template
- Dawn theme clone created, version 15.5.0
- Theme app extension created: product-options-extension
- Product Options Add-ons block working on PDP
- Custom PDP layout made close to Figma using custom-main-product.liquid, custom-main-product.css, custom-main-product.js
- App admin product list page done: product image, title, status, handle, search, single/multiple select, Continue button
- Configure page done: selected products + two options
- Add-on Product Selection page done as UI
- Custom Option Creation page done as UI
- External CSS used: app/styles/machine-test.css
- Route issue fixed by using app.configure._index.jsx pattern
- Current progress approx 40% done, 60% pending

Important preferences:
- Use external CSS and JS, avoid inline styles
- JS should run after window load where needed
- Use Prisma instead of localStorage for final data persistence

Pending next step:
Start Prisma/database persistence.
Need to update prisma/schema.prisma with ProductConfiguration model, run migration, then replace localStorage save/read with Prisma/API routes.

Suggested Prisma model:
model ProductConfiguration {
  id                String   @id @default(cuid())
  shop              String
  mainProductId     String
  mainProductHandle String
  mainProductTitle  String
  addonProducts     Json?
  customFields      Json?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@unique([shop, mainProductId])
}


================================================
prompt: Continue Shopify machine test from this summary. Start with Prisma persistence step by step.
================================================
Name on Product - Text input - Required
Gift Message - Textarea - Optional
Delivery Date - Date field - Optional
Packaging Type - Dropdown - Required


===============================================
1. Figma/PDP design compare karna ho
2. Current UI issue visually debug karna ho
3. Theme layout ka spacing/design fix karna ho
-----------------------------------------------


Continue my Shopify machine test.

Current state:
- Shopify app is created using React Router template.
- Theme is Dawn v15.5.0.
- Theme app extension is created: product-options-extension.
- Product Options Add-ons block is working on product page.
- Custom PDP section is created: sections/custom-main-product.liquid.
- Custom CSS and JS are external:
  assets/custom-main-product.css
  assets/custom-main-product.js
- PDP layout is mostly done using JS to move app block, quantity, and buy buttons into right-side card.
- Admin product list page is done:
  app/routes/app._index.jsx
  app/styles/machine-test.css
- Product list shows image, title, status, handle, variants, search, single select, multiple select, Continue.
- Configure page is done:
  app/routes/app.configure._index.jsx
- Add-on selection page is done:
  app/routes/app.configure.addons.jsx
- Custom option creation page is done:
  app/routes/app.configure.custom-options.jsx
- Basic API test route is created:
  app/routes/api.product-options.jsx
- We used localStorage temporarily for selected products, add-ons, and custom fields.
- Now we want to replace localStorage with Prisma/database.

Important preferences:
- Give step-by-step code.
- Use external CSS and JS, not inline.
- JS should run after window load where needed.
- I want final machine test quality, not just demo.
- Explain in Hinglish.

Next task:
Start Prisma persistence.
Create ProductConfiguration model in prisma/schema.prisma, run migration, then create API routes to save/read add-ons and custom fields from Prisma.