
Continue my Shopify machine test from this point.

Language preference:
- Explain in Hinglish.
- Give step-by-step code.
- Keep answers practical and not too theoretical.
- Use external CSS and JS, avoid inline styles.
- JS should run after window load where needed.
- I want final machine test quality, not just demo.

Current project:
- Shopify app name: rahul-machine-test
- Shopify app template: React Router
- Theme: Dawn v15.5.0
- Theme app extension: product-options-extension
- App block name: Product Options Add-ons
- PDP custom section: sections/custom-main-product.liquid
- PDP custom assets:
  assets/custom-main-product.css
  assets/custom-main-product.js
- App admin CSS:
  app/styles/machine-test.css

Machine test requirement summary:
1. Customize Dawn product page based on Figma.
2. Build merchant backend inside Shopify app.
3. Backend should show product list with image, title, status, handle, search, single selection, and multiple selection.
4. After selecting products, merchant clicks Continue.
5. Next page should show:
   - Add-on Product Selection
   - Custom Option Creation
6. Add-ons should appear on product page for the configured product.
7. Custom fields should appear on product page for the configured product.
8. Custom fields include:
   - text input
   - textarea
   - number
   - dropdown
   - checkbox
   - date
9. Fields should support label, placeholder, required/optional.
10. Main product + selected add-ons should add to cart through AJAX.
11. Cart drawer should open after add to cart.
12. Custom field values should save as line item properties.
13. Values should show in cart drawer, cart page, checkout, and order status.
14. Bundle quantity sync and remove behavior is required.
15. Previous/Next product navigation from collection context is required.
16. Order Status Page extension is required.
17. README and screenshots are required.

Completed so far:
1. Shopify app setup is done.
2. Dawn theme clone is done.
3. Theme app extension is created and working.
4. Product Options Add-ons block is visible on product page.
5. Custom PDP layout is mostly done using custom-main-product.liquid, CSS, and JS.
6. Product page layout is close to Figma:
   - left product media
   - middle product info
   - right add-ons/custom fields/quantity/buttons card
7. Admin product list page is done:
   app/routes/app._index.jsx
   It shows:
   - product image
   - title
   - status
   - handle
   - variant count
   - search
   - checkbox multiple select
   - Select only button
   - Continue button
8. Configure page is done:
   app/routes/app.configure._index.jsx
   It shows selected product/products and two cards:
   - Add-on Product Selection
   - Custom Option Creation
9. Add-on page is done as UI:
   app/routes/app.configure.addons.jsx
   It shows main products and selectable add-on products.
10. Custom option page is done as UI:
   app/routes/app.configure.custom-options.jsx
   It can create fields:
   - text
   - textarea
   - number
   - dropdown
   - checkbox
   - date
11. Basic API test route was created:
   app/routes/api.product-options.jsx
12. We used localStorage temporarily for selected products, selected add-ons, and custom fields.

Important decision:
- Do not continue with localStorage for final storage.
- Do not use Prisma unless absolutely needed.
- Use Shopify product metafields as the final storage layer because the configuration is product-specific and theme extension needs current product configuration.
- Store configuration directly on each main product.

Recommended final storage design:
Use product metafields:
1. Namespace: custom
   Key: product_addons
   Type: json
   Value: selected add-on products JSON

2. Namespace: custom
   Key: custom_options
   Type: json
   Value: custom fields JSON

Reason:
- Task does not specify the storage method.
- Product metafields are Shopify-native.
- Config is product-specific.
- Theme extension can read current product metafields directly.
- This avoids unnecessary external database dependency.

Next task to start:
Replace temporary localStorage save with Shopify Admin GraphQL metafield save.

Start with:
1. Update add-on save flow:
   - When merchant selects add-ons and clicks Save add-ons, save selected add-ons JSON to the selected main product metafield:
     custom.product_addons
2. Update custom option save flow:
   - When merchant creates fields and clicks Save custom fields, save fields JSON to selected main product metafield:
     custom.custom_options
3. Use Admin GraphQL metafieldsSet mutation.
4. Then update theme app extension product_options.liquid to read:
   {{ product.metafields.custom.product_addons.value | json }}
   {{ product.metafields.custom.custom_options.value | json }}
5. Render add-ons and custom fields dynamically.
6. If no config exists, hide the extension block.
7. Then implement AJAX add to cart with line item properties.
8. Then implement bundle cart behavior.

Please continue from the Shopify product metafields approach and give the next step code.

---------------------------------------------------
shared file 
app/routes/app.configure.addons.jsx
app/routes/app.configure.custom-options.jsx
extensions/product-options-extension/blocks/product_options.liquid