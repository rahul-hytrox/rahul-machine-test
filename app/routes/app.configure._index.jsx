import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { authenticate } from "../shopify.server";
import machineTestStyles from "../styles/machine-test.css?url";

export const links = () => [
  { rel: "stylesheet", href: machineTestStyles },
];

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

function getProductImage(product) {
  return (
    product.featuredMedia?.preview?.image?.url ||
    product.featuredImage?.url ||
    ""
  );
}

function getProductAlt(product) {
  return (
    product.featuredMedia?.preview?.image?.altText ||
    product.featuredImage?.altText ||
    product.title ||
    "Selected product"
  );
}

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch (error) {
    console.error("JSON parse error:", error);
    return fallback;
  }
}

export default function ConfigurePage() {
  const navigate = useNavigate();

  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedAddonIds, setSelectedAddonIds] = useState([]);
  const [customFields, setCustomFields] = useState([]);

  useEffect(() => {
    try {
      const savedProducts = window.localStorage.getItem("selectedMainProducts");
      const savedAddons = window.localStorage.getItem("selectedAddonProducts");
      const savedFields = window.localStorage.getItem("customOptionFields");

      const parsedProducts = savedProducts ? safeJsonParse(savedProducts, []) : [];
      const parsedAddons = savedAddons ? safeJsonParse(savedAddons, []) : [];
      const parsedFields = savedFields ? safeJsonParse(savedFields, []) : [];

      setSelectedProducts(Array.isArray(parsedProducts) ? parsedProducts : []);
      setSelectedAddonIds(Array.isArray(parsedAddons) ? parsedAddons : []);
      setCustomFields(Array.isArray(parsedFields) ? parsedFields : []);
    } catch (error) {
      console.error("Configure page load error:", error);
      setSelectedProducts([]);
      setSelectedAddonIds([]);
      setCustomFields([]);
    }
  }, []);

  const firstProduct = selectedProducts[0];

  const productPreviewLinks = useMemo(() => {
    return selectedProducts.map((product) => ({
      id: product.id,
      title: product.title,
      directUrl: `/products/${product.handle}`,
      collectionUrl: `/collections/women-tops/products/${product.handle}`,
    }));
  }, [selectedProducts]);

  const hasSelectedProducts = selectedProducts.length > 0;
  const hasAddons = selectedAddonIds.length > 0;
  const hasCustomFields = customFields.length > 0;

  function goBackToProducts() {
    navigate("/app");
  }

  function goToAddons() {
    navigate("/app/configure/addons");
  }

  function goToCustomOptions() {
    navigate("/app/configure/custom-options");
  }

  function clearSelection() {
    window.localStorage.removeItem("selectedMainProducts");
    window.localStorage.removeItem("selectedAddonProducts");
    window.localStorage.removeItem("addonConfiguration");
    window.localStorage.removeItem("customOptionFields");
    window.localStorage.removeItem("customOptionConfiguration");

    setSelectedProducts([]);
    setSelectedAddonIds([]);
    setCustomFields([]);
  }

  return (
    <div className="machine-test-page">
      <div className="machine-test-header">
        <div>
          <h1>Configure Selected Products</h1>
          <p>
            Manage product-specific add-ons and custom input fields. Final data is
            saved on Shopify product metafields.
          </p>
        </div>

        <div className="machine-test-header-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={goBackToProducts}
          >
            Back to products
          </button>

          <button
            type="button"
            className="danger-button"
            disabled={!hasSelectedProducts}
            onClick={clearSelection}
          >
            Clear selection
          </button>
        </div>
      </div>

      <div className="machine-test-card configure-selected-card">
        <div className="configure-section-heading">
          <div>
            <h2>Selected main products</h2>
            <p>
              These products will receive the add-on and custom field configuration.
            </p>
          </div>

          <span className="configure-count-badge">
            {selectedProducts.length} selected
          </span>
        </div>

        {hasSelectedProducts ? (
          <div className="selected-products-grid">
            {selectedProducts.map((product) => {
              const productImage = getProductImage(product);
              const productAlt = getProductAlt(product);

              return (
                <div className="selected-product-card" key={product.id}>
                  {productImage ? (
                    <img
                      className="selected-product-image"
                      src={productImage}
                      alt={productAlt}
                    />
                  ) : (
                    <div className="selected-product-image selected-product-image-empty">
                      No image
                    </div>
                  )}

                  <div className="selected-product-info">
                    <h3>{product.title}</h3>
                    <p>{product.handle}</p>

                    <span
                      className={`status-badge status-${String(
                        product.status || "draft",
                      ).toLowerCase()}`}
                    >
                      {product.status || "DRAFT"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-configuration-state">
            <p>No selected products found.</p>
            <button
              type="button"
              className="primary-button"
              onClick={goBackToProducts}
            >
              Select products
            </button>
          </div>
        )}
      </div>

      <div className="configure-option-grid">
        <button
          type="button"
          className="configure-option-card"
          disabled={!hasSelectedProducts}
          onClick={goToAddons}
        >
          <span className="configure-option-number">1</span>

          <div className="configure-option-content">
            <h2>Add-on Product Selection</h2>
            <p>
              Select optional add-on products. These appear on the assigned product
              page near the add to cart button.
            </p>

            <span
              className={`configure-status-pill ${hasAddons ? "is-complete" : "is-pending"
                }`}
            >
              {hasAddons
                ? `${selectedAddonIds.length} add-on product(s) selected`
                : "Pending"}
            </span>
          </div>
        </button>

        <button
          type="button"
          className="configure-option-card"
          disabled={!hasSelectedProducts}
          onClick={goToCustomOptions}
        >
          <span className="configure-option-number">2</span>

          <div className="configure-option-content">
            <h2>Custom Option Creation</h2>
            <p>
              Create text, textarea, number, dropdown, checkbox, and date fields
              with label, placeholder, and required status.
            </p>

            <span
              className={`configure-status-pill ${hasCustomFields ? "is-complete" : "is-pending"
                }`}
            >
              {hasCustomFields
                ? `${customFields.length} custom field(s) created`
                : "Pending"}
            </span>
          </div>
        </button>
      </div>

      <div className="machine-test-card configure-summary-card">
        <div className="configure-section-heading">
          <div>
            <h2>Testing checklist</h2>
            <p>
              Use these links after saving add-ons and custom fields to verify the
              product page.
            </p>
          </div>
        </div>

        {hasSelectedProducts ? (
          <div className="configure-test-grid">
            {productPreviewLinks.map((link) => (
              <div className="configure-test-card" key={link.id}>
                <h3>{link.title}</h3>

                <div className="configure-test-links">
                  <a href={link.directUrl} target="_blank" rel="noreferrer">
                    Open PDP
                  </a>

                  <a href={link.collectionUrl} target="_blank" rel="noreferrer">
                    Open with collection context
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted-text">
            Select products first to generate product preview links.
          </p>
        )}

        <div className="configure-note-box">
          <h3>Metafields used</h3>
          <p>
            Add-ons are saved to <strong>custom.product_addons</strong>. Custom
            fields are saved to <strong>custom.custom_options</strong>. The theme
            app extension reads these metafields on the current product.
          </p>
        </div>

        {firstProduct && (
          <div className="configure-note-box">
            <h3>Recommended final test flow</h3>
            <p>
              Open the collection context PDP, select add-ons, fill custom fields,
              add to cart, verify cart drawer, then test cart page quantity and
              remove behavior.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function ErrorBoundary() {
  return (
    <div className="machine-test-page">
      <div className="machine-test-card">
        <h1>Configure page error</h1>
        <p>Please check the terminal console for the exact error.</p>
      </div>
    </div>
  );
}