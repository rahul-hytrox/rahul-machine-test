# Rahul Machine Test - Shopify Product Add-ons

A Shopify machine test project built with a local Shopify app, Dawn theme customization, a theme app extension, product metafields, AJAX cart behavior, and custom PDP sections.

## Features

- Merchant can select single or multiple products from the Shopify app.
- Merchant can configure add-on products for selected main products.
- Merchant can create custom fields such as text, textarea, number, dropdown, checkbox, and date.
- Add-ons and custom fields are saved in Shopify product metafields.
- Configured add-ons and custom fields appear only on assigned product pages.
- Main product and selected add-ons are added to cart using AJAX.
- Cart drawer opens after Add to Cart.
- Custom field values are saved as line item properties.
- Bundle quantity sync and remove behavior works in cart drawer and cart page.
- Custom Dawn product page layout with extra PDP sections.

## Requirements

Use the following app scopes:

```toml
scopes = "read_products,write_products"
```

After changing scopes, reinstall or re-authenticate the app.

## Installation

```bash
git clone <repository-url>
cd rahul-machine-test
npm install
shopify app dev
```

Select the correct Shopify development store when prompted.

## Theme Setup

Upload or push the customized Dawn theme:

```bash
shopify theme push
```

Make sure these theme files are included:

```text
sections/custom-main-product.liquid
assets/custom-main-product.css
assets/custom-main-product.js
assets/bundle-cart.js
assets/custom-pdp-extra-sections.css
assets/custom-pdp-tabs.js
sections/custom-complimentary-products.liquid
sections/custom-product-info-tabs.liquid
sections/custom-you-may-also-like.liquid
snippets/custom-pdp-small-product-card.liquid
snippets/custom-pdp-large-product-card.liquid
```

Also include this script in `layout/theme.liquid`:

```liquid
<script src="{{ 'bundle-cart.js' | asset_url }}" defer="defer"></script>
```

## Theme App Extension Setup

The theme app extension block displays add-ons and custom fields on the product page.

Important files:

```text
extensions/product-options-extension/blocks/product_options.liquid
extensions/product-options-extension/assets/product-options.css
extensions/product-options-extension/assets/product-options.js
```

To enable it:

1. Go to **Online Store > Themes > Customize**.
2. Open the product template.
3. Add the app block named **Product Options Add-ons**.
4. Place it near the product form/Add to Cart area.
5. Save the theme.

The block automatically hides when the product has no saved configuration.

## Configure Add-ons

1. Open the Shopify app.
2. Select one or more main products.
3. Click **Continue**.
4. Open **Add-on Product Selection**.
5. Select add-on products.
6. Click **Save add-ons**.

Add-ons are saved in this product metafield:

```text
custom.product_addons
```

## Configure Custom Options

1. Open the Shopify app.
2. Select one or more main products.
3. Click **Continue**.
4. Open **Custom Option Creation**.
5. Create required or optional fields.
6. Click **Save custom options**.

Custom fields are saved in this product metafield:

```text
custom.custom_options
```

## Product Page Sections

Add these sections below the product information section from the theme editor:

```text
Custom complimentary
Custom PDP tabs
Custom recommendations
```

Use manual product selection or select a fallback collection for product cards.

## Cart Behavior

- Main product and selected add-ons are added together.
- Custom field values are attached to the main product line item.
- Hidden bundle properties are used for sync behavior.
- Quantity changes sync all bundle items.
- Removing a bundle item removes the related bundle items.
- Unrelated cart items are not affected.

## Previous / Next Navigation

Previous and Next buttons work from collection context.

Example URL:

```text
/collections/women-tops/products/adelina-neck-bodycon-midi
```

Product data updates without a full page reload, and the URL updates correctly.

## Order Status Page Note

Custom field values are saved as line item properties and appear through cart, checkout, and order details.

Editing completed order line item properties from the customer-facing Order Status Page has Shopify platform limitations. For this machine test, the implementation focuses on saving and displaying the custom values correctly, with this limitation noted.

## Testing Checklist

- Product list loads in app admin.
- Product search and selection works.
- Add-ons save and show on assigned PDP.
- Custom options save and show on assigned PDP.
- Required validation works.
- Main product and add-ons add to cart.
- Cart drawer opens.
- Custom field values display in cart.
- Hidden bundle properties are not visible.
- Bundle quantity sync works.
- Bundle remove behavior works.
- Previous/Next navigation works.
- Mobile layout works.

## Submission

Submit:

```text
1. GitHub repository or ZIP file
2. Shopify development store preview link
3. README.md
4. Required screenshots
```

## Important Files

```text
app/routes/app._index.jsx
app/routes/app.configure._index.jsx
app/routes/app.configure.addons.jsx
app/routes/app.configure.custom-options.jsx
extensions/product-options-extension/blocks/product_options.liquid
extensions/product-options-extension/assets/product-options.css
extensions/product-options-extension/assets/product-options.js
sections/custom-main-product.liquid
assets/custom-main-product.css
assets/custom-main-product.js
assets/bundle-cart.js
```
